import {
  bip32ToAddressNList,
  HDWallet,
  RippleWallet,
  supportsRipple,
  RippleTx
} from "@bithighlander/hdwallet-core";
import { HDWalletInfo } from "@bithighlander/hdwallet-core/src/wallet";

import * as tx01_unsigned from "./tx01.unsigned.json";
import * as tx01_signed from "./tx01.signed.json";

const MNEMONIC12_NOPIN_NOPASSPHRASE =
  "alcohol woman abuse must during monitor noble actual mixed trade anger aisle";

const TIMEOUT = 60 * 1000;

/**
 *  Main integration suite for testing RippleWallet implementations' Ripple support.
 */
export function rippleTests(
  get: () => { wallet: HDWallet; info: HDWalletInfo }
): void {
  let wallet: RippleWallet & HDWallet;

  describe("Ripple", () => {
    beforeAll(async () => {
      const { wallet: w } = get();
      if (supportsRipple(w)) wallet = w;
    });

    beforeEach(async () => {
      if (!wallet) return;
      await wallet.wipe();
      await wallet.loadDevice({
        mnemonic: MNEMONIC12_NOPIN_NOPASSPHRASE,
        label: "test",
        skipChecksum: true
      });
    }, TIMEOUT);

    test(
      "rippleGetAccountPaths()",
      () => {
        if (!wallet) return;
        let paths = wallet.rippleGetAccountPaths({ accountIdx: 0 });
        expect(paths.length > 0).toBe(true);
        expect(paths[0].addressNList[0] > 0x80000000).toBe(true);
        paths.forEach(path => {
          let curAddr = path.addressNList.join();
          let nextAddr = wallet.rippleNextAccountPath(path).addressNList.join();
          expect(nextAddr === undefined || nextAddr !== curAddr).toBeTruthy();
        });
      },
      TIMEOUT
    );

    test(
      "rippleGetAddress()",
      async () => {
        if (!wallet) return;
        expect(
          await wallet.rippleGetAddress({
            addressNList: bip32ToAddressNList("m/44'/144'/0'/0/0"),
            showDisplay: false
          })
        ).toEqual("rh5ZnEVySAy7oGd3nebT3wrohGDrsNS83E");
      },
      TIMEOUT
    );

    test(
      "rippleSignTx()",
      async () => {
        if (!wallet) return;

        let res = await wallet.rippleSignTx({
          addressNList: bip32ToAddressNList(`m/44'/144'/0'/0/0`),
          tx: (tx01_unsigned as unknown) as RippleTx,
          flags: undefined,
          sequence: "3",
          lastLedgerSequence: "0",
          payment: {
            amount: "47000",
            destination: "rh5ZnEVySAy7oGd3nebT3wrohGDrsNS83E",
            destinationTag: "1234567890"
          }
        });
        expect(res).toEqual((tx01_signed as unknown) as RippleTx);
      },
      TIMEOUT
    );
  });
}
