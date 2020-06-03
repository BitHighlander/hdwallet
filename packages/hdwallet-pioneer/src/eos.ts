import {addressNListToBIP32, ETHSignedTx, ETHSignTx} from "@bithighlander/hdwallet-core";


export async function eosSignTx(
    msg: ETHSignTx,
    mnemonic: string,
    from: string
): Promise<ETHSignedTx> {



    return {
        v: 37,
        r: "0x2482a45ee0d2851d3ab76a693edd7a393e8bc99422f7857be78a883bc1d60a5b",
        s: "0x18d776bcfae586bf08ecc70f714c9bec8959695a20ef73ad0c28233fdaeb1bd2",
        serialized:"foobar"
    };
}
