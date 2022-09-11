import "./core";
import {
  httpSuccess,
  makeAPIGatewayLambda,
  makeLambda,
  sendHttpResult,
} from "@raydeck/serverless-lambda-builder";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Callback,
  Handler,
} from "aws-lambda";
import { Agent } from "https";
import { QldbDriver, RetryConfig } from "amazon-qldb-driver-nodejs";
import { getAssetPath } from "@raydeck/local-assets";
import { BigNumber, ContractFactory, ethers, utils } from "ethers";
import { exec } from "child_process";
import { List, load, Value } from "ion-js/dist/commonjs/es6/dom";
import { Lambda } from "aws-sdk";
import { get as registryGet } from "@raydeck/registry-manager";
import { copyFileSync, readFileSync, writeFileSync } from "fs";
import {
  TermsableNoToken__factory,
  ERC721Termsable__factory,
  ERC721Termsable,
} from "./contracts/index";
import { promisify } from "util";
import { render } from "mustache";
import fetch from "node-fetch";
import { KeyPair } from "ucan-storage-commonjs/keypair";
import { build, validate } from "ucan-storage-commonjs/ucan-storage";
//#region Constants
const DEFAULT_RENDERER =
  "bafybeig44fabnqp66umyilergxl6bzwno3ntill3yo2gtzzmyhochbchhy";
const DEFAULT_TEMPLATE =
  "bafybeiavljiisrizkro3ob5rhdludulsiqwkjp43lanlekth33sqhikfry/template.md";
//#endregion
//#region QLDB intialization
const maxConcurrentTransactions = 10;
const retryLimit = 4;
//Reuse connections with keepAlive
const agentForQldb: Agent = new Agent({
  keepAlive: true,
  maxSockets: maxConcurrentTransactions,
});
const serviceConfigurationOptions = {
  region: process.env.region || process.env.AWS_REGION,
  httpOptions: {
    agent: agentForQldb,
  },
};
const retryConfig: RetryConfig = new RetryConfig(retryLimit);
const ledgerName = process.env.ledgerName || "myLedger";
const chainInfo: Record<string, { privateKey: string; url: string }> = {
  "80001": {
    privateKey: process.env.METASIGNER_MUMBAI_PRIVATE_KEY || "",
    url: process.env.ALCHEMY_MUMBAI_KEY || "",
  },
  "137": {
    privateKey: process.env.METASIGNER_POLYGON_PRIVATE_KEY || "",
    url: process.env.ALCHEMY_POLYGON_KEY || "",
  },
};
const getChainInfo = (chainId: string) => {
  if (chainId.startsWith("0x")) chainId = parseInt(chainId, 16).toString(10);
  const _chainInfo = chainInfo[chainId];
  if (!_chainInfo) {
    throw new Error(`Chain ${chainId} not found`);
  }
  return _chainInfo;
};

const qldbDriver: QldbDriver = new QldbDriver(
  ledgerName,
  serviceConfigurationOptions,
  maxConcurrentTransactions,
  retryConfig
);
//#endregion
//#region Helper Functions
let madeTables = false;
const makeTables = async () => {
  if (madeTables) return;
  const tableNames = await qldbDriver.getTableNames();
  if (!tableNames.includes("Contracts")) {
    //Build transmissions table
    await qldbDriver.executeLambda(async (txn) => {
      await txn.execute(`CREATE TABLE Contracts`);
      await txn.execute(`CREATE INDEX ON Contracts (id)`);
      await txn.execute(`CREATE INDEX ON Contracts (owner)`);
    });
  }
  if (!tableNames.includes("Accounts")) {
    //Build transmissions table
    await qldbDriver.executeLambda(async (txn) => {
      await txn.execute(`CREATE TABLE Accounts`);
      await txn.execute(`CREATE INDEX ON Accounts (id)`);
    });
  }
  if (!tableNames.includes("Templates")) {
    //Build transmissions table
    await qldbDriver.executeLambda(async (txn) => {
      await txn.execute(`CREATE TABLE Templates`);
      await txn.execute(`CREATE INDEX ON Templates (id)`);
      await txn.execute(`CREATE INDEX ON Templates (owner)`);
    });
  }
  if (!tableNames.includes("Users")) {
    //Build transmissions table
    await qldbDriver.executeLambda(async (txn) => {
      await txn.execute(`CREATE TABLE Users`);
      await txn.execute(`CREATE INDEX ON Users (id)`);
    });
  }
  madeTables = true;
};
const getRecord = async (tableName: string, id: string) => {
  await makeTables();
  const result = await qldbDriver.executeLambda(async (txn) => {
    const result = await txn.execute(
      `SELECT * FROM ${tableName} WHERE id = '${id}'`
    );
    return result;
  });
  return result.getResultList().pop();
};
const getUser = async (address: string) =>
  getRecord("Users", address.toLowerCase());
