import { FC, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMain } from "./Main";
import { templateBlockExplorer, useKnownTemplates } from "./useKnownTemplates";

const Templates: FC = () => {
  const knownTemplates = useKnownTemplates();
  const cids = useMemo(
    () => knownTemplates.map(({ cid }) => cid),
    [knownTemplates]
  );
  const { setTitle } = useMain();
  useEffect(() => {
    setTitle("Known Templates");
  }, [setTitle]);
  return (
    <div>
      <div>
        <div className="flex justify-center space-x-12 mt-8">
          <h2 className="flex text-3xl font-bold text-black">
            Manage Document Templates
          </h2>
        </div>
        <div className="w-full mx-auto">
          <div className="mb-12">
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
            <ul className="max-w-4xl mx-auto">
              {knownTemplates
                .filter(({ cid }) => !!cid)
                .map(({ name, cid }) => (
                  <li className="pt-4">
                    <Link
                      to={"/templates/" + cid}
                      className="text-gray-60 mt-4 text-primary-default hover:text-primary-light"
                    >
                      <div>{name}</div>
                      <div className="text-xs text-gray-600">cid: {cid}</div>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Templates;
