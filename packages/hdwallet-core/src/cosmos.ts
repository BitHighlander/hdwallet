import { ExchangeType, BIP32Path, Coin } from './wallet'


export enum BTCInputScriptType {
  CashAddr, // for Bitcoin Cash
  SpendAddress,
  SpendMultisig,
  External,
  SpendWitness,
  SpendP2SHWitness,
}

export interface ATOMGetAccountPath {
  coin: string,
  accountIdx: number
}

/**
 * Concat accountPath with relPath for the absolute path to the Cosmos address.
 */
export interface ATOMAccountPath {
  hardenedPath: BIP32Path,
  relPath: BIP32Path,
  description: string,
}

export interface ATOMAccountSuffix {
  addressNList: BIP32Path
}

export interface ATOMGetAddress {
  addressNList: BIP32Path,
  showDisplay?: boolean,
  /** Optional. Required for showDisplay == true. */
  address?: string,
}

export interface ATOMSignTx {
  addressNList: BIP32Path,
  coin?: Coin,
  scriptType?: BTCInputScriptType,
  message: string
}

export interface ATOMSignedTx {

  /** hex string representation of the raw, signed transaction */
  serialized: string
}

export interface ATOMSignMessage {
  addressNList: BIP32Path,
  message: string
}

export interface ATOMSignedMessage {
  address: string,
  signature: string
}

export interface ATOMVerifyMessage {
  address: string,
  message: string,
  signature: string
}

export abstract class ATOMWallet {
  _supportsATOM: boolean = true

  //public abstract async atomSupportsNetwork (chain_id: number): Promise<boolean>
  public abstract async atomGetAddress (msg: ATOMGetAddress): Promise<string>
  public abstract async atomSignTx (msg: ATOMSignTx): Promise<ATOMSignedTx>
  //public abstract async atomSignMessage (msg: ATOMSignMessage): Promise<ATOMSignedMessage>
  //public abstract async atomVerifyMessage (msg: ATOMVerifyMessage): Promise<boolean>

  /**
   * Does the device support internal transfers without the user needing to
   * confirm the destination address?
   */
  public abstract async atomSupportsSecureTransfer (): Promise<boolean>

  /**
   * Does the device support `/sendamountProto2` style ShapeShift trades?
   */
  public abstract async atomSupportsNativeShapeShift (): Promise<boolean>

  /**
   * Returns a list of bip32 paths for a given account index in preferred order
   * from most to least preferred.
   *
   * Note that this is the location of the ATOM address in the tree, not the
   * location of its corresponding xpub.
   */
  public abstract atomGetAccountPaths (msg: ATOMGetAccountPath): Array<ATOMAccountPath>
}
