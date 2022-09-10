import { wallet_switchEthereumChain } from "@raydeck/metamask-ts";
import { useChainId } from "@raydeck/usemetamask";
import { FaGithub } from "react-icons/fa";
import Title from "./Title";
import Topography from "./topography.svg";
const chainNames: Record<number, string> = {
  1: "mainnet",
  3: "ropsten",
  4: "rinkeby",
  5: "goerli",
  42: "kovan",
  31337: "Hardhat 31337",
  1337: "Hardhat 1337",
  137: "Polygon Mainnet",
  80001: "Polygon Mumbai",
};
export default function WrongChain() {
  const chainId = useChainId();
  const targetChain = window.location.hash.split("::")[1];
  const isMatch = parseInt(chainId, 16).toString(10) === targetChain;
  if (!isMatch) {
    return (
      <div
        className="h-screen w-full flex flex-col justify-center items-center"
        style={{ background: `url(${Topography})` }}
      >
        <div className="flex flex-col space-y-8">
          <Title />

          <div>
            <p className="text-2xl text-center mb-4">
              Select a supported network
            </p>
            {[targetChain].map((chainId) => (
              <div className="flex flex-row justify-center ">
                <button
                  className="text-black text-lg btn btn-gradient"
                  onClick={async () => {
                    await wallet_switchEthereumChain(
                      "0x" + parseInt(chainId, 10).toString(16)
                    );
                    window.location.reload();
                  }}
                >
                  Switch to {chainNames[parseInt(chainId)]}
                </button>
              </div>
            ))}
          </div>
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
    );
  }
  return null;
}
