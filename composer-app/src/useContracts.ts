import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthenticatedFetch } from "./Authenticator";
import { NonEvilToken__factory } from "./contracts";
import { getProvider } from "./provider";
import {
  useIPFSText,
  useIPFSDataUri,
  getIPFS,
  getIPFSText,
  getIPFSDataUri,
} from "./useIPFS";
type PartialContract = {
  chainId: string;
  contractAddress: string;
  contractId: string;
  deployed: number;
  image?: string;
  cover?: string;
  title?: string;
  description?: string;
  imageSrc?: string;
  coverSrc?: string;
};
export type Contract = PartialContract & {
  name: string;
  symbol: string;
};
export const useContracts = () => {
  const fetch = useAuthenticatedFetch();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const contractsRef = useRef(contracts);
  useEffect(() => {
    contractsRef.current = contracts;
  }, [contracts]);
  const updateContract = useCallback(
    async ({
      contractAddress,
      chainId,
      contractId,
      deployed,
    }: PartialContract) => {
      if (
        contractsRef.current.find(
          (c) => c.contractAddress === contractAddress && c.chainId === chainId
        )
      ) {
        return;
      }
      //get the info
      const provider = getProvider(chainId);
      const contract = NonEvilToken__factory.connect(contractAddress, provider);
      try {
        console.log("Checking ", contractAddress, chainId);
        const name = await contract.name();
        const symbol = await contract.symbol();
        setContracts((old) => [
          ...old.filter((c) => c.contractAddress !== contractAddress),
          { contractAddress, chainId, name, symbol, contractId, deployed },
        ]);
        const uri = await contract.URI();
        const json = await getIPFSText(uri);
        const { image, cover, description, title } = JSON.parse(json);
        setContracts((old) => [
          ...old.filter(
            (c) =>
              c.contractAddress !== contractAddress || c.chainId !== chainId
          ),
          {
            contractAddress,
            chainId,
            name,
            symbol,
            contractId,
            deployed,
            description,
            title,
            image,
            cover,
          },
        ]);
        const imageSrc = await getIPFSDataUri(image);
        const coverSrc = await getIPFSDataUri(cover);
        setContracts((old) => [
          ...old.filter(
            (c) =>
              c.contractAddress !== contractAddress || c.chainId !== chainId
          ),
          {
            contractAddress,
            chainId,
            name,
            symbol,
            contractId,
            deployed,
            description,
            title,
            image,
            imageSrc,
            cover,
            coverSrc,
          },
        ]);
      } catch (e) {
        console.log("THat wasnt nice", e);
      }
    },
    []
  );
  const getContracts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/contracts");
      const json: PartialContract[] = await response.json();
      console.log("Got contracts", json);
      json.forEach(updateContract);
    } catch (e) {
      console.error("I had a bad error", e);
    } finally {
      setLoading(false);
    }
  }, [fetch, updateContract]);
  useEffect(() => {
    getContracts();
  }, [getContracts]);
  const removeContract = useCallback(
    async (contractId: string) => {
      setContracts((old) =>
        old.filter((contract) => contract.contractId !== contractId)
      );
      console.log("I am removing contract", contractId);
      await fetch(`/contracts?id=${contractId}`, { method: "DELETE" });
      getContracts();
    },
    [fetch]
  );
  return useMemo(
    () => ({ contracts, refresh: getContracts, loading, removeContract }),
    [contracts, getContracts, loading, removeContract]
  );
};
