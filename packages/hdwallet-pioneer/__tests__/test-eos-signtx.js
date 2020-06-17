

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

        let unsigned_main = {
            expiration: "2020-04-30T22:00:00.000",
            ref_block_num: 54661,
            ref_block_prefix: 2118672142,
            max_net_usage_words: 0,
            max_cpu_usage_ms: 0,
            delay_sec: 0,
            context_free_actions: [],
            actions: [
                {
                    account: "eosio.token",
                    name: "transfer",
                    authorization: [
                        {
                            actor: "xhackmebrosx",
                            permission: "active",
                        },
                    ],
                    data: {
                        from: "xhackmebrosx",
                        to: "xhighlanderx",
                        quantity: "0.0001 EOS",
                        memo: "testmemo",
                    },
                },
            ],
        };

        let chainid_main =
            "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906";
        let res = await wallet.eosSignTx({
            addressNList:[ 0x80000000 + 44, 0x80000000 + 194, 0x80000000 + 0 , 0, 0 ],
            chain_id: chainid_main,
            tx: unsigned_main,
        });
        console.log("res: ",res)


    }catch(e){
        console.error(e)
    }
}
run_test()
