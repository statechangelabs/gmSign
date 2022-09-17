import { FC, useState } from "react";
import { BigNumber, ethers } from "ethers";
import { Signable__factory, TokenSignable__factory } from "./contracts";
import useAsyncEffect from "./useAsyncEffect";
import Title from "./Title";
import Topography from "./topography.svg";
const providers: Record<string, string> = {
  "137": process.env.REACT_APP_POLYGON_RPC || "",
  "80001": process.env.REACT_APP_MUMBAI_RPC || "",
};

let fragment = window.location.hash;
if (fragment.startsWith("#/")) fragment = fragment.substring(2);
else if (fragment.startsWith("#")) fragment = fragment.substring(1);
const [, chain, address, token] = fragment.split("::");
const validGaslessRenderers = ["hellosign-bridge.polydocs.xyz"];
const Redirector: FC = () => {
  const [error, setError] = useState("");
  console.log("Hello");
  useAsyncEffect(async () => {
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
      if (token) {
        const contract = TokenSignable__factory.connect(address, provider);
        const termsUrl = await contract.termsUrl(BigNumber.from(token));
        const [, fragment] = termsUrl.split("://");
        console.log("in token view", fragment);
        window.location.href =
          window.location.protocol +
          "//" +
          window.location.host +
          "/#/" +
          fragment;
        window.location.reload();
      } else {
        const contract = Signable__factory.connect(address, provider);
        const termsUrl = await contract.termsUrl();
        const fragmentBase = termsUrl.substring(
          termsUrl.indexOf("://") + 3,
          termsUrl.length
        );
        const [renderer, fragment] = fragmentBase.split("/#/");
        //validate renderer
        if (
          window.location.host.startsWith(renderer) ||
          validGaslessRenderers.includes(renderer)
        ) {
          window.location.href =
            window.location.protocol +
            "//" +
            window.location.host +
            "/#/" +
            fragment;
          window.location.reload();
          console.log("in nontotken view", fragment);
        } else {
          // window.location.href =
          //   "https://w3s.link/ipfs/" + renderer + ("/#/" + fragment);
          console.log("I would redirect to", {
            renderer,
            fragment,
            fragmentBase,
            termsUrl,
          });
        }
        // }
      }
    } catch (e) {
      console.log("got an error", e);
    }
  }, []);
  if (error) {
    return <div>Error: {error}</div>;
  } else {
    return (
      <div
        className="h-screen w-full flex flex-col justify-center items-center"
        style={{ background: `url(${Topography})` }}
      >
        <div className="flex flex-col space-y-8">
          <Title />
        </div>
      </div>
    );
  }
};
export default Redirector;
