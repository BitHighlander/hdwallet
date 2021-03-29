import { HDWallet, HDWalletInfo } from "@bithighlander/hdwallet-core";

import { terraTests as tests } from "./terra";

export function terraTests(get: () => { wallet: HDWallet; info: HDWalletInfo }): void {
  tests(get);
}
