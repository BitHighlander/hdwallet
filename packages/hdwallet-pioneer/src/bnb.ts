import {addressNListToBIP32, ETHSignedTx, BinanceSignTx,BinanceSignedTx} from "@bithighlander/hdwallet-core";
// @ts-ignore
import BncClient from '@bithighlander/javascript-sdk-patch'
let bitcoin = require("bitcoinjs-lib");
const bip39 = require(`bip39`);
import HDKey from "hdkey";
const ripemd160 = require("crypto-js/ripemd160");
const crypto = require("crypto")
const CryptoJS = require("crypto-js");
const sha256 = require("crypto-js/sha256");
const bech32 = require(`bech32`);

function bech32ify(address, prefix) {
    const words = bech32.toWords(address);
    return bech32.encode(prefix, words);
}


// NOTE: this only works with a compressed public key (33 bytes)
function createBNBAddress(publicKey) {
    const message = CryptoJS.enc.Hex.parse(publicKey.toString(`hex`))
    const hash = ripemd160(sha256(message)).toString()
    const address = Buffer.from(hash, `hex`)
    const bnbAddress = bech32ify(address, `bnb`)
    return bnbAddress
}


export async function bnbSignTx(
    msg: BinanceSignTx,
    mnemonic: string,
    xpriv: string,
    from: string
): Promise<BinanceSignedTx> {

    console.log("MSG: ",msg)
    console.log("mnemonic: ",mnemonic)


    // expects bip32
    let path = addressNListToBIP32(msg.addressNList)

    let privateKey
    let publicKey
    if(mnemonic === 'citadel'){
        if(path.indexOf("m/44'/714'/0'") === -1) throw Error("666: citadel is NOT HD, can not sign! ")

        //replace
        path = path.replace("m/44'/714'/0'/",'')

        //convert to index/account
        let pathInfo = path.split("/")
        if(pathInfo.length > 2) throw Error(" Not configured for this path: "+path)

        //
        let account = parseInt(pathInfo[0])
        let index = parseInt(pathInfo[1])

        privateKey = bitcoin.bip32.fromBase58(xpriv).derive(account).derive(index).privateKey
        publicKey  = bitcoin.bip32.fromBase58(xpriv).derive(account).derive(index).publicKey
        publicKey = publicKey.toString('hex')
        privateKey = privateKey.toString('hex')
    } else {
        const seed = await bip39.mnemonicToSeed(mnemonic)

        let mk = new HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))

        // expects bip32
        let path = addressNListToBIP32(msg.addressNList)
        mk = mk.derive(path)

        privateKey = mk.privateKey
        publicKey = mk.publicKey
        publicKey = publicKey.toString('hex')
        privateKey = privateKey.toString('hex')
    }

    //verify from address match signing
    let signingAddress = await createBNBAddress(publicKey)
    if(signingAddress !== msg.tx.msgs[0].inputs[0].address){
        throw Error("102: attempting to sign a transaction on the wrong address! sign: "+signingAddress+' from: '+msg.tx.msgs[0].inputs[0].address)
    }

    //use sdk to build Amino encoded hex transaction
    const client = new BncClient('https://dex.binance.org') //broadcast not used but available
    await client.chooseNetwork('mainnet')
    await client.setPrivateKey(privateKey)
    await client.initChain()

    //let fromAddress = msg
    let addressFrom = msg.tx.msgs[0].inputs[0].address
    let addressTo = msg.tx.msgs[0].outputs[0].address
    let amount = msg.tx.msgs[0].inputs[0].coins[0].amount
    let asset  = "BNB"
    let message = ""


    console.log("pre-client: ",{
        addressFrom,
        addressTo,
        amount,
        asset,
        message,
    })

    let result = await client.transfer(addressFrom, addressTo, amount, asset, message, null)

    let rawHex = result.serialize()
    const buffer = Buffer.from(rawHex, 'hex');
    let txid = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase()


    let output:BinanceSignedTx = {
        account_number:result.account,
        chain_id:result.chain_id,
        data:null,
        memo:result.memo,
        msgs:result.msgs,
        txid,
        serialized:rawHex,
        signatures:{
            pub_key:result.signatures[0].pub_key,
            signature:result.signatures[0].signature
        }
    }


    return output;
}
