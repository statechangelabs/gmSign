import React, { Fragment } from "react";
import {
  MetamaskConnected,
  MetamaskDisconnected,
  MetamaskNotInstalled,
  MetamaskWrongChain,
  useReloadOnChainChange,
} from "@raydeck/usemetamask";
import GetMetamask from "./GetMetamask";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import Main from "./Main";
import WrongChain from "./WrongChain";
import Disconnected from "./Disconnected";
import ContractFinder from "./ContractFinder";
import Redirector from "./Redirector";
let fragment = window.location.hash;
if (fragment.startsWith("#/")) fragment = fragment.substring(2);
else if (fragment.startsWith("#")) fragment = fragment.substring(1);
const [documentId, chainId, contractAddress, block, tokenId] =
  fragment.split("::");
const base16Chain = chainId && "0x" + Number.parseInt(chainId).toString(16);
console.log({ documentId, chainId, contractAddress, block, tokenId });
function App() {
  useReloadOnChainChange();
  if (documentId === "redirect") return <Redirector />;

  if (!base16Chain && documentId !== "redirect") return <ContractFinder />;

  return (
    <Fragment>
      <MetamaskNotInstalled>
        <GetMetamask />
      </MetamaskNotInstalled>
      <MetamaskDisconnected>
        <Disconnected />
      </MetamaskDisconnected>
      <MetamaskWrongChain chainIds={base16Chain ? [base16Chain] : undefined}>
        <WrongChain />
      </MetamaskWrongChain>
      <MetamaskConnected chainIds={base16Chain ? [base16Chain] : undefined}>
        <Main
          block={block}
          contractAddress={contractAddress}
          documentId={documentId}
          tokenId={tokenId}
        />
      </MetamaskConnected>
      <ToastContainer />
    </Fragment>
  );
}

export default App;
