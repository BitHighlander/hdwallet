require("dotenv")
require("dotenv").config({path:'.env'})

global.window = {};
global.document = {};

//let TEST_SEED = ""
let TEST_SEED  = "alcohol woman abuse must during monitor noble actual mixed trade anger aisle"
// let TEST_SEED  = process.env['HIGHLANDER_SEED']
console.log(TEST_SEED)

let hdwallet = require("../../hdwallet-core/dist")
let pioneer = require("../dist/index")


let keyring = new hdwallet.Keyring()

let walletFile = require("./data/testSeed.wallet")

let config = {}
config.wallet = walletFile

let run_test = async function(){
    try{
        const pioneerAdapter = pioneer.PioneerAdapter.useKeyring(keyring, {})
        //pair
        const wallet = await pioneerAdapter.pairDevice()

        //load
        await wallet.loadDevice({ mnemonic: TEST_SEED })

        // await wallet.loadDeviceFromWallet({
        //     walletPublic: config.wallet.WALLET_PUBLIC,
        //     walletPrivate: config.wallet.WALLET_PRIVATE
        // })

        //get master
        // let fromAddress = "cosmos1qjwdyn56ecagk8rjf7crrzwcyz6775cj89njn3"
        // let toAddress  = "cosmos1v7z4rqzwrfvptlya858mavqvuth6hgrdpkws2s"
        // let amount = "20000"
        // let txType = "cosmos-sdk/MsgSend"
        // let gas = "100000"
        // let fee = "100"
        // let account_number = "482"
        // let sequence = "121"
        // let memo = "Sent from the citadel! "
        // let account_number = "482"
        // let sequence = "121"
        //get privkey for master

        //test example
        let fromAddress = "cosmos15cenya0tr7nm3tz2wn3h3zwkht2rxrq7q7h3dj"
        let toAddress  = "cosmos14um3sf75lc0kpvgrpj9hspqtv0375epn05cpfa"
        let amount = "47000"
        let txType = "cosmos-sdk/MsgSend"
        let gas = "28000"
        let fee = "1000"
        let memo = "KeepKey"

        let account_number = "1"
        let sequence = "0"

        //sign tx
        let unsigned = {
            "value": {
                "fee": {
                    "amount": [
                        {
                            "amount": fee,
                            "denom": "uatom"
                        }
                    ],
                    "gas": gas
                },
                "memo": memo,
                "msg": [
                    {
                        "type": txType,
                        "value": {
                            "amount": [
                                {
                                    "amount": amount,
                                    "denom": "uatom"
                                }
                            ],
                            "from_address": fromAddress,
                            "to_address": toAddress
                        }
                    }
                ],
                "signatures": null
            }
        }


        let res = await wallet.cosmosSignTx({
            addressNList: [ 0x80000000 + 44, 0x80000000 + 118, 0x80000000 + 0 , 0, 0 ],
            chain_id: "cosmoshub-2",
            account_number: account_number,
            sequence: sequence,
            tx: unsigned,
        });

        // console.log("signature: ",JSON.stringify(res))

        let txFinal
        txFinal = res.value
        txFinal.signatures = res.signatures

        // console.log("txFinal: ",JSON.stringify(txFinal))


        let rawTx = {
            value:txFinal,
            type:"auth/StdTx",
            // mode:"async"
        }
        console.log("txFinal: ",JSON.stringify(rawTx))

        // console.log("signature: ",JSON.stringify(rawTx))
        let signature = res.signatures[0].signature

        console.log("signature: ",signature)
        console.log(" expected: ","ka8jz36z+IYOQFYJGMS6c/YBoKJhXHBevkjBwDTiT6kLxpU43j4T+78vAxPfnhatJJax1OejT+eHFrGfL8Cwaw==")



    }catch(e){
        console.error(e)
    }
}
run_test()
