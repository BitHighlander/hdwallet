import Web3 from "web3";
import {
  HDWallet,
  GetPublicKey,
  PublicKey,
  RecoverDevice,
  ResetDevice,
  Coin,
  Ping,
  Pong,
  LoadDevice,
  BinanceSignTx,
  BinanceSignedTx,
  CosmosSignTx,
  CosmosSignedTx,
  EosToSignTx,
  EosSignedTx,
  ETHWallet,
  ETHGetAddress,
  ETHSignTx,
  ETHGetAccountPath,
  ETHAccountPath,
  ETHSignMessage,
  ETHSignedMessage,
  ETHVerifyMessage,
  ETHSignedTx,
  DescribePath,
  PathDescription,
  addressNListToBIP32,
  Transport,
  Keyring,
  HDWalletInfo,
  ETHWalletInfo,
  BTCWallet,
  BTCGetAddress,
  BTCSignTx,
  BTCSignedTx,
  BTCSignMessage,
  BTCSignedMessage,
  BTCVerifyMessage,
  BTCInputScriptType,
  BTCGetAccountPaths,
  BTCAccountPath,
  BTCWalletInfo,
  slip44ByCoin
} from "@bithighlander/hdwallet-core";

import * as eth from "./ethereum";
import * as bnb from "./bnb";
import * as btc from "./bitcoin";
import * as cosmos from "./cosmos";
import * as eos from "./eos";

import { isObject } from "lodash";

import {
  generateWalletFromSeed,
  generatePubkey,
  generateAddress,
} from "./crypto";

/**
 * @globals
 */

const supportedCoins = [
  "Bitcoin",
  "Testnet",
  "BitcoinCash",
  "BitcoinGold",
  "Litecoin",
  "EOS",
  "Dash",
  "DigiByte",
  "Dogecoin",
];

const segwitCoins = ["Bitcoin", "Testnet", "BitcoinGold", "Litecoin"];

const COIN_MAP = {
  Bitcoin: "BTC",
  Cosmos: "ATOM",
  Testnet: "BTCT",
  BitcoinCash: "BCH",
  Litecoin: "LTC",
  Dash: "DASH",
  DigiByte: "DGB",
  Dogecoin: "DOGE",
  Ethereum: "ETH",
  Cardano: "ADA",
  Binance: "BNB",
  Eos: "EOS",
  EOS: "EOS",
};


// const COIN_MAP = {
//   BTC: "Bitcoin",
//   BTCT: "Testnet",
//   ETH: "Ethereum",
//   BCH: "BitcoinCash",
//   LTC: "Litecoin",
//   DASH: "Dash",
//   DGB: "DigiByte",
//   DOGE: "Dogecoin",
//   ATOM: "Cosmos",
//   BNB: "Binance",
//   EOS: "Eos",
//   XRP: "Ripple",
//   ADA: "Cardano",
// };


/**
  @Types

  TODO? move these somewhere else?

 */

interface CoinInfo {
  coin: string;
  master: string;
  network: string;
  publicKey: string;
  xpub: string;
  zpub?: string;
}

interface CoinInfoPriv {
    coin: string;
    masterPrivkey: string;
    xpriv?: string;
    type?:string
}

interface Wallet {
    walletPrivate:{
        coins: {
            [index: string]: CoinInfoPriv;
        }
    },
    walletPublic:{
        coins: {
            [index: string]: CoinInfo;
        }
    }
}

// We might not need this. Leaving it for now to debug further
class PioneerTransport extends Transport {
  public getDeviceID() {
    return "pioneer:0";
  }

  public call(...args: any[]): Promise<any> {
    return Promise.resolve();
  }
}

export function isPioneer(wallet: HDWallet) {
  return isObject(wallet) && (wallet as any)._isPioneer;
}

export class PioneerHDWallet implements HDWallet, ETHWallet, BTCWallet {
  _supportsETH: boolean = true;
  _supportsETHInfo: boolean = true;
  _supportsBTCInfo: boolean = true;
  _supportsBTC: boolean = true;
  _supportsCosmosInfo: boolean = true;
  _supportsCosmos: boolean = true;
  _supportsBinanceInfo: boolean = true;
  _supportsBinance: boolean = true;
  _supportsRippleInfo: boolean = false;
  _supportsRipple: boolean = true;
  _supportsEosInfo: boolean = false;
  _supportsEos: boolean = true;
  _supportsDebugLink: boolean = false;
  _isPioneer: boolean = true;

