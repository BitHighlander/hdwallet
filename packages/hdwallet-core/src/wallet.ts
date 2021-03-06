import { BTCInputScriptType, BTCWallet, BTCWalletInfo } from "./bitcoin";
import { ETHWallet, ETHWalletInfo } from "./ethereum";
import { CosmosWallet, CosmosWalletInfo } from "./cosmos";
import { BinanceWallet, BinanceWalletInfo } from "./binance";
import { RippleWallet, RippleWalletInfo } from "./ripple";
import { EosWallet, EosWalletInfo } from "./eos";
import { FioWallet, FioWalletInfo } from "./fio";
import { ThorchainWallet, ThorchainWalletInfo } from "./thorchain";
import { SecretWallet, SecretWalletInfo } from "./secret";
import { KavaWallet, KavaWalletInfo } from "./kava";
import { TerraWallet, TerraWalletInfo } from "./terra";
import { CardanoWallet, CardanoWalletInfo } from "./cardano";
import { DebugLinkWallet } from "./debuglink";
import { Transport } from "./transport";
import { isObject } from "lodash";

export type BIP32Path = Array<number>;

export interface GetPublicKey {
  addressNList: BIP32Path;
  addressNListMaster: BIP32Path;
  showDisplay?: boolean;
  coin?:string;
  scriptType?: BTCInputScriptType;
  script_type?: BTCInputScriptType;
  symbol?: string;
  network?: string;
  available_scripts_types?: [any];
  curve: string;
  blockchain?: string;
  address?: string;
  pubkey?: string;
  path?: string;
  pathMaster?: string;
  long?: string;
  master?: string;
  type?: string;
  logs?: string;
  note?: string;
  verbose?: any;
}

export interface PublicKey {
  xpub?: string;
  tpub?: string;
  zpub?: string;
  address?: string;
  path?: string;
  coin?: string;
  symbol?: string;
  long?: string;
  network?: string;
  master?: string;
  pubkey?: string;
  script_type?: BTCInputScriptType;
  available_scripts_types?: [any];
  type?: string;
  logs?: string;
  note?: string;
  verbose?: any;
}

export interface Ping {
  msg: string;
  passphrase?: boolean;
  pin?: boolean;
  button?: boolean;
}

export interface Pong {
  msg: string;
}

export interface ResetDevice {
  /** Bits. Either 128 (12 words), 192 (18 words), or 256 (24 words)*/
  entropy?: 128 | 192 | 256;
  label?: string;
  passphrase?: boolean;
  pin?: boolean;
  autoLockDelayMs?: number;
  u2fCounter?: number;
}

export interface RecoverDevice {
  /** Bits. Either 128 (12 words), 192 (18 words), or 256 (24 words)*/
  entropy?: 128 | 192 | 256;
  label?: string;
  passphrase?: boolean;
  pin?: boolean;
  language?: string;
  autoLockDelayMs?: number;
  u2fCounter?: number;
}

export interface LoadDevice {
  /** Use Testnet (defaults to mainnet) */
  isTestnet?: boolean;
  /** 12, 18, or 24 word BIP39 mnemonic */
  mnemonic: string;
  /** User-identifiable device label */
  label?: string;
  /** Whether passphrase protection should be enabled */
  passphrase?: boolean;
  /** pin, in plaintext */
  pin?: string;
  /** Whether to enforce checksum */
  skipChecksum?: boolean;
}

export interface ExchangeType {
  /** `SignedExchangeResponse` from the `/sendamountProto2` ShapeShift endpoint, base64 encoded */
  signedExchangeResponse: string;
  withdrawalCoinName: string;
  withdrawalAddressNList: BIP32Path;
  withdrawalScriptType?: BTCInputScriptType;
  returnAddressNList: BIP32Path;
  returnScriptType?: BTCInputScriptType;
}

export interface DescribePath {
  path: BIP32Path;
  blockchain: string;
  coin?: string; //please kill this
  scriptType?: BTCInputScriptType;
}

export interface GetAddress {
  path: BIP32Path;
  blockchain: string;
  coin?:string;
  scriptType?: BTCInputScriptType;
}

export interface PathDescription {
  isKnown: boolean;
  verbose: string;
  coin: Coin;
  scriptType?: BTCInputScriptType;
  accountIdx?: number;
  addressIdx?: number;
  isChange?: boolean;
  wholeAccount?: boolean;
  isPrefork?: boolean;
}

type CoinWallets = BTCWallet | ETHWallet | CosmosWallet | BinanceWallet | RippleWallet | EosWallet | DebugLinkWallet;

export type Coin = string;
export type Symbol = string;

