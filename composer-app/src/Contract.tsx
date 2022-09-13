import {
  FC,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  // TokenTermsable__factory,
  TermsableNoToken__factory,
  // TokenTermReader__factory,
  TermReader__factory,
  NonEvilToken__factory,
} from "./contracts";
import { ethers } from "ethers";
import useAsyncEffect from "./useAsyncEffect";
import { useMain } from "./Main";
import Renderer from "./Renderer";
import { getIPFSText, useIPFSText } from "./useIPFS";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useKnownTemplates } from "./useKnownTemplates";
import { useProvider } from "./provider";
import {
  ErrorMessage as FormikErrorMessage,
  Field,
  Form,
  Formik,
} from "formik";
import { DropFile } from "./DropFile";
import { useAuthenticatedFetch } from "./Authenticator";
import { useUpload } from "./useIPFSUpload";
import { blockExplorers } from "./chains";
import Tokens from "./Tokens";
const knownRenderers = [
  "bafybeig44fabnqp66umyilergxl6bzwno3ntill3yo2gtzzmyhochbchhy",
];

const ContractDocument: FC = () => {
  const knownTemplates = useKnownTemplates();
  const navigate = useNavigate();
  const { contractId } = useParams();
  const [chainId, contractAddress] = (contractId || "").split("::");
  const provider = useProvider(chainId);
  const [currentRenderer, setCurrentRenderer] = useState("");
  const [currentBlock, setCurrentBlock] = useState("");
  const [currentTemplate, setCurrentTemplate] = useState("");
  const [contractTemplate, setContractTemplate] = useState("");
  const [currentTerms, setCurrentTerms] = useState<Record<string, string>>({});
  const [templateTerms, setTemplateTerms] = useState<string[]>([]);
  const [currentUrl, setCurrentUrl] = useState("");
  const updateUrl = useCallback(async () => {
    if (!provider) return;
    const noTokenContract = TermsableNoToken__factory.connect(
      contractAddress,
      provider
    );
    setCurrentUrl(
      await noTokenContract.termsUrlWithPrefix("https://ipfs.io/ipfs/")
    );
  }, [contractAddress, provider]);
  useEffect(() => {
    updateUrl();
  }, [updateUrl, currentTemplate, currentTerms, currentRenderer]);
  const [tokenId, setTokenId] = useState(0);
  const templates = useMemo(() => {
    const templates: Record<string, string> = JSON.parse(
      localStorage.getItem("templates") || "{}"
    );
    console.log("I will use templates", templates);
    return templates;
  }, []);
  const fetch = useAuthenticatedFetch();
  useAsyncEffect(async () => {
    if (!provider) return;
    if (ethers.utils.isAddress(contractAddress)) {
      //   const tokenContract = TokenTermsable__factory.connect(
      //     contractAddress,
      //     provider
      //   );
      //   try {
      //     console.log("Trtying to get from contracts");
      //     const tokenRenderer = await tokenContract.tokenRenderer(tokenId);
      //     console.log(" iam tryign to get the template cid");
      //     setContractTemplate(tokenRenderer);
      //   } catch (e) {
      console.log("trying another way");
      const noTokenContract = TermsableNoToken__factory.connect(
        contractAddress,
        provider
      );
      console.log("On this other path", await noTokenContract.renderer());
      setCurrentRenderer(await noTokenContract.renderer());
      setContractTemplate(await noTokenContract.docTemplate());
      // }
    } else {
      setCurrentRenderer("");
      setContractTemplate("");
      setCurrentTerms({});
    }
  }, [contractAddress, provider]);
  useEffect(() => {
    setCurrentTemplate(contractTemplate);
  }, [contractTemplate]);
  const currentTemplateText = useIPFSText(currentTemplate);
  useEffect(() => {
    setTemplateTerms([]);
  }, [currentTemplate]);
  const currentTermsRef = useRef(currentTerms);
  useEffect(() => {
    currentTermsRef.current = currentTerms;
  }, [currentTerms]);
  useAsyncEffect(async () => {
    console.log("starting UAE");
    if (
      templateTerms &&
      templateTerms.length &&
      ethers.utils.isAddress(contractAddress) &&
      provider
    ) {
      // const tokenContract = TokenTermReader__factory.connect(
      //   contractAddress,
      //   provider
      // );
      // try {
      //   await Promise.all(
      //     templateTerms
      //       .filter((v, i, a) => a.indexOf(v) === i)
      //       .filter((v) => !currentTermsRef.current[v])
      //       .map(async (term) => {
      //         const termText = await tokenContract.tokenTerm(term, tokenId);
      //         setCurrentTerms((prev) =>
      //           prev[term] ? prev : { ...prev, [term]: termText }
      //         );
      //       })
      //   );
      // } catch (e) {
      const noTokenContract = TermReader__factory.connect(
        contractAddress,
        provider
      );
      //extract terms
      await Promise.all(
        templateTerms
          .filter((v) => !currentTermsRef.current[v])
          .map(async (term) => {
            if (!currentTerms[term]) {
              const termText = await noTokenContract.globalTerm(term);
              setCurrentTerms((prev) =>
                prev[term] ? prev : { ...prev, [term]: termText }
              );
            }
          })
      );
      // }
    }
    console.log("FINISHED UAE");
  }, [templateTerms, contractAddress, tokenId]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  // useEffect(() => {
  //   if (
  //     contractAddress !== contractId &&
  //     ethers.utils.isAddress(contractAddress)
  //   ) {
  //     navigate(`/contract/${contractAddress}`);
  //     localStorage.setItem("contractAddress", contractAddress);
  //   }
  // }, [contractAddress, contractId, navigate]);
  // const knownTemplates = useIPFSList(knownCids);
  return (
    <Fragment>
      <hr className="my-6 border-gray-300" />
      <h2 className="text-xl font-bold text-gray-700">Terms Document</h2>
      <div>
        <div className="flex space-x-6 items-center justify-end mb-12">
          {/* <h2 className="text-xl font-semibold ">Contract Address</h2>
          <input
            className="border border-gray-200 rounded-none p-1  flex-grow"
            value={contractAddress}
            onChange={(e) => {
              setContractAddress(e.target.value);
            }} 
          /> */}
        </div>
        <div className="grid grid-cols-2 gap-x-6">
          <div>
            <div className="bg-white doc-shadow p-6 mb-6">
              <span className="font-semibold mr-6">Renderer CID:</span>{" "}
              {currentRenderer && (
                <a
                  href={`https://ipfs.io/ipfs/${currentRenderer}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {currentRenderer.substring(0, 6)}...
                  {currentRenderer.substring(currentRenderer.length - 4)}
                </a>
              )}
              {currentRenderer === knownRenderers[0] && (
                <span className="ml-2 text-xs text-teal-dark">
                  Using the best renderer!
                </span>
              )}
            </div>
            <div className="bg-white doc-shadow p-6">
              <div className="mb-3">
                <h2 className="text-lg font-semibold">Document Template</h2>
                {currentRenderer !== knownRenderers[0] && (
                  <button
                    className="btn btn-gradient"
                    onClick={async () => {
                      console.log("Uou are pressing the button");
                      if (!provider) return;
                      const contract = TermsableNoToken__factory.connect(
                        contractAddress,
                        provider?.getSigner()
                      );
                      try {
                        const p = fetch("/contracts", {
                          method: "POST",
                          body: JSON.stringify({
                            contractAddress,
                            chainId,
                            renderer: knownRenderers[0],
                          }),
                        });
                        // const txn = await contract.setGlobalRenderer(
                        //   knownRenderers[0]
                        // );
                        toast("Saving renderer via metatransaction");
                        await p;
                        toast("Saved");
                        setCurrentRenderer(knownRenderers[0]);
                      } catch (e) {
                        toast(
                          "Error saving to blockchain: " +
                            (e as { reason: string }).reason.substring(14)
                        );
                      }
                    }}
                  >
                    Use Default Renderer
                  </button>
                )}
              </div>

              {!showTemplateForm && (
                <div>
                  <div>
                    <span className="font-semibold mr-6">Template CID:</span>
                    {currentTemplate && (
                      <a
                        href={`https://ipfs.io/ipfs/${currentTemplate}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {currentTemplate.substring(0, 6)}...
                        {currentTemplate.substring(currentTemplate.length - 4)}
                      </a>
                    )}
                  </div>
                  <button
                    className="btn btn-primary mt-6 text-xs"
                    onClick={() => setShowTemplateForm(true)}
                  >
                    Change
                  </button>
                </div>
              )}
              {showTemplateForm && (
                <div>
                  <div className="flex flex-col mb-6">
                    <input
                      className="border border-gray-200 p-1 rounded-none mb-3"
                      value={currentTemplate}
                      onChange={(e) => setCurrentTemplate(e.target.value)}
                    />{" "}
                    {currentTemplate !== contractTemplate && (
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          if (!provider) return;
                          const contract = TermsableNoToken__factory.connect(
                            contractAddress,
                            provider.getSigner()
                          );

                          try {
                            toast("Saving new template to chain");
                            await fetch("/contracts", {
                              method: "POST",
                              body: JSON.stringify({
                                contractAddress,
                                chainId,
                                template: currentTemplate,
                              }),
                            });

                            toast("Template saved to chain");
                            updateUrl();
                          } catch (e) {
                            let reason = (e as { reason: any }).reason;
                            if (reason.startsWith("execution reverted: "))
                              reason = reason.substring(
                                "execution reverted: ".length
                              );
                            toast("Could not save because " + reason, {
                              type: "error",
                            });
                          }
                        }}
                      >
                        Update Template
                      </button>
                    )}
                  </div>
                  <div>
                    <p className="text-xs opacity-50 mb-6">
                      Select a template to preview how it would work in your
                      contract. Click copy to make a modified version of the
                      template.
                    </p>
                    <h3 className="font-semibold mb-2">Known Templates</h3>
                    <ul>
                      {knownTemplates.map(({ cid, name }) => (
                        <li className="flex justify-between gap-4 mb-6 ">
                          <button
                            onClick={() => {
                              setCurrentTemplate(cid);
                            }}
                            className="text-left text-primary-default hover:text-primary-light truncate"
                          >
                            <div>
                              {name}
                              ...
                            </div>
                            <div className="text-xs text-left opacity-50">
                              cid: {cid}
                            </div>
                          </button>
                          <button
                            className="text-teal-dark underline"
                            onClick={() => {
                              navigate("/template/" + cid);
                            }}
                          >
                            Copy
                          </button>
                        </li>
                      ))}
                    </ul>
                    {Object.entries(templates).length > 0 && (
                      <>
                        <h3 className="font-semibold mb-2">My Templates</h3>
                        <ul>
                          {Object.entries(templates).map(([cid, template]) => (
                            <li className="flex justify-between gap-4 mb-4 ">
                              <button
                                onClick={() => {
                                  setCurrentTemplate(cid);
                                }}
                                className="text-left gap-1text-gray-60 text-primary-default hover:text-primary-light truncate"
                              >
                                <div>
                                  {template
                                    .replaceAll("#", "")
                                    .substring(0, 60)}
                                  ...
                                </div>
                                <div className="text-xs text-gray-60">
                                  cid: {cid}
                                </div>
                              </button>
                              <button
                                className="text-teal-dark underline"
                                onClick={() => {
                                  navigate("/template/" + cid);
                                }}
                              >
                                Copy
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                  <button
                    className="btn btn-gradient mt-8"
                    onClick={() => setShowTemplateForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white doc-shadow p-6">
            <h2 className="text-lg font-semibold">Terms used in contract</h2>
            {templateTerms
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((term) => (
                <div>
                  <div className="text-xs text-black text-opacity-75 mt-4">
                    {term}
                  </div>
                  <div className="w-full flex">
                    <input
                      className="border border-gray-200 p-1 flex-grow"
                      value={currentTerms[term]}
                      onChange={(e) => {
                        setCurrentTerms((prev) => ({
                          ...prev,
                          [term]: e.target.value,
                        }));
                      }}
                    />
                    <button
                      className="btn btn-gradient !px-4 ml-4"
                      onClick={async () => {
                        if (!provider) return;
                        const contract = TermsableNoToken__factory.connect(
                          contractAddress,
                          provider.getSigner()
                        );
                        try {
                          console.log("Saving", term, currentTerms[term]);
                          toast("Saving new term to chain");
                          await fetch("/contracts", {
                            method: "POST",
                            body: JSON.stringify({
                              contractAddress,
                              chainId,
                              terms: { [term]: currentTerms[term] },
                            }),
                          });
                          // const txn = await contract.setGlobalTerm(
                          //   term,
                          //   currentTerms[term]
                          // );
                          // await txn.wait();
                          toast("Term saved to chain");
                          updateUrl();
                        } catch (e) {
                          let reason = (e as { reason: any }).reason;
                          if (reason.startsWith("execution reverted: "))
                            reason = reason.substring(
                              "execution reverted: ".length
                            );
                          toast("Could not save because " + reason, {
                            type: "error",
                          });
                        }
                        updateUrl();
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className="flex flex-col mt-12">
          <div className="prose mx-auto">
            <Renderer
              template={currentTemplateText}
              setTerms={setTemplateTerms}
              terms={currentTerms}
            />
          </div>
        </div>
      </div>
    </Fragment>
  );
};

const ErrorMessage: FC<{ name: string }> = ({ name }) => {
  return (
    <FormikErrorMessage
      component="div"
      name={name}
      className="text-red-500 text-xs pt-2"
    />
  );
};

const ContractEditor: FC = () => {
  const { setTitle } = useMain();
  useEffect(() => {
    setTitle("");
  }, [setTitle]);
  const navigate = useNavigate();
  const { contractId } = useParams();
  const [chainId, contractAddress] = (contractId || "").split("::");
  const provider = useProvider(chainId);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [jsonObj, setJsonObj] = useState<Record<string, any>>();
  useAsyncEffect(async () => {
    const contract = NonEvilToken__factory.connect(contractAddress, provider);
    const name = await contract.name();
    setName(name);
    const symbol = await contract.symbol();
    setSymbol(symbol);
    const uri = await contract.URI();
    const json = await getIPFSText(uri);
    const obj = JSON.parse(json);
    setJsonObj(obj);
    console.log("json obj is updated", obj);
    // const image = JSON.parse(image);
  }, [provider]);
  const { upload } = useUpload();
  const fetch = useAuthenticatedFetch();
  if (!jsonObj) return null;
  return (
    <>
      <Formik
        initialValues={jsonObj}
        onSubmit={async (values) => {
          const newObj = { ...jsonObj, ...values };
          toast.info("Saving new JSON file to IPFS");
          const cid = await upload(JSON.stringify(newObj));
          toast.info("Updating contract via metatransaction");
          await fetch("/contracts", {
            method: "POST",
            body: JSON.stringify({
              contractAddress,
              chainId,
              uri: "ipfs://" + cid,
            }),
          });
          toast.success("Saved!");
          console.log("submit");
        }}
      >
        {({ dirty, isValid, isSubmitting, setFieldValue, values }) => (
          <Form>
            <div>
              <div className="container-narrow mb-12">
                <div className="bg-white doc-shadow p-6">
                  <div className="pb-6 border-b border-gray-100">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Profile
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      General information about the contract
                    </p>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start  sm:py-6">
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                    >
                      Short Description
                    </label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <div className="max-w-lg flex  shadow-sm">
                        {/* <span className="inline-flex items-center px-3 -l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        workcation.com/
                      </span> */}
                        <Field
                          type="text"
                          name="title"
                          id="title"
                          autoComplete="title"
                          className="flex-1 block w-full focus:ring-indigo-500 focus:border-indigo-500 min-w-0  sm:text-sm border-gray-300"
                        />
                      </div>
                      <ErrorMessage name="title" />
                    </div>
                  </div>

                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-100 sm:py-6">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                    >
                      Longer Description <span className="text-red-500">*</span>
                      <p className="mt-2 text-xs opacity-50">
                        A description that will go into each token. The link to
                        sign the contract terms will be substituted where you
                        add [POLYDOCS]
                      </p>
                    </label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <Field
                        component="textarea"
                        id="description"
                        name="description"
                        rows={3}
                        className="max-w-lg shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 "
                        defaultValue={
                          "Purchasing this token requires accepting our service terms: [POLYDOCS]"
                        }
                      />
                      <ErrorMessage name="description" />
                    </div>
                  </div>

                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center sm:border-t sm:border-gray-100 sm:py-6">
                    <label
                      htmlFor="thumbnail"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Thumbnail/logo image for the contract
                      {values.image && (
                        <button
                          className="btn btn-gradient block"
                          type="button"
                          onClick={() => {
                            setFieldValue("image", "", true);
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <div className="flex items-center">
                        <DropFile name="image" onUploading={setIsUploading} />
                      </div>
                    </div>
                  </div>

                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-100 sm:pt-5">
                    <label
                      htmlFor="cover-photo"
                      className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                    >
                      Cover Image
                      {values.cover && (
                        <button
                          className="btn btn-gradient block"
                          type="button"
                          onClick={() => {
                            setFieldValue("cover", "", true);
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <DropFile name="cover" onUploading={setIsUploading} />
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-100 sm:pt-5">
                    <label
                      htmlFor="background"
                      className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                    >
                      Background Image
                      {values.background && (
                        <button
                          className="btn btn-gradient block"
                          type="button"
                          onClick={() => {
                            setFieldValue("background", "", true);
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <DropFile name="background" onUploading={setIsUploading} />
                  </div>
                </div>

                <button
                  disabled={!dirty || !isValid || isSubmitting}
                  className="btn btn-primary mt-6"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

const Contract: FC = () => {
  const { setTitle } = useMain();
  useEffect(() => {
    setTitle("");
  }, [setTitle]);
  const navigate = useNavigate();
  const { contractId } = useParams();
  const [chainId, contractAddress] = (contractId || "").split("::");
  const provider = useProvider(chainId);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  useAsyncEffect(async () => {
    const contract = NonEvilToken__factory.connect(contractAddress, provider);
    const name = await contract.name();
    setName(name);
    const symbol = await contract.symbol();
    setSymbol(symbol);
  }, [provider]);

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {name} ({symbol}){" "}
              {chainId === "80001" && (
                <span className=" text-yellow-dark bg-yellow-100 px-2 mt-0.5 rounded-full text-[10px]">
                  Testnet
                </span>
              )}
            </h1>
            <p className="text-xs">{contractAddress}</p>
          </div>
          <div>
            <a
              className="btn-gradient btn mr-2"
              href={blockExplorers[parseInt(chainId)] + contractAddress}
              target="_blank"
              rel="noreferrer"
            >
              View on Block Explorer
            </a>
            <a
              className="btn btn-primary text-center"
              href={`httpd://sign.gmsign.xyz/#/redirect::${chainId}::${contractAddress}`}
              target="_blank"
              rel="noreferrer"
            >
              Open Signing Page in New Tab
            </a>
          </div>
        </div>
      </div>
      <Tokens />
      <ContractEditor />
    </div>
  );
};

export default Contract;
