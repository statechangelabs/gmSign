/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../common";

export interface TermsableBaseInterface extends utils.Interface {
  functions: {
    "currentTermsBlock()": FunctionFragment;
    "docTemplate()": FunctionFragment;
    "globalTerm(string)": FunctionFragment;
    "owner()": FunctionFragment;
    "renderer()": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "setGlobalRenderer(string)": FunctionFragment;
    "setGlobalTemplate(string)": FunctionFragment;
    "setGlobalTerm(string,string)": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "currentTermsBlock"
      | "docTemplate"
      | "globalTerm"
      | "owner"
      | "renderer"
      | "renounceOwnership"
      | "setGlobalRenderer"
      | "setGlobalTemplate"
      | "setGlobalTerm"
      | "transferOwnership"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "currentTermsBlock",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "docTemplate",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "globalTerm",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(functionFragment: "renderer", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "setGlobalRenderer",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "setGlobalTemplate",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "setGlobalTerm",
    values: [PromiseOrValue<string>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(
    functionFragment: "currentTermsBlock",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "docTemplate",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "globalTerm", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "renderer", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setGlobalRenderer",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setGlobalTemplate",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setGlobalTerm",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;

  events: {
    "GlobalTermAdded(bytes32,bytes32)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "GlobalTermAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
}

export interface GlobalTermAddedEventObject {
  _term: string;
  _value: string;
}
export type GlobalTermAddedEvent = TypedEvent<
  [string, string],
  GlobalTermAddedEventObject
>;

export type GlobalTermAddedEventFilter = TypedEventFilter<GlobalTermAddedEvent>;

export interface OwnershipTransferredEventObject {
  previousOwner: string;
  newOwner: string;
}
export type OwnershipTransferredEvent = TypedEvent<
  [string, string],
  OwnershipTransferredEventObject
>;

export type OwnershipTransferredEventFilter =
  TypedEventFilter<OwnershipTransferredEvent>;

export interface TermsableBase extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: TermsableBaseInterface;

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
    currentTermsBlock(overrides?: CallOverrides): Promise<[BigNumber]>;

    docTemplate(overrides?: CallOverrides): Promise<[string]>;

    globalTerm(
      _term: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    renderer(overrides?: CallOverrides): Promise<[string]>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setGlobalRenderer(
      _newRenderer: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setGlobalTemplate(
      _newDocTemplate: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setGlobalTerm(
      _term: PromiseOrValue<string>,
      _value: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  currentTermsBlock(overrides?: CallOverrides): Promise<BigNumber>;

  docTemplate(overrides?: CallOverrides): Promise<string>;

  globalTerm(
    _term: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string>;

  owner(overrides?: CallOverrides): Promise<string>;

  renderer(overrides?: CallOverrides): Promise<string>;

  renounceOwnership(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setGlobalRenderer(
    _newRenderer: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setGlobalTemplate(
    _newDocTemplate: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setGlobalTerm(
    _term: PromiseOrValue<string>,
    _value: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    currentTermsBlock(overrides?: CallOverrides): Promise<BigNumber>;

    docTemplate(overrides?: CallOverrides): Promise<string>;

    globalTerm(
      _term: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;

    owner(overrides?: CallOverrides): Promise<string>;

    renderer(overrides?: CallOverrides): Promise<string>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    setGlobalRenderer(
      _newRenderer: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    setGlobalTemplate(
      _newDocTemplate: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    setGlobalTerm(
      _term: PromiseOrValue<string>,
      _value: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "GlobalTermAdded(bytes32,bytes32)"(
      _term?: PromiseOrValue<BytesLike> | null,
      _value?: null
    ): GlobalTermAddedEventFilter;
    GlobalTermAdded(
      _term?: PromiseOrValue<BytesLike> | null,
      _value?: null
    ): GlobalTermAddedEventFilter;

    "OwnershipTransferred(address,address)"(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;
  };

  estimateGas: {
    currentTermsBlock(overrides?: CallOverrides): Promise<BigNumber>;

    docTemplate(overrides?: CallOverrides): Promise<BigNumber>;

    globalTerm(
      _term: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    renderer(overrides?: CallOverrides): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setGlobalRenderer(
      _newRenderer: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setGlobalTemplate(
      _newDocTemplate: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setGlobalTerm(
      _term: PromiseOrValue<string>,
      _value: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    currentTermsBlock(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    docTemplate(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    globalTerm(
      _term: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    renderer(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setGlobalRenderer(
      _newRenderer: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setGlobalTemplate(
      _newDocTemplate: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setGlobalTerm(
      _term: PromiseOrValue<string>,
      _value: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
