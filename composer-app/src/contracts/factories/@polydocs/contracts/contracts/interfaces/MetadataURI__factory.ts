/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  MetadataURI,
  MetadataURIInterface,
} from "../../../../../@polydocs/contracts/contracts/interfaces/MetadataURI";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "uri",
        type: "string",
      },
    ],
    name: "UpdatedURI",
    type: "event",
  },
  {
    inputs: [],
    name: "URI",
    outputs: [
      {
        internalType: "string",
        name: "_uri",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export class MetadataURI__factory {
  static readonly abi = _abi;
  static createInterface(): MetadataURIInterface {
    return new utils.Interface(_abi) as MetadataURIInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MetadataURI {
    return new Contract(address, _abi, signerOrProvider) as MetadataURI;
  }
}
