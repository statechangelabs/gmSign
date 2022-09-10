import { useMemo, useState } from "react";
import useAsyncEffect from "./useAsyncEffect";
import { decode, encode } from "base64-arraybuffer";
let gateway = "https://ipfs.io/ipfs/";
export const setGateway = (newGateway: string) => {
  gateway = newGateway;
};
export const useIPFS = (cid: string | undefined) => {
  const [ipfs, setIPFS] = useState<ArrayBuffer>();
  useAsyncEffect(async () => {
    if (!cid) return;
    const content64 = localStorage.getItem("ipfs_" + cid);
    if (content64) {
      const content = decode(content64);
      setIPFS(content);
    } else {
      console.log("Requesting from ", gateway + cid);
      const result = await fetch(gateway + cid);
      console.log("got my result");
      const content2 = await result.blob();
      console.log("got my blob");
      try {
        const ab = await content2.arrayBuffer();
        const b64 = encode(ab);
        localStorage.setItem("ipfs_" + cid, b64);
        setIPFS(ab);
        console.log("I set the ipfs");
      } catch (e) {
        console.log("I hit an error", e);
      }
    }
  }, [cid]);
  return ipfs;
};

export const useIPFSText = (cid: string) => {
  const buf = useIPFS(cid);
  const text = useMemo(() => (buf ? new TextDecoder().decode(buf) : ""), [buf]);
  return text;
};

export const useIPFSDataUri = (cid: string) => {
  const buf = useIPFS(cid);
  const dataUri = useMemo(() => {
    if (!buf) return "";
    const base64 = encode(buf);
    return base64 ? `data:;base64,${base64}` : "";
  }, [buf]);
  return dataUri;
};
