import { ethers } from "ethers";
import { useMemo } from "react";

const providers: Record<string, string> = {
  "137": process.env.REACT_APP_POLYGON_RPC || "",
  "80001": process.env.REACT_APP_MUMBAI_RPC || "",
};
export const getProvider = (chain: string) => {
  if (chain.startsWith("0x")) {
    //we are looking at hex
    chain = parseInt(chain, 16).toString(10);
  }
  const provider = new ethers.providers.JsonRpcProvider(providers[chain]);
  return provider;
};

export const useProvider = (chain: string) => {
  const provider = useMemo(() => getProvider(chain), [chain]);
  return provider;
};

export const isSupportedChain = (chain: string) => {
  if (chain.startsWith("0x")) {
    //we are looking at hex
    chain = parseInt(chain, 16).toString(10);
  }
  return providers[chain] !== undefined && providers[chain] !== "";
};
