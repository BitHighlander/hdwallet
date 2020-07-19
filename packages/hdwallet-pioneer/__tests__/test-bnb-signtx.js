


global.window = {};
global.document = {};

//let TEST_SEED  = "alcohol woman abuse must during monitor noble actual mixed trade anger aisle"
let TEST_SEED = process.env['HIGHLANDER_SEED']

let hdwallet = require("../../hdwallet-core/dist")
let pioneer = require("../dist/index")

let walletCitadel = require("./data/citadel-highlander-1.wallet")
let config = {}
config.wallet = walletCitadel

let keyring = new hdwallet.Keyring()

let run_test = async function(){
    try{
        const pioneerAdapter = pioneer.PioneerAdapter.useKeyring(keyring, {})
        //pair
        const wallet = await pioneerAdapter.pairDevice()
        //load
        // await wallet.loadDevice({ mnemonic: TEST_SEED })
        await wallet.loadDeviceFromWallet({
            walletPublic: config.wallet.WALLET_PUBLIC,
            walletPrivate: config.wallet.WALLET_PRIVATE
        })


        //build tx
        let bnbTx = {
            "account_number": "34",
            "chain_id": "Binance-Chain-Nile",
            "data": null,
            "memo": "test",
            "msgs": [
                {
                    "inputs": [
                        {
                            "address": "bnb1gx3nyps3etlux8gpfzyqqalhrnak2z0al7qqrs",
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
                            "address": "bnb1v7wds8atg9pxss86vq5qjuz38wqsadq7e5m2rr",
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
            "sequence": "31",
            "source": "1"
        }

        //bip32ToAddressNList(`m/44'/714'/0'/0/0`)

        let result = await wallet.bnbSignTx({
            addressNList: [ 0x80000000 + 44, 0x80000000 + 714, 0x80000000 + 0 , 0, 0 ],
            chain_id: "Binance-Chain-Nile",
            account_number: "24250",
            sequence: "31",
            tx: bnbTx,
        })
        console.log("result: ",result)




    }catch(e){
        console.error(e)
    }
}
run_test()
