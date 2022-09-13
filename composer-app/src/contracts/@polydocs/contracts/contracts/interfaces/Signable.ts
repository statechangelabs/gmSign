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
} from "../../../../common";

export interface SignableInterface extends utils.Interface {
  functions: {
    "acceptTerms(string)": FunctionFragment;
    "acceptTermsFor(address,string,bytes)": FunctionFragment;
    "acceptedTerms(address)": FunctionFragment;
    "termsUrl()": FunctionFragment;
    "termsUrlWithPrefix(string)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "acceptTerms"
      | "acceptTermsFor"
      | "acceptedTerms"
      | "termsUrl"
      | "termsUrlWithPrefix"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "acceptTerms",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "acceptTermsFor",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BytesLike>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "acceptedTerms",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(functionFragment: "termsUrl", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "termsUrlWithPrefix",
    values: [PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(
    functionFragment: "acceptTerms",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "acceptTermsFor",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "acceptedTerms",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "termsUrl", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "termsUrlWithPrefix",
    data: BytesLike
  ): Result;

  events: {
    "AcceptedTerms(address,string)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "AcceptedTerms"): EventFragment;
}

export interface AcceptedTermsEventObject {
  sender: string;
  terms: string;
}
export type AcceptedTermsEvent = TypedEvent<
  [string, string],
  AcceptedTermsEventObject
>;

export type AcceptedTermsEventFilter = TypedEventFilter<AcceptedTermsEvent>;

export interface Signable extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: SignableInterface;

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
    acceptTerms(
      _newtermsUrl: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    acceptTermsFor(
      _signer: PromiseOrValue<string>,
      _newtermsUrl: PromiseOrValue<string>,
      _signature: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    acceptedTerms(
      _address: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    termsUrl(overrides?: CallOverrides): Promise<[string]>;

    termsUrlWithPrefix(
      prefix: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string]>;
  };

  acceptTerms(
    _newtermsUrl: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  acceptTermsFor(
    _signer: PromiseOrValue<string>,
    _newtermsUrl: PromiseOrValue<string>,
    _signature: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  acceptedTerms(
    _address: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  termsUrl(overrides?: CallOverrides): Promise<string>;

  termsUrlWithPrefix(
    prefix: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string>;

  callStatic: {
    acceptTerms(
      _newtermsUrl: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    acceptTermsFor(
      _signer: PromiseOrValue<string>,
      _newtermsUrl: PromiseOrValue<string>,
      _signature: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    acceptedTerms(
      _address: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    termsUrl(overrides?: CallOverrides): Promise<string>;

    termsUrlWithPrefix(
      prefix: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;
  };

  filters: {
    "AcceptedTerms(address,string)"(
      sender?: null,
      terms?: null
    ): AcceptedTermsEventFilter;
    AcceptedTerms(sender?: null, terms?: null): AcceptedTermsEventFilter;
  };

  estimateGas: {
    acceptTerms(
      _newtermsUrl: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    acceptTermsFor(
      _signer: PromiseOrValue<string>,
      _newtermsUrl: PromiseOrValue<string>,
      _signature: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    acceptedTerms(
      _address: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    termsUrl(overrides?: CallOverrides): Promise<BigNumber>;

    termsUrlWithPrefix(
      prefix: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    acceptTerms(
      _newtermsUrl: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    acceptTermsFor(
      _signer: PromiseOrValue<string>,
      _newtermsUrl: PromiseOrValue<string>,
      _signature: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    acceptedTerms(
      _address: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    termsUrl(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    termsUrlWithPrefix(
      prefix: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
