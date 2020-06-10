import {
  PathDescription,
  addressNListToBIP32,
  BIP32Path,
  slip44ByCoin,
  ETHVerifyMessage,
  ETHGetAccountPath,
  ETHAccountPath,
  ETHSignTx,
  ETHSignedTx,
  ETHSignMessage,
  ETHSignedMessage,
} from "@bithighlander/hdwallet-core";

let bitcoin = require("bitcoinjs-lib");
import HDKey from "hdkey";
import { hexToNumberString } from 'web3-utils'

const bip39 = require(`bip39`);
//const ethUtils = require('ethereumjs-util');
const txBuilder = require("ethereumjs-tx").Transaction;

export function describeETHPath(path: BIP32Path): PathDescription {
  let pathStr = addressNListToBIP32(path);
  let unknown: PathDescription = {
    verbose: pathStr,
    coin: "Ethereum",
    isKnown: false,
  };

  if (path.length !== 5) return unknown;

  if (path[0] !== 0x80000000 + 44) return unknown;

  if (path[1] !== 0x80000000 + slip44ByCoin("Ethereum")) return unknown;

  if ((path[2] & 0x80000000) >>> 0 !== 0x80000000) return unknown;

  if (path[3] !== 0) return unknown;

  if (path[4] !== 0) return unknown;

  let index = path[2] & 0x7fffffff;
  return {
    verbose: `Ethereum Account #${index}`,
    accountIdx: index,
    wholeAccount: true,
    coin: "Ethereum",
    isKnown: true,
  };
}

export async function ethVerifyMessage(
  msg: ETHVerifyMessage,
  web3: any
): Promise<boolean> {
  const signingAddress = await web3.eth.accounts.recover(
    msg.message,
    "0x" + msg.signature,
    false
  );
  return signingAddress === msg.address;
}

export function ethGetAccountPaths(
  msg: ETHGetAccountPath
): Array<ETHAccountPath> {
  return [
    {
      addressNList: [
        0x80000000 + 44,
        0x80000000 + slip44ByCoin(msg.coin),
        0x80000000 + msg.accountIdx,
        0,
        0,
      ],
      hardenedPath: [
        0x80000000 + 44,
        0x80000000 + slip44ByCoin(msg.coin),
        0x80000000 + msg.accountIdx,
      ],
      relPath: [0, 0],
      description: "Pioneer",
    },
  ];
}

//
// let generateAddressPrivkey = function(){
//   try{
//
//   }catch(e){
//
//   }
// }

export async function ethSignTx(
  msg: ETHSignTx,
  mnemonic: string,
  xpriv: string,
  from: string
): Promise<ETHSignedTx> {

  // expects bip32
  let path = addressNListToBIP32(msg.addressNList)
  console.log("path: ",path)

  let privateKey
  //if citadel && not expected path ERROR
  if(mnemonic === 'citadel'){
    if(path.indexOf("m/44'/60'/0'") === -1) throw Error("666: citadel is NOT HD, can not sign! ")

    //replace
    path = path.replace("m/44'/60'/0'/",'')

    //convert to index/account
    let pathInfo = path.split("/")
    if(pathInfo.length > 2) throw Error(" Not configured for this path: "+path)

    //
    let account = parseInt(pathInfo[0])
    let index = parseInt(pathInfo[1])

    privateKey = bitcoin.bip32.fromBase58(xpriv).derive(account).derive(index).privateKey
  } else {
    const seed = await bip39.mnemonicToSeed(mnemonic)

    let mk = new HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))

    // expects bip32
    let path = addressNListToBIP32(msg.addressNList)
    mk = mk.derive(path)

    privateKey = mk.privateKey
  }




  let txTemplate = {
    nonce: msg.nonce,
    to: msg.to,
    gasPrice: msg.gasPrice,
    gasLimit : msg.gasLimit,
    value: msg.value,
    data:msg.data
  }

  //console.log("txTemplate: ",txTemplate)
  let transaction = new txBuilder(txTemplate)
  transaction.sign(privateKey)

  let sig = {
    v:transaction.v.toString('hex'),
    r:transaction.r.toString('hex'),
    s:transaction.s.toString('hex')
  }

  const txid = '0x' + transaction.hash().toString('hex')

  let serialized = transaction.serialize()
  serialized = '0x' + serialized.toString('hex')
  //console.log(serialized)

  return {
    txid,
    v: sig.v,
    r: sig.r,
    s: sig.s,
    serialized
  };
}

export async function ethSignMessage(
  msg: ETHSignMessage,
  web3: any,
  address: string
): Promise<ETHSignedMessage> {
  const result = await web3.eth.sign(msg.message, address);
  return {
    address,
    signature: result,
  };
}
