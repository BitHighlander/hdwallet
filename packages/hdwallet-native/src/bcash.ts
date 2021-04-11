import * as core from "@bithighlander/hdwallet-core";
import { NativeHDWalletBase } from "./native";
import { toCashAddress, toLegacyAddress } from "bchaddrjs";

// fork of bitcoinjs-lib that supports bitcoin cash
// that would be worth looking into (see: https://github.com/junderw/bitcoinjs-lib/tree/cashv5).


import { ECPairInterface } from "@bithighlander/bitcoin-cash-js-lib";
import { getNetwork } from "./networks";
import * as bitcoin from "@bithighlander/bitcoin-cash-js-lib";

type BTCScriptType = core.BTCInputScriptType | core.BTCOutputScriptType;

type NonWitnessUtxo = Buffer;

type WitnessUtxo = {
  script: Buffer;
  amount: Number;
};


type UtxoData = NonWitnessUtxo | WitnessUtxo;

type ScriptData = {
  redeemScript?: Buffer;
  witnessScript?: Buffer;
};

type InputData = UtxoData | ScriptData;

const supportedCoins = ["bitcoinCash", "bcash"];

function getKeyPair(
  seed: Buffer,
  addressNList: number[],
  coin = "bitcoin",
  scriptType?: BTCScriptType
): ECPairInterface {
  const network = getNetwork(coin, scriptType);
  const wallet = bitcoin.bip32.fromSeed(seed, network);
  const path = core.addressNListToBIP32(addressNList);
  return bitcoin.ECPair.fromWIF(wallet.derivePath(path).toWIF(), getNetwork(coin, scriptType));
}

export function MixinNativeBcashWalletInfo<TBase extends core.Constructor>(Base: TBase) {
  return class MixinNativeBcashWalletInfo extends Base implements core.BcashWalletInfo {
    async bcashSupportsCoin(coin: string): Promise<boolean> {
      return supportedCoins.includes(String(coin).toLowerCase());
    }
    async bcashSupportsScriptType(coin: string, scriptType: core.BcashInputScriptType): Promise<boolean> {
      if (!(await this.bcashSupportsCoin(coin))) return false;

      switch (scriptType) {
        case core.BcashInputScriptType.CashAddr:
        case core.BcashInputScriptType.SpendMultisig:
        case core.BcashInputScriptType.SpendAddress:
          return true;
        default:
          return false;
      }
    }
    bcashIsSameAccount(msg: core.BcashAccountPath[]): boolean {
      // TODO: support at some point
      return false;
    }
    _supportsBcashInfo = true;

    async bcashSupportsNetwork(): Promise<boolean> {
      return true;
    }

    async bcashSupportsSecureTransfer(): Promise<boolean> {
      return false;
    }

    bcashSupportsNativeShapeShift(): boolean {
      return false;
    }

    bcashGetAccountPaths(msg: core.BcashGetAccountPaths): Array<core.BcashAccountPath> {
      return [
        {
          addressNList: [0x80000000 + 44, 0x80000000 + 235, 0x80000000 + msg.accountIdx, 0, 0],
        },
      ];
    }

    bcashNextAccountPath(msg: core.BcashAccountPath): core.BcashAccountPath {
      // Only support one account for now (like portis).
      // the bcashers library supports paths so it shouldnt be too hard if we decide multiple accounts are needed
      return undefined;
    }
  };
}

