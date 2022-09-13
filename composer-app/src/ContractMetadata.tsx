import { Formik } from "formik";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuthenticatedFetch } from "./Authenticator";
import { MetadataURI__factory } from "./contracts/index";
import { useProvider } from "./provider";
import { useIPFSDataUri, useIPFSText } from "./useIPFS";
import { useUpload } from "./useIPFSUpload";

const useMetadata = (chainId: string, contractAddress: string) => {
  const [uri, setUri] = useState("");
  const provider = useProvider(chainId);
  const getUri = useCallback(async () => {
    const contract = MetadataURI__factory.connect(contractAddress, provider);
    const metadataURI = await contract.URI();
    setUri(metadataURI);
  }, [contractAddress, provider]);
  useEffect(() => {
    getUri();
  }, [getUri]);
  //Get the metadata from the URI
  const ipfsJson = useIPFSText(uri);
  const metaData = JSON.parse(ipfsJson) as Record<string, any>;
  return useMemo(
    () => ({ metaData, refresh: getUri, setUri }),
    [metaData, getUri, setUri]
  );
};

const ContractMetadata: FC = () => {
  const { qualifiedAddress } = useParams();
  const [chainId, contractAddress] = (qualifiedAddress || "").split("::");
  const { metaData, refresh } = useMetadata(chainId, contractAddress);
  const image = useIPFSDataUri(metaData.image);
  const cover = useIPFSDataUri(metaData.cover);
  const description = metaData.description;
  const title = metaData.title;
  const { upload } = useUpload();
  const provider = useProvider(chainId);
  const fetch = useAuthenticatedFetch();
  return (
    <Formik
      initialValues={{
        image: metaData.image,
        cover: metaData.cover,
        description: metaData.description,
        title: metaData.title,
        background: metaData.background,
        backgroundColor: metaData.backgroundColor,
      }}
      onSubmit={async (values, { resetForm }) => {
        const newMetadata = metaData;
        newMetadata.image = values.image;
        newMetadata.cover = values.cover;
        newMetadata.description = values.description;
        newMetadata.title = values.title;
        newMetadata.background = values.background;
        newMetadata.backgroundColor = values.backgroundColor;
        const newMetadataURI = await upload(JSON.stringify(newMetadata));
        //support gasless update
        const response = await fetch("/setUri", {
          method: "POST",
          body: JSON.stringify({ chainId, contractAddress, newMetadataURI }),
        });
      }}
    ></Formik>
  );

  //Get the info from the contract address
};
export default ContractMetadata;
