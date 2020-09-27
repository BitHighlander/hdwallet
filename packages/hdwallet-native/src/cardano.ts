import * as core from "@bithighlander/hdwallet-core";
import { NativeHDWalletBase } from "./native";

export function MixinNativeCardanoWalletInfo<TBase extends core.Constructor>(Base: TBase) {
  return class MixinNativeCardanoWalletInfo extends Base implements core.CardanoWalletInfo {
    _supportsCardanoInfo = true;

    async cardanoSupportsNetwork(): Promise<boolean> {
      return true;
    }

    async cardanoSupportsSecureTransfer(): Promise<boolean> {
      return false;
    }

    cardanoSupportsNativeShapeShift(): boolean {
      return false;
    }

    cardanoGetAccountPaths(msg: core.CardanoGetAccountPaths): Array<core.CardanoAccountPath> {
      return [
        {
          addressNList: [0x80000000 + 44, 0x80000000 + 235, 0x80000000 + msg.accountIdx, 0, 0],
        },
      ];
    }

    cardanoNextAccountPath(msg: core.CardanoAccountPath): core.CardanoAccountPath {
      // Only support one account for now (like portis).
      // the cardanoers library supports paths so it shouldnt be too hard if we decide multiple accounts are needed
      return undefined;
    }
  };
}

export function MixinNativeCardanoWallet<TBase extends core.Constructor<NativeHDWalletBase>>(Base: TBase) {
  return class MixinNativeCardanoWallet extends Base {
    _supportsCardano = true;
    #seed = "";
    #privateKey = "";

    #publicKey = "";
    #cardanoSdk;

    cardanoInitializeWallet(seed: string): void {
      this.#seed = seed;
    }

    async cardanoGetAddress(msg: any): Promise<string> {
      const path = core.addressNListToBIP32(msg.addressNList);

      return this.#publicKey;
    }

    async cardanoSignTx(msg: any): Promise<any> {
      let sig = {
        serialized: "", // Serialized hexadecimal transaction
      };

      return sig;
    }
  };
}
