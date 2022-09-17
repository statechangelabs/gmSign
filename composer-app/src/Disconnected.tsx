import { eth_requestAccounts } from "@raydeck/metamask-ts";
import { FC, useEffect } from "react";
import { FaGithub } from "react-icons/fa";
import { useAuthenticator } from "./Authenticator";
import { useMain } from "./DisconnectedMain";
import Title from "./Title";
import Topography from "./topography.svg";

const Disconnected: FC = () => {
  const { setHeaderVisible } = useMain();
  useEffect(() => {
    setHeaderVisible(false);
    return () => {
      setHeaderVisible(true);
    };
  }, []);
  const { authenticate } = useAuthenticator();
  return (
    <div
      className="h-screen w-full flex flex-col justify-center items-center"
      style={{ background: `url(${Topography})` }}
    >
      <div className="flex flex-col space-y-8">
        <Title />
        <div className="-mt-2 text-2xl font-bold flex flex-row justify-center">
          <div>Can't Be Evil Contract Generator</div>
        </div>
        <div className="flex flex-row justify-center">
          <button
            className="btn btn-primary"
            onClick={async () => {
              const accounts = await eth_requestAccounts();
              console.log("I haz accounts", accounts);
              await authenticate();
              console.log("I am authenticated");
            }}
          >
            Connect to Metamask
          </button>
        </div>
        <div className="flex flex-row justify-center">
          <a
            className="btn btn-gradient"
            href="https://a16zcrypto.com/introducing-nft-licenses/"
          >
            Learn More about CBE Licenses
          </a>
        </div>
      </div>
      <div className="fixed bottom-0 w-screen h-10 p-2 bg-black text-white flex flex-row space-between">
        <div className="text-xs hover:text-purple-400 transition">
          <a href="https://github.com/statechangelabs/gmsign">
            <FaGithub className="h-6 w-6 mr-2 inline " />
            Source on GitHub
          </a>
        </div>
      </div>
    </div>
  );
};
export default Disconnected;