const getContract = async (id: string, account?: Value) => {
  const contract = await getRecord("Contracts", id);
  if (!contract)
    return {
      contract: undefined,
      contractError: sendHttpResult(400, "No contract found"),
    };
  const owner = contract.get("owner")?.stringValue()?.toLowerCase() ?? "";
  if (owner !== account?.get("id")?.stringValue()?.toLowerCase())
    return {
      contract: undefined,
      contractError: sendHttpResult(400, "Not contract owner"),
    };
  return { contract, contractError: undefined };
};
const getAccount = async (id: string) =>
  getRecord("Accounts", id.toLowerCase());
const getAccountsForUser = async (address: string) => {
  const user = await getUser(address);
  if (user) {
    const accounts = user.get("accounts") as List;
    const accountArr: Value[] = [];
    for (let i = 0; i < accounts.length; i++) {
      const a = accounts.get(i);
      if (a) {
        accountArr.push(a);
      }
    }
    const output = accountArr.map((v) => v.stringValue()).filter(Boolean);
    if (output && output.length) return output as string[];
  }
  return [];
};
const getSignerFromHeader = <T extends { exp: number }>(
  event: APIGatewayProxyEvent
) => {
  //check for the header
  //check the header for my signature
  const authorization = event.headers.Authorization;
  if (authorization) {
    const [, key] = authorization.split(" ");
    const json = Buffer.from(key, "base64").toString("utf8");
    const { signature, message }: { signature: string; message: string } =
      JSON.parse(json);
    const address = ethers.utils.verifyMessage(message, signature);
    const parsedMessage: T = JSON.parse(message);
    if (parsedMessage.exp) {
      //compare with now
      const exp = parsedMessage.exp;
      const now = Date.now();
      if (exp < now) {
        return undefined;
      }
    }
    return { address, message: parsedMessage };
  }
  return undefined;
};

const _validateAccount = (
  accounts: Record<string, Value>,
  accountId?: string
) => {
  let error: ReturnType<typeof sendHttpResult> | undefined;
  if (!accountId) accountId = Object.keys(accounts)[0];
  if (!accountId) error = sendHttpResult(400, "No account id");
  const account = accounts[accountId.toLowerCase()];
  if (!account) error = sendHttpResult(400, "No account found");
  if (error) return { account: undefined, accountError: error };
  else return { account, accountError: undefined };
};
const makeAuthenticatedFunc = (
  func: (args: {
    event: APIGatewayProxyEvent;
    context: any;
    callback: Callback<APIGatewayProxyResult>;
    user: Value;
    accounts: Record<string, Value>;
    validateAccount: (
      accountId?: string
    ) => ReturnType<typeof _validateAccount>;
  }) => void
) => <Handler<APIGatewayProxyEvent, APIGatewayProxyResult>>(async (
    event,
    context,
    callback
  ) => {
    const payload = getSignerFromHeader(event);
    if (!payload) {
      return sendHttpResult(401, "Unauthorized");
    }
    let user = await getUser(payload.address);
    if (!user) {
      await qldbDriver.executeLambda(async (txn) => {
        await txn.execute("INSERT INTO Users ?", {
          id: payload.address.toLowerCase(),
          accounts: [payload.address.toLowerCase()],
        });
        await txn.execute("INSERT INTO Accounts ?", {
          id: payload.address.toLowerCase(),
        });
      });
      user = await getUser(payload.address);
      if (!user) {
        return sendHttpResult(500, "Error creating user");
      }
    }
    const accountIds = await getAccountsForUser(payload.address);
    const accountList = (
      await Promise.all(accountIds.map(async (id) => await getAccount(id)))
    ).filter(Boolean);
    const accounts = accountList.reduce(
      (acc, account) => ({
        ...acc,
        [account?.get("id")?.stringValue() || ""]: account,
      }),
      {}
    );
    if (!Object.keys(accounts).length) {
      return sendHttpResult(401, "No Authorized accounts");
    }
    return func({
      event,
      context,
      callback,
      user,
      accounts: accounts as Record<string, Value>,
      validateAccount: (accountId?: string) =>
        _validateAccount(accounts, accountId),
    });
  });
