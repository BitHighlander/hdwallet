import * as core from "@bithighlander/hdwallet-core";
import { EventEmitter2 } from "eventemitter2";
import { mnemonicToSeed, validateMnemonic } from "bip39";
import { fromSeed } from "bip32";
import { isObject } from "lodash";
import { getNetwork } from "./networks";
import { MixinNativeBTCWallet, MixinNativeBTCWalletInfo } from "./bitcoin";
import { MixinNativeETHWalletInfo, MixinNativeETHWallet } from "./ethereum";
import { MixinNativeCosmosWalletInfo, MixinNativeCosmosWallet } from "./cosmos";
import { MixinNativeBinanceWalletInfo, MixinNativeBinanceWallet } from "./binance";
import { MixinNativeFioWalletInfo, MixinNativeFioWallet } from "./fio";
import { MixinNativeEosWalletInfo, MixinNativeEosWallet } from "./eos";
import { MixinNativeBcashWalletInfo, MixinNativeBcashWallet } from "./bcash";
import { MixinNativeCardanoWalletInfo, MixinNativeCardanoWallet } from "./cardano";
import { MixinNativeThorchainWalletInfo, MixinNativeThorchainWallet } from "./thorchain";
import { MixinNativeSecretWalletInfo, MixinNativeSecretWallet } from "./secret";
import { MixinNativeTerraWalletInfo, MixinNativeTerraWallet } from "./terra";
import { MixinNativeKavaWalletInfo, MixinNativeKavaWallet } from "./kava";
// let crypto = require("@pioneer-platform/utxo-crypto")
const BIP84 = require('bip84')
import type { NativeAdapterArgs } from "./adapter";

export enum NativeEvents {
  MNEMONIC_REQUIRED = "MNEMONIC_REQUIRED",
  READY = "READY",
}

interface LoadDevice extends core.LoadDevice {
  // Set this if your deviceId is dependent on the mnemonic
  deviceId?: string;
}

export class NativeHDWalletBase {
  readonly #events: EventEmitter2;

  constructor() {
    this.#events = new EventEmitter2();
  }

  get events() {
    return this.#events;
  }

  /**
   * Wrap a function call that needs a mnemonic seed
   * Raise an event if the wallet hasn't been initialized with a mnemonic seed
   */
  needsMnemonic<T>(hasMnemonic: boolean, callback: () => T): T | null {
    if (hasMnemonic) {
      return callback();
    }

    this.#events.emit(
      NativeEvents.MNEMONIC_REQUIRED,
      core.makeEvent({
        message_type: NativeEvents.MNEMONIC_REQUIRED,
        from_wallet: true,
      })
    );

    return null;
  }
}

class NativeHDWalletInfo
  extends MixinNativeBinanceWalletInfo(
    MixinNativeETHWalletInfo(
      MixinNativeCosmosWalletInfo(
        MixinNativeEosWalletInfo(
          MixinNativeFioWalletInfo(
            MixinNativeBcashWalletInfo(MixinNativeCardanoWalletInfo(MixinNativeThorchainWalletInfo(MixinNativeBTCWalletInfo(MixinNativeSecretWalletInfo(MixinNativeTerraWalletInfo(MixinNativeKavaWalletInfo(MixinNativeThorchainWalletInfo(NativeHDWalletBase))))))))
          )
        )
      )
    )
  )
  implements core.HDWalletInfo {
  _supportsBTCInfo: boolean = true;
  _supportsETHInfo: boolean = true;
  _supportsCosmosInfo: boolean = true;
  _supportsBinanceInfo: boolean = true;
  _supportsRippleInfo: boolean = false;
  _supportsEosInfo: boolean = false;
  _supportsFioInfo: boolean = false;
  _supportsThorchainInfo: boolean = false;
  _supportsBcashInfo: boolean = true;
  _supportsSecretInfo: boolean = true;
  _supportsSecret: boolean = true;
  _supportsKava: boolean = true;
  _supportsKavaInfo: boolean = true;
  _supportsTerra: boolean = true;
  _supportsTerraInfo: boolean = true;
  _supportsCardano: boolean = false;
  _supportsCardanoInfo: boolean = false;

  getVendor(): string {
    return "Native";
  }

  hasOnDevicePinEntry(): boolean {
    return false;
  }

  hasOnDevicePassphrase(): boolean {
    return false;
  }

  hasOnDeviceDisplay(): boolean {
    return false;
  }

  hasOnDeviceRecovery(): boolean {
    return false;
  }

  hasNativeShapeShift(): boolean {
    return false;
  }

  describePath(msg: core.DescribePath): core.PathDescription {
    switch (msg.coin.toLowerCase()) {
      case "bitcoin":
      case "bitcoincash":
      case "dash":
      case "digibyte":
      case "dogecoin":
      case "litecoin":
      case "testnet":
        const unknown = core.unknownUTXOPath(msg.path, msg.coin, msg.scriptType);

        if (!super.btcSupportsCoin(msg.coin)) return unknown;
        if (!super.btcSupportsScriptType(msg.coin, msg.scriptType)) return unknown;

        return core.describeUTXOPath(msg.path, msg.coin, msg.scriptType);
      case "ethereum":
        return core.describeETHPath(msg.path);
      case "atom":
        return core.cosmosDescribePath(msg.path);
      case "rune":
      case "trune":
      case "thorchain":
        return core.thorchainDescribePath(msg.path);
      case "secret":
      case "scrt":
      case "tscrt":
        return core.secretDescribePath(msg.path);
      case "luna":
      case "terra":
      case "tluna":
        return core.terraDescribePath(msg.path);
      case "kava":
      case "tkava":
        return core.kavaDescribePath(msg.path);
      case "binance":
        return core.binanceDescribePath(msg.path);
      case "fio":
        return core.fioDescribePath(msg.path);
      default:
        throw new Error("Unsupported path");
    }
  }
}

