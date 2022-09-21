import {
  ErrorMessage as FormikErrorMessage,
  Field,
  Form,
  Formik,
} from "formik";
import { FC, useState } from "react";
import { useAddress, useAuthenticatedFetch } from "./Authenticator";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { DropFile } from "./DropFile";
import { useUpload } from "./useIPFSUpload";
const supportedChains = [
  // { chainId: 137, name: "Polygon Mainnet" },
  { chainId: 80001, name: "Polygon Mumbai Testnet" },
];
const ErrorMessage: FC<{ name: string }> = ({ name }) => {
  return (
    <FormikErrorMessage
      component="div"
      name={name}
      className="text-red-500 text-xs pt-2"
    />
  );
};
export const CreateContract: FC = () => {
  const address = useAddress();
  const [isUploading, setIsUploading] = useState(false);
  const fetch = useAuthenticatedFetch();
  const navigate = useNavigate();
  const { upload } = useUpload();
  const plans = [
    {
      name: "CC0",
      description: "All copyrights are waived",
      url: "https://arweave.net/_D9kN1WrNWbCq55BSAGRbTB4bS3v8QAPTYmBThSbX3A/0",
    },
    {
      name: "ECR",
      description: "Full exclusive commercial rights",
      url: "https://arweave.net/_D9kN1WrNWbCq55BSAGRbTB4bS3v8QAPTYmBThSbX3A/1",
    },
    {
      name: "NECR",
      description: "Full non-exclusive commercial rights",
      url: "https://arweave.net/_D9kN1WrNWbCq55BSAGRbTB4bS3v8QAPTYmBThSbX3A/2",
    },
    {
      name: "NECR-HS",
      description:
        "Full non-exclusive commercial rights plus hate speech termination",
      url: "https://arweave.net/_D9kN1WrNWbCq55BSAGRbTB4bS3v8QAPTYmBThSbX3A/3",
    },
    {
      name: "PR",
      description: "Personal rights granted",
      url: "https://arweave.net/_D9kN1WrNWbCq55BSAGRbTB4bS3v8QAPTYmBThSbX3A/4",
    },
    {
      name: "PR-HS",
      description: "Personal rights granted with hate speech termination",
      url: "https://arweave.net/_D9kN1WrNWbCq55BSAGRbTB4bS3v8QAPTYmBThSbX3A/5",
    },
  ];

  return (
    <Formik
      initialValues={{
        name: "",
        symbol: "",
        title: "",
        description: "",
        tokenDescription:
          "Purchasing this token requires accepting our service terms: [POLYDOCS]",
        thumbnail: "",
        cover: "",
        owner: address,
        chainId: "80001",
        royaltyRecipient: "",
        royaltyPercentage: "0.00",
        licenseVersion: "0",
        background: "",
      }}
      validate={async ({
        name,
        symbol,
        title,
        description,
        thumbnail,
        cover,
        background,
        chainId,
        royaltyRecipient,
        royaltyPercentage,
        owner,
        tokenDescription,
      }) => {
        let isError = false;
        const errors: Record<string, string> = {};
        if (!name) {
          isError = true;
          errors["name"] = "Name is Required";
        }
        if (!symbol || symbol.length > 10) {
          isError = true;
          errors["symbol"] =
            "Symbol is Required and must be less than 10 characters";
        }
        console.log("validating");
        if (!tokenDescription || !tokenDescription.includes("[POLYDOCS]")) {
          isError = true;
          errors["tokenDescription"] =
            "Description is Required and must include [POLYDOCS]";
        } else {
        }
        if (!supportedChains.find((c) => c.chainId.toString() === chainId)) {
          isError = true;
          errors["chainId"] = "Chain is not supported";
        }

        if (!ethers.utils.isAddress(owner)) {
          isError = true;
          errors["owner"] = "Owner is Invalid Address";
        }
        //Royalties
        if (royaltyRecipient && !ethers.utils.isAddress(royaltyRecipient)) {
          isError = true;
          errors["royaltyRecipient"] = "Royalty Recipient is Invalid Address";
        }
        if (
          parseFloat(royaltyPercentage) > 100 ||
          parseFloat(royaltyPercentage) < 0 ||
          isNaN(parseFloat(royaltyPercentage))
        ) {
          isError = true;
          errors["royaltyPercentage"] =
            "Royalty Percentage must be between 0 and 100, with up to two decimal places (basis points)";
        }
        if (isError) return errors;
      }}
      onSubmit={async (values) => {
        //First, upload the JSON
        const obj = {
          title: values.title,
          description: values.description,
          image: values.thumbnail,
          cover: values.cover,
          tokenDescription: values.tokenDescription,
          background: values.background,
        };
        const json = JSON.stringify(obj);
        const uploadToast = toast("Uploading metadata to IPFS");
        try {
          const jsonHash = await upload(json);
          toast.dismiss(uploadToast);
          const toastId = toast("Submitting", {
            type: "info",
            autoClose: 25000,
          });
          const res = await fetch("/deploy", {
            method: "POST",
            body: JSON.stringify({
              address: values.owner,
              name: values.name,
              symbol: values.symbol,
              uri: "ipfs://" + jsonHash,
              chainId: values.chainId,
              royaltyRecipient: values.royaltyRecipient,
              royaltyPercentage: values.royaltyPercentage,
              licenseVersion: values.licenseVersion,
            }),
          });
          toast.dismiss(toastId);
          const output = await res.json();
          const { contractId } = output;
          console.log("All the json was", output);
          if (res.status === 200) {
            toast("Contract Created", { type: "success" });
            const target = `/contracts/${contractId}`;
            console.log("navigating to ", target);
            navigate(target);
          } else {
            toast("Error creating contract", { type: "error" });
          }
        } catch (e) {
          toast.dismiss(uploadToast);
          toast.error("Problem uploading: try refreshing the browser tab");
        }
      }}
    >
      {({ isSubmitting, isValid, dirty, values, setFieldValue }) => (
        <Form className="space-y-8 ">
          <div className="container-narrow space-y-8 sm:space-y-5">
            <div>
              <div className="bg-white p-6 doc-shadow">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Profile
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    General information about the contract
                  </p>
                </div>
                <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-100 sm:pt-5">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                    >
                      Name (cannot be changed)
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <div className="max-w-lg flex  shadow-sm">
                        {/* <span className="inline-flex items-center px-3 -l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        workcation.com/
                      </span> */}
                        <Field
                          type="text"
                          name="name"
                          id="name"
                          autoComplete="name"
                          className="flex-1 block w-full focus:ring-indigo-500 focus:border-indigo-500 min-w-0  sm:text-sm border-gray-300"
                        />
                      </div>
                      <ErrorMessage name="name" />
                    </div>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-100 sm:pt-5">
                    <label
                      htmlFor="symbol"
                      className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                    >
                      Symbol (cannot be changed)
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <div className="w-40 flex  shadow-sm">
                        {/* <span className="inline-flex items-center px-3 -l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        workcation.com/
                      </span> */}
                        <Field
                          type="text"
                          name="symbol"
                          id="symbol"
                          className="flex-1 block w-full focus:ring-indigo-500 focus:border-indigo-500 min-w-0  sm:text-sm border-gray-300"
                        />
                      </div>
                      <ErrorMessage name="symbol" />
                    </div>
                  </div>

                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-100 sm:pt-5">
                    <label
                      htmlFor="tokenDescription"
                      className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                    >
                      Token base description{" "}
                      <span className="text-red-500">*</span>
                      <p className="mt-2 text-xs opacity-50">
                        A description that will go into each token. The link to
                        sign the contract terms will be substituted where you
                        add [POLYDOCS]
                      </p>
                    </label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <Field
                        component="textarea"
                        id="tokenDescription"
                        name="tokenDescription"
                        rows={3}
                        className="max-w-lg shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 "
                        // defaultValue={
                        //   "Purchasing this token requires accepting our service terms: [POLYDOCS]"
                        // }
                      />
                      <ErrorMessage name="tokenDescription" />
                    </div>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-100 sm:pt-5">
                    <label
                      htmlFor="licenseVersion"
                      className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                    >
                      License Version <span className="text-red-500">*</span>
                      <p className="mt-2 text-xs opacity-50">
                        CantBeEvil license variant to apply to your contract.{" "}
                        <a href="https://a16zcrypto.com/introducing-nft-licenses/">
                          Learn more
                        </a>
                      </p>
                    </label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <fieldset>
                        <legend className="sr-only">Plan</legend>
                        <div className="space-y-5">
                          {plans.map((plan, index) => (
                            <div
                              key={"plan_" + index.toString()}
                              className="relative flex items-start"
                            >
                              <div className="flex h-5 items-center">
                                <Field
                                  id={"plan_" + index.toString()}
                                  aria-describedby={`${index}-description`}
                                  name="licenseVersion"
                                  type="radio"
                                  checked={
                                    values.licenseVersion === index.toString()
                                  }
                                  value={index.toString()}
                                  // onChange={() => {
                                  //   setFieldValue(
                                  //     "licenseVersion",
                                  //     index.toString()
                                  //   );
                                  // }}
                                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label
                                  onClick={() =>
                                    setFieldValue(
                                      "licenseVersion",
                                      index.toString()
                                    )
                                  }
                                  htmlFor={"plan_" + index}
                                  className="font-medium text-gray-700"
                                >
                                  {plan.name}
                                </label>
                                <p
                                  id={`${index}-description`}
                                  className="text-gray-500"
                                >
                                  {plan.description}{" "}
                                  <a
                                    href={plan.url}
                                    className="italic text-xs text-blue-600"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Learn more...
                                  </a>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 doc-shadow my-12">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Signing Page
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Content and images to customize the signing page for
                    agreeing to terms
                  </p>
                </div>
                <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-100 sm:pt-5">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                  >
                    Short Description
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="max-w-lg flex  shadow-sm">
                      {/* <span className="inline-flex items-center px-3 -l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      workcation.com/
                    </span> */}
                      <Field
                        type="text"
                        name="title"
                        id="title"
                        autoComplete="title"
                        className="flex-1 block w-full focus:ring-indigo-500 focus:border-indigo-500 min-w-0  sm:text-sm border-gray-300"
                      />
                    </div>
                    <ErrorMessage name="title" />
                  </div>
                </div>

                <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-100 sm:pt-5">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                  >
                    Longer Description
                    <p className="mt-2 text-xs opacity-50">
                      Longer description of the contract
                    </p>
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      component="textarea"
                      id="description"
                      name="description"
                      rows={3}
                      className="max-w-lg shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 "
                      // defaultValue={""}
                    />
                    <ErrorMessage name="description" />
                  </div>
                </div>
                <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center sm:border-t sm:border-gray-100 sm:pt-5">
                  <label
                    htmlFor="thumbnail"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Thumbnail/logo image for the contract
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <div className="flex items-center">
                      <DropFile name="thumbnail" onUploading={setIsUploading} />
                    </div>
                  </div>
                </div>

                <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-100 sm:pt-5">
                  <label
                    htmlFor="cover"
                    className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                  >
                    Cover Image
                  </label>
                  <DropFile name="cover" onUploading={setIsUploading} />
                </div>
                <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-100 sm:pt-5">
                  <label
                    htmlFor="background"
                    className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                  >
                    Cover Image
                  </label>
                  <DropFile name="background" onUploading={setIsUploading} />
                </div>
              </div>

              <div className="bg-white p-6 doc-shadow my-12">
                <div className="border-b border-gray-100 pb-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Contract Info
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Address &amp; Chain
                  </p>
                </div>
                <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5 mb-5">
                  <label
                    htmlFor="owner"
                    className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                  >
                    Contract Owner Address{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      type="text"
                      name="owner"
                      id="owner"
                      onClick={(e: InputEvent) => {
                        //@ts-ignore
                        e.target?.select();
                      }}
                      className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 "
                    />
                  </div>
                  <ErrorMessage name="owner" />
                </div>
                <div className="pt-6 sm:pt-5 border-t border-gray-100">
                  <div role="group" aria-labelledby="label-notifications">
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-baseline">
                      <div>
                        <div
                          className="text-base font-medium text-gray-900 sm:text-sm sm:text-gray-700"
                          id="label-notifications"
                        >
                          Chain For Deployment
                          <p className="text-xs opacity-50">
                            When Experimenting, start with a testnet.
                          </p>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="max-w-lg">
                          <div className="mt-4 space-y-4">
                            {supportedChains.map(({ chainId, name }) => (
                              <div
                                className="flex items-center"
                                key={"chainId_" + chainId}
                              >
                                <Field
                                  id={"chainId_" + chainId}
                                  name="chainId"
                                  type="radio"
                                  value={chainId.toString()}
                                  checked={
                                    values.chainId === chainId.toString()
                                  }
                                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                                />

                                <label
                                  onClick={() =>
                                    setFieldValue("chainId", chainId.toString())
                                  }
                                  htmlFor="push-everything"
                                  className="ml-3 block text-sm font-medium text-gray-700"
                                >
                                  {name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <ErrorMessage name="chainId" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 doc-shadow pt-8 space-y-6 sm:pt-10 sm:space-y-5">
              <div className="border-b border-gray-100 pb-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Royalty Information (optional)
                </h3>
                <p className="mt-1 max-w-2xl text-sm opacity-50">
                  Only works on NFT platforms that conform to ERC 2981
                </p>
              </div>
              <div className="space-y-6 sm:space-y-5">
                <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start  sm:border-gray-100 ">
                  <label
                    htmlFor="royaltyRecipient"
                    className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                  >
                    Royalty Fees Recipient (blank to go to owner)
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      type="text"
                      name="royaltyRecipient"
                      id="royaltyRecipient"
                      className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 "
                    />
                  </div>
                  <ErrorMessage name="royaltyRecipient" />
                </div>

                <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-100 sm:pt-5">
                  <label
                    htmlFor="royaltyPercentage"
                    className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                  >
                    Percentage
                  </label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Field
                      id="royaltyPercentage"
                      name="royaltyPercentage"
                      type="text"
                      className="block w-40 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 "
                    />
                  </div>
                  <ErrorMessage name="royaltyPercentage" />
                </div>
              </div>
            </div>
          </div>

          <div className="container-narrow pt-5">
            <div className="flex justify-between items-center">
              {!dirty && <div>Nothing to save yet...</div>}
              <div>
                <button
                  type="button"
                  className="btn text-gray-500 underline mr-6"
                >
                  Cancel
                </button>
                <button
                  disabled={!isValid || isSubmitting || !dirty || isUploading}
                  type="submit"
                  className="btn btn-primary"
                >
                  {isSubmitting ? "Sending..." : "Save"}
                </button>
              </div>
            </div>
            {/* {!isValid && (
              <div>
                {Object.entries(errors).map(([key, value]) => (
                  <ErrorMessage name={key} />
                ))}
              </div>
            )} */}
          </div>
        </Form>
      )}
    </Formik>
  );
};
export default CreateContract;