/**
 * Type guard for BTCWallet Support
 *
 * Example Usage:
 ```typescript
 if (supportsBTC(wallet)) {
   wallet.btcGetAddress(...)
 }
 ```
 */
export function supportsBTC(wallet: any): wallet is BTCWallet {
  return isObject(wallet) && (wallet as any)._supportsBTC;
}

export function infoBTC(info: any): info is BTCWalletInfo {
  return isObject(info) && (info as any)._supportsBTCInfo;
}

/**
 * Type guard for ETHWallet Support
 *
 * Example Usage:
 ```typescript
 if (supportsETH(wallet)) {
   wallet.ethGetAddress(...)
 }
 ```
 */
export function supportsETH(wallet: any): wallet is ETHWallet {
  return isObject(wallet) && (wallet as any)._supportsETH;
}

export function infoETH(info: any): info is ETHWalletInfo {
  return isObject(info) && (info as any)._supportsETHInfo;
}

export function supportsCosmos(wallet: any): wallet is CosmosWallet {
  return isObject(wallet) && (wallet as any)._supportsCosmos;
}

export function infoCosmos(info: any): info is CosmosWalletInfo {
  return isObject(info) && (info as any)._supportsCosmosInfo;
}

export function supportsThorchain(wallet: any): wallet is ThorchainWallet {
  return isObject(wallet) && (wallet as any)._supportsThorchain;
}

export function infoThorchain(info: any): info is ThorchainWalletInfo {
  return isObject(info) && (info as any)._supportsThorchainInfo;
}

export function supportsEos(wallet: any): wallet is EosWallet {
  return isObject(wallet) && (wallet as any)._supportsEos;
}

export function infoEos(info: any): info is EosWalletInfo {
  return isObject(info) && (info as any)._supportsEosInfo;
}

export function supportsFio(wallet: any): wallet is FioWallet {
  return isObject(wallet) && (wallet as any)._supportsFio;
}

export function infoFio(info: any): info is FioWalletInfo {
  return isObject(info) && (info as any)._supportsFioInfo;
}

export function supportsSecret(wallet: any): wallet is SecretWallet {
  return isObject(wallet) && (wallet as any)._supportsSecret;
}

export function infoSecret(info: any): info is SecretWalletInfo {
  return isObject(info) && (info as any)._supportsSecretInfo;
}

export function supportsTerra(wallet: any): wallet is TerraWallet {
  return isObject(wallet) && (wallet as any)._supportsTerra;
}

export function infoTerra(info: any): info is TerraWalletInfo {
  return isObject(info) && (info as any)._supportsTerraInfo;
}

export function supportsKava(wallet: any): wallet is KavaWallet {
  return isObject(wallet) && (wallet as any)._supportsKava;
}

export function infoKava(info: any): info is KavaWalletInfo {
  return isObject(info) && (info as any)._supportsKavaInfo;
}

export function supportsCardano(wallet: any): wallet is CardanoWallet {
  return isObject(wallet) && (wallet as any)._supportsCardano;
}

export function infoCardano(info: any): info is CardanoWalletInfo {
  return isObject(info) && (info as any)._supportsCardanoInfo;
}

/**
 * Type guard for RippleWallet Support
 *
 * Example Usage:
 ```typescript
 if (supportsripple(wallet)) {
   wallet.xrpGetAddress(...)
 }
 ```
 */
export function supportsRipple(wallet: any): wallet is RippleWallet {
  return isObject(wallet) && (wallet as any)._supportsRipple;
}

export function infoRipple(info: any): info is RippleWalletInfo {
  return isObject(info) && (info as any)._supportsRippleInfo;
}

export function supportsBinance(wallet: any): wallet is BinanceWallet {
  return isObject(wallet) && (wallet as any)._supportsBinance;
}

export function infoBinance(info: any): info is BinanceWalletInfo {
  return isObject(info) && (info as any)._supportsBinanceInfo;
}

export function supportsDebugLink(wallet: any): wallet is DebugLinkWallet {
  return isObject(wallet) && (wallet as any)._supportsDebugLink;
}

export interface HDWalletInfo {
  _supportsETHInfo: boolean;
  _supportsBTCInfo: boolean;
  _supportsCosmosInfo: boolean;
  _supportsRippleInfo: boolean;
  _supportsBinanceInfo: boolean;
  _supportsEosInfo: boolean;
  _supportsFioInfo: boolean;
  _supportsThorchainInfo: boolean;
  _supportsSecretInfo: boolean;
  _supportsTerraInfo: boolean;
  _supportsKavaInfo: boolean;
  _supportsCardanoInfo: boolean;

  /**
   * Retrieve the wallet's vendor string.
   */
  getVendor(): string;

