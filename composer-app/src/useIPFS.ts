import { useMemo, useRef, useState } from "react";
import useAsyncEffect from "./useAsyncEffect";
import { decode, encode } from "base64-arraybuffer";
import localForage from "localforage";
let gateway = "https://w3s.link/ipfs/";
export const setGateway = (newGateway: string) => {
  gateway = newGateway;
};
const waiters: Record<string, Array<(a: ArrayBuffer) => void>> = {};
export const getIPFS = async (cid: string | undefined, nocache = false) => {
  if (!cid) return;
  if (cid.startsWith("ipfs://")) cid = cid.slice(7);
  const content64 =
    !nocache && (await localForage.getItem<string>("ipfs_" + cid));
  if (content64) {
    const content = decode(content64);
    return content;
  } else {
    if (cid.startsWith("https://")) {
      if (!waiters[cid]) waiters[cid] = [];
      let r: (a: ArrayBuffer) => void;
      const p = new Promise<ArrayBuffer>((resolve, reject) => {
        r = resolve;
      });
      waiters[cid].push(r!);
      if (waiters[cid].length > 1) return await p;
      const response = await fetch(cid);
      const content = await response.blob();
      try {
        const ab = await content.arrayBuffer();
        const b64 = encode(ab);
        try {
          localForage.setItem("ipfs_" + cid, b64);
        } catch (e) {}
        waiters[cid].forEach((r) => r(ab));
        return await p;
      } catch (e) {
        console.log("I hit an error", e);
      }
      return;
    }
    console.log("Requesting from ", gateway + cid);
    const result = await fetch(gateway + cid);
    console.log("got my result");
    const content2 = await result.blob();
    console.log("got my blob");
    try {
      const ab = await content2.arrayBuffer();
      const b64 = encode(ab);
      localForage.setItem("ipfs_" + cid, b64);
      return ab;
    } catch (e) {
      console.log("I hit an error", e);
    }
  }
};
export const getIPFSText = async (cid: string | undefined, nocache = false) => {
  const content = await getIPFS(cid, nocache);
  return new TextDecoder().decode(content);
};

export const getIPFSDataUri = async (
  cid: string | undefined,
  nocache = false
) => {
  const content = await getIPFS(cid, nocache);
  if (!content) return "";
  const base64 = encode(content);
  return base64 ? `data:;base64,${base64}` : "";
};

export const useIPFS = (cid: string | undefined) => {
  const [ipfs, setIPFS] = useState<ArrayBuffer>();
  const ipfsStateRef = useRef<Record<string, boolean>>({});
  useAsyncEffect(async () => {
    if (!cid) return;
    if (ipfsStateRef.current[cid]) return;
    ipfsStateRef.current[cid] = true;
    const ab = await getIPFS(cid);
    setIPFS(ab);
    console.log("I set the ipfs");
  }, [cid]);
  return ipfs;
};
export const useIPFSList = (cids: string[]) => {
  const [abs, setAbs] = useState<Record<string, ArrayBuffer>>({});
  useAsyncEffect(async () => {
    if (!cids.length) return;
    await Promise.all(
      cids.map(async (cid) => {
        const ab = await getIPFS(cid);
        if (ab) setAbs((prev) => ({ ...prev, [cid]: ab }));
      })
    );
  }, [cids]);
  return abs;
};
export const useIPFSDataUriList = (cids: string[]) => {
  const list = useIPFSList(cids);
  return useMemo(() => {
    const result = Object.entries(list)
      .map(([cid, ab]) => {
        if (!ab) return { cid, data: "" };
        const base64 = encode(ab);
        return base64
          ? { cid, data: `data:;base64,${base64}` }
          : { cid, data: "" };
      })
      .filter(({ data }) => data)
      .reduce(
        (acc, { cid, data }) => ({ ...acc, [cid]: data }),
        {} as Record<string, string>
      );
    return result;
  }, [list]);
};

export const decodeAB = (buf: ArrayBuffer) =>
  buf ? new TextDecoder().decode(buf) : "";

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
