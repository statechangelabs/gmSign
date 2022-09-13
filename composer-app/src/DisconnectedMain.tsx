import { Disclosure } from "@headlessui/react";
import React, { createContext, FC, useContext, useMemo, useState } from "react";
import {
  Route,
  Routes,
  useLocation,
  Link,
  useNavigate,
} from "react-router-dom";
import Editor from "./Editor";
import Logo from "./logo.png";
import { MenuIcon, XIcon } from "@heroicons/react/outline";
import Topography from "./topography.svg";
import Disconnected from "./Disconnected";
import KnownTemplates from "./KnownTemplates";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
const mainContext = createContext({
  title: "Dashboard",
  setTitle: (title: string) => {},
  headerVisible: true,
  setHeaderVisible: (visible: boolean) => {},
});
const { Provider: MainProvider } = mainContext;
export const useMain = () => useContext(mainContext);

const Main: FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const navigation = useMemo(() => {
    return [
      { name: "Home", to: "/", current: pathname === "/" },
      {
        name: "Templates",
        to: "/templates",
        current: pathname.startsWith("/templates"),
      },
      {
        name: "Contract",
        to: "/contract",
        current: pathname.startsWith("/contract"),
      },
    ];
  }, [pathname]);

  const [title, setTitle] = useState("Dashboard");
  const [headerVisible, setHeaderVisible] = useState(true);
  const value = useMemo(
    () => ({ title, setTitle, headerVisible, setHeaderVisible }),
    [title, headerVisible]
  );
  if (!headerVisible)
    return (
      <MainProvider value={value}>
        <SubMain />
      </MainProvider>
    );
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
                      <span className="text-lg font-bold text-primary-default">
                        Polydocs
                      </span>
                    </div>
                    <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.to}
                          className={classNames(
                            item.current
                              ? "border-purple-600 text-gray-600"
                              : "border-transparent text-gray-400 hover:border-gray-300 hover:text-purple-600",
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
      <Route path="/templates" element={<KnownTemplates />} />
      <Route path="/templates/:templateId" element={<Editor />} />
      <Route path="*" element={<Disconnected />} />
    </Routes>
  );
};

export default Main;
