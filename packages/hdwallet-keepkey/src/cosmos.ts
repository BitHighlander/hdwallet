import {
  ATOMWallet,
  ATOMGetAddress,
  ATOMSignTx,
  ATOMSignedTx,
  ATOMGetAccountPath,
  ATOMAccountPath,
  BTCSignMessage,
  BTCGetAddress,
  Constructor,
  toHexString,
  fromHexString,
  arrayify,
  Event,
  Events,
  LONG_TIMEOUT,
  base64toHEX,
  slip44ByCoin,
  BTCInputScriptType,
} from '@shapeshiftoss/hdwallet-core'

import { KeepKeyTransport } from './transport'

import * as Messages from '@bithighlander/device-protocol/lib/messages_pb'
//import * as ProtoMessages from './device-protocol/messages_pb'
import * as ProtoMessages from '@bithighlander/device-protocol/lib/messages_pb'
import * as ProtoExchange from '@bithighlander/device-protocol/lib/exchange_pb'
import * as ProtoTypes from '@bithighlander/device-protocol/lib/types_pb'

import {
  toUTF8Array,
  translateInputScriptType,
  translateOutputScriptType
} from './utils'


const { default: { ExchangeType } } = ProtoMessages as any

// import javascript
// @ts-ignore
// @ts-ignore
import * as Ethereumjs from 'ethereumjs-tx'
const { default: EthereumTx } = Ethereumjs as any

/**
 * Mixin Constructor that adds ATOM support to a KeepKeyHDWallet
 */
