

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




    }catch(e){
        console.error(e)
    }
}
run_test()
