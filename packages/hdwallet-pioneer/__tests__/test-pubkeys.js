
//
global.window = {};
global.document = {};

let TEST_SEED  = "alcohol woman abuse must during monitor noble actual mixed trade anger aisle"

let hdwallet = require("../../hdwallet-core/dist")
let pioneer = require("../dist/index")

const assert = require('assert');
let paths = require("./data/common_paths")
//console.log("paths",paths)


let walletHighlander = require("./data/walletHighlander.wallet")

// console.log(hdwallet)
// console.log(pioneer)
// console.log(pioneer.isPioneer())

let keyring = new hdwallet.Keyring()

let config = {}
config.wallet = walletHighlander

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

        //get privkeys
        const resultPriv = await wallet.getPrivateKeys(paths.paths)
        console.log('get resultPriv: ', resultPriv)

        // public addys
        const result = await wallet.getPublicKeys(paths.paths)
        console.log('get Xpubs: ', result)

    }catch(e){
        console.error(e)
    }
}
run_test()
