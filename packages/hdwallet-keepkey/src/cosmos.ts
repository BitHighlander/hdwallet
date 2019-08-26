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

import * as Messages from '@keepkey/device-protocol/lib/messages_pb'
import * as ProtoMessages from '@keepkey/device-protocol/lib/messages_pb'
import * as ProtoExchange from '@keepkey/device-protocol/lib/exchange_pb'
import * as ProtoTypes from '@keepkey/device-protocol/lib/types_pb'

import {
  toUTF8Array,
  translateInputScriptType,
  translateOutputScriptType
} from './utils'


const { default: { ExchangeType } } = ProtoMessages as any

// import javascript
// @ts-ignore


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

    public async atomSignTx (msg: ATOMSignTx): Promise<ATOMSignedTx> {
      return this.transport.lockDuring(async () => {

        return {serialized:"this:is:a:txid:bro"}
      })
    }

    // public async atomSignTx (msg: BTCSignMessage): Promise<BTCSignedMessage> {
    //   //await ensureCoinSupport(this, msg.coin)
    //   const sign = new Messages.SignMessage()
    //   sign.setAddressNList(msg.addressNList)
    //   sign.setMessage(toUTF8Array(msg.message))
    //   sign.setCoinName(msg.coin || 'Bitcoin')
    //   sign.setScriptType(translateInputScriptType(msg.scriptType || BTCInputScriptType.SpendAddress))
    //   const event = await this.transport.call(Messages.MessageType.MESSAGETYPE_SIGNMESSAGE, sign, LONG_TIMEOUT) as Event
    //   const messageSignature = event.proto as Messages.MessageSignature
    //   return {
    //     address: messageSignature.getAddress(),
    //     signature: toHexString(messageSignature.getSignature_asU8())
    //   }
    // }

  }
}
