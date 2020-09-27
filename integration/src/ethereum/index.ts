import { HDWallet, HDWalletInfo } from "@bithighlander/hdwallet-core";

// @ts-ignore
import { ethereumTests } from "./ethereum";

export function ethTests(get: () => { wallet: HDWallet; info: HDWalletInfo }): void {
  ethereumTests(get);
}
