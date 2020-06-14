import {addressNListToBIP32, ETHSignedTx, BinanceSignTx,BinanceSignedTx} from "@bithighlander/hdwallet-core";
// @ts-ignore
import BncClient from '@bithighlander/javascript-sdk-patch'
let bitcoin = require("bitcoinjs-lib");
const bip39 = require(`bip39`);
import HDKey from "hdkey";

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
        privateKey = privateKey.toString('hex')
    } else {
        const seed = await bip39.mnemonicToSeed(mnemonic)

        let mk = new HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))

        // expects bip32
        let path = addressNListToBIP32(msg.addressNList)
        mk = mk.derive(path)

        privateKey = mk.privateKey
        privateKey = privateKey.toString('hex')
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
        // sequence,
        // pubkey,
        // signature,
        // account_number
    })


    let result = await client.transfer(addressFrom, addressTo, amount, asset, message, null)
    console.log("result: ",result)
    //convert sig format

    return{
        "account_number": "24250",
        "chain_id": "Binance-Chain-Nile",
        "data": null,
        "memo": "test",
        "msgs": [
            {
                "inputs": [
                    {
                        "address": "tbnb1hgm0p7khfk85zpz5v0j8wnej3a90w709zzlffd",
                        "coins": [
                            {
                                "amount": 1000000000,
                                "denom": "BNB"
                            }
                        ]
                    }
                ],
                "outputs": [
                    {
                        "address": "tbnb1ss57e8sa7xnwq030k2ctr775uac9gjzglqhvpy",
                        "coins": [
                            {
                                "amount": 1000000000,
                                "denom": "BNB"
                            }
                        ]
                    }
                ]
            }
        ],
        "signatures": {
            "pub_key": "At3wix9RpBMsY8c0VcrGVpQEx4yeO1v/0fZOB6mi8Qm0",
            "signature": "QFeON8DDkigJLA1v/rlubjxfwY9UG1A4OyMTRWSj144md3kaNHGBOS5VHNNhT0uSfXSryBFhfU8Yu/U16EmkCQ=="
        }
    };
}
