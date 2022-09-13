import { useEffect, useRef, useState } from "react";
const useAsyncEffect = (
  promise: () => Promise<void | (() => {})>,
  conditions: any[]
) => {
  const [unmount, setUnmount] = useState<void | (() => void)>(() => {});
  const promiseRef = useRef(promise);
  promiseRef.current = promise;
  useEffect(() => () => unmount && unmount(), [unmount]);
  return useEffect(() => {
    (async () => {
      try {
        const unmount = await promiseRef.current();
        setUnmount(unmount);
      } catch (e) {
        setUnmount(() => {});
      }
    })();
  }, [...conditions]); // eslint-disable-line react-hooks/exhaustive-deps
};
export default useAsyncEffect;
