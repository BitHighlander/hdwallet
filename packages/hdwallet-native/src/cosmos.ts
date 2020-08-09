import * as core from "@bithighlander/hdwallet-core";

import { addressNListToBIP32, CosmosSignTx, CosmosSignedTx } from "@bithighlander/hdwallet-core";

let txBuilder = require("cosmos-tx-builder");
import * as bitcoin from "bitcoinjs-lib";
import { getNetwork } from "./networks";
const bip39 = require(`bip39`);
const ripemd160 = require("crypto-js/ripemd160");
const CryptoJS = require("crypto-js");
const sha256 = require("crypto-js/sha256");
const bech32 = require(`bech32`);

function bech32ify(address, prefix) {
  const words = bech32.toWords(address);
  return bech32.encode(prefix, words);
}

function createCosmosAddress(publicKey) {
  const message = CryptoJS.enc.Hex.parse(publicKey.toString(`hex`));
  const hash = ripemd160(sha256(message)).toString();
  const address = Buffer.from(hash, `hex`);
  const cosmosAddress = bech32ify(address, `cosmos`);
  return cosmosAddress;
}

export function MixinNativeCosmosWalletInfo<TBase extends core.Constructor>(Base: TBase) {
  return class MixinNativeCosmosWalletInfo extends Base implements core.CosmosWalletInfo {
    _supportsCosmosInfo = true;

    async cosmosSupportsNetwork(): Promise<boolean> {
      return true;
    }

    async cosmosSupportsSecureTransfer(): Promise<boolean> {
      return false;
    }

    cosmosSupportsNativeShapeShift(): boolean {
      return false;
    }

    cosmosGetAccountPaths(msg: core.CosmosGetAccountPaths): Array<core.CosmosAccountPath> {
      return [
        {
          addressNList: [0x80000000 + 44, 0x80000000 + 117, 0x80000000 + msg.accountIdx, 0, 0],
          // hardenedPath: [0x80000000 + 44, 0x80000000 + core.slip44ByCoin(msg.coin), 0x80000000 + msg.accountIdx],
          // relPath: [0, 0],
          // description: "Native",
        },
      ];
    }

    cosmosNextAccountPath(msg: core.CosmosAccountPath): core.CosmosAccountPath {
      // Only support one account for now (like portis).
      return undefined;
    }
  };
}

export function MixinNativeCosmosWallet<TBase extends core.Constructor>(Base: TBase) {
  return class MixinNativeCosmosWallet extends Base {
    _supportsCosmos = true;
    #seed = "";

    cosmosInitializeWallet(seed: string): void {
      //get
      this.#seed = seed;
    }

    // getKeyPair(seed:Buffer,coin: core.Coin, addressNList: core.BIP32Path): bitcoin.ECPairInterface {
    //   const network = getNetwork('bitcoin');
    //   const wallet = bitcoin.bip32.fromSeed(seed, network);
    //   const path = core.addressNListToBIP32(addressNList);
    //   return bitcoin.ECPair.fromWIF(wallet.derivePath(path).toWIF(), network);
    // }

    async cosmosGetAddress(msg: core.CosmosGetAddress): Promise<string> {
      const seed = await bip39.mnemonicToSeed(this.#seed);

      const network = getNetwork("bitcoin");
      const wallet = bitcoin.bip32.fromSeed(seed, network);
      const path = core.addressNListToBIP32(msg.addressNList);

      let keypair = await bitcoin.ECPair.fromWIF(wallet.derivePath(path).toWIF(), network);
      let address = createCosmosAddress(keypair.publicKey.toString("hex"));

      return address;
    }

    async cosmosSignTx(msg: CosmosSignTx, mnemonic: string, xpriv: string, from: string): Promise<CosmosSignedTx> {
      const seed = await bip39.mnemonicToSeed(this.#seed);
      let ATOM_CHAIN = "cosmoshub-3";

      const network = getNetwork("bitcoin");
      const hdkey = bitcoin.bip32.fromSeed(seed, network);
      const path = core.addressNListToBIP32(msg.addressNList);

      let keypair = await bitcoin.ECPair.fromWIF(hdkey.derivePath(path).toWIF(), network);
      // expects bip32

      let privateKey = keypair.privateKey.toString("hex");
      let publicKey = keypair.publicKey.toString("hex");

      let wallet = {
        privateKey,
        publicKey,
      };

      let result = await txBuilder.sign(msg.tx, wallet, msg.sequence, msg.account_number, ATOM_CHAIN);

      // build final tx
      const signedTx = txBuilder.createSignedTx(msg.tx, result);

      return signedTx;
    }
  };
}
