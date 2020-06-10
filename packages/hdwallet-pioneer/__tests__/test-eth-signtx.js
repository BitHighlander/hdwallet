

global.window = {};
global.document = {};

let TEST_SEED  = "alcohol woman abuse must during monitor noble actual mixed trade anger aisle"

let hdwallet = require("../../hdwallet-core/dist")
let pioneer = require("../dist/index")


//test wallet
let walletCitadel = require("./data/testSeed.wallet")
let config = {}
config.wallet = walletCitadel

let keyring = new hdwallet.Keyring()

let run_test = async function(){
    try{
        const pioneerAdapter = pioneer.PioneerAdapter.useKeyring(keyring, {})
        //pair
        const wallet = await pioneerAdapter.pairDevice()

        //load seed
        await wallet.loadDevice({ mnemonic: TEST_SEED })

        //load wallet
        // await wallet.loadDeviceFromWallet({
        //     walletPublic: config.wallet.WALLET_PUBLIC,
        //     walletPrivate: config.wallet.WALLET_PRIVATE
        // })

        //get master


        //build tx
        let ethTx = {
            addressNList: [ 2147483692, 2147483708, 2147483648, 0, 0 ],
            nonce: '0x1e3',
            gasPrice: '0x649534e00',
            gasLimit: '0x649534e00',
            value: '0x649534e00',
            to: '0xdb0aaa864046971d116e3c33efb7e59bb7667816',
            chainId: 1,
            data: undefined }

        let result = await wallet.ethSignTx(ethTx)
        console.log("result: ",result)

        if(result.txid !== "0xf291d6d063ffe281219f1ace989bc18491d641830fa69116ffcecf72adbac58d") throw Error("invalid sig!")

    }catch(e){
        console.error(e)
    }
}
run_test()

let run_test2 = async function(){
    try{
        const pioneerAdapter = pioneer.PioneerAdapter.useKeyring(keyring, {})
        //pair
        const wallet = await pioneerAdapter.pairDevice()

        //load seed
        // await wallet.loadDevice({ mnemonic: TEST_SEED })

        //load wallet
        await wallet.loadDeviceFromWallet({
            walletPublic: config.wallet.WALLET_PUBLIC,
            walletPrivate: config.wallet.WALLET_PRIVATE
        })

        //get master

        //build tx
        let ethTx = {
            addressNList: [ 2147483692, 2147483708, 2147483648, 0, 0 ],
            nonce: '0x1e3',
            gasPrice: '0x649534e00',
            gasLimit: '0x649534e00',
            value: '0x649534e00',
            to: '0xdb0aaa864046971d116e3c33efb7e59bb7667816',
            chainId: 1,
            data: undefined }

        let result = await wallet.ethSignTx(ethTx)
        console.log("result: ",result)

        if(result.txid !== "0xf291d6d063ffe281219f1ace989bc18491d641830fa69116ffcecf72adbac58d") throw Error("invalid sig!")

    }catch(e){
        console.error(e)
    }
}
run_test2()
