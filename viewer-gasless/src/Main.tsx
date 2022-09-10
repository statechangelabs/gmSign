import {
  FC,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useIPFSText, useIPFSDataUri } from "./useIPFS";
import { BigNumber, ethers } from "ethers";
import {
  TokenTermReader__factory,
  TermReader__factory,
  MetadataURI__factory,
  Signable__factory,
  TokenSignable__factory,
} from "./contracts";
import Mustache from "mustache";
import Markdown from "react-markdown";
import copy from "clipboard-copy";
import { toast } from "react-toastify";
import Topography from "./topography.svg";
import Logo from "./PolydocsLogo.svg";
import { FaClipboard } from "react-icons/fa";
import useAsyncEffect from "./useAsyncEffect";
import Loading from "./Loading";

// const MYJSON: any = {
//   image: "ipfs://bafybeihaejmfddiavxfhcnb3nbpxetyscwoarde4g42xtk4e5vupql3mmi",
//   cover: "ipfs://bafkreie4pck53sp62rezde2h5z4uw7e4gqzwmj7aeysybbr23zm3jzz73q",
//   title: "Sample NFT Collection, Drew!",
//   description:
//     "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
//   terms: {
//     name: "State Change Labs",
//   },
//   backgroundColor: "#0000FF",
//   background:
//     "ipfs://bafybeihaejmfddiavxfhcnb3nbpxetyscwoarde4g42xtk4e5vupql3mmi",
// };

const POLYDOCS_URL =
  process.env.REACT_APP_POLYDOCS_URL ??
  "https://y86jifedeh.execute-api.us-east-1.amazonaws.com/dev/sign";

export const ethereum = (window as unknown as { ethereum: any }).ethereum;
export const provider = ethereum
  ? new ethers.providers.Web3Provider(ethereum)
  : undefined;

const useSign = (contractAddress: string, tokenId?: string) => {
  const [isSigning, setIsSigning] = useState(false);
  const sign = useCallback(async () => {
    if (!provider) return;
    const address = await provider.getSigner().getAddress();
    const contract = Signable__factory.connect(contractAddress, provider);
    const termsUrl = await contract.termsUrl();
    if (!termsUrl.endsWith(window.location.hash)) {
      toast(
        "There is a mismatch between this document and the smart contract. Do not sign this version",
        { type: "error" }
      );
      return false;
    }
    setIsSigning(true);
    const message = "I agree to the terms in this document: " + termsUrl;
    const signature = await provider.getSigner().signMessage(message);
    try {
      const res = await fetch(POLYDOCS_URL, {
        method: "post",
        body: JSON.stringify({
          message,
          signature,
          address,
        }),
      });
      if (res.status === 200) {
        return true;
      } else {
        toast("Oops! Something went wrong.", {
          type: "error",
        });
      }
    } catch (e) {
      toast("Oops! Something went wrong.", {
        type: "error",
      });
    }
    setIsSigning(false);
  }, [contractAddress, tokenId]);
  return { sign, isSigning };
};

