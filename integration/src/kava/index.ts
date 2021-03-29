import { HDWallet, HDWalletInfo } from "@bithighlander/hdwallet-core";

import { kavaTests as tests } from "./kava";

export function kavaTests(get: () => { wallet: HDWallet; info: HDWalletInfo }): void {
  tests(get);
}
