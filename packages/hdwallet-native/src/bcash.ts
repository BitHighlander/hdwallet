import * as core from "@bithighlander/hdwallet-core";
import { NativeHDWalletBase } from "./native";

export function MixinNativeBcashWalletInfo<TBase extends core.Constructor>(Base: TBase) {
  return class MixinNativeBcashWalletInfo extends Base implements core.BcashWalletInfo {
    bcashSupportsCoin(coin: string): Promise<boolean> {
      throw new Error("Method not implemented.");
    }
    bcashSupportsScriptType(coin: string, scriptType: core.BcashInputScriptType): Promise<boolean> {
      throw new Error("Method not implemented.");
    }
    bcashIsSameAccount(msg: core.BcashAccountPath[]): boolean {
      throw new Error("Method not implemented.");
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
    #seed = "";
    #privateKey = "";
    #publicKey = "";
    #bcashSdk;

    bcashInitializeWallet(seed: string): void {
      this.#seed = seed;
    }

    async bcashGetAddress(msg: any): Promise<string> {
      const path = core.addressNListToBIP32(msg.addressNList);

      return this.#publicKey;
    }

    async bcashSignTx(msg: any): Promise<any> {
      let sig = {
        serialized: "", // Serialized hexadecimal transaction
      };

      return sig;
    }
  };
}
