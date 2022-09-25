import { FC, Fragment, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { blockExplorers } from "./chains";
import ContractFinder from "./ContractFinder";
import { useMain } from "./Main";
import { useContracts } from "./useContracts";

const Home: FC = () => {
  const { contracts, removeContract, refresh } = useContracts();
  console.log("my contracts are", contracts);
  useEffect(() => {
    console.log("setting interval");
    const t = setInterval(() => {
      refresh();
    }, 10000);
    return () => clearInterval(t);
  }, [refresh]);
  const { setTitle } = useMain();
  useEffect(() => {
    setTitle("");
  }, []);
  const navigate = useNavigate();
  return (
    <div>
      <div className="container-narrow">
        <div className="flex justify-between items-center space-x-12">
          <h2 className="text-3xl font-bold text-black mb-4">
            Manage Contracts
          </h2>

          <Link to="/contract" className="btn btn-primary">
            Create an NFT Contract
          </Link>
        </div>
        {!!contracts.length && (
          <div className="mb-12">
            <ol className=" doc-shadow bg-white p-6 flex flex-col space-y-6">
              {contracts
                .sort((a, b) =>
                  a.chainId > b.chainId
                    ? 1
                    : a.chainId < b.chainId
                    ? -1
                    : a.contractAddress > b.contractAddress
                    ? 1
                    : a.contractAddress < b.contractAddress
                    ? -1
                    : 0
                )
                .map((contract, index) => (
                  <Fragment>
                    <li
                      key={contract.contractId}
                      className="flex justify-between space-x-6"
                      // style={
                      //   contract.coverSrc
                      //     ? {
                      //         backgroundImage: `url(${contract.coverSrc})`,
                      //       }
                      //     : undefined
                      // }
                    >
                      <div className="flex flex-row justify-start">
                        {contract.imageSrc && (
                          <img
                            className="rounded-full w-8 h-8 border-2 border-green shadow-sm mr-4 cursor-pointer"
                            src={contract.imageSrc}
                            alt={contract.name}
                            onClick={() => {
                              navigate(`/contracts/${contract.contractId}`);
                            }}
                          />
                        )}
                        {!!contract.deployed && (
                          <Link
                            to={`/contracts/${contract.contractId}`}
                            className="relative text-primary-default hover:text-primary-light "
                          >
                            <h2 className="">
                              <span className="font-bold text-md mr-2">
                                {contract.name}
                              </span>
                              <span className="text-gray-700">
                                ({contract.symbol}){" "}
                                {contract.deployed ? "" : "(deploying...)"}
                              </span>
                              {contract.chainId === "80001" && (
                                <span className=" text-yellow-dark bg-yellow-100 px-2 mt-0.5 rounded-full text-[10px]">
                                  Testnet
                                </span>
                              )}
                            </h2>

                            <div className="text-gray-700 text-xs">
                              {contract.contractAddress}{" "}
                            </div>
                          </Link>
                        )}
                        {!contract.deployed && (
                          <div className="relative text-primary-default hover:text-primary-light ">
                            <h2 className="">
                              <span className="font-bold text-md mr-2">
                                {contract.name}
                              </span>
                              <span className="text-gray-700">
                                ({contract.symbol}){" "}
                                {contract.deployed ? "" : "(deploying...)"}
                              </span>
                              {contract.chainId === "80001" && (
                                <span className=" text-yellow-dark bg-yellow-100 px-2 mt-0.5 rounded-full text-[10px]">
                                  Testnet
                                </span>
                              )}
                            </h2>

                            <div className="text-gray-700 text-xs">
                              {contract.contractAddress}{" "}
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        {!!contract.deployed && (
                          <a
                            className="btn-gradient btn mr-2 text-xs"
                            href={`${
                              blockExplorers[parseInt(contract.chainId)]
                            }/${contract.contractAddress}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View on Block Explorer
                          </a>
                        )}
                        <button
                          className="btn btn-gradient text-xs"
                          onClick={() => {
                            removeContract(contract.contractId);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                    {index + 1 !== Object.entries(contracts).length && (
                      <>
                        <hr className="bg-gray-50 mt-6" />
                      </>
                    )}
                  </Fragment>
                ))}
            </ol>
          </div>
        )}
        {/* <ContractFinder refresh={refresh} /> */}
      </div>
    </div>
  );
};
export default Home;
