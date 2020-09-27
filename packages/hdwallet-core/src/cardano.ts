import { BIP32Path } from "./wallet";

export interface CardanoGetAddress {
  addressNList: BIP32Path;
  showDisplay?: boolean;
  /** Optional. Required for showDisplay == true. */
  address?: string;
}
declare namespace Cardano {
  namespace sdk {
    interface Msg {
      type: string;
      value: any;
    }
    type Coins = Coin[];
    interface Coin {
      denom: string;
      amount: string;
    }
  }

  interface StdFee {
    amount: sdk.Coins;
    gas: string;
  }
  namespace crypto {
    interface PubKey {
      type: string;
      value: string;
    }
  }

  interface StdSignature {
    signature: string;
    serializedTx: string;
  }

  interface StdTx {
    msg: sdk.Msg[];
    fee: StdFee;
    signatures: null | StdSignature[];
    memo: string;
  }
}

export interface CardanoTx {
  type: string;
  value: Cardano.StdTx;
}

export interface CardanoPayment {
  amount: string;
  destination: string;
  destinationTag?: string;
}

export interface CardanoSignTx {
  addressNList: BIP32Path;
  tx: CardanoTx;
  flags?: string;
  sequence: string;
  lastLedgerSequence?: string;
  payment?: CardanoPayment;
}

export declare type CardanoSignedTx = CardanoTx;

export interface CardanoGetAccountPaths {
  accountIdx: number;
}

export interface CardanoAccountPath {
  addressNList: BIP32Path;
}

export interface CardanoWalletInfo {
  _supportsCardanoInfo: boolean;

  /**
   * Returns a list of bip32 paths for a given account index in preferred order
   * from most to least preferred.
   */
  cardanoGetAccountPaths(msg: CardanoGetAccountPaths): Array<CardanoAccountPath>;

  /**
   * Returns the "next" account path, if any.
   */
  cardanoNextAccountPath(msg: CardanoAccountPath): CardanoAccountPath | undefined;
}

export interface CardanoWallet extends CardanoWalletInfo {
  _supportsCardano: boolean;

  cardanoGetAddress(msg: CardanoGetAddress): Promise<string>;
  cardanoSignTx(msg: CardanoSignTx): Promise<CardanoSignedTx>;
}
