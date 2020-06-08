
//
global.window = {};
global.document = {};

let TEST_SEED  = "alcohol woman abuse must during monitor noble actual mixed trade anger aisle"

let hdwallet = require("../../hdwallet-core/dist")
let pioneer = require("../dist/index")

const assert = require('assert');
let paths = require("./data/common_paths")
//console.log("paths",paths)

// console.log(hdwallet)
// console.log(pioneer)
// console.log(pioneer.isPioneer())

let keyring = new hdwallet.Keyring()

let run_test = async function(){
    try{
        const pioneerAdapter = pioneer.PioneerAdapter.useKeyring(keyring, {})
        //pair
        const wallet = await pioneerAdapter.pairDevice()

        //load
        await wallet.loadDevice({ mnemonic: TEST_SEED })

        //get privkeys
        const resultPriv = await wallet.getPrivateKeys(paths.paths)
        console.log('get resultPriv: ', resultPriv)


    }catch(e){
        console.error(e)
    }
}
run_test()
