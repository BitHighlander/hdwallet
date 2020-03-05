import Web3 from 'web3'
import {
    HDWallet,
    GetPublicKey,
    PublicKey,
    RecoverDevice,
    ResetDevice,
    Coin,
    Ping,
    Pong,
    LoadDevice,
    ETHWallet,
    ETHGetAddress,
    ETHSignTx,
    ETHGetAccountPath,
    ETHAccountPath,
    ETHSignMessage,
    ETHSignedMessage,
    ETHVerifyMessage,
    ETHSignedTx,
    DescribePath,
    PathDescription,
    addressNListToBIP32,
    Transport,
    Keyring,
    HDWalletInfo,
    ETHWalletInfo,
    BTCWallet,
    BTCGetAddress,
    BTCSignTx,
    BTCSignedTx,
    BTCSignMessage,
    BTCSignedMessage,
    BTCVerifyMessage,
    BTCInputScriptType,
    BTCGetAccountPaths,
    BTCAccountPath,
    BTCWalletInfo,
    slip44ByCoin
} from "@shapeshiftoss/hdwallet-core"
import * as eth from './ethereum'
import * as btc from './bitcoin'
import { isObject } from 'lodash';

// We might not need this. Leaving it for now to debug further
class PioneerTransport extends Transport {
    public getDeviceID() {
        return 'Pioneer:0'
    }

    public call (...args: any[]): Promise<any> {
        return Promise.resolve()
    }
}

export function isPioneer(wallet: HDWallet): wallet is PioneerHDWallet {
    return isObject(wallet) && (wallet as any)._isPioneer
}

export class PioneerHDWallet implements HDWallet, ETHWallet, BTCWallet {
    _supportsETH: boolean = true
    _supportsETHInfo: boolean = true
    _supportsBTCInfo: boolean = true
    _supportsBTC: boolean = true
    _supportsCosmosInfo: boolean = false
    _supportsCosmos: boolean = false
    _supportsDebugLink: boolean = false
    _isPioneer: boolean = true

    transport = new PioneerTransport(new Keyring())

    Pioneer: any
    web3: any
    info: PioneerHDWalletInfo & HDWalletInfo
    ethAddress: string

    // used as a mutex to ensure calls to Pioneer.getExtendedPublicKey cannot happen before a previous call has resolved
    PioneerCallInProgress: Promise<any> = Promise.resolve()

    constructor(Pioneer) {
        this.Pioneer = Pioneer
        this.web3 = new Web3(Pioneer.provider)
        this.info = new PioneerHDWalletInfo()
    }

    public async isLocked(): Promise<boolean> {
        return false
    }

    public getVendor(): string {
        return "Pioneer"
    }

    public getModel(): Promise<string> {
        return Promise.resolve('Pioneer')
    }

    public getLabel(): Promise<string> {
        return Promise.resolve('Pioneer')
    }

    public initialize(): Promise<any> {
        // no means to reset the state of the Pioneer widget
        // while it's in the middle of execution
        return Promise.resolve()
    }

    public hasOnDevicePinEntry(): boolean {
        return this.info.hasOnDevicePinEntry()
    }

    public hasOnDevicePassphrase(): boolean {
        return this.info.hasOnDevicePassphrase()
    }

    public hasOnDeviceDisplay(): boolean {
        return this.info.hasOnDeviceDisplay()
    }

    public hasOnDeviceRecovery(): boolean {
        return this.info.hasOnDeviceRecovery()
    }

    public hasNativeShapeShift(
        srcCoin: Coin,
        dstCoin: Coin
    ): boolean {
        return this.info.hasNativeShapeShift(srcCoin, dstCoin)
    }

    public clearSession(): Promise<void> {
        return this.Pioneer.logout()
    }

    public ping(msg: Ping): Promise<Pong> {
        // no ping function for Pioneer, so just returning Pong
        return Promise.resolve({ msg: msg.msg })
    }

    public sendPin(pin: string): Promise<void> {
        // no concept of pin in Pioneer
        return Promise.resolve()
    }

    public sendPassphrase(passphrase: string): Promise<void> {
        // cannot send passphrase to Pioneer. Could show the widget?
        return Promise.resolve()
    }

