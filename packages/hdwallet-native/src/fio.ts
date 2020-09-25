import * as core from "@mcchadwick/hdwallet-core";
const fio = require("@fioprotocol/fiosdk");
const fetch = require("node-fetch");

const fetchJson = async (uri, opts = {}) => {
  return fetch(uri, opts);
};

export function MixinNativeFioWalletInfo<TBase extends core.Constructor>(Base: TBase) {
  return class MixinNativeFioWalletInfo extends Base implements core.FioWalletInfo {
    _supportsFioInfo = true;

    async fioSupportsNetwork(): Promise<boolean> {
      return true;
    }

    async fioSupportsSecureTransfer(): Promise<boolean> {
      return false;
    }

    fioSupportsNativeShapeShift(): boolean {
      return false;
    }

    fioGetAccountPaths(msg: core.FioGetAccountPaths): Array<core.FioAccountPath> {
      return [
        {
          addressNList: [0x80000000 + 44, 0x80000000 + 235, 0x80000000 + msg.accountIdx, 0, 0],
        },
      ];
    }

    fioNextAccountPath(msg: core.FioAccountPath): core.FioAccountPath {
      // Only support one account for now (like portis).
      // the fioers library supports paths so it shouldnt be too hard if we decide multiple accounts are needed
      return undefined;
    }
  };
}

export function MixinNativeFioWallet<TBase extends core.Constructor>(Base: TBase) {
  return class MixinNativeFioWallet extends Base {
    _supportsFio = true;
    baseUrl = "https://testnet.fioprotocol.io:443/v1/";
    #seed = "";
    #privateKey = "";
    #publicKey = "";
    #fioSdk;

    fioInitializeWallet(seed: string): void {
      this.#seed = seed;
    }

    async fioGetAddress(msg: core.FioGetAddress): Promise<string> {
      const path = core.addressNListToBIP32(msg.addressNList);
      this.#privateKey = fio.FIOSDK.createPrivateKeyMnemonic(this.#seed, path).fioKey;
      this.#publicKey = fio.FIOSDK.derivedPublicKey(this.#privateKey);
      this.#fioSdk = new fio.FIOSDK(this.#privateKey, this.#publicKey, this.baseUrl, fetchJson);
      return this.#publicKey;
    }

    async fioSignTx(msg: core.FioTx): Promise<any> {
      const account: string = msg.actions.account || "fio.token";
      const action: string = msg.actions.name || "fiotrnspubky";
      const data: core.FioTxActionData = msg.actions.data;
      if (!this.#fioSdk) {
        // Throw error. fioInitializeWallet has not been called.
      }
      const res = this.#fioSdk.prepareTransaction(account, action, data);
      if (!res.signatures || !res.packed_trx) {
        // Throw error. Transaction is invalid.
      }
      let sig = {
        serialized: res.packed_trx, // Serialized hexadecimal transaction
        signature: res.signatures[0], //
      };

      return sig;
    }
  };
}