  //CORE pioneer info
  _WALLET_SEED: string = "";
  _WALLET_PUBLIC: any = {};
  _WALLET_PRIVATE: any = {};

  transport = new PioneerTransport(new Keyring());

  pioneer: any;
  web3: any;
  info: PioneerHDWalletInfo & HDWalletInfo;
  ethAddress: string;

  // used as a mutex to ensure calls to pioneer.getExtendedPublicKey cannot happen before a previous call has resolved
  pioneerCallInProgress: Promise<any> = Promise.resolve();

  constructor(pioneer) {
    this.pioneer = pioneer;
    //this.web3 = new Web3()
    this.info = new PioneerHDWalletInfo();
  }

  public async isLocked(): Promise<boolean> {
    return false;
  }

  public getVendor(): string {
    return "Pioneer";
  }

  public getModel(): Promise<string> {
    return Promise.resolve("pioneer");
  }

  public getLabel(): Promise<string> {
    return Promise.resolve("Pioneer");
  }

  public initialize(): Promise<any> {
    // no means to reset the state of the Pioneer widget
    // while it's in the middle of execution
    return Promise.resolve();
  }

  public hasOnDevicePinEntry(): boolean {
    return this.info.hasOnDevicePinEntry();
  }

  public hasOnDevicePassphrase(): boolean {
    return this.info.hasOnDevicePassphrase();
  }

  public hasOnDeviceDisplay(): boolean {
    return this.info.hasOnDeviceDisplay();
  }

  public hasOnDeviceRecovery(): boolean {
    return this.info.hasOnDeviceRecovery();
  }

  public hasNativeShapeShift(srcCoin: Coin, dstCoin: Coin): boolean {
    return this.info.hasNativeShapeShift(srcCoin, dstCoin);
  }

  public ping(msg: Ping): Promise<Pong> {
    // no ping function for Pioneer, so just returning Pong
    return Promise.resolve({ msg: msg.msg });
  }

  public sendPin(pin: string): Promise<void> {
    // no concept of pin in Pioneer
    return Promise.resolve();
  }

  public sendPassphrase(passphrase: string): Promise<void> {
    // cannot send passphrase to Pioneer. Could show the widget?
    return Promise.resolve();
  }

  public sendCharacter(charater: string): Promise<void> {
    // no concept of sendCharacter in Pioneer
    return Promise.resolve();
  }

  public sendWord(word: string): Promise<void> {
    // no concept of sendWord in Pioneer
    return Promise.resolve();
  }

  public cancel(): Promise<void> {
    // no concept of cancel in Pioneer
    return Promise.resolve();
  }

  public wipe(): Promise<void> {
    return Promise.resolve();
  }

  public reset(msg: ResetDevice): Promise<void> {
    return Promise.resolve();
  }

  public recover(msg: RecoverDevice): Promise<void> {
    // no concept of recover in Pioneer
    return Promise.resolve();
  }

  public async loadDevice(msg: LoadDevice): Promise<void> {
    this._WALLET_SEED = msg.mnemonic;
    let {walletPublic , walletPrivate} = await generateWalletFromSeed(msg.mnemonic)

    this._WALLET_PUBLIC = walletPublic
    this._WALLET_PRIVATE = walletPrivate

    return Promise.resolve();
  }

  public async loadDeviceFromWallet(msg: any): Promise<void> {
    this._WALLET_SEED = 'citadel'

    this._WALLET_PUBLIC = msg.walletPublic
    this._WALLET_PRIVATE = msg.walletPrivate

    return Promise.resolve();
  }

  public describePath(msg: DescribePath): PathDescription {
    return this.info.describePath(msg);
  }

  public async getPrivateKeys(
      msg: Array<any>
  ): Promise<Array<any | null>> {
    //console.log("msg: ", msg);
    const privateKeys = [];
    //console.log({ pubWallet: this._WALLET_PRIVATE });
    for (let i = 0; i < msg.length; i++) {
      const { coin, symbol } = msg[i];

      let coinInfo:CoinInfoPriv = this._WALLET_PRIVATE[symbol]
      privateKeys.push(coinInfo);
    }

    return privateKeys;
  }

  public async getPublicKeys(
    msg: Array<any>
  ): Promise<Array<any | null>> {
    //console.log("msg: ", msg);
    const publicKeys = [];
    //console.log({ pubWallet: this._WALLET_PUBLIC });
    for (let i = 0; i < msg.length; i++) {
      const { coin, symbol } = msg[i];
      //console.log("coin: ", coin);
      //console.log("coin: ", COIN_MAP[coin]);
      let coinInfo:CoinInfo = this._WALLET_PUBLIC[symbol]
      publicKeys.push(coinInfo);
    }

    return publicKeys;
  }

