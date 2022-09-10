import { FC, Fragment } from "react";
import Logo from "./PolydocsLogo.svg";
const Title: FC = () => {
  return (
    <Fragment>
      <div className="flex items-center space-x-12">
        <img src={Logo} alt="Logo" className="w-32" />
        <h1 className="text-[96px] font-bold ">Polydocs</h1>
      </div>
    </Fragment>
  );
};
export default Title;
