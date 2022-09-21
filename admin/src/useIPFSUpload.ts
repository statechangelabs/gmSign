import { useCallback, useMemo } from "react";
import { useAuthenticatedFetch } from "./Authenticator";
let cachedToken: { token: string; did: string } = { token: "", did: "" };
let cachedToken__expires = 0;
const ucanPath = process.env.UPLOAD_PATH ?? "/ucan-token";
export const useUpload = () => {
  const authFetch = useAuthenticatedFetch();
  const getUCAN = useCallback(async () => {
    if (cachedToken__expires > Date.now()) return cachedToken;
    const response = await authFetch(ucanPath);
    const json = (await response.json()) as { token: string; did: string };
    cachedToken = json;
    cachedToken__expires = Date.now() + 1000 * 1 * 60;
    return json;
  }, [authFetch]);
  const uploadBlob = useCallback(
    async (blob: Blob) => {
      const { token, did } = await getUCAN();
      const result = await fetch("https://api.nft.storage/upload", {
        headers: {
          Authorization: "Bearer " + token,
          "x-agent-did": did,
        },
        method: "POST",
        body: blob,
      });
      const obj = await result.json();
      if (obj.ok) {
        return obj.value.cid as string;
      } else {
        console.error(obj.error);
        throw new Error(obj.error);
      }
    },
    [getUCAN]
  );
  const upload = useCallback(
    async (newText: string | Buffer) => {
      const blob = new Blob([newText]);
      return uploadBlob(blob);
    },
    [uploadBlob]
  );
  const value = useMemo(() => ({ upload, uploadBlob }), [upload, uploadBlob]);
  return value;
};
