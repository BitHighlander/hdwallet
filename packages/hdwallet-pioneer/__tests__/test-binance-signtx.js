const BnbApiClient = require('../lib/index');
const api = 'https://dex.binance.org';
const bnbClient = new BnbApiClient(api);

//
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

        //get privkey for master

        //sign tx



    }catch(e){
        console.error(e)
    }
}
run_test()