  /**
   * Does the wallet need the user to enter their pin through the device?
   */
  hasOnDevicePinEntry(): boolean;

  /**
   * Does the wallet need the user to enter their passphrase through the device?
   */
  hasOnDevicePassphrase(): boolean;

  /**
   * Does the wallet have a screen for displaying addresses / confirming?
   */
  hasOnDeviceDisplay(): boolean;

  /**
   * Does the wallet use a recovery method that does not involve communicating
   * with the host? Eg. for a KeepKey, this is `false` since we use Ciphered
   * Recovery, but for a Ledger it's `true` since you enter words using only
   * the device.
   */
  hasOnDeviceRecovery(): boolean;

  /**
   * Does the device support `/sendamountProto2` style native ShapeShift
   * integration for the given pair?
   */
  hasNativeShapeShift(srcCoin: Coin, dstCoin: Coin): boolean;

  /**
   * Describes a BIP32 path in plain English.
   */
  describePath(msg: DescribePath): PathDescription;
}

export interface HDWallet extends HDWalletInfo {
  _supportsBTC: boolean;
  _supportsETH: boolean;
  _supportsCosmos: boolean;
  _supportsBinance: boolean;
  _supportsRipple: boolean;
  _supportsEos: boolean;
  _supportsFio: boolean;
  _supportsThorchain: boolean;
  _supportsSecret: boolean;
  _supportsTerra: boolean;
  _supportsKava: boolean;
  _supportsCardano: boolean;
  _supportsDebugLink: boolean;

  transport?: Transport;

  /**
   * Retrieve the wallet's unique ID
   */
  getDeviceID(): Promise<string>;

  /**
   * Get device specific features
   */
  getFeatures(): Promise<Record<string, any>>;
  /**
   * Retrieve the wallet's firmware version
   */
  getFirmwareVersion(): Promise<string>;

  /**
   * Retrieve the name of the model of wallet, eg 'KeepKey' or 'Trezor One'
   */
  getModel(): Promise<string>;

  /**
   * Retrieve the device's user-assigned label.
   */
  getLabel(): Promise<string>;

  /**
   * Derive one or more xpubs.
   */
  getPublicKeys(msg: Array<GetPublicKey>): Promise<Array<PublicKey | null>>;

  /**
   * Get any address by string
   */
  //TODO implementMe everywhere
  //getAddress(msg: any): Promise<string>;

  /**
   * Check whether the device has been initialized with a secret.
   */
  isInitialized(): Promise<boolean>;

  //TODO implementMe everywhere
  // /**
  //  * Check whether the wallet is in testnet mode
  //  */
  // isTestnet(): Boolean;

  /**
   * Check whether the device is locked.
   */
  isLocked(): Promise<boolean>;

  /**
   * Clear cached pin / passphrase, and lock the wallet.
   */
  clearSession(): Promise<void>;

  /**
   * Initialize a device session.
   */
  initialize(): Promise<any>;

  /**
   * Send a ping to the device.
   */
  ping(msg: Ping): Promise<Pong>;

  /**
   * Respond to device with the user's pin.
   *
   * For KeepKey/Trezor, this would be encoded with the PIN matrix OTP, so the
   * host cannot decipher it without actually seeing the device's screen.
   */
  sendPin(pin: string): Promise<void>;

  /**
   * Respond to device with the user's BIP39 passphrase.
   */
  sendPassphrase(passphrase: string): Promise<void>;

  /**
   * Respond to device with a character that the user entered.
   */
  sendCharacter(charater: string): Promise<void>;

  /**
   * Respond to device with a word that the user entered.
   */
  sendWord(word: string): Promise<void>;

  /**
   * Cancel an in-progress operation
   */
  cancel(): Promise<void>;

  /**
   * Erase all secrets and lock the wallet.
   */
  wipe(): Promise<void>;

  /**
   * Initialize a wiped device with brand new secrets generated by the device.
   */
  reset(msg: ResetDevice): Promise<void>;

  /**
   * Recover a wiped device with an existing BIP39 seed phrase.
   */
  recover(msg: RecoverDevice): Promise<void>;

  /**
   * Initialize a device with a raw BIP39 seed phrase in plaintext.
   *
   * **Extreme** care is needed when loading BIP39 seed phrases this way, as
   * the phrase is exposed in plaintext to the host machine. It is not
   * recommended to use this method of re-initialization except for unittests,
   * or if you really really know what you're doing on an **airgapped** machine.
   */
  loadDevice(msg: LoadDevice): Promise<void>;

  /**
   * Close connection with device
   */
  disconnect(): Promise<void>;

}
