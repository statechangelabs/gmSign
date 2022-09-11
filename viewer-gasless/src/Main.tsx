import { FC, Fragment, useCallback, useEffect, useState } from "react";
import { useIPFSText, useIPFSDataUri } from "./useIPFS";
import { ethers } from "ethers";
import {
  MetadataURI__factory,
  Signable__factory,
  TokenSignable__factory,
} from "./contracts";
import { toast } from "react-toastify";
import Topography from "./topography.svg";
import Logo from "./PolydocsLogo.svg";
import useAsyncEffect from "./useAsyncEffect";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useAccount } from "@raydeck/usemetamask";
import { validate } from "email-validator";

const POLYDOCS_URL =
  process.env.REACT_APP_POLYDOCS_URL ??
  "https://xw8v-tcfi-85ay.n7.xano.io/api:W2GV-aeC/request-signature";

export const ethereum = (window as unknown as { ethereum: any }).ethereum;
export const provider = ethereum
  ? new ethers.providers.Web3Provider(ethereum)
  : undefined;

const Renderer: FC<{
  documentId: string;
  contractAddress: string;
  block: string;
  tokenId?: string;
  chainId: string;
}> = ({ block, contractAddress, documentId, tokenId, chainId }) => {
  const [isSigned, setIsSigned] = useState(false);
  const myAddress = useAccount();
  const checkSigned = useCallback(
    async (address: string) => {
      if (!provider) return false;
      if (typeof tokenId !== "undefined") {
        const contract = TokenSignable__factory.connect(
          contractAddress,
          provider
        );
        const accepted = await contract.acceptedTerms(address, tokenId);
        if (accepted) return true;
      } else {
        const contract = Signable__factory.connect(
          contractAddress,
          provider.getSigner()
        );

        const accepted = await contract.acceptedTerms(address);
        if (accepted) return true;
      }
      return false;
    },
    [contractAddress, tokenId]
  );
  useAsyncEffect(async () => {
    const signed = await checkSigned(myAddress);
    setIsSigned(signed);
  }, [myAddress]);
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
  const json = useIPFSText(URI);
  const obj = json ? JSON.parse(json) : {};
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
  if (!provider) return <div>"No provider"</div>;
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
                <Formik
                  initialValues={{
                    name: "",
                    email: "",
                    walletAddress: myAddress,
                  }}
                  validate={async (values) => {
                    const errors: Record<string, string> = {};
                    if (!values.name) {
                      errors.name = "Required";
                    }
                    if (!values.email) {
                      errors.email = "Required";
                    }
                    if (!validate(values.email)) {
                      errors.email = "Invalid email";
                    }
                    if (!values.walletAddress) {
                      errors.walletAddress = "Required";
                    } else if (!ethers.utils.isAddress(values.walletAddress)) {
                      errors.walletAddress = "Not a valid Ethereum address";
                    } else {
                      const signed = await checkSigned(values.walletAddress);
                      setIsSigned(signed);
                      if (signed) {
                        errors.walletAddress =
                          "Congratulations - this address already signed";
                      }
                    }
                    if (Object.keys(errors).length) return errors;
                  }}
                  onSubmit={async (values) => {
                    const response = await fetch(POLYDOCS_URL, {
                      method: "POST",
                      body: JSON.stringify({
                        contractAddress,
                        chainId,
                        requesterAddress: values.walletAddress || myAddress,
                        email: values.email,
                        name: values.name,
                      }),
                      headers: {
                        "Content-Type": "application/json",
                      },
                    });
                    if (response.status === 200) {
                      toast.success("Check your email to accept the terms!");
                    } else {
                      toast.error(
                        "Something went wrong: " + response.statusText
                      );
                    }
                  }}
                >
                  {({ dirty, isValid, isSubmitting, values }) => (
                    <Form>
                      <div className="space-y-8 divide-y divide-gray-200">
                        <div className="space-y-8 divide-y divide-gray-200 sm:space-y-5">
                          <div className="space-y-6 pt-8 sm:space-y-5 sm:pt-10">
                            <div>
                              <h3 className="text-lg font-medium leading-6 text-gray-900">
                                Let's Get Signed
                              </h3>
                              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Provide the following information to get your
                                signable copy of the document in your email.
                              </p>
                            </div>
                            <div className="space-y-6 sm:space-y-5">
                              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
                                <label
                                  htmlFor="first-name"
                                  className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                                >
                                  Name
                                </label>
                                <div className="mt-1 sm:col-span-2 sm:mt-0">
                                  <Field
                                    type="text"
                                    name="name"
                                    id="name"
                                    autoComplete="name"
                                    className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
                                  />
                                </div>
                              </div>
                              <ErrorMessage
                                name="name"
                                component="div"
                                className="text-red-500 font-medium text-xs"
                              />
                              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
                                <label
                                  htmlFor="last-name"
                                  className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                                >
                                  Wallet address (0x...)
                                </label>
                                <div className="mt-1 sm:col-span-2 sm:mt-0">
                                  <Field
                                    type="text"
                                    name="walletAddress"
                                    className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
                                  />
                                </div>
                              </div>
                              <ErrorMessage
                                name="walletAddress"
                                component="div"
                                className="text-red-500 font-medium text-xs"
                              />

                              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
                                <label
                                  htmlFor="email"
                                  className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                                >
                                  Email address
                                </label>
                                <div className="mt-1 sm:col-span-2 sm:mt-0">
                                  <Field
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  />
                                </div>
                              </div>
                              <ErrorMessage
                                name="email"
                                component="div"
                                className="text-red-500 font-medium text-xs"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="pt-5">
                          <div className="flex justify-end">
                            <button
                              disabled={!dirty || !isValid || isSubmitting}
                              type="submit"
                              className={
                                !dirty || !isValid || isSubmitting
                                  ? "ml-3 inline-flex justify-center rounded-md border border-transparent bg-gray-600 py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none"
                                  : "ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                              }
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};
export default Renderer;