  public async isInitialized(): Promise<boolean> {
    return true;
  }

  public disconnect(): Promise<void> {
    return Promise.resolve();
  }

  public async btcGetAddress(msg: BTCGetAddress): Promise<string> {
    //console.log("*** msg", msg);
    let coinSymbol = COIN_MAP[msg.coin];
    let pathStr = addressNListToBIP32(msg.addressNList);
    //console.log("*** pathStr", pathStr);
    let pubKey = await generatePubkey(
      coinSymbol,
      this._WALLET_PUBLIC[coinSymbol].pubkey,
      pathStr
    );
    //console.log("*** pubKey: ", pubKey);
    //address
    let address = await generateAddress(coinSymbol, pubKey, null);

    return address;
  }

  public async cosmosGetAddress(msg: BTCGetAddress): Promise<string> {
    let coinSymbol = COIN_MAP[msg.coin];
    let pathStr = addressNListToBIP32(msg.addressNList);
    let pubKey = await generatePubkey(
      coinSymbol,
      this._WALLET_PUBLIC[coinSymbol].xpub,
      pathStr
    );

    //address
    let address = await generateAddress(coinSymbol, pubKey, null);

    return address;
  }

  public async btcSignTx(msg: BTCSignTx): Promise<BTCSignedTx> {
    return btc.btcSignTx(msg, this.pioneer);
  }

  public async btcSignMessage(msg: BTCSignMessage): Promise<BTCSignedMessage> {
    // pioneer doesnt support this for btc
    return undefined;
  }

  public async btcVerifyMessage(msg: BTCVerifyMessage): Promise<boolean> {
    return btc.btcVerifyMessage(msg);
  }

  public async btcSupportsCoin(coin: Coin): Promise<boolean> {
    return this.info.btcSupportsCoin(coin);
  }

  public async btcSupportsScriptType(
    coin: Coin,
    scriptType: BTCInputScriptType
  ): Promise<boolean> {
    return this.info.btcSupportsScriptType(coin, scriptType);
  }

  public async btcSupportsSecureTransfer(): Promise<boolean> {
    return this.info.btcSupportsSecureTransfer();
  }

  public btcSupportsNativeShapeShift(): boolean {
    return this.info.btcSupportsNativeShapeShift();
  }

  public btcGetAccountPaths(msg: BTCGetAccountPaths): Array<BTCAccountPath> {
    return this.info.btcGetAccountPaths(msg);
  }

  public btcIsSameAccount(msg: Array<BTCAccountPath>): boolean {
    return this.info.btcIsSameAccount(msg);
  }

  public btcNextAccountPath(msg: BTCAccountPath): BTCAccountPath | undefined {
    return this.info.btcNextAccountPath(msg);
  }
  public async bnbSignTx(msg: BinanceSignTx): Promise<BinanceSignedTx> {
    return bnb.bnbSignTx(msg, this._WALLET_SEED,this._WALLET_PRIVATE['ATOM'].xpriv, "");
  }

  /**
   *  ATOM tx's
   */

  public async cosmosSignTx(msg: CosmosSignTx): Promise<CosmosSignedTx> {
    return cosmos.cosmosSignTx(msg, this._WALLET_SEED, this._WALLET_PRIVATE['ATOM'].xpriv, "");
  }

  /**
   *  EOS tx's
   */

  public async eosSignTx(msg: EosToSignTx): Promise<any> {
    return eos.eosSignTx(msg, this._WALLET_SEED, this._WALLET_PRIVATE['EOS'].xpriv, "");
  }

  /**
   *  ETH params
   * @param chainId
   */
  public async ethSupportsNetwork(chainId: number = 1): Promise<boolean> {
    return this.info.ethSupportsNetwork(chainId);
  }

  public async ethSupportsSecureTransfer(): Promise<boolean> {
    return this.info.ethSupportsSecureTransfer();
  }

  public ethSupportsNativeShapeShift(): boolean {
    return this.info.ethSupportsNativeShapeShift();
  }

  public async ethVerifyMessage(msg: ETHVerifyMessage): Promise<boolean> {
    return eth.ethVerifyMessage(msg, "nerf");
  }

  public ethNextAccountPath(msg: ETHAccountPath): ETHAccountPath | undefined {
    // Pioneer only supports one account for eth
    return this.info.ethNextAccountPath(msg);
  }