export const useTerms = (
  address: string,
  block: string,
  token?: ethers.BigNumber
) => {
  const [terms, setTerms] = useState<Record<string, string>>({});
  const [termBlocks, setTermBlocks] = useState<Record<string, number>>({});
  const termRef = useRef(terms);
  termRef.current = terms;
  const addTerm = useCallback(
    async (key: string) => {
      const [realKey, _defaultValue] = key.split(",");
      if (termRef.current[key]) {
        return;
      }
      const defaultValue = _defaultValue; //?? ``;
      if (defaultValue)
        setTerms((prev) => {
          if (prev[key]) return prev;
          return { ...prev, [key]: defaultValue };
        });
      try {
        if (!provider) return;

        const blockTag = parseInt(block);
        if (typeof token === "undefined") {
          const contract = TermReader__factory.connect(address, provider);
          const term = isNaN(blockTag)
            ? await contract.globalTerm(realKey)
            : await contract.globalTerm(realKey, {
                blockTag,
              });
          if (term) setTerms((prev) => ({ ...prev, [key]: `${term}` }));
          console.log("Realkey is ", realKey);
          const events = await contract.queryFilter(
            contract.filters.GlobalTermChanged(ethers.utils.keccak256(realKey)),
            0,
            blockTag
          );
          const lastEvent = events.pop()?.blockNumber;
          if (lastEvent)
            setTermBlocks((prev) => ({ ...prev, [key]: lastEvent }));
        } else {
          const contract = TokenTermReader__factory.connect(address, provider);
          const term = isNaN(blockTag)
            ? await contract.tokenTerm(realKey, token)
            : await contract.tokenTerm(realKey, token, {
                blockTag,
              });
          if (term.startsWith(""))
            if (term) setTerms((prev) => ({ ...prev, [key]: `${term}` }));
          const events = await contract.queryFilter(
            contract.filters.TokenTermChanged(
              ethers.utils.keccak256(realKey),
              token
            ),
            0,
            blockTag
          );
          const lastEvent = events.pop()?.blockNumber;
          if (lastEvent)
            setTermBlocks((prev) => ({ ...prev, [key]: lastEvent }));
          //@TODO CONFIRM blocktags for token-based terms
        }
      } catch (e) {
        console.error("My life is so hard", e);
      }
    },
    [address, token, block]
  );

  //http://localhost:3000/
  // #/bafkreiahgnurv72abvrvlvl4s2k62s4kxwxuc56l7eyfwhh3tatnmt4poa::31337::0x5FbDB2315678afecb367f032d93F642f64180aa3::2::0

  // https://ipfs.io/ipfs/bafybeia45ccvqp632ysddhs3bykp3j273pkoxnuaq24r37mh3dl4g3qmvm/#/bafkreiahgnurv72abvrvlvl4s2k62s4kxwxuc56l7eyfwhh3tatnmt4poa::31337::0x5FbDB2315678afecb367f032d93F642f64180aa3::2::0
  const reset = useCallback(() => {
    setTerms({});
  }, []);
  const setTerm = useCallback((term: string, value: string) => {
    setTerms((old) => ({ ...old, [term]: term }));
  }, []);
  return useMemo(
    () => ({ terms, addTerm, reset, setTerm, termBlocks }),
    [terms, addTerm, reset, setTerm, termBlocks]
  );
};
const Renderer: FC<{
  documentId: string;
  contractAddress: string;
  block: string;
  tokenId?: string;
}> = ({ block, contractAddress, documentId, tokenId }) => {
  const [isSigned, setIsSigned] = useState(false);
  const [isHighlight, setIsHighlight] = useState(false);
  useAsyncEffect(async () => {
    if (!provider) return;
    if (typeof tokenId !== "undefined") {
      const contract = TokenSignable__factory.connect(
        contractAddress,
        provider
      );
      const accepted = await contract.acceptedTerms(
        provider.getSigner().getAddress(),
        tokenId
      );
      if (accepted) setIsSigned(true);
    } else {
      const contract = Signable__factory.connect(
        contractAddress,
        provider.getSigner()
      );

      const accepted = await contract.acceptedTerms(
        provider.getSigner().getAddress()
      );
      if (accepted) setIsSigned(true);
    }
  }, []);
  const [URI, setURI] = useState("");
  const [lastURIBlock, setLastURIBlock] = useState(0);
  useAsyncEffect(async () => {
    if (!provider) return;
    const contract = MetadataURI__factory.connect(
      contractAddress,
      provider.getSigner()
    );
    const uri = (await contract.URI({ blockTag: parseInt(block) })) as string;
    const strippedUri = uri.split("://").pop() || uri;
    setURI(strippedUri);
    const events = await contract.queryFilter(
      contract.filters.UpdatedURI(),
      0,
      parseInt(block)
    );
    const lastEvent = events.pop()?.blockNumber;
    if (lastEvent) setLastURIBlock(lastEvent);
  }, [contractAddress, provider]);
  console.log("Last URI block is", lastURIBlock);
  //@TODO Move back to using contract JSON
  const json = useIPFSText(URI);
  const obj = json ? JSON.parse(json) : {};
  // const obj = MYJSON;
  const image = useIPFSDataUri(
    (obj.image && obj.image.split("://").pop()) || obj.image
  );
  const cover = useIPFSDataUri(
    (obj.cover && obj.cover.split("://").pop()) || obj.cover
  );
  const contractBg = useIPFSDataUri(
    (obj.background && obj.background.split("://").pop()) || obj.background
  );
  const [bg, setBg] = useState(Topography);
  useEffect(() => {
    if (contractBg) setBg(contractBg);
  }, [contractBg]);
  const title = obj.title || "";
  const description = obj.description || "";
  const jsonTerms = (obj.terms || {}) as Record<string, string>;
  const template = useIPFSText(documentId);
  const { terms, addTerm, termBlocks } = useTerms(
    contractAddress,
    block,
    typeof tokenId === "undefined" ? undefined : BigNumber.from(tokenId)
  );
  useEffect(() => {
    if (template) {
      const spans = Mustache.parse(template);
      const tokens = spans
        .filter(([type]) => type === "name")
        .map(([, key]) => key);
      tokens.forEach(addTerm);
    }
  }, [template, addTerm]);
  const { isSigning, sign: _sign } = useSign(contractAddress, tokenId);
  const sign = useCallback(async () => {
    if (await _sign()) {
      toast("Signature recorded!");
      setIsSigned(true);
    }
  }, [_sign]);
  if (!template) return <Loading />;
  if (!provider) return <div>"No provider"</div>;
  const overrideTerms = Object.entries(terms)
    .filter(([key]) => {
      if (!jsonTerms[key] || termBlocks[key] > lastURIBlock) {
        return true;
      }
    })
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  const baseValues = Object.entries({ ...jsonTerms, ...overrideTerms });
  const values = baseValues
    .map(([key, value]) => [key, isHighlight ? `**${value}**` : value])
    .reduce(
      (acc, [key, value]) => ({ ...acc, [key]: value }),
      {} as Record<string, string>
    );
  const output = Mustache.render(template, values);
  const baseOutput = Mustache.render(template, baseValues);
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(baseOutput));
  console.log("Bg is", bg);
  return (
    <Fragment>
      <div
        style={
          obj.backgroundColor
            ? { backgroundColor: obj.backgroundColor }
            : undefined
        }
      >
        <div
          className="fixed w-full h-screen bg-cover"
          style={{ backgroundImage: `url(${bg})` }}
        />
        <div className="relative  mx-auto flex flex-col">
          <header className="flex justify-between items-center p-4 bg-opacity-80 bg-white">
            <div className="flex items-center space-x-2">
              <img src={Logo} alt="Logo" className="w-12" />
              <h1 className="text-lg font-bold text-black">Polydocs</h1>
            </div>

            <div className="flex flex-row justify-end print:hidden">
              <button
                className=" text-primary-light hover:text-teal-light transition font-medium text-xs"
                onClick={() => {
                  copy(hash);
                  toast("Copied to clipboard");
                }}
              >
                <span className="text-gray-600">Hash:</span> {hash}
                <FaClipboard className="inline ml-1 -mt-1" />
              </button>
            </div>
          </header>
          <div className="max-w-[760px] mx-auto lg:-mt-4 shadow-lg">
            <div className="flex-grow w-full prose mx-auto  bg-white doc-shadow print:shadow-none">
              <div className="relative overflow-hidden">
                {cover && (
                  <img
                    src={cover}
                    alt="Contract Image"
                    className="absolute z-0 my-0 h-40 w-full object-cover"
                  />
                )}
                <div className="mt-32 top-0 z-50 p-6">
                  {image && (
                    <img
                      src={image}
                      alt="Contract Image"
                      className="h-24 w-24 object-cover
                 rounded-full left-0 border-2 border-white shadow-md absolute ml-6 -mt-6"
                    />
                  )}

                  <div className=" ml-32 mt-6">
                    {title && <p className="my-0">{title}</p>}{" "}
                    {description && (
                      <p className="text-sm opacity-75 my-0">
                        {description.replace("[POLYDOCS]", "").trim()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 lg:p-8 overflow-x-scroll scrollable">
                <Markdown>{output}</Markdown>
              </div>
            </div>

            <div className="bg-white doc-shadow p-6 my-6">
              <div className="prose mx-auto">
                <div className=" flex flex-row justify-between print:hidden ">
                  <button
                    className="btn btn-gradient"
                    onClick={() => setIsHighlight((old) => !old)}
                  >
                    {isHighlight ? "Unhighlight terms" : "Highlight terms"}
                  </button>
                  <button
                    className="btn btn-gradient"
                    onClick={() => window.print()}
                    disabled={isSigned || isSigning}
                  >
                    Print
                  </button>
                  <button
                    className="btn btn-gradient"
                    onClick={() => {
                      copy(window.location.href);
                      toast("Copied to clipboard");
                    }}
                    disabled={isSigned || isSigning}
                  >
                    Copy Unique URL
                  </button>
                  <button
                    className={[
                      "btn ",
                      isSigning || isSigned
                        ? "text-black border bg-gradient-to-r from-gray-200 to-gray-400 hover:background-gray-200"
                        : "btn-primary",
                    ].join(" ")}
                    onClick={() => {
                      if (!isSigned && !isSigning) sign();
                    }}
                  >
                    {isSigned
                      ? "You're all set!"
                      : isSigning
                      ? "Signing..."
                      : terms["signatureLabel"] || "Agree To Terms"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};
export default Renderer;
