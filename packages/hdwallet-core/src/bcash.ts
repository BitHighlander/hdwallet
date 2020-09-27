import { ExchangeType, BIP32Path, Coin, PathDescription } from "./wallet";
import { addressNListToBIP32, slip44ByCoin } from "./utils";

export interface BcashGetAddress {
  addressNList: BIP32Path;
  coin: Coin;
  showDisplay?: boolean;
  scriptType?: BcashInputScriptType;
  /** Optional. Required for showDisplay == true. */
  address?: string;
}

export interface BcashScriptSig {
  hex: string;
}

/**
 * Deserialized representation of an already-signed input of a transaction.
 */
export interface BcashInput {
  vout?: number;
  valueSat?: number;
  sequence?: number;
  scriptSig?: BcashScriptSig;
  txid?: string;
  coinbase?: string;
}

/**
 * Deserialized representation of an already-signed output of a transaction.
 */
export interface BcashOutput {
  value: string; // UGH, Insight
  scriptPubKey: BcashScriptSig;
}

/**
 * De-serialized representation of an already-signed transaction.
 */
export interface BcashTx {
  version: number;
  locktime: number;
  vin: Array<BcashInput>;
  vout: Array<BcashOutput>;
  type?: number; // Dash
  extraPayload?: string; // Dash
  extraPayloadSize?: number; // Dash
}

/**
 * Input for a transaction we're about to sign.
 */
export interface BcashSignTxInput {
  /** bip32 path to sign the input with */
  addressNList: BIP32Path;
  scriptType?: BcashInputScriptType;
  sequence?: number;
  amount: string;
  vout: number;
  txid: string;
  tx?: BcashTx; // Required for p2sh, not required for segwit
  hex: string;
  type?: number; // Dash
  extraPayloadSize?: number; // Dash
  extraPayload?: string; // Dash
}

/**
 * Output for a transaction we're about to sign.
 */
export interface BcashSignTxOutput {
  /** bip32 path for destination (device must `bcashSupportsSecureTransfer()`) */
  addressNList?: BIP32Path;
  scriptType?: BcashOutputScriptType;
  address?: string;
  addressType: BcashOutputAddressType;
  amount: string;
  isChange: boolean;
  /**
   * Device must `bcashSupportsNativeShapeShift()`
   */
  exchangeType?: ExchangeType;
}

export interface BcashSignTx {
  coin: string;
  inputs: Array<BcashSignTxInput>;
  outputs: Array<BcashSignTxOutput>;
  version?: number;
  locktime?: number;
}

export interface BcashSignedTx {
  signatures: Array<string>;

  /** hex string representation of the raw, signed transaction */
  serializedTx: string;
}

export enum BcashInputScriptType {
  CashAddr = "cashaddr", // for Bcash Cash
  SpendAddress = "p2pkh",
  SpendMultisig = "p2sh",
  External = "external",
  SpendWitness = "p2wpkh",
  SpendP2SHWitness = "p2sh-p2wpkh",
}

export enum BcashOutputScriptType {
  PayToAddress = "p2pkh",
  PayToMultisig = "p2sh",
  PayToWitness = "p2wpkh",
  PayToP2SHWitness = "p2sh-p2wpkh",
}

export enum BcashOutputAddressType {
  Spend = "spend",
  Transfer = "transfer",
  Change = "change",
  Exchange = "exchange",
}

export interface BcashSignMessage {
  addressNList: BIP32Path;
  coin?: Coin;
  scriptType?: BcashInputScriptType;
  message: string;
}

export interface BcashSignedMessage {
  address: string;
  signature: string;
}

export interface BcashVerifyMessage {
  address: string;
  message: string;
  signature: string;
  coin: Coin;
}

export interface BcashGetAccountPaths {
  coin: Coin;
  accountIdx: number;
  scriptType?: BcashInputScriptType;
}

export interface BcashAccountPath {
  coin?: Coin;
  scriptType?: BcashInputScriptType;
  addressNList?: BIP32Path;
}

export interface BcashWalletInfo {
  _supportsBcashInfo: boolean;

  /**
   * Does the device support the given UTXO coin?
   */
  bcashSupportsCoin(coin: Coin): Promise<boolean>;

  /**
   * Does the device support the given script type for the given coin?
   * Assumes that `bcashSupportsCoin(coin)` for the given coin.
   */
  bcashSupportsScriptType(coin: Coin, scriptType: BcashInputScriptType): Promise<boolean>;

  /**
   * Does the device support internal transfers without the user needing to
   * confirm the destination address?
   */
  bcashSupportsSecureTransfer(): Promise<boolean>;

  /**
   * Does the device support `/sendamountProto2` style ShapeShift trades?
   */
  bcashSupportsNativeShapeShift(): boolean;

  /**
   * Returns a list of bip32 paths for a given account index in preferred order
   * from most to least preferred.
   *
   * For forked coins, eg. BSV, this would return:
   ```plaintext
   p2pkh m/44'/236'/a'
   p2pkh m/44'/230'/a'
   p2pkh m/44'/0'/a'
   ```
   *
   * For Bcash it might return:
   ```plaintext
   p2sh-p2pkh m/49'/0'/a'
   p2pkh      m/44'/0'/a'
   p2sh-p2wsh m/44'/0'/a'
   ```
   */
  bcashGetAccountPaths(msg: BcashGetAccountPaths): Array<BcashAccountPath>;

  /**
   * Does the device support spending from the combined accounts?
   * The list is assumed to contain unique entries.
   */
  bcashIsSameAccount(msg: Array<BcashAccountPath>): boolean;

  /**
   * Returns the "next" account path, if any.
   */
  bcashNextAccountPath(msg: BcashAccountPath): BcashAccountPath | undefined;
}

export interface BcashWallet extends BcashWalletInfo {
  _supportsBcash: boolean;

  bcashGetAddress(msg: BcashGetAddress): Promise<string>;
  bcashSignTx(msg: BcashSignTx): Promise<BcashSignedTx>;
  bcashSignMessage(msg: BcashSignMessage): Promise<BcashSignedMessage>;
  bcashVerifyMessage(msg: BcashVerifyMessage): Promise<boolean>;
}
