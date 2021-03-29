import { HDWallet, HDWalletInfo } from "@bithighlander/hdwallet-core";

import { thorchainTests as tests } from "./thorchain";

export function thorchainTests(get: () => { wallet: HDWallet; info: HDWalletInfo }): void {
  tests(get);
}
