import { FC } from "react";
import { useIPFSDataUri } from "./useIPFS";

const IPFSImg: FC<{ cid: string; alt?: string; className?: string }> = ({
  cid,
  className,
  alt,
}) => {
  const uri = useIPFSDataUri(cid);
  return <img src={uri} alt={alt} className={className} />;
};

export default IPFSImg;