export class NativeHDWallet
  extends MixinNativeBTCWallet(
    MixinNativeFioWallet(MixinNativeETHWallet(MixinNativeCosmosWallet(MixinNativeBinanceWallet(MixinNativeThorchainWallet(MixinNativeSecretWallet(MixinNativeTerraWallet(MixinNativeKavaWallet(NativeHDWalletInfo))))))))
  )
  implements core.HDWallet, core.BTCWallet, core.ETHWallet, core.CosmosWallet, core.FioWallet, core.ThorchainWallet, core.SecretWallet, core.TerraWallet, core.KavaWallet {
  _supportsBTC = true;
  _supportsETH = true;
  _supportsCosmos = true;
  _supportsBinance = true;
  _supportsRipple = false;
  _supportsEos = false;
  _supportsFio = true;
  _supportsThorchain = true;
  _supportsSecret = false;
  _supportsTerra = false;
  _supportsKava = false;
  _supportsDebugLink = false;
  _isNative = true;

  #isTestnet: boolean;
  #deviceId: string;
  #initialized: boolean;
  #mnemonic: string;

  constructor({ mnemonic, deviceId }: NativeAdapterArgs) {
    super();
    this.#mnemonic = mnemonic;
    this.#deviceId = deviceId;
  }

  async getFeatures(): Promise<Record<string, any>> {
    return {};
  }

  async getDeviceID(): Promise<string> {
    return this.#deviceId;
  }

  async getFirmwareVersion(): Promise<string> {
    return "Software";
  }

  async getModel(): Promise<string> {
    return "Native";
  }

  async getLabel(): Promise<string> {
    return "Native";
  }

  async getAddress(msg: core.GetAddress): Promise<string> {
    switch (msg.coin.toLowerCase()) {
      case "bitcoin":
      case "bitcoincash":
      case "dash":
      case "digibyte":
      case "dogecoin":
      case "litecoin":
      case "testnet":
        let inputClone: core.BTCAccountPath = {
          addressNList: msg.path,
          coin: msg.coin,
          scriptType: msg.scriptType,
        };
        return super.btcGetAddress(inputClone);
      case "ethereum":
        let inputETH: core.BTCAccountPath = {
          addressNList: msg.path,
          coin: msg.coin,
          scriptType: msg.scriptType,
        };
        return super.ethGetAddress(inputETH);
      case "fio":
        let inputFIO: core.FioAccountPath = {
          addressNList: msg.path,
        };
        return super.fioGetAddress(inputFIO);
      // case "eos":
      //   let inputEOS: core.EosAccountPath = {
      //     addressNList: msg.path,
      //   };
      //   return super.eosGetAddress(inputEOS);
      case "cosmos":
        let inputATOM: core.CosmosGetAddress = {
          addressNList: msg.path,
        };
        return super.cosmosGetAddress(inputATOM);
      case "thorchain":
        let inputRUNE: core.ThorchainGetAddress = {
          addressNList: msg.path,
        };
        return super.thorchainGetAddress(inputRUNE);
      case "binance":
        let inputBNB: core.BinanceAccountPath = {
          addressNList: msg.path,
        };
        return super.binanceGetAddress(inputBNB);
      default:
        throw new Error("Unsupported path " + msg.coin);
    }
  }

  /*
   * @see: https://github.com/satoshilabs/slips/blob/master/slip-0132.md
   * to supports different styles of xpubs as can be defined by passing in a network to `fromSeed`
   */
  getPublicKeys(msg: Array<core.GetPublicKey>): Promise<core.PublicKey[]> {
    return this.needsMnemonic(!!this.#mnemonic, () =>
      Promise.all(
        msg.map(async (getPublicKey) => {
          let { addressNList, addressNListMaster } = getPublicKey;
          const seed = await mnemonicToSeed(this.#mnemonic);

          const network = getNetwork("bitcoin", getPublicKey.scriptType);
          const node = fromSeed(seed, network);
          const xpub = node.derivePath(core.addressNListToBIP32(addressNList)).neutered().toBase58();

          let addressInfo: core.GetAddress = {
            path: addressNListMaster,
            coin: getPublicKey.coin.toLowerCase(),
            scriptType: getPublicKey.script_type,
          };

          let pubkey: any = {
            coin: getPublicKey.network,
            network: getPublicKey.network,
            script_type: getPublicKey.script_type,
            path: core.addressNListToBIP32(addressNList),
            pathMaster: core.addressNListToBIP32(addressNListMaster),
            long: getPublicKey.coin,
            address: await this.getAddress(addressInfo),
            master: await this.getAddress(addressInfo),
            type: getPublicKey.type,
          };
          //TODO
          if(this.#isTestnet){
            //pubkey.tpub = await crypto.xpubConvert(xpub,'tpub')
          }else{
            pubkey.xpub = xpub
          }

          if (getPublicKey.type == "address") {
            pubkey.pubkey = pubkey.address;
          } else if(getPublicKey.type == '') {
            pubkey.pubkey = pubkey.xpub || pubkey.tpub;
          }

          switch(getPublicKey.type) {
            case "address":
              pubkey.pubkey = pubkey.address;
              break;
            case 'xpub':
              pubkey.pubkey = pubkey.xpub
              break;
            case 'tpub':
              pubkey.pubkey = pubkey.tpub
              break;
            case 'zpub':
              let root = new BIP84.fromSeed(this.#mnemonic)
              let child0 = root.deriveAccount(0)
              let account0 = new BIP84.fromZPrv(child0)
              let zpub = account0.getAccountPublicKey()
              pubkey.address = account0.getAddress(0)
              pubkey.master = account0.getAddress(0)
              pubkey.zpub = zpub
              pubkey.pubkey = pubkey.zpub
              break;
            default:
              throw Error("Unhandled pubkey type! :"+getPublicKey.type)
          }


          return pubkey;
        })
      )
    );
  }

  async isInitialized(): Promise<boolean> {
    return this.#initialized;
  }

  async isLocked(): Promise<boolean> {
    return false;
  }

  async clearSession(): Promise<void> {}

  async initialize(): Promise<boolean> {
    return this.needsMnemonic(!!this.#mnemonic, async () => {
      try {
        const seed = await mnemonicToSeed(this.#mnemonic);

        await Promise.all([
          super.btcInitializeWallet(seed,this.#isTestnet),
          // super.bcashInitializeWallet(seed),
          super.ethInitializeWallet(seed),
          super.cosmosInitializeWallet(seed),
          super.binanceInitializeWallet(seed),
          super.fioInitializeWallet(seed),
          super.thorchainInitializeWallet(seed),
          super.secretInitializeWallet(seed),
          super.secretSetMnemonic(this.#mnemonic),
          super.terraInitializeWallet(seed),
          super.terraSetMnemonic(this.#mnemonic),
          super.kavaInitializeWallet(seed),
          super.kavaSetMnemonic(this.#mnemonic),
        ]);

        this.#initialized = true;
      } catch (e) {
        console.error("NativeHDWallet:initialize:error", e);
        this.#initialized = false;
      }

      return this.#initialized;
    });
  }

  async ping(msg: core.Ping): Promise<core.Pong> {
    return { msg: msg.msg };
  }

  async sendPin(): Promise<void> {}

  async sendPassphrase(): Promise<void> {}

  async sendCharacter(): Promise<void> {}

  async sendWord(): Promise<void> {}

  async cancel(): Promise<void> {}

  async wipe(): Promise<void> {
    this.#mnemonic = null;

    super.btcWipe();
    super.ethWipe();
    super.cosmosWipe();
    super.binanceWipe();
    super.thorchainWipe();
    super.secretWipe();
    super.terraWipe();
    super.kavaWipe();
  }

  async reset(): Promise<void> {}

  async recover(): Promise<void> {}

  async loadDevice(msg: LoadDevice): Promise<void> {
    if (typeof msg?.mnemonic !== "string" || !validateMnemonic(msg.mnemonic))
      throw new Error("Required property [mnemonic] is missing or invalid");

    if(msg.isTestnet) this.#isTestnet = true

    this.#mnemonic = msg.mnemonic;
    if (typeof msg.deviceId === "string") this.#deviceId = msg.deviceId;

    this.#initialized = false;
    await this.initialize();

    // Once we've been seeded with a mnemonic we re-emit the connected event
    this.events.emit(
      NativeEvents.READY,
      core.makeEvent({
        message_type: NativeEvents.READY,
        from_wallet: true,
      })
    );
  }

  async disconnect(): Promise<void> {}
}

export function isNative(wallet: core.HDWallet): wallet is NativeHDWallet {
  return isObject(wallet) && (wallet as any)._isNative;
}

export function info() {
  return new NativeHDWalletInfo();
}

export function create(args: NativeAdapterArgs): NativeHDWallet {
  return new NativeHDWallet(args);
}

// This prevents any malicious code from overwriting the prototype
// to potentially steal the mnemonic when calling "loadDevice"
Object.freeze(Object.getPrototypeOf(NativeHDWallet));
