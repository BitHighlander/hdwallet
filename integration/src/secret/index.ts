import { HDWallet, HDWalletInfo } from "@bithighlander/hdwallet-core";

import { secretTests as tests } from "./secret";

export function secretTests(get: () => { wallet: HDWallet; info: HDWalletInfo }): void {
  tests(get);
}