export function MixinNativeBcashWallet<TBase extends core.Constructor<NativeHDWalletBase>>(Base: TBase) {
  return class MixinNativeBcashWallet extends Base {
    _supportsBcash = true;
    #wallet = Buffer;

    bcashInitializeWallet(seed: Buffer): void {
      // @ts-ignore
      this.#wallet = seed;
    }

    bcashWipe(): void {
      this.#wallet = undefined;
    }

    buildInput(coin: core.Coin, input: core.BTCSignTxInput): InputData {
      return this.needsMnemonic(!!this.#wallet, () => {
        const { addressNList, amount, hex, scriptType, tx, vout } = input;
        // @ts-ignore
        const keyPair = getKeyPair(this.#wallet, addressNList, coin, scriptType);

        const isSegwit = false
        const nonWitnessUtxo = hex && Buffer.from(hex, "hex");
        const witnessUtxo = tx && {
          script: Buffer.from(tx.vout[vout].scriptPubKey.hex, "hex"),
          value: Number(amount),
        };
        const utxoData = isSegwit && witnessUtxo ? { witnessUtxo } : { nonWitnessUtxo };

        if (!utxoData) {
          throw new Error(
            "failed to build input - must provide prev rawTx (segwit input can provide scriptPubKey hex and value instead)"
          );
        }

        const { publicKey, network } = keyPair;
        const payment = this.createPayment(publicKey, scriptType, network);

        let scriptData: ScriptData = {};
        switch (scriptType) {
          case "p2sh":
          case "p2sh-p2wpkh":
            scriptData.redeemScript = payment.redeem.output;
            break;
        }

        return {
          ...utxoData,
          ...scriptData,
        };
      });
    }


    createPayment(pubkey: Buffer, scriptType: BTCScriptType, network?: bitcoin.Network): bitcoin.Payment {
      switch (scriptType) {
        case "p2sh":
          return bitcoin.payments.p2sh({ pubkey, network });
        case "p2pkh":
          return bitcoin.payments.p2pkh({ pubkey, network });
        default:
          throw new Error(`no implementation for script type: ${scriptType}`);
      }
    }

    async bcashGetAddress(msg: any): Promise<string> {
      const { addressNList, coin, scriptType } = msg;
      // @ts-ignore
      const keyPair = getKeyPair(this.#wallet, addressNList, coin, scriptType);
      const { address } = this.createPayment(keyPair.publicKey, scriptType, keyPair.network);
      return coin.toLowerCase() === "bitcoincash" ? toCashAddress(address) : address;
    }

    async bcashSignTx(msg: any): Promise<any> {
      const { coin, inputs, outputs, version, locktime } = msg;

      const psbt = new bitcoin.Psbt({ network: getNetwork(coin) });

      psbt.setVersion(version | 1);
      locktime && psbt.setLocktime(locktime);

      let hashType = bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_BITCOINCASHBIP143

      inputs.forEach((input) => {
        try {
          const inputData = this.buildInput(coin, input);

          psbt.addInput({
            hash: input.txid,
            index: input.vout,
            ...inputData,
            sighashType: hashType,
          });
        } catch (e) {
          throw new Error(`failed to add input: ${e}`);
        }
      });

      outputs.map((output) => {
        try {
          const { address: addr, amount, addressNList, scriptType } = output;

          let address = addr;
          if (!address) {
            // @ts-ignore
            const keyPair = getKeyPair(this.#wallet, addressNList, coin, scriptType);
            const { publicKey, network } = keyPair;
            const payment = this.createPayment(publicKey, scriptType, network);
            address = payment.address;
          }

          if (coin.toLowerCase() === "bitcoincash") {
            address = toLegacyAddress(address);
          }

          psbt.addOutput({ address, value: Number(amount) });
        } catch (e) {
          throw new Error(`failed to add output: ${e}`);
        }
      });

      inputs.forEach((input, idx) => {
        try {
          const { addressNList, scriptType } = input;
          // @ts-ignore
          const keyPair = getKeyPair(this.#wallet, addressNList, coin, scriptType);
          psbt.signInput(idx, keyPair);
        } catch (e) {
          throw new Error(`failed to sign input: ${e}`);
        }
      });

      psbt.finalizeAllInputs();

      const tx = psbt.extractTransaction(true);

      const signatures = tx.ins.map((input) => {
        const sigLen = input.script[0];
        return input.script.slice(1, sigLen).toString("hex");
      });

      return {
        signatures,
        serializedTx: tx.toHex(),
      };
    }
  };
}
