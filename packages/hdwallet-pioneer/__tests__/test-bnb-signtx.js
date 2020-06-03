

global.window = {};
global.document = {};

let TEST_SEED  = "alcohol woman abuse must during monitor noble actual mixed trade anger aisle"

let hdwallet = require("../../hdwallet-core/dist")
let pioneer = require("../dist/index")


let keyring = new hdwallet.Keyring()

let run_test = async function(){
    try{
        const pioneerAdapter = pioneer.PioneerAdapter.useKeyring(keyring, {})
        //pair
        const wallet = await pioneerAdapter.pairDevice()
        //load
        await wallet.loadDevice({ mnemonic: TEST_SEED })

        //get master

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
            "sequence": "31",
            "source": "1"
        }


        let result = await wallet.bnbSignTx(bnbTx)
        console.log("result: ",result)




    }catch(e){
        console.error(e)
    }
}
run_test()
