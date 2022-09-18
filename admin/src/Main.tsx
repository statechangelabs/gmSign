import { Disclosure } from "@headlessui/react";
import React, {
  createContext,
  FC,
  Fragment,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  Route,
  Routes,
  useLocation,
  Link,
  useNavigate,
  Navigate,
} from "react-router-dom";
import Editor from "./Editor";
import Home from "./Home";
import Logo from "./logo.png";
import { MenuIcon, XIcon } from "@heroicons/react/outline";
import Settings from "./Settings";
import Contract from "./Contract";
import Topography from "./topography.svg";
import { useAddress, useAuthenticator } from "./Authenticator";
import CreateContract from "./CreateContract";
import Templates from "./Templates";
const chainNames: Record<number, string> = {
  1: "mainnet",
  3: "ropsten",
  4: "rinkeby",
  5: "goerli",
  42: "kovan",
  31337: "Hardhat 3",
  1337: "Hardhat",
  137: "Polygon Mainnet",
  80001: "Polygon Mumbai",
};
const blockExplorers: Record<number, string> = {
  1: "https://etherscan.io/address/",
  3: "https://ropsten.etherscan.io/address/",
  4: "https://rinkeby.etherscan.io/address/",
  5: "https://goerli.etherscan.io/address/",
  42: "https://kovan.etherscan.io/address/",
  // 31337: "Hardhat 3",
  // 1337: "Hardhat",
  137: "https://polygonscan.com/address/",
  80001: "https://mumbai.polygonscan.com/address/",
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
const mainContext = createContext({
  title: "Dashboard",
  setTitle: (title: string) => {},
});
const { Provider: MainProvider } = mainContext;
export const useMain = () => useContext(mainContext);

const Main: FC = () => {
  const { logout } = useAuthenticator();
  const address = useAddress();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const navigation = useMemo(() => {
    return [
      {
        name: "Contracts",
        to: "/",
        current: !pathname.startsWith("/template"),
      },
      {
        name: "Templates",
        to: "/template",
        current: pathname.startsWith("/template"),
      },
      // {
      //   name: "Contract",
      //   to: "/contract",
      //   current: pathname.startsWith("/contract"),
      // },
    ];
  }, [pathname]);

  const [title, setTitle] = useState("Dashboard");
  const value = useMemo(() => ({ title, setTitle }), [title]);
  return (
    <div>
      <div
        className="fixed w-screen h-screen"
        style={{ background: `url(${Topography})` }}
      />
      <div className="relative  mx-auto flex flex-col h-screen">
        {/* <Fragment>
      <div className="min-h-screen bg-purple-200"> */}
        <Disclosure as="nav" className=" border-b border-gray-200 z-50">
          {({ open }) => (
            <>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-12">
                  <div className="flex">
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <img src={Logo} alt="Logo" className="w-6" />
                      <span className="text-lg font-bold text-black">
                        gmSign
                      </span>
                    </div>
                    <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.to}
                          className={classNames(
                            item.current
                              ? "border-primary-light text-gray-600"
                              : "border-transparent text-gray-400 hover:border-gray-300 hover:text-black",
                            "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                          )}
                          aria-current={item.current ? "page" : undefined}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  {/* <div className="hidden sm:ml-6 sm:flex sm:items-center">
                    <button
                      type="button"
                      className="bg-white p-1 rounded-full text-gray-200 hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <span className="sr-only">View notifications</span>
                      <BellIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div> */}
                  <div className="-mr-2 flex items-center sm:hidden">
                    {/* Mobile menu button */}
                    <Disclosure.Button className="bg-pink-800 inline-flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-white hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <MenuIcon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      )}
                    </Disclosure.Button>
                  </div>
                  <button
                    className="hidden sm:block ml-2 text-purple-dark text-xs"
                    onClick={logout}
                  >
                    {address.substring(0, 6)}...
                    {address.substring(address.length - 4)} Log out
                  </button>
                </div>
              </div>

              <Disclosure.Panel className="sm:hidden">
                <div className="pt-2 pb-3 space-y-1">
                  {navigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      onClick={() => navigate(item.to)}
                      className={classNames(
                        item.current
                          ? " border-pink-500 text-pink-700"
                          : "border-transparent text-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-400",
                        "block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                      )}
                      aria-current={item.current ? "page" : undefined}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
                {/* <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="mt-3 space-y-1">
                    {userNavigation.map((item) => (
                      <Disclosure.Button
                        key={item.name}
                        as="a"
                        onClick={() => navigate(item.to)}
                        className="block px-4 py-2 text-base font-medium text-gray-200 hover:text-gray-400 hover:bg-gray-100"
                      >
                        {item.name}
                      </Disclosure.Button>
                    ))}
                  </div>
                </div> */}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        <div className="py-2">
          <header>
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
              <h1 className="text-4xl font-bold leading-tight text-primary-default mt-2">
                {title}
              </h1>
            </div>
          </header>
          <main>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              {/* Replace with your content */}
              <div className="px-4 py-8 sm:px-0">
                <MainProvider value={value}>
                  <SubMain />
                </MainProvider>
              </div>
              {/* /End replace */}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

const SubMain: FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/template" element={<Templates />} />
      <Route path="/template/:templateId" element={<Editor />} />
      <Route path="/template/:templateId/:subpath1" element={<Editor />} />
      <Route
        path="/template/:templateId/:subpath1/:subpath2"
        element={<Editor />}
      />
      <Route
        path="/template/:templateId/:subpath1/:subpath2/:subpath3"
        element={<Editor />}
      />
      <Route path="/settings" element={<Settings />} />
      <Route path="/contracts/:contractId" element={<Contract />} />
      <Route path="/contracts/" element={<Contract />} />
      <Route path="*" element={<Navigate to="/" />} />
      <Route path="/contract" element={<CreateContract />} />
    </Routes>
  );
};

export default Main;
