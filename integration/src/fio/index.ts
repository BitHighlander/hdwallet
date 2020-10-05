import { HDWallet, HDWalletInfo } from "@bithighlander/hdwallet-core";

import { fioTests as tests } from "./fio";

export function fioTests(get: () => { wallet: HDWallet; info: HDWalletInfo; wallet2: HDWallet }): void {
  tests(get);
}