export function KeepKeyATOMWallet<TBase extends Constructor>(Base: TBase) {
  return class KeepKeyATOMWallet extends Base implements ATOMWallet {
    _supportsATOM: boolean = true
    transport: KeepKeyTransport

    //TODO find cosmos chainId
    // public async cosmosSupportsNetwork (chain_id: number): Promise<boolean> {
    //   return true
    // }

    public async atomSupportsSecureTransfer (): Promise<boolean> {
      return true
    }

    public async atomSupportsNativeShapeShift (): Promise<boolean> {
      return true
    }

    public atomGetAccountPaths (msg: ATOMGetAccountPath): Array<ATOMAccountPath> {
      return [{
        hardenedPath: [ 0x80000000 + 44, 0x80000000 + slip44ByCoin(msg.coin), 0x80000000 + msg.accountIdx ],
        relPath: [ 0, 0 ],
        description: "KeepKey"
      }]
    }

    // public async atomGetAddress (msg: BTCGetAddress): Promise<string> {
    //   //TODO await ensureCoinSupport(this, msg.coin)
    //   console.log("checkpoint cosmos")
    //
    //   const GPK = new Messages.GetPublicKey();
    //   GPK.setCoinName(msg.coin)
    //   GPK.setAddressNList(msg.addressNList);
    //   GPK.setShowDisplay(msg.showDisplay || false)
    //   GPK.setEcdsaCurveName("secp256k1")
    //   GPK.setScriptType(BTCInputScriptType.SpendAddress))
    //
    //   const event = await this.transport.call(
    //     Messages.MessageType.MESSAGETYPE_GETPUBLICKEY,
    //     GPK,
    //     msg.showDisplay ? LONG_TIMEOUT : DEFAULT_TIMEOUT
    //   ) as Event
    //   if (event.message_type === Events.FAILURE) throw event
    //   const publicKey = event.proto as Messages.PublicKey
    //   console.log("publicKey: ",publicKey)
    //   return "publikkey"
    // }


    public async atomGetAddress (msg: BTCGetAddress): Promise<string> {
      //TODO await ensureCoinSupport(this, msg.coin)
      console.log("checkpoint cosmos")
      const addr = new Messages.GetAddress()
      addr.setAddressNList(msg.addressNList)
      addr.setCoinName(msg.coin)
      addr.setShowDisplay(msg.showDisplay || false)
      addr.setScriptType(translateInputScriptType(msg.scriptType || BTCInputScriptType.SpendAddress))

      console.log("checkpoint cosmos2")
      const response = await this.transport.call(Messages.MessageType.MESSAGETYPE_GETADDRESS, addr, LONG_TIMEOUT) as Event

      console.log("response: ",response)


      if(response.message_type === Events.FAILURE) throw response
      if(response.message_type === Events.CANCEL) throw response

      const btcAddress = response.proto as Messages.Address
      return btcAddress.getAddress()
    }

    // public async atomSignTx (msg: ATOMSignTx): Promise<ATOMSignedTx> {
    //   return this.transport.lockDuring(async () => {
    //
    //     return {serialized:"this:is:a:txid:bro"}
    //   })
    // }

    public async atomSignTx (msg: ATOMSignTx): Promise<ATOMSignedTx> {
      return this.transport.lockDuring(async () => {
        console.log("Checkpoint1 ")
        const est: ProtoMessages.CosmosSignTx = new ProtoMessages.CosmosSignTx()
        est.setAddressNList(msg.addressNList)
        est.setNonce(arrayify(msg.nonce))
        est.setGasPrice(arrayify(msg.gasPrice))
        est.setGasLimit(arrayify(msg.gasLimit))
        if (msg.value.match('^0x0*$') === null) {
          est.setValue(arrayify(msg.value))
        }

        console.log("Checkpoint2 ")
        if (msg.toAddressNList) {
          console.log("Checkpoint2a ")
          est.setAddressType(ProtoTypes.OutputAddressType.SPEND)
          est.setToAddressNList(msg.toAddressNList)
        } else if (msg.exchangeType) {
          console.log("Checkpoint2b ")
          est.setAddressType(ProtoTypes.OutputAddressType.EXCHANGE)

          const signedHex = base64toHEX(msg.exchangeType.signedExchangeResponse)
          const signedExchangeOut = ProtoExchange.SignedExchangeResponse.deserializeBinary(arrayify(signedHex))
          const exchangeType = new ExchangeType()
          exchangeType.setSignedExchangeResponse(signedExchangeOut)
          exchangeType.setWithdrawalCoinName(msg.exchangeType.withdrawalCoinName) // KeepKey firmware will complain if this doesn't match signed exchange response
          exchangeType.setWithdrawalAddressNList(msg.exchangeType.withdrawalAddressNList)
          exchangeType.setWithdrawalScriptType(translateInputScriptType(
            msg.exchangeType.withdrawalScriptType || BTCInputScriptType.SpendAddress))
          exchangeType.setReturnAddressNList(msg.exchangeType.returnAddressNList)
          exchangeType.setReturnScriptType(translateInputScriptType(
            msg.exchangeType.returnScriptType || BTCInputScriptType.SpendAddress))
          est.setExchangeType(exchangeType)
        } else {
          console.log("Checkpoint2c ")
          est.setAddressType(ProtoTypes.OutputAddressType.SPEND)
        }

        console.log("Checkpoint3 ")
        if (msg.to) {
          est.setTo(arrayify(msg.to))
        }

        let dataChunk = null
        let dataRemaining = undefined

        if (msg.data) {
          console.log("Checkpoint3a ")
          dataRemaining = arrayify(msg.data)
          est.setDataLength(dataRemaining.length)
          dataChunk = dataRemaining.slice(0, 1024)
          dataRemaining = dataRemaining.slice(dataChunk.length)
          est.setDataInitialChunk(dataChunk)
        }

        if (msg.chainId !== undefined) {
          est.setChainId(msg.chainId)
        }

        let response: ProtoMessages.CosmosTxRequest
        let nextResponse = await this.transport.call(ProtoMessages.MessageType.MESSAGETYPE_COSMOSSIGNTX, est, LONG_TIMEOUT, /*omitLock=*/true)
        if (nextResponse.message_enum === ProtoMessages.MessageType.MESSAGETYPE_FAILURE) {
          throw nextResponse
        }
        response = nextResponse.proto as ProtoMessages.CosmosTxRequest
        console.log("response:  ",response)
        try {
          while (response.hasDataLength()) {
            const dataLength = response.getDataLength()
            dataChunk = dataRemaining.slice(0, dataLength)
            dataRemaining = dataRemaining.slice(dataLength, dataRemaining.length)

            nextResponse = await this.transport.call(ProtoMessages.MessageType.MESSAGETYPE_COSMOSSIGNTX, est, LONG_TIMEOUT, /*omitLock=*/true)
            if (nextResponse.message_enum === ProtoMessages.MessageType.MESSAGETYPE_FAILURE) {
              throw nextResponse
            }
            response = nextResponse.proto as ProtoMessages.CosmosTxRequest
          }
        } catch(error) {
          console.error({ error })
          throw new Error('Failed to sign ATOM transaction')
        }

        const r = '0x' + toHexString(response.getSignatureR_asU8())
        const s = '0x' + toHexString(response.getSignatureS_asU8())
        const v = '0x' + response.getSignatureV().toString(16)

        const utx = {
          to: msg.to,
          value: msg.value,
          data: msg.data,
          chainId: msg.chainId,
          nonce: msg.nonce,
          gasLimit: msg.gasLimit,
          gasPrice: msg.gasPrice,
          r,
          s,
          v
        }

        const tx = new EthereumTx(utx)

        return {
          r,
          s,
          v: response.getSignatureV(),
          serialized: '0x' + toHexString(tx.serialize())
        }
      })
    }

  }
}
