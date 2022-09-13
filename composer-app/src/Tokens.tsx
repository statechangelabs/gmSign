import { upload } from "@testing-library/user-event/dist/upload";
import { Field, Form, Formik } from "formik";
import { FC, useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthenticatedFetch } from "./Authenticator";
import { NonEvilToken__factory } from "./contracts";
import { DropFileBase } from "./DropFile";
import { useMain } from "./Main";
import { useProvider } from "./provider";
import useAsyncEffect from "./useAsyncEffect";
import { useIPFSDataUriList, useIPFSText } from "./useIPFS";
import { useUpload } from "./useIPFSUpload";

const Tokens: FC = () => {
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
  const [uri, setUri] = useState("");
  useAsyncEffect(async () => {
    const contract = NonEvilToken__factory.connect(contractAddress, provider);
    const name = await contract.name();
    setName(name);
    const symbol = await contract.symbol();
    setSymbol(symbol);
    const uri = await contract.URI();
    setUri(uri);
  }, [provider]);
  const [uploadedFileCids, setUploadedFileCids] = useState<
    { name: string; cid: string }[]
  >([]);
  const onUploaded = useCallback(
    (file: File, cid: string) => {
      setUploadedFileCids((old) => [...old, { name: file.name, cid }]);
    },
    [setUploadedFileCids]
  );
  const uris = useIPFSDataUriList(uploadedFileCids.map(({ cid }) => cid));
  const jsonText = useIPFSText(uri);
  const { description: contractDescription } = JSON.parse(jsonText || "{}");
  const fetch = useAuthenticatedFetch();
  const { upload } = useUpload();
  //   const mint = useCallback(
  //     async (index: number) => {
  //         const { name, cid} = uploadedFileCids[index];
  //       const response = await fetch("/mintNFT", {
  //         method: "POST",
  //         body: JSON.stringify({
  //           contractAddress,
  //           cid,
  //           chainId,
  //         }),
  //       });
  //       const o = await response.json();
  //       console.log("GOt a response from theminting", o);
  //     },
  //     [contractAddress, chainId, fetch]
  //   );
  return (
    <div className="p-6 border-4 ">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Tokens for {name} ({symbol}){" "}
              {chainId === "80001" && (
                <span className=" text-yellow-dark bg-yellow-100 px-2 mt-0.5 rounded-full text-[10px]">
                  Testnet
                </span>
              )}
            </h1>
            <p className="text-xs">{contractAddress}</p>
          </div>
        </div>
      </div>
      <div>
        <DropFileBase name="tokenUpload" value={""} onUploaded={onUploaded} />
        {uploadedFileCids.map(({ cid, name }, index) => {
          const uri = uris[cid];
          return (
            <Formik
              initialValues={{
                description: contractDescription,
                name: name.includes(".")
                  ? name.substring(0, name.lastIndexOf("."))
                  : name,
              }}
              onSubmit={async (values, { setSubmitting }) => {
                const description = values.description.replace(
                  "[POLYDOCS]",
                  `https://sign.polydocs.xyz/#/redirect::${chainId}::${contractAddress}`
                );
                console.log("Goody let's mint!!!!", {
                  ...values,
                  description,
                  cid,
                  name,
                });
                const json = JSON.stringify({
                  ...values,
                  description,
                  image: "ipfs://" + cid,
                });
                setSubmitting(true);
                const jsonCid = await upload(json);
                const response = await fetch("/mintNFT", {
                  method: "POST",
                  body: JSON.stringify({
                    contractAddress,
                    cid: "ipfs://" + jsonCid,
                    chainId,
                  }),
                });
                const o = await response.json();
                console.log("GOt a response from theminting", o);
                setSubmitting(false);
                setUploadedFileCids((old) => old.filter((_, i) => i !== index));
              }}
            >
              {({ values, setValues, dirty, isValid, isSubmitting }) => {
                return (
                  <Form>
                    <div
                      key={cid}
                      className="flex justify-between items-center"
                    >
                      <div
                        onClick={() => {
                          window.open("https://ipfs.io/ipfs/" + cid, "_blank");
                        }}
                      >
                        <img src={uri} className="w-12 h-12 object-contain" />
                      </div>
                      <div>
                        <div>
                          Name
                          <Field type="text" name="name" />
                        </div>
                        <div>
                          Description
                          <Field type="textarea" name="description" />
                        </div>
                      </div>
                      <div>
                        <button
                          className="btn btn-gradient"
                          disabled={!isValid || isSubmitting}
                        >
                          {isSubmitting ? "Minting..." : "Mint"}
                        </button>
                        <button
                          className="btn btn-gradient"
                          onClick={() => {
                            setUploadedFileCids(
                              uploadedFileCids.filter(({ cid }) => cid !== cid)
                            );
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </Form>
                );
              }}
            </Formik>
          );
        })}
      </div>
    </div>
  );
};
export default Tokens;
