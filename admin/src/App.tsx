import React, { FC, Fragment, useEffect } from "react";
import {
  MetamaskConnected,
  MetamaskDisconnected,
  MetamaskInstalled,
  MetamaskNotInstalled,
} from "@raydeck/usemetamask";
import { HashRouter, Route, Routes } from "react-router-dom";
import GetMetamask from "./GetMetamask";
import { ToastContainer } from "react-toastify";
import Main from "./Main";
import "inter-ui";
import Redirector from "./Redirector";
import Authenticator, { useAuthenticator } from "./Authenticator";
import DisconnectedMain from "./DisconnectedMain";
const App: FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/redirect/:key" element={<Redirector />} />
        <Route path="*" element={<RestOfApp />} />
      </Routes>
      <ToastContainer />
    </HashRouter>
  );
};
const Disconnected: FC = () => {
  const { logout } = useAuthenticator();
  useEffect(() => {
    const t = setTimeout(() => {
      logout();
    }, 500);
    return () => {
      clearTimeout(t);
    };
  }, [logout]);
  return null;
};

const RestOfApp: FC = () => {
  return (
    <Fragment>
      <MetamaskNotInstalled>
        <GetMetamask />
      </MetamaskNotInstalled>
      <MetamaskInstalled>
        <Authenticator fallback={<DisconnectedMain />}>
          <Fragment>
            <MetamaskConnected>
              <Main />
            </MetamaskConnected>
            {/* <MetamaskDisconnected>
              <Disconnected />
            </MetamaskDisconnected> */}
          </Fragment>
        </Authenticator>
      </MetamaskInstalled>
      <ToastContainer />
    </Fragment>
  );
};

export default App;
