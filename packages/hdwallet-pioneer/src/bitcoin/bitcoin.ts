//
// import { BIP32Interface } from '@types/bip32'
// import { TransactionBuilder, ECPairInterface } from '../../@types/bitcoinjs-lib'
// import * as bitcoin from 'bitcoinjs-lib'
// import { mnemonicToSeed } from 'bip39'
// import Networks, { Network } from 'bip39/networks'
//
// interface ScriptType {
//     node: BIP32Interface
//     path: string
// }
//
// type UndScriptyTypes = 'p2pkh' | 'p2sh-p2wpkh'
//
// export interface Coin {
//     network: Network
//     rootNode: BIP32Interface
//     scripts: {
//         [k in UndScriptyTypes]: ScriptType
//     }
// }
//
// const HARDENED = 0x80000000
//
// export function addressNListToBIP32(address: number[]): string {
//     return `m/${address.map(num => (num >= HARDENED ? `${num - HARDENED}'` : num)).join('/')}`
// }
//
// export async function getBTCWallet(mnemonic: string): Promise<Coin> {
//     const seed = Buffer.from(await mnemonicToSeed(mnemonic), 'hex')
//     const rootNode = bitcoin.bip32.fromSeed(seed, Networks.btc) as BIP32Interface
//
//     return {
//         network: Networks.btc,
//         rootNode,
//         scripts: {
//             p2pkh: {
//                 node: rootNode.derivePath("m/44'/0'/0'"),
//                 path: "m/44'/0'/0'"
//             },
//             'p2sh-p2wpkh': {
//                 node: rootNode.derivePath("m/49'/0'/0'"),
//                 path: "m/49'/0'/0'"
//             }
//         }
//     }
// }
//
// export function getBTCXpub(wallet: Coin): string {
//     const scriptType = 'p2sh-p2wpkh'
//     const script = wallet.scripts[scriptType]
//
//     return script.node.neutered().toBase58()
// }
//
// export function getBTCAddress(wallet: Coin, bip32Path: string): string {
//     const keyPair = bitcoin.ECPair.fromWIF(
//         wallet.rootNode.derivePath(bip32Path).toWIF()
//     ) as ECPairInterface
//
//     return bitcoin.payments.p2sh({
//         redeem: bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey })
//     }).address
// }
//
// function getSegWitAddress(pubkey: Buffer, network: bitcoin.networks.Network): string {
//     return bitcoin.payments.p2sh({
//         redeem: bitcoin.payments.p2wpkh({ pubkey, network })
//     }).address
// }
//
// function getNativeSegWitAddress(pubkey: Buffer, network: bitcoin.networks.Network): string {
//     return bitcoin.payments.p2wpkh({ pubkey, network }).address
// }
//
// function getLegacyAddress(pubkey: Buffer, network: bitcoin.networks.Network): string {
//     return bitcoin.payments.p2pkh({ pubkey, network }).address
// }
//
// export async function buildAndSignTx(tx: UnsignedUtxoTransaction): Promise<string> {
//     const mnemonic = await SecureStore.getItemAsync('mnemonic')
//
//     if (mnemonic) {
//         const wallet = await getBTCWallet(mnemonic)
//         const txBuilder = new bitcoin.TransactionBuilder(wallet.network) as TransactionBuilder
//
//         tx.inputs.forEach(input =>
//             txBuilder.addInput(
//                 input.txid,
//                 input.vout,
//                 null,
//                 input.scriptType === 'p2wpkh' && input.tx
//                     ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                     Buffer.from((tx as any).vout[input.vout].scriptPubKey.hex, 'hex')
//                     : undefined
//             )
//         )
//
//         await Promise.all(
//             tx.outputs.map(async output => {
//                 if (output.addressNList) {
//                     const path = addressNListToBIP32(output.addressNList)
//                     const privateKey = wallet.rootNode.derivePath(path).toWIF()
//                     const keyPair = bitcoin.ECPair.fromWIF(privateKey, wallet.network) as ECPairInterface
//
//                     let address: string
//                     if (output.scriptType === 'p2wpkh') {
//                         address = getNativeSegWitAddress(keyPair.publicKey, wallet.network)
//                     } else if (output.scriptType === 'p2sh-p2wpkh') {
//                         address = getSegWitAddress(keyPair.publicKey, wallet.network)
//                     } else {
//                         address = getLegacyAddress(keyPair.publicKey, wallet.network)
//                     }
//
//                     txBuilder.addOutput(address, Number(output.amount))
//                 } else if (output.address) {
//                     txBuilder.addOutput(output.address, Number(output.amount))
//                 }
//             })
//         )
//
//         await Promise.all(
//             tx.inputs.map(async (input, idx) => {
//                 const path = addressNListToBIP32(input.addressNList)
//                 const privateKey = wallet.rootNode.derivePath(path).toWIF()
//                 const keyPair = bitcoin.ECPair.fromWIF(privateKey, wallet.network)
//
//                 switch (input.scriptType) {
//                     case 'p2wpkh':
//                         txBuilder.sign(idx, keyPair, undefined, undefined, Number(input.amount))
//                         break
//                     case 'p2sh-p2wpkh': {
//                         const p2wpkh = bitcoin.payments.p2wpkh({
//                             pubkey: keyPair.publicKey,
//                             network: wallet.network
//                         })
//                         const p2sh = bitcoin.payments.p2sh({ redeem: p2wpkh, network: wallet.network })
//                         txBuilder.sign(idx, keyPair, p2sh.redeem.output, undefined, Number(input.amount))
//                         break
//                     }
//                     case 'p2sh':
//                     default:
//                         txBuilder.sign(idx, keyPair)
//                         break
//                 }
//             })
//         )
//
//         const signedTx = txBuilder.build()
//         const serializedTx = signedTx.toHex()
//
//         return serializedTx
//     } else {
//         throw new Error('Wallet does not exist')
//     }
// }
//
// export function getBTCAddressFromNList(wallet: Coin, addressNList: number[]): string {
//     const bip32Path = addressNListToBIP32(addressNList)
//     return getBTCAddress(wallet, bip32Path)
// }
