import { FC } from "react";
import { FaGithub } from "react-icons/fa";
import MetaMaskOnboarding from "@metamask/onboarding";
import Title from "./Title";
import Topography from "./topography.svg";
const GetMetamask: FC = () => {
  return (
    <div
      className="h-screen w-full flex flex-col justify-center items-center"
      style={{ background: `url(${Topography})` }}
    >
      <div className="flex flex-col space-y-8">
        <Title />
        <div className="flex flex-row justify-center">
          <button
            className="btn btn-gradient"
            onClick={async () => {
              const onboarder = new MetaMaskOnboarding();
              onboarder.startOnboarding();
            }}
          >
            Get Metamask
          </button>
        </div>
        <div className="fixed bottom-0 w-screen h-10 p-2 bg-black text-white flex flex-row space-between">
          <div className="text-xs hover:text-primary-400 transition">
            <a href="https://github.com/akshay-rakheja/polydocs">
              <FaGithub className="h-6 w-6 mr-2 inline " />
              Source on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
export default GetMetamask;