const getProvider = (chainId: string) => {
  const chainInfo = getChainInfo(chainId);
  const provider = new ethers.providers.StaticJsonRpcProvider(chainInfo.url);
  const signer = new ethers.Wallet(chainInfo.privateKey, provider);
  return { provider, signer };
};
const getGasOptions = async (chainId: string) => {
  const { provider } = getProvider(chainId);

  const gasPrice = await provider.getGasPrice();
  const maxFeePerGas = gasPrice
    ? gasPrice.gt(utils.parseUnits("10", "gwei"))
      ? gasPrice.mul(5)
      : utils.parseUnits("30", "gwei")
    : utils.parseUnits("100", "gwei");
  const maxPriorityFeePerGas = maxFeePerGas.mul(2).div(10);
  console.log(
    "using recalculated gas fees",
    maxFeePerGas.toNumber().toLocaleString(),
    maxPriorityFeePerGas.toNumber().toLocaleString()
  );
  return { maxFeePerGas, maxPriorityFeePerGas };
};

//#endregion
//#region Unsecured API Endpoints
export const signDocument = makeAPIGatewayLambda({
  path: "/sign",
  method: "post",
  cors: true,
  timeout: 30,
  func: async (event, context, callback) => {
    if (!event.body) return sendHttpResult(400, "No body provided");
    const {
      address,
      signature,
      message,
    }: { address: string; signature: string; message: string } = JSON.parse(
      event.body
    );
    if (!ethers.utils.verifyMessage(message, signature)) {
      return sendHttpResult(400, "Invalid signature");
    }
    const polydocsURI = message.substring(
      message.indexOf(": "),
      message.length
    );
    const fragment = polydocsURI.substring(polydocsURI.indexOf("#") + 1);
    const [, chainId, contractAddress, blockNumber] = fragment.split("::");
    //check the chainID
    const { signer } = getProvider(chainId);
    const gasOptions = await getGasOptions(chainId);

    const polydocs = TermsableNoToken__factory.connect(contractAddress, signer);
    try {
      await polydocs.acceptTermsFor(address, message, signature, gasOptions);
      return httpSuccess("signed");
    } catch (e) {
      console.log("error on the transaction", e);
      return sendHttpResult(
        500,
        "Could not sign document on contract " + contractAddress
      );
    }
  },
});
// export const registerUser = makeAPIGatewayLambda({
//   path: "/register",
//   method: "post",
//   cors: true,
//   timeout: 30,
//   func: async (event, context, callback) => {
//     if (!event.body) return sendHttpResult(400, "No body provided");
//     const {
//       address,
//       signature,
//       message,
//     }: { address: string; signature: string; message: string } = JSON.parse(
//       event.body
//     );
//     await qldbDriver.executeLambda(async (txn) => {
//       await txn.execute(
//         "INSERT INTO Users (id, accounts) VALUES ($1, $2)",
//         address,
//         [address]
//       );
//       await txn.execute("INSERT INTO Accounts (id) VALUES ($1)", address);
//     });
//     return httpSuccess("registered");
//   },
// });
//#endregion
//#region Contract Deployment API Endpoints
type DeployEvent = {
  address: string;
  name: string;
  symbol: string;
  renderer: string;
  template: string;
  // terms: Record<string, string>;
  // title: string;
  // description: string;
  // image?: string;
  // cover?: string;
  royaltyRecipient: string;
  royaltyPercentage: string;
  chainId: string;
  uri: string;
};
export const deployNFTContract = makeAPIGatewayLambda({
  path: "/make-nft-contract",
  method: "post",
  cors: true,
  timeout: 30,
  func: makeAuthenticatedFunc(
    async ({ event, context, callback, user, accounts, validateAccount }) => {
      if (!event.body) return sendHttpResult(400, "No body provided");
      const {
        address,
        name,
        symbol,
        chainId,
        renderer,
        template,
        uri,
        royaltyRecipient,
        royaltyPercentage,
      }: DeployEvent = JSON.parse(event.body);
      //Validate the address
      if (!address || ethers.utils.isAddress(address) === false)
        return sendHttpResult(400, "Invalid address");
      const { account, accountError } = validateAccount(address);
      if (accountError) return accountError;
      if (!name) return sendHttpResult(400, "Invalid name");
      if (!symbol) return sendHttpResult(400, "Invalid symbol");
      if (!getChainInfo(chainId).url)
        return sendHttpResult(400, "Invalid chainId");
      const Payload = JSON.stringify({
        address,
        name,
        symbol,
        chainId,
        uri,
        accountId: account,
      });
      await new Lambda({ region: registryGet("AWS_REGION", "us-east-1") })
        .invoke({
          InvocationType: "Event",
          FunctionName: registryGet("stackName") + "-doDeploy",
          Payload,
        })
        .promise();
      return httpSuccess({
        message: "I got this party started",
      });
    }
  ),
});
export const doDeploy = makeLambda({
  timeout: 300,
  func: async (event) => {
    const {
      royaltyRecipient,
      royaltyPercentage,
      renderer = DEFAULT_RENDERER,
      template = DEFAULT_TEMPLATE,
      // terms = {},
      uri,
      chainId,
      name,
      address,
      symbol,
    }: DeployEvent = event;
    const { provider, signer } = getProvider(chainId);
    if (!signer) return sendHttpResult(400, "bad chain id");
    //time to deploy
    // build the new contract

    const feeData = await provider.getFeeData();
    const gasPrice = await provider.getGasPrice();
    const polyDocsFactory = new ERC721Termsable__factory(signer);

    console.log("Deploying with", address, name, symbol);
    console.log(
      "feedata",
      feeData.maxFeePerGas?.toNumber().toLocaleString(),
      feeData.maxPriorityFeePerGas?.toNumber().toLocaleString()
    );
    console.log("ethers gasprice", gasPrice.toNumber().toLocaleString());
    let maxFeePerGas = gasPrice
      ? gasPrice.gt(utils.parseUnits("10", "gwei"))
        ? gasPrice.mul(5)
        : utils.parseUnits("30", "gwei")
      : utils.parseUnits("100", "gwei");
    let maxPriorityFeePerGas = maxFeePerGas.mul(2).div(10);
    console.log(
      "using recalculated",
      maxFeePerGas.toNumber().toLocaleString(),
      maxPriorityFeePerGas.toNumber().toLocaleString()
    );
    let polyDocs: ERC721Termsable;
    try {
      const polyDocs1 = await polyDocsFactory.deploy(address, name, symbol, {
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasLimit: BigNumber.from(6_500_000),
      });
      polyDocs = polyDocs1;
    } catch (e) {
      console.log("Trying with double fees");
      maxFeePerGas = maxFeePerGas.mul(2);
      maxPriorityFeePerGas = maxPriorityFeePerGas.mul(2);
      const polyDocs2 = await polyDocsFactory.deploy(address, name, symbol, {
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasLimit: BigNumber.from(6_500_000),
      });
      polyDocs = polyDocs2;
    }
    console.log("polyDocs is ", polyDocs.address);

    const id = `${chainId}::${polyDocs.address}`;
    await qldbDriver.executeLambda(async (tx) => {
      await tx.execute("INSERT INTO Contracts ?", {
        id,
        name,
        symbol,
        owner: address.toLowerCase(),
        deployed: 0,
      });
      return true;
    });
    await polyDocs.deployed();

    const pdTxn = await polyDocs.setPolydocs(renderer, template, [], {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await pdTxn.wait();
    const mdTxn = await polyDocs.setURI(uri, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });

    //@TODO support royalty
    await mdTxn.wait();
    await qldbDriver.executeLambda(async (tx) => {
      await tx.execute(`UPDATE Contracts SET deployed = 1 WHERE id = '${id}'`);
    });
  },
});
export const hhDeploy = makeLambda({
  timeout: 300,
  func: async (event) => {
    const {
      address,
      name,
      symbol,
      renderer = DEFAULT_RENDERER,
      template = DEFAULT_TEMPLATE,
      terms = {},
      chainId,
    }: {
      address: string;
      name: string;
      symbol: string;
      renderer: string;
      template: string;
      terms: Record<string, string>;
      chainId: string;
    } = event;
    const { provider, signer } = getProvider(chainId);

    //time to deploy
    // build the new contract
    //copy everything into tmp/contracts

    const templateContract = readFileSync(
      getAssetPath() + "/contracts/tokens/MyContract.sol",
      "utf8"
    );
    await promisify(exec)(
      "cp -r " + getAssetPath() + "/contracts/ /tmp/sources/"
    );
    await promisify(exec)(
      "cp -r " + getAssetPath() + "/node_modules/ /tmp/node_modules/"
    );

    const renderedContract = render(templateContract, {
      newowner: address.replace('"', '\\"'),
      name: name.replace('"', '\\"'),
      symbol: symbol.replace('"', '\\"'),
    });

    writeFileSync("/tmp/sources/tokens/MyContract.sol", renderedContract);
    console.log("wrote contract");
    console.log(readFileSync("/tmp/sources/tokens/MyContract.sol", "utf8"));
    console.log("compiling contract");
    copyFileSync(
      getAssetPath() + "/hardhat.config.js",
      "/tmp/hardhat.config.js"
    );
    const hardhatPrefix =
      "cd /tmp && /opt/nodejs/node_modules/hardhat/internal/cli/cli.js";
    const cmd = hardhatPrefix + " compile";
    console.log("cmd is ", cmd);
    console.log(await promisify(exec)(cmd));
    console.log("Getting the json");
    console.log(await promisify(exec)("ls -lR /tmp"));

    const json = readFileSync(
      "/tmp/artifacts/MyContract.sol/MyContract.json",
      "utf8"
    );
    console.log("json is ", json);
    const { abi, bytecode } = JSON.parse(json);
    console.log("abi is ", abi);
    const polyDocsFactory = new ContractFactory(abi, bytecode, signer);
    // const polyDocsFactory = new ERC721Termsable__factory(signer);
    const hundredgwei = ethers.utils.parseUnits("50", "gwei");
    console.log("A hundred gwei is", hundredgwei.toString());
    console.log("Deploying with", address, name, symbol);
    const polyDocs = await polyDocsFactory.deploy(address, name, symbol, {
      maxFeePerGas: hundredgwei,
      maxPriorityFeePerGas: hundredgwei,
      gasLimit: BigNumber.from(6_500_000),
    });
    console.log("polyDocs is ", polyDocs.address);
    await polyDocs.deployed();
    const pdtxn = await polyDocs.setPolydocs(
      renderer,
      template,
      Object.entries(terms).map(([key, value]) => ({
        key,
        value,
      }))
    );
    await pdtxn.wait();
    console.log("I have a deployed polydocs");
  },
});
export const testHH = makeLambda({
  timeout: 300,
  func: async (event) => {
    console.log("my event is ", event);
    if (event) console.log(await promisify(exec)(event));
    // const path = require.resolve("hardhat");
    // console.log("path is ", path);
    // console.log("current path is", __dirname);
    // console.log(await promisify(exec)("pwd"));
    // const output = await promisify(exec)("ls -l opt/node_modules");
    // console.log("output is ", output);
  },
});

//#endregion
export const mintNFT = makeAPIGatewayLambda({
  timeout: 300,
  method: "post",
  path: "/mintNFT",
  cors: true,
  func: makeAuthenticatedFunc(
    async ({ event, context, callback, accounts, user, validateAccount }) => {
      //Get the image
      const {
        contractAddress,
        cid,
        chainId,
        account: accountId,
      } = JSON.parse(event.body || "{}");
      const { account, accountError } = await validateAccount(accountId);
      if (!account && accountError) return accountError;
      const { contractError } = await getContract(
        `${chainId}::${contractAddress}`,
        account
      );
      if (contractError) return contractError;
      const { signer } = getProvider(chainId);

      console.log("Hooray I did not run upload and got a cid", cid);
      console.log("connecting to contract at ", contractAddress);
      const contract = ERC721Termsable__factory.connect(
        contractAddress,
        signer
      );
      console.log("Connected to contract at address", contractAddress);
      const gasOptions = await getGasOptions(chainId);
      console.log("Minting", cid, account.get("id")?.stringValue() || "");
      const tx = await contract.mintFor(
        cid,
        account.get("id")?.stringValue() || "",
        {
          ...gasOptions,
          gasLimit: BigNumber.from(500_000),
        }
      );
      console.log("Minted good as gold");
      await tx.wait();
      console.log("Done!!!!!");
      return httpSuccess("hooray!!!");
    }
  ),
});
//#region UCAN Management
let rootToken = "";
const nsServiceKey = "did:key:z6MknjRbVGkfWK1x5gyJZb6D4LjMj1EsitFzcSccS3sAaviQ";
const issuerKeyPair = new KeyPair(
  Buffer.from(process.env.DID_PRIVATE_KEY ?? "", "base64"),
  Buffer.from(process.env.DID_PUBLIC_KEY ?? "", "base64")
);
export const getUCANToken = makeAPIGatewayLambda({
  timeout: 30,
  method: "get",
  cors: true,
  path: "/ucan-token",
  func: makeAuthenticatedFunc(async () => {
    if (!rootToken.length) {
      const url = "https://api.nft.storage/ucan/token";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NFTSTORAGE_API_KEY}`,
        },
      });
      const retJSON = await response.json();
      rootToken = retJSON.value;
    }
    const { payload } = await validate(rootToken);
    const { att } = payload;
    const capabilities = att.map((capability) => ({
      ...capability,
      with: [capability.with, nsServiceKey].join("/"),
    }));
    const proofs = [rootToken];
    const token = await build({
      issuer: issuerKeyPair,
      audience: nsServiceKey,
      capabilities: capabilities as any,
      proofs,
      lifetimeInSeconds: 100,
    });
    return httpSuccess({ token, did: process.env.DID });
  }),
});
//#endregion
//#region Contract REST API
export const getContracts = makeAPIGatewayLambda({
  timeout: 30,
  method: "get",
  cors: true,
  path: "/contracts",
  func: makeAuthenticatedFunc(async ({ event, validateAccount }) => {
    const { account: accountId } = event.queryStringParameters || {};
    const { account, accountError } = validateAccount(accountId);
    if (accountError) return accountError;
    //lets get my contracts
    const list = await qldbDriver.executeLambda(async (txn) => {
      const result = await txn.execute(
        `SELECT * FROM Contracts WHERE owner = ?`,
        account.get("id")?.stringValue()?.toLowerCase() || ""
      );
      return result.getResultList();
    });
    const output = list.map((v, i) => {
      const id = v.get("id")?.stringValue() ?? "";
      const [chainId, address] = id.split("::");
      const name = v.get("name")?.stringValue() ?? "";
      const description = v.get("description")?.stringValue() ?? "";
      const image = v.get("image")?.stringValue() ?? "";
      const symbol = v.get("symbol")?.stringValue() ?? "";
      const deployed = v.get("deployed")?.numberValue() ?? false;
      return {
        id,
        chainId,
        address,
        name,
        description,
        image,
        symbol,
        deployed,
      };
    });
    return httpSuccess(output);
  }),
});
export const updateContract = makeAPIGatewayLambda({
  timeout: 30,
  method: "post",
  cors: true,
  path: "/contracts",
  func: makeAuthenticatedFunc(async ({ event, validateAccount }) => {
    if (!event.body) return sendHttpResult(400, "No body");
    const {
      accountId,
      contractAddress,
      chainId,
      uri,
      template,
      renderer,
      terms,
    }: {
      accountId?: string;
      contractAddress: string;
      chainId: string;
      uri?: string;
      template?: string;
      renderer?: string;
      terms?: Record<string, string>;
    } = JSON.parse(event.body);
    const { account, accountError } = validateAccount(accountId);
    if (accountError) return accountError;
    const { contractError } = await getContract(
      `${chainId}::${contractAddress}`,
      account
    );
    if (contractError) return contractError;
    const { provider, signer } = getProvider(chainId);
    const gasOptions = await getGasOptions(chainId);
    const pdContract = ERC721Termsable__factory.connect(
      contractAddress,
      provider
    );
    const pdSignable = ERC721Termsable__factory.connect(
      contractAddress,
      signer
    );
    if (uri) {
      const oldUri = await pdContract.URI();
      if (uri !== oldUri) {
        await pdSignable.setURI(uri, gasOptions);
      }
    }
    if (template) {
      const oldUri = await pdContract.docTemplate();
      if (template !== oldUri) {
        await pdSignable.setGlobalTemplate(template, gasOptions);
      }
    }
    if (renderer) {
      const oldUri = await pdContract.renderer();
      if (renderer !== oldUri) {
        await pdSignable.setGlobalRenderer(renderer, gasOptions);
      }
    }
    if (terms && Object.keys(terms).length) {
      const termsEntries = Object.entries(terms);
      for (let x = 0; x < termsEntries.length; x++) {
        const [termId, termUri] = termsEntries[x];
        await pdSignable.setGlobalTerm(termId, termUri, gasOptions);
      }
    }
    return httpSuccess("ok");
  }),
});
export const addContract = makeAPIGatewayLambda({
  timeout: 30,
  method: "post",
  cors: true,
  path: "/contracts/add",
  func: makeAuthenticatedFunc(async ({ event, validateAccount }) => {
    if (!event.body) return sendHttpResult(400, "No body");
    const { accountId, contractAddress, chainId } = JSON.parse(event.body);
    const { account, accountError } = validateAccount(accountId);
    if (accountError) return accountError;
    const { provider } = getProvider(chainId);
    const pdContract = ERC721Termsable__factory.connect(
      contractAddress,
      provider
    );
    const [name, symbol] = await Promise.all([
      pdContract.name(),
      pdContract.symbol(),
    ]);
    await qldbDriver.executeLambda(async (tx) => {
      await tx.execute("INSERT INTO Contracts ?", {
        id: `${chainId}::${contractAddress}`,
        name,
        symbol,
        owner: account.get("id")?.stringValue()?.toLowerCase(),
        deployed: 1,
      });
      return true;
    });
    return httpSuccess("ok");
  }),
});
export const removeContract = makeAPIGatewayLambda({
  timeout: 30,
  method: "delete",
  cors: true,
  path: "/contracts",
  func: makeAuthenticatedFunc(async ({ event, validateAccount }) => {
    const { accountId, id } = event.queryStringParameters || {};
    if (!id) return sendHttpResult(400, "No id");
    const { account, accountError } = validateAccount(accountId);
    if (accountError) return accountError;
    const { contractError } = await getContract(id, account);
    if (contractError) return contractError;
    await qldbDriver.executeLambda(async (tx) => {
      const statement = `DELETE FROM Contracts WHERE id = '${id}'`;
      await tx.execute(statement);
      return true;
    });
    return httpSuccess("ok");
  }),
});
//#endregion
