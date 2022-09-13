/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../../common";

export interface CantBeEvilInterface extends utils.Interface {
  functions: {
    "getLicenseName()": FunctionFragment;
    "getLicenseURI()": FunctionFragment;
    "licenseVersion()": FunctionFragment;
    "supportsInterface(bytes4)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "getLicenseName"
      | "getLicenseURI"
      | "licenseVersion"
      | "supportsInterface"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "getLicenseName",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getLicenseURI",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "licenseVersion",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [PromiseOrValue<BytesLike>]
  ): string;

  decodeFunctionResult(
    functionFragment: "getLicenseName",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getLicenseURI",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "licenseVersion",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;

  events: {};
}

export interface CantBeEvil extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: CantBeEvilInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    getLicenseName(overrides?: CallOverrides): Promise<[string]>;

    getLicenseURI(overrides?: CallOverrides): Promise<[string]>;

    licenseVersion(overrides?: CallOverrides): Promise<[number]>;

    supportsInterface(
      interfaceId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;
  };

  getLicenseName(overrides?: CallOverrides): Promise<string>;

  getLicenseURI(overrides?: CallOverrides): Promise<string>;

  licenseVersion(overrides?: CallOverrides): Promise<number>;

  supportsInterface(
    interfaceId: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  callStatic: {
    getLicenseName(overrides?: CallOverrides): Promise<string>;

    getLicenseURI(overrides?: CallOverrides): Promise<string>;

    licenseVersion(overrides?: CallOverrides): Promise<number>;

    supportsInterface(
      interfaceId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<boolean>;
  };

  filters: {};

  estimateGas: {
    getLicenseName(overrides?: CallOverrides): Promise<BigNumber>;

    getLicenseURI(overrides?: CallOverrides): Promise<BigNumber>;

    licenseVersion(overrides?: CallOverrides): Promise<BigNumber>;

    supportsInterface(
      interfaceId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    getLicenseName(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getLicenseURI(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    licenseVersion(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    supportsInterface(
      interfaceId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
