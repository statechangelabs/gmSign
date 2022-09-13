import { CloudUploadIcon } from "@heroicons/react/outline";
import { useFormikContext, Field } from "formik";
import { FC, useEffect, useState, useCallback, Fragment } from "react";
import { useDropzone } from "react-dropzone";
import { useMain } from "./Main";
import { useIPFSDataUri } from "./useIPFS";
import { useUpload } from "./useIPFSUpload";

export const DropFile: FC<{
  name: string;
  onUploading: (isUploading: boolean) => void;
}> = ({ name, onUploading = () => {} }) => {
  const { setFieldValue, values } = useFormikContext<Record<string, string>>();

  const onUploaded = useCallback(
    (file: File, cid: string) => {
      setFieldValue(name, cid);
    },
    [setFieldValue, name]
  );
  return (
    <DropFileBase
      name={name}
      value={values[name]}
      onUploading={onUploading}
      onUploaded={onUploaded}
    />
  );
};

export const DropFileBase: FC<{
  name: string;
  value: string;
  onUploading?: (isUploading: boolean) => void;
  onUploaded?: (file: File, cid: string) => void;
}> = ({ name, value, onUploading = () => {}, onUploaded = () => {} }) => {
  const { setTitle } = useMain();
  useEffect(() => {
    setTitle("Create a Contract");
  }, [setTitle]);
  const [isUploading, setIsUploading] = useState(false);
  const { uploadBlob } = useUpload();
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      console.log("I have accepted these files into my life", acceptedFiles);
      const f = acceptedFiles[0];
      //upload the blob
      setIsUploading(true);
      onUploading(true);
      const cid = await uploadBlob(f);
      setIsUploading(false);
      onUploading(false);
      onUploaded(f, cid);
    },
    [uploadBlob, onUploaded, onUploading]
  );
  useEffect(() => {
    onUploading(isUploading);
  }, [isUploading, onUploading]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  const image = useIPFSDataUri(value);
  return (
    <div className="mt-1 sm:mt-0 sm:col-span-2">
      <div
        {...getRootProps()}
        className={[
          "max-w-lg flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md",
          isDragActive && "bg-gray-200",
        ].join(" ")}
      >
        <div className="space-y-1 text-center">
          {isUploading && (
            <CloudUploadIcon className="mx-auto h-12 w-12 text-gray-400 object-cover animated-pulse" />
          )}

          {!isUploading && !value && (
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {value && !isUploading && (
            <Fragment>
              <img
                src={image}
                className="mx-auto h-12 w-12 text-gray-400 object-cover"
              />

              <a
                href={`https://ipfs.io/ipfs/${value}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  window.open(`https://ipfs.io/ipfs/${value}`, "_blank");
                  return false;
                }}
                className="flex text-sm text-blue-600 hover:underline align-center"
              >
                {" "}
                Click to Preview
              </a>
            </Fragment>
          )}
          {!isUploading && (
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <span>{"Upload a file"}</span>
                <input
                  name={name}
                  type="file"
                  className="sr-only"
                  {...getInputProps()}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
          )}
          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
        </div>
      </div>
    </div>
  );
};
