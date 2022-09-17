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
          await fetch(
            "/contracts/" +
              encodeURIComponent(chainId + "::" + contractAddress),
            {
              method: "POST",
              body: JSON.stringify({
                uri: "ipfs://" + cid,
              }),
            }
          );
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
                        // defaultValue={
                        //   "Purchasing this token requires accepting our service terms: [POLYDOCS]"
                        // }
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
                  className={
                    !dirty || !isValid || isSubmitting
                      ? "btn btn-gray mt-6 text-gray-700"
                      : "btn btn-primary mt-6"
                  }
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
              href={`https://sign.gmsign.xyz/#/redirect::${chainId}::${contractAddress}`}
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
