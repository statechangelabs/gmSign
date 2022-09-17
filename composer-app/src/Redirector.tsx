import { FC, useState } from "react";
import { useParams } from "react-router-dom";
import { BigNumber, ethers } from "ethers";
import {
  TermsableNoToken__factory,
  // TokenTermsable__factory,
} from "./contracts";
import useAsyncEffect from "./useAsyncEffect";
const providers: Record<string, string> = {
  "137": process.env.REACT_APP_POLYGON_RPC || "",
  "80001": process.env.REACT_APP_MUMBAI_RPC || "",
};
console.log(process.env);
const prefix = "https://w3s.link/ipfs/";
const Redirector: FC = () => {
  const { key } = useParams();
  const [error, setError] = useState("");
  useAsyncEffect(async () => {
    if (key) {
      const [chain, address, token] = key.split("::");
      if (!address) {
        console.log("No address to work with");
        return;
      }
      if (!providers[chain]) {
        setError("No provider for chain " + chain);
        return;
      }
      try {
        const provider = new ethers.providers.JsonRpcProvider(providers[chain]);
        // if (token) {
        //   const contract = TokenTermsable__factory.connect(address, provider);
        //   const termsUrl = await contract.termsUrlWithPrefix(
        //     BigNumber.from(token),
        //     prefix
        //   );

        //   window.location.href = termsUrl;
        // } else {
        const contract = TermsableNoToken__factory.connect(address, provider);
        const termsUrl = await contract.termsUrlWithPrefix(prefix);
        window.location.href = termsUrl;
        // }
      } catch (e) {
        console.log(e);
      }
    }
  }, [key]);
  if (error) {
    return <div>Error: {error}</div>;
  } else {
    return <div>LOading...</div>;
  }
};
export default Redirector;
