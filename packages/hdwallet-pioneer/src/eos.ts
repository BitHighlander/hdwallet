import {addressNListToBIP32, EosToSignTx, EosSignedTx} from "@bithighlander/hdwallet-core";

let bitcoin = require("bitcoinjs-lib");
import HDKey from "hdkey";
const bip39 = require(`bip39`);
let {PrivateKey, PublicKey, Signature, Aes, key_utils, config} = require('eosjs-ecc')

export async function eosSignTx(
    msg: EosToSignTx,
    mnemonic: string,
    xpriv: string,
    from: string
): Promise<any> {


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
        if(path.indexOf("m/44'/194'/0'") === -1) throw Error("666: citadel is NOT HD, can not sign! ")

        //replace
        path = path.replace("m/44'/194'/0'/",'')

        //convert to index/account
        let pathInfo = path.split("/")
        if(pathInfo.length > 2) throw Error(" Not configured for this path: "+path)

        //
        let account = parseInt(pathInfo[0])
        let index = parseInt(pathInfo[1])

        privateKey = bitcoin.bip32.fromBase58(xpriv).derive(account).derive(index).privateKey
        publicKey = bitcoin.bip32.fromBase58(xpriv).derive(account).derive(index).publicKey
    } else {
        const seed = await bip39.mnemonicToSeed(mnemonic)

        let mk = new HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))

        // expects bip32
        let path = addressNListToBIP32(msg.addressNList)
        mk = mk.derive(path)

        privateKey = mk.privateKey
        publicKey = mk.publicKey
    }
    console.log("Checkpoint 1")
    //convert privkey to EOS format
    privateKey = PrivateKey.fromBuffer(privateKey)
    privateKey = privateKey.toString()

    let URL_REMOTE = "https://api.eossweden.org" //not used (TODO fork eosjs and removeme)
    //
    const { Api, JsonRpc, RpcError } = require('eosjs');
    const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig'); // development only
    const fetch = require('node-fetch'); // node only; not needed in browsers
    const { TextEncoder, TextDecoder } = require('util');

    const privateKeys = [privateKey];
    const signatureProvider = new JsSignatureProvider(privateKeys);

    console.log(signatureProvider.keys)

    console.log("Checkpoint 2")
    const rpc = new JsonRpc(URL_REMOTE, { fetch });
    const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });


    console.log("Checkpoint 3")
    let result = await api.transact({
        actions: msg.tx.actions
    }, {
        broadcast: false,
        blocksBehind: 3,
        expireSeconds: 300,
    });
    console.log("Checkpoint 4")
    console.log("result: ",result)
    console.log("result: ",result.serialized)

    let serialized = result.serializedTransaction
    serialized = new Buffer(result.serializedTransaction).toString('hex')
    // console.log(serialized)

    return {
        eosFormSig:result.signatures,
        serialized
    };
}
