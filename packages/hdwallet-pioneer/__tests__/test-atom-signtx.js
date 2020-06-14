

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
        let fromAddress
        //get privkey for master

        //sign tx
        let unsigned = {
            type: "auth/StdTx",
            value: {
                fee: {
                    amount: [
                        {
                            amount: "1000",
                            denom: "uatom",
                        },
                    ],
                    gas: "28000",
                },
                memo: "KeepKey",
                msg: [
                    {
                        type: "cosmos-sdk/MsgSend",
                        value: {
                            amount: [
                                {
                                    amount: "47000",
                                    denom: "uatom",
                                },
                            ],
                            from_address: "cosmos1934nqs0ke73lm5ej8hs9uuawkl3ztesg9jp5c5",
                            to_address: "cosmos14um3sf75lc0kpvgrpj9hspqtv0375epn05cpfa",
                        },
                    },
                ],
                signatures: null,
            },
        };

        let res = await wallet.cosmosSignTx({
            addressNList: [ 2147483692, 2147483708, 2147483648, 0, 0 ],
            chain_id: "cosmoshub-2",
            account_number: "24250",
            sequence: "3",
            tx: unsigned,
        });
        console.log("res: ",res)

    }catch(e){
        console.error(e)
    }
}
run_test()
