
//let crypto = require("../index.ts")
let fs = require('fs-extra')
require("dotenv").config({path:'../../../.env'})
let crypto = require("../src/crypto")


let seed = crypto.generateSeed()
console.log("seed: ",seed)

crypto.generateWalletFromSeed(seed)
    .then(function(resp){
        console.log("resp: ",resp)
    })

//convert xpub to ypub
// crypto.xpubConvert("","ypub")
//     .then(function(resp){
//         console.log(resp)
//         crypto.generatePubkey("resp",12,false,'ypub')
//             .then(function(resp){
//                 console.log(resp)
//             })
//     })

// crypto.generatePubkey("",12)
//     .then(function(resp){
//         console.log(resp)
//         crypto.generateAddress("BTC",resp,'legacy')
//             .then(function(resp){
//                 console.log(resp)
//             })
//     })

// let pubkeys = []
// pubkeys.push(Buffer.from('', 'hex'))
// pubkeys.push(Buffer.from('', 'hex'))
// pubkeys.push(Buffer.from('', 'hex'))
// console.log(pubkeys)
//
// crypto.generateMultiSigAddress(pubkeys,2)
//     .then(function(resp){
//         console.log(resp)
//     })
