import {
    addressNListToBIP32,
    ETHSignedTx,
    BinanceSignTx,
    BinanceSignedTx,
    CosmosSignTx, CosmosSignedTx
} from "@bithighlander/hdwallet-core";
let txBuilder = require("@bithighlander/cosmos-tx-builder")
let bitcoin = require("bitcoinjs-lib");
import HDKey from "hdkey";

const bip39 = require(`bip39`);

export async function cosmosSignTx(
    msg: CosmosSignTx,
    mnemonic: string,
    xpriv: string,
    from: string
): Promise<CosmosSignedTx> {

    console.log("MSG: ",msg)
    console.log("mnemonic: ",mnemonic)
    let ATOM_CHAIN="cosmoshub-3"

    // expects bip32
    let path = addressNListToBIP32(msg.addressNList)
    console.log("path: ",path)

    //if citadel && not expected path ERROR
    let privateKey
    let publicKey
    if(mnemonic === 'citadel'){
        if(path.indexOf("m/44'/118'/0'") === -1) throw Error("666: citadel is NOT HD, can not sign! ")

        //replace
        path = path.replace("m/44'/118'/0'/",'')

        //convert to index/account
        let pathInfo = path.split("/")
        if(pathInfo.length > 2) throw Error(" Not configured for this path: "+path)

        //
        let account = parseInt(pathInfo[0])
        let index = parseInt(pathInfo[1])

        privateKey = bitcoin.bip32.fromBase58(xpriv).derive(account).derive(index).privateKey
    } else {
        const seed = await bip39.mnemonicToSeed(mnemonic)

        let mk = new HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))

        // expects bip32
        let path = addressNListToBIP32(msg.addressNList)
        mk = mk.derive(path)

        privateKey = mk.privateKey
        publicKey = mk.publicKey
    }


    let wallet = {
        privateKey,
        publicKey
    }

    let result = await txBuilder.sign(msg.tx.value,wallet,msg.sequence, msg.account_number, ATOM_CHAIN)
    console.log("result: ",result)

    // build final tx
    const signedTx = txBuilder.createSignedTx(msg.tx, result)
    console.log("signedTx: ",signedTx)

    return{
        "type": "auth/StdTx",
        "value": signedTx
    };
}