    public sendCharacter(charater: string): Promise<void> {
        // no concept of sendCharacter in Pioneer
        return Promise.resolve()
    }

    public sendWord(word: string): Promise<void> {
        // no concept of sendWord in Pioneer
        return Promise.resolve()
    }

    public cancel(): Promise<void> {
        // no concept of cancel in Pioneer
        return Promise.resolve()
    }

    public wipe(): Promise<void> {
        return Promise.resolve()
    }

    public reset(msg: ResetDevice): Promise<void> {
        return Promise.resolve()
    }

    public recover(msg: RecoverDevice): Promise<void> {
        // no concept of recover in Pioneer
        return Promise.resolve()
    }

    public loadDevice (msg: LoadDevice): Promise<void> {
        return this.Pioneer.importWallet(msg.mnemonic)
    }

    public describePath (msg: DescribePath): PathDescription {
        return this.info.describePath(msg)
    }

    public async getPublicKeys(msg: Array<GetPublicKey>): Promise<Array<PublicKey | null>> {
        const publicKeys = []
        this.PioneerCallInProgress = new Promise( async (resolve, reject) => {
            try {
                await this.PioneerCallInProgress
            } catch (e) {
                console.error(e)
            }
            for (let i = 0; i < msg.length; i++) {
                const { addressNList, coin } = msg[i];
                const bitcoinSlip44 = 0x80000000 + slip44ByCoin('Bitcoin')
                // TODO we really shouldnt be every using the "bitcoin" string parameter but is here for now to make it work with their btc address on their Pioneer wallet.
                const PioneerResult = await this.Pioneer.getExtendedPublicKey(addressNListToBIP32(addressNList), addressNList[1] === bitcoinSlip44 ? 'Bitcoin' : '')
                const { result, error } = PioneerResult
                if(error)
                    reject(error)
                publicKeys.push({ xpub: result })
            }
            resolve(publicKeys)
        })
        return this.PioneerCallInProgress
    }

    public async isInitialized (): Promise<boolean> {
        return true
    }

    public disconnect (): Promise<void> {
        return Promise.resolve()
    }

    public async btcGetAddress (msg: BTCGetAddress): Promise<string> {
        return btc.btcGetAddress(msg, this.Pioneer)
    }

    public async btcSignTx (msg: BTCSignTx): Promise<BTCSignedTx> {
        return btc.btcSignTx(msg, this.Pioneer)
    }

    public async btcSignMessage (msg: BTCSignMessage): Promise<BTCSignedMessage> {
        // Pioneer doesnt support this for btc
        return undefined
    }

    public async btcVerifyMessage (msg: BTCVerifyMessage): Promise<boolean> {
        return btc.btcVerifyMessage(msg)
    }

    public async btcSupportsCoin (coin: Coin): Promise<boolean> {
        return this.info.btcSupportsCoin(coin)
    }

    public async btcSupportsScriptType (coin: Coin, scriptType: BTCInputScriptType): Promise<boolean> {
        return this.info.btcSupportsScriptType(coin, scriptType)
    }

    public async btcSupportsSecureTransfer (): Promise<boolean> {
        return this.info.btcSupportsSecureTransfer()
    }

    public btcSupportsNativeShapeShift (): boolean {
        return this.info.btcSupportsNativeShapeShift()
    }

    public btcGetAccountPaths (msg: BTCGetAccountPaths): Array<BTCAccountPath> {
        return this.info.btcGetAccountPaths(msg)
    }

    public btcIsSameAccount (msg: Array<BTCAccountPath>): boolean {
        return this.info.btcIsSameAccount(msg)
    }

    public btcNextAccountPath (msg: BTCAccountPath): BTCAccountPath | undefined {
        return this.info.btcNextAccountPath(msg)
    }

    public async ethSupportsNetwork (chainId: number = 1): Promise<boolean> {
        return this.info.ethSupportsNetwork(chainId)
    }

    public async ethSupportsSecureTransfer (): Promise<boolean> {
        return this.info.ethSupportsSecureTransfer()
    }

    public ethSupportsNativeShapeShift (): boolean {
        return this.info.ethSupportsNativeShapeShift()
    }

    public async ethVerifyMessage (msg: ETHVerifyMessage): Promise<boolean> {
        return eth.ethVerifyMessage(msg, this.web3)
    }

