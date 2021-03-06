import * as core from "@bithighlander/hdwallet-core";
import { create, NativeHDWallet } from "./native";

export type NativeAdapterArgs = {
  deviceId: string;
  mnemonic?: string;
  isTestnet?: boolean;
};

export class NativeAdapter {
  keyring: core.Keyring;

  private constructor(keyring: core.Keyring) {
    this.keyring = keyring;
  }

  static useKeyring(keyring: core.Keyring) {
    return new NativeAdapter(keyring);
  }

  async initialize(): Promise<number> {
    return 0;
  }

  async pairDevice(deviceId: string): Promise<core.HDWallet | null> {
    let wallet = this.keyring.get<NativeHDWallet>(deviceId);
    if (!wallet && deviceId) {
      // If a wallet with that ID hasn't been added to the keychain, then create it
      wallet = new NativeHDWallet({ deviceId });
      this.keyring.add(wallet, deviceId);
      this.keyring.decorateEvents(deviceId, wallet.events);
    }

    if (wallet?._isNative) {
      const id = await wallet.getDeviceID();
      this.keyring.emit([wallet.getVendor(), id, core.Events.CONNECT], id);

      return wallet;
    }

    return null;
  }
}
