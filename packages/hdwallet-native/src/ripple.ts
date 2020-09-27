import * as core from "@bithighlander/hdwallet-core";
import { NativeHDWalletBase } from "./native";

export function MixinNativeRippleWalletInfo<TBase extends core.Constructor>(Base: TBase) {
  return class MixinNativeRippleWalletInfo extends Base implements core.RippleWalletInfo {
    _supportsRippleInfo = true;

    async rippleSupportsNetwork(): Promise<boolean> {
      return true;
    }

    async rippleSupportsSecureTransfer(): Promise<boolean> {
      return false;
    }

    rippleSupportsNativeShapeShift(): boolean {
      return false;
    }

    rippleGetAccountPaths(msg: core.RippleGetAccountPaths): Array<core.RippleAccountPath> {
      return [
        {
          addressNList: [0x80000000 + 44, 0x80000000 + 235, 0x80000000 + msg.accountIdx, 0, 0],
        },
      ];
    }

    rippleNextAccountPath(msg: core.RippleAccountPath): core.RippleAccountPath {
      // Only support one account for now (like portis).
      // the rippleers library supports paths so it shouldnt be too hard if we decide multiple accounts are needed
      return undefined;
    }
  };
}

export function MixinNativeRippleWallet<TBase extends core.Constructor<NativeHDWalletBase>>(Base: TBase) {
  return class MixinNativeRippleWallet extends Base {
    _supportsRipple = true;
    #seed = "";
    #privateKey = "";

    #publicKey = "";
    #rippleSdk;

    rippleInitializeWallet(seed: string): void {
      this.#seed = seed;
    }

    async rippleGetAddress(msg: any): Promise<string> {
      const path = core.addressNListToBIP32(msg.addressNList);

      return this.#publicKey;
    }

    async rippleSignTx(msg: any): Promise<any> {
      let sig = {
        serialized: "", // Serialized hexadecimal transaction
      };

      return sig;
    }
  };
}
