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
import { BigNumber, ethers, utils } from "ethers";
import { Lambda } from "aws-sdk";
import { get as registryGet } from "@raydeck/registry-manager";
import fetch, { RequestInit, Response } from "node-fetch";
import { KeyPair } from "ucan-storage-commonjs/keypair";
import { build, validate } from "ucan-storage-commonjs/ucan-storage";
import { NonEvilToken, NonEvilToken__factory } from "./contracts";
//#region Constants
const DEFAULT_RENDERER = "https://sign.gmsign.xyz";
const DEFAULT_LICENSE_VERSION = 0;
//#endregion
//#region Helper Functions
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

const urlBase = "https://xw8v-tcfi-85ay.n7.xano.io/api:W2GV-aeC";
const xanoFetch = async (
  path: string,
  options: RequestInit = {}
): Promise<Response> => {
  const headers = {
    Authorization: "Bearer " + process.env.HELLOSIGN_API_KEY,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  console.log(
    "RHD Reaching out to Xano",
    urlBase,
    path,
    JSON.stringify(headers, null, 2)
  );
  return fetch(urlBase + path, { ...options, headers });
};

//getAccount - get from the list in the original file we have of this
let account: any;
let accountId: any;
const getAccount = async (_accountId?: string) => {
  if (_accountId) accountId = _accountId;
  if (account) return account;
  if (!accountId) throw new Error("No account id");
  console.log("Getting account", accountId);
  const response = await xanoFetch(`/hs_accounts/${accountId}`, {
    method: "GET",
  });
  if (response.status !== 200) {
    return undefined;
  }
  const obj = await response.json();
  return obj;
};

const getContractId = (address: string, chainId: string) => {
  return `${chainId}::${address}`;
};

const getContractPartsFromId = (id: string) => {
  const [chainId, address] = id.split("::", 2);
  return { chainId, address };
};

//getContract

const getContractById = async (id: string): Promise<any> => {
  try {
    const account = await getAccount();
    const response = await xanoFetch(`/hs_contract?hs_contracts_id=${id}`, {
      method: "GET",
    });
    const obj = await response.json();
    if (obj.owner === account.id) {
      return { contract: obj };
    } else {
      throw new Error("Not owner");
    }
  } catch (e) {
    return {
      contract: undefined,
      contractError: sendHttpResult(400, "No contract found"),
    };
  }
};

const getSignerFromHeader = <T extends { exp: number }>(
  event: APIGatewayProxyEvent
) => {
  account = undefined;
  accountId = undefined;
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
    accountId = address;
    return { address, message: parsedMessage };
  }
  return undefined;
};
const makeAuthenticatedFunc = (
  func: (args: {
    event: APIGatewayProxyEvent;
    context: any;
    callback: Callback<APIGatewayProxyResult>;
    user: Awaited<ReturnType<typeof getAccount>>;
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
    let user = await getAccount(payload.address);
    if (!user) {
      //make the account
      console.log(
        "I am trying to make the account on xano",
        JSON.stringify({ address: payload.address }),
        "Hello"
      );
      const response = await xanoFetch(`/hs_accounts`, {
        method: "POST",
        body: JSON.stringify({ address: payload.address }),
      });
      user = await getAccount();
      if (!user) {
        return sendHttpResult(500, "Error creating user");
      }
    }
    return func({
      event,
      context,
      callback,
      user,
    });
  });
const getProvider = (chainId: string) => {
  const chainInfo = getChainInfo(chainId);
  console.log("got chaininfo for chain", chainId, chainInfo);
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
//#region Contract Deployment API Endpoints
type DeployEvent = {
  address: string;
  name: string;
  symbol: string;
  // terms: Record<string, string>;
  // title: string;
  // description: string;
  // image?: string;
  // cover?: string;
  royaltyRecipient: string;
  royaltyPercentage: string;
  chainId: string;
  uri: string;
  licenseVersion: number;
};
export const deployNFTContract = makeAPIGatewayLambda({
  path: "/make-nft-contract",
  method: "post",
  cors: true,
  timeout: 30,
  func: makeAuthenticatedFunc(
    async ({ event, context, callback, user: account }) => {
      if (!event.body) return sendHttpResult(400, "No body provided");
      const {
        address,
        name,
        symbol,
        chainId,
        uri,
        royaltyRecipient,
        royaltyPercentage,
        licenseVersion,
      }: DeployEvent = JSON.parse(event.body);
      //Validate the address
      if (!address || ethers.utils.isAddress(address) === false)
        return sendHttpResult(400, "Invalid address");
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
        royaltyPercentage,
        royaltyRecipient,
        licenseVersion,
      });
      console.log("Triggering doDeploy with payload", Payload);
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
      // terms = {},
      uri,
      chainId,
      name,
      address,
      symbol,
      licenseVersion,
    }: DeployEvent = event;
    const { provider, signer } = getProvider(chainId);
    console.log("I have a provider for chainId", chainId);
    if (!signer) return sendHttpResult(400, "bad chain id");
    //time to deploy
    // build the new contract
    console.log("I will get fee data things");
    const feeData = await provider.getFeeData();
    const gasPrice = await provider.getGasPrice();
    const polyDocsFactory = new NonEvilToken__factory(signer);
    console.log("That's over now");
    console.log("Deploying with", licenseVersion, address, name, symbol);
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
    let polyDocs: NonEvilToken;
    try {
      console.log(
        "I am about to deploy",
        licenseVersion,
        address,
        name,
        symbol,
        {
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasLimit: BigNumber.from(6_500_000),
        }
      );
      const polyDocs1 = await polyDocsFactory.deploy(
        licenseVersion,
        address,
        name,
        symbol,
        {
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasLimit: BigNumber.from(6_500_000),
        }
      );
      polyDocs = polyDocs1;
    } catch (e) {
      console.log("Hit an error in the first round:", (e as any).errorMessage);
      console.log("Trying with double fees");
      maxFeePerGas = maxFeePerGas.mul(2);
      maxPriorityFeePerGas = maxPriorityFeePerGas.mul(2);
      const polyDocs2 = await polyDocsFactory.deploy(
        licenseVersion,
        address,
        name,
        symbol,
        {
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasLimit: BigNumber.from(6_500_000),
        }
      );
      polyDocs = polyDocs2;
    }
    console.log("polyDocs is ", polyDocs.address);

    const id = `${chainId}::${polyDocs.address}`;
    const account = await getAccount(address);
    const response = await xanoFetch("/hs_contracts", {
      body: JSON.stringify({
        owner: account.id,
        contractAddress: polyDocs.address,
        chainId,
        contractId: id,
        name,
        symbol,
        deployed: 0,
      }),

      method: "POST",
    });

    await polyDocs.deployed();

    // const pdTxn = await polyDocs.setPolydocs(renderer, template, [], {
    //   maxFeePerGas,
    //   maxPriorityFeePerGas,
    // });
    // await pdTxn.wait();
    const mdTxn = await polyDocs.setURI(uri, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });

    //@TODO support royalty
    await mdTxn.wait();
    const deployedUri = `/hs_contracts_deployed`;
    console.log("Updating with deployedUri", deployedUri);
    const response2 = await xanoFetch(deployedUri, {
      body: JSON.stringify({
        deployed: 1,
        hs_contracts_id: id,
      }),
      method: "POST",
    });
    console.log("response2", response2.status, await response2.text());
  },
});
//#endregion
export const mintNFT = makeAPIGatewayLambda({
  timeout: 300,
  method: "post",
  path: "/mintNFT",
  cors: true,
  func: makeAuthenticatedFunc(async ({ event, user: account }) => {
    //Get the image
    const {
      contractAddress,
      cid,
      chainId,
      account: accountId,
    } = JSON.parse(event.body || "{}");
    const { contractError } = await getContractById(
      `${chainId}::${contractAddress}`
    );
    if (contractError) return contractError;
    const { signer } = getProvider(chainId);

    console.log("Hooray I did not run upload and got a cid", cid);
    console.log("connecting to contract at ", contractAddress);
    const contract = NonEvilToken__factory.connect(contractAddress, signer);
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
  }),
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
  func: makeAuthenticatedFunc(async ({ event, user }) => {
    //lets get my contracts
    const accountId = user.address;
    console.log("I have a user object", JSON.stringify(user, null, 2));
    const result = await xanoFetch(`/hs_accounts/${accountId}/contracts`);
    if (result.status !== 200)
      return sendHttpResult(400, "No good result" + (await result.text()));
    const list = await result.json();
    return httpSuccess(list);
  }),
});
export const updateContract = makeAPIGatewayLambda({
  timeout: 30,
  method: "post",
  cors: true,
  path: "/contracts",
  func: makeAuthenticatedFunc(async ({ event, user: account }) => {
    if (!event.body) return sendHttpResult(400, "No body");
    const {
      contractAddress,
      chainId,
      uri,
      template,
      renderer,
      terms,
    }: {
      contractAddress: string;
      chainId: string;
      uri?: string;
      template?: string;
      renderer?: string;
      terms?: Record<string, string>;
    } = JSON.parse(event.body);
    const { contractError } = await getContractById(
      `${chainId}::${contractAddress}`
    );
    if (contractError) return contractError;
    const { provider, signer } = getProvider(chainId);
    const gasOptions = await getGasOptions(chainId);
    const pdContract = NonEvilToken__factory.connect(contractAddress, provider);
    const pdSignable = NonEvilToken__factory.connect(contractAddress, signer);
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
  func: makeAuthenticatedFunc(async ({ event, user: account }) => {
    if (!event.body) return sendHttpResult(400, "No body");
    const { contractAddress, chainId } = JSON.parse(event.body);
    const { provider } = getProvider(chainId);
    const pdContract = NonEvilToken__factory.connect(contractAddress, provider);
    const [name, symbol] = await Promise.all([
      pdContract.name(),
      pdContract.symbol(),
    ]);
    //Add contract
    const { id } = account;
    const result = await xanoFetch("/hs_contracts/", {
      method: "POST",
      body: JSON.stringify({
        contractId: `${chainId}::${contractAddress}`,
        address: contractAddress,
        chainId,
        name,
        symbol,
        owner: id,
        deployed: 1,
      }),
    });
    const obj = await result.json();
    console.log("Got back answer on my fetch", obj);
    return httpSuccess("ok");
  }),
});
export const removeContract = makeAPIGatewayLambda({
  timeout: 30,
  method: "delete",
  cors: true,
  path: "/contracts",
  func: makeAuthenticatedFunc(async ({ event, user: account }) => {
    const { id } = event.queryStringParameters || {};
    if (!id) return sendHttpResult(400, "No id");
    console.log("Getting a contract", id);
    const { contract, contractError } = await getContractById(id);
    if (contractError) {
      console.log("Error getting contract", contractError);
      return contractError;
    }
    console.log("I got the conrtract", id, contract);
    if (contract.owner !== account.id) {
      return sendHttpResult(403, "Not your contract");
    }
    console.log("deleting contract", id);
    const response = await xanoFetch(`/hs_contract?hs_contracts_id=${id}`, {
      method: "DELETE",
    });
    console.log(
      "I deleted the contract",
      response.status,
      await response.text()
    );

    return httpSuccess("ok");
  }),
});
//#endregion
