import { FC, Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMain } from "./Main";
import { templateBlockExplorer, useKnownTemplates } from "./useKnownTemplates";
import ThumbsUp from "./thumbs-up.svg";
import ThumbsDown from "./thumbs-down.svg";

const Home: FC = () => {
  const knownTemplates = useKnownTemplates();
  const [contractAddress, setContractAddress] = useState("");
  const [hasTemplates, setHasTemplates] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const contractAddress = localStorage.getItem("contractAddress");
    if (contractAddress) setContractAddress(contractAddress);
  }, []);
  const templates = useMemo(() => {
    return JSON.parse(localStorage.getItem("templates") || "{}") as Record<
      string,
      string
    >;
  }, []);

  useEffect(() => {
    if (Object.entries(templates).length > 0) setHasTemplates(true);
  }, [templates]);

  const [counter, setCounter] = useState(0);
  const incrementCounter = useCallback(() => {
    setCounter((old) => old + 1);
  }, []);

  const { setTitle } = useMain();
  useEffect(() => {
    setTitle("Document Templates");
  }, []);
  return (
    <div>
      <div>
        <div className="container-narrow">
          <div className="mb-24">
            <div className="flex flex-row justify-between space-x-12">
              <h3 className="text-xl font-bold text-black">Known Templates </h3>
              <button
                className="btn btn-gradient text-xs"
                type="button"
                onClick={() => window.open(templateBlockExplorer, "_blank")}
              >
                View Registry on Block Explorer
              </button>
            </div>

            <div className="text-xs italic mb-4 opacity-50">
              Click To Review and Copy
            </div>
            <ul className=" doc-shadow bg-white p-6 flex flex-col space-y-6">
              {knownTemplates.map(({ cid, name }, index) => (
                <li>
                  <Link
                    to={"/template/" + cid}
                    className="relative text-primary-default hover:text-primary-light "
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div>{name}</div>
                        <div className="text-xs opacity-50">
                          {/* <a
                      href={"https://ipfs.io/ipfs/" + cid}
                       className=" hover:text-primary-light"
                      > */}
                          cid: {cid}
                          {/* </a> */}
                        </div>
                        {index === 0 && (
                          <p className="absolute text-teal-dark bg-teal-100 px-2 mt-0.5 rounded-full text-[10px]">
                            Highly Trusted!
                          </p>
                        )}
                      </div>

                      <div>
                        <button className="group mr-5" type="button">
                          <img
                            src={ThumbsDown}
                            className="h-5 w-5 opacity-20 group-hover:opacity-100  transition ease-in-out duration-150"
                          />
                          <span className="sr-only">
                            Cast a down vote for contract {name}
                          </span>
                        </button>

                        <button className="group" type="button">
                          <img
                            src={ThumbsUp}
                            className="h-5 w-5 opacity-20 group-hover:opacity-100  transition ease-in-out duration-150"
                          />
                          <span className="sr-only">
                            Cast an up vote for contract {name}
                          </span>
                        </button>
                      </div>
                    </div>
                    {index + 1 !== knownTemplates.length && (
                      <>
                        <hr className="bg-gray-50 mt-6" />
                      </>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="mb-24">
            <div className="">
              <h3 className="text-xl font-bold text-black">My Templates</h3>
            </div>
            <div className="text-xs italic mb-4 opacity-50">
              Click To Review/Revise
            </div>
            {hasTemplates && (
              <ul className=" doc-shadow bg-white p-6 flex flex-col space-y-6">
                {Object.entries(templates).map(([cid, template], index) => (
                  <Fragment>
                    <div className="flex justify-between mt-4">
                      <Link
                        to={"/template/" + cid}
                        className="w-3/4 block align-left text-primary-default hover:text-primary-light"
                      >
                        <div className="truncate">
                          {template.replaceAll("#", "").substring(0, 120)}
                          ...
                        </div>
                        <div className="text-xs text-gray-60">cid: {cid}</div>
                      </Link>
                      <button
                        onClick={() => {
                          delete templates[cid];
                          localStorage.setItem(
                            "templates",
                            JSON.stringify(templates)
                          );
                          incrementCounter();
                        }}
                        className="btn btn-gradient"
                      >
                        Delete
                      </button>
                    </div>
                    {index + 1 !== Object.entries(templates).length && (
                      <>
                        <hr className="bg-gray-50 mt-6" />
                      </>
                    )}
                  </Fragment>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Home;
