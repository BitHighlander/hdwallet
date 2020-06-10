
//
global.window = {};
global.document = {};

let TEST_SEED  = "alcohol woman abuse must during monitor noble actual mixed trade anger aisle"

let hdwallet = require("../../hdwallet-core/dist")
let pioneer = require("../dist/index")

const assert = require('assert');
let paths = require("./data/common_paths")
//console.log("paths",paths)


let walletFile = require("./data/testSeed.wallet")

// console.log(hdwallet)
// console.log(pioneer)
// console.log(pioneer.isPioneer())

let keyring = new hdwallet.Keyring()

let config = {}
config.wallet = walletFile

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

        //get privkeys
        // const resultPriv = await wallet.getPrivateKeys(paths.paths)
        // console.log('get resultPriv: ', resultPriv)

        // public addys
        const result = await wallet.getPublicKeys(paths.paths)
        console.log('get Xpubs: ', result)

        if(result[0].master !== "bc1qnjwjrarnsfmzmuadsyu3acykfv5dm9gh0ah6x8") throw Error("invalid wallet!")
    }catch(e){
        console.error(e)
    }
}
run_test()