    public ethNextAccountPath (msg: ETHAccountPath): ETHAccountPath | undefined {
        // Pioneer only supports one account for eth
        return this.info.ethNextAccountPath(msg)
    }

    public async ethSignTx (msg: ETHSignTx): Promise<ETHSignedTx> {
        return eth.ethSignTx(msg, this.web3, await this._ethGetAddress())
    }

    public async ethSignMessage (msg: ETHSignMessage): Promise<ETHSignedMessage> {
        return eth.ethSignMessage(msg, this.web3, await this._ethGetAddress())
    }

    public ethGetAccountPaths (msg: ETHGetAccountPath): Array<ETHAccountPath> {
        return this.info.ethGetAccountPaths(msg)
    }

    public async ethGetAddress (msg: ETHGetAddress): Promise<string> {
        if(msg.showDisplay === true) {
            this.Pioneer.showPioneer()
        }
        return this._ethGetAddress()
    }

    public async getDeviceID(): Promise<string> {
        return 'Pioneer:' + (await this._ethGetAddress())
    }

    public async getFirmwareVersion(): Promise<string> {
        return 'Pioneer'
    }

    public async _ethGetAddress(): Promise<string> {
        if(!this.ethAddress) {
            this.ethAddress = (await this.web3.eth.getAccounts())[0]
        }
        return this.ethAddress
    }

}

export class PioneerHDWalletInfo implements HDWalletInfo, ETHWalletInfo, BTCWalletInfo {
    _supportsBTCInfo: boolean = true
    _supportsETHInfo: boolean = true
    _supportsCosmosInfo: boolean = false

    public getVendor (): string {
        return "Pioneer"
    }

    public hasOnDevicePinEntry (): boolean {
        return true
    }

    public hasOnDevicePassphrase (): boolean {
        return true
    }

    public hasOnDeviceDisplay (): boolean {
        return true
    }

    public hasOnDeviceRecovery (): boolean {
        return true
    }

    public hasNativeShapeShift (srcCoin: Coin, dstCoin: Coin): boolean {
        // It doesn't... yet?
        return false
    }

    public describePath (msg: DescribePath): PathDescription {
        switch (msg.coin) {
            case 'Ethereum':
                return eth.describeETHPath(msg.path)
            case 'Bitcoin':
                return btc.describeUTXOPath(msg.path, msg.coin, msg.scriptType)
            default:
                throw new Error("Unsupported path")
        }
    }

    public async btcSupportsCoin (coin: Coin): Promise<boolean> {
        return btc.btcSupportsCoin(coin)
    }

    public async btcSupportsScriptType (coin: Coin, scriptType: BTCInputScriptType): Promise<boolean> {
        return btc.btcSupportsScriptType(coin, scriptType)
    }

    public async btcSupportsSecureTransfer (): Promise<boolean> {
        return Promise.resolve(false)
    }

    public btcSupportsNativeShapeShift (): boolean {
        return false
    }

    public btcGetAccountPaths (msg: BTCGetAccountPaths): Array<BTCAccountPath> {
        return btc.btcGetAccountPaths(msg)
    }

    public btcIsSameAccount (msg: Array<BTCAccountPath>): boolean {
        return false
    }

    public btcNextAccountPath (msg: BTCAccountPath): BTCAccountPath | undefined {
        return btc.btcNextAccountPath(msg)
    }

    public ethNextAccountPath (msg: ETHAccountPath): ETHAccountPath | undefined {
        // Pioneer only supports one account for eth
        return undefined
    }

    public async ethSupportsNetwork (chainId: number = 1): Promise<boolean> {
        return chainId === 1
    }

    public async ethSupportsSecureTransfer (): Promise<boolean> {
        return false
    }

    public ethSupportsNativeShapeShift (): boolean {
        return false
    }

    public ethGetAccountPaths (msg: ETHGetAccountPath): Array<ETHAccountPath> {
        return eth.ethGetAccountPaths(msg)
    }
}

export function info () {
    return new PioneerHDWalletInfo()
}

export type Pioneer = any

export function create (Pioneer: Pioneer): PioneerHDWallet {
    return new PioneerHDWallet(Pioneer)
}