  public async ethSignTx(msg: ETHSignTx): Promise<ETHSignedTx> {
    return eth.ethSignTx(msg, this._WALLET_SEED, this._WALLET_PRIVATE['ETH'].xpriv, await this._ethGetAddress());
  }

  public async ethSignMessage(msg: ETHSignMessage): Promise<ETHSignedMessage> {
    return eth.ethSignMessage(msg, {}, await this._ethGetAddress());
  }

  public ethGetAccountPaths(msg: ETHGetAccountPath): Array<ETHAccountPath> {
    return this.info.ethGetAccountPaths(msg);
  }

  public async ethGetAddress(msg: ETHGetAddress): Promise<string> {
    let pathStr = addressNListToBIP32(msg.addressNList);
    let pubKey = await generatePubkey(
      "ETH",
      this._WALLET_PUBLIC["ETH"].xpub,
      pathStr
    );
    //address
    let address = await generateAddress("ETH", pubKey, null);
    return address;
  }

  public async getDeviceID(): Promise<string> {
    return "pioneer:" + (await this._ethGetAddress());
  }

  public async getFirmwareVersion(): Promise<string> {
    return "pioneer";
  }

  public async _ethGetAddress(): Promise<string> {
    if (!this.ethAddress) {
      //this.ethAddress =
    }
    return this.ethAddress;
  }

  clearSession(): Promise<void> {
    return undefined;
  }
}

export class PioneerHDWalletInfo
  implements HDWalletInfo, ETHWalletInfo, BTCWalletInfo {
  _supportsBTCInfo: boolean = true;
  _supportsETHInfo: boolean = true;
  _supportsCosmosInfo: boolean = false;
  _supportsBinanceInfo: boolean = true;
  _supportsRippleInfo: boolean = false;
  _supportsEosInfo: boolean = false;

  public getVendor(): string {
    return "pioneer";
  }

  public hasOnDevicePinEntry(): boolean {
    return false;
  }

  public hasOnDevicePassphrase(): boolean {
    return false;
  }

  public hasOnDeviceDisplay(): boolean {
    return false;
  }

  public hasOnDeviceRecovery(): boolean {
    return false;
  }

  public hasNativeShapeShift(srcCoin: Coin, dstCoin: Coin): boolean {
    // It doesn't... yet?
    return false;
  }

  public describePath(msg: DescribePath): PathDescription {
    switch (msg.coin) {
      case "Ethereum":
        return eth.describeETHPath(msg.path);
      case "Bitcoin":
        return btc.describeUTXOPath(msg.path, msg.coin, msg.scriptType);
      default:
        throw new Error("Unsupported path");
    }
  }

  public async btcSupportsCoin(coin: Coin): Promise<boolean> {
    return btc.btcSupportsCoin(coin);
  }

  public async btcSupportsScriptType(
    coin: Coin,
    scriptType: BTCInputScriptType
  ): Promise<boolean> {
    return btc.btcSupportsScriptType(coin, scriptType);
  }

  public async btcSupportsSecureTransfer(): Promise<boolean> {
    return Promise.resolve(false);
  }

  public btcSupportsNativeShapeShift(): boolean {
    return false;
  }

  public btcGetAccountPaths(msg: BTCGetAccountPaths): Array<BTCAccountPath> {
    return btc.btcGetAccountPaths(msg);
  }

  public btcIsSameAccount(msg: Array<BTCAccountPath>): boolean {
    return false;
  }

  public btcNextAccountPath(msg: BTCAccountPath): BTCAccountPath | undefined {
    return btc.btcNextAccountPath(msg);
  }

  public ethNextAccountPath(msg: ETHAccountPath): ETHAccountPath | undefined {
    // Pioneer only supports one account for eth
    return undefined;
  }

  public async ethSupportsNetwork(chainId: number = 1): Promise<boolean> {
    return chainId === 1;
  }

  public async ethSupportsSecureTransfer(): Promise<boolean> {
    return false;
  }

  public ethSupportsNativeShapeShift(): boolean {
    return false;
  }

  public ethGetAccountPaths(msg: ETHGetAccountPath): Array<ETHAccountPath> {
    return eth.ethGetAccountPaths(msg);
  }
}

export function info() {
  return new PioneerHDWalletInfo();
}

export type Pioneer = any;

export function create(pioneer: Pioneer): PioneerHDWallet {
  return new PioneerHDWallet(pioneer);
}
