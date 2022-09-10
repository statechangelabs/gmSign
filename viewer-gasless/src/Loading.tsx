import { eth_requestAccounts } from "@raydeck/metamask-ts";
import { FC } from "react";
import { FaGithub } from "react-icons/fa";
import Title from "./Title";
import Topography from "./topography.svg";
const Disconnected: FC = () => {
  return (
    <div
      className="h-screen w-full flex flex-col justify-center items-center"
      style={{ background: `url(${Topography})` }}
    >
      <div className="flex flex-col space-y-8">
        <Title />
      </div>
      <div className="fixed bottom-0 w-screen h-10 p-2 bg-black text-white flex flex-row space-between">
        <div className="text-xs hover:text-primary-400 transition">
          <a href="https://github.com/statechangelabs/polydocs">
            <FaGithub className="h-6 w-6 mr-2 inline " />
            Source on GitHub
          </a>
        </div>
      </div>
    </div>
  );
};
export default Disconnected;
