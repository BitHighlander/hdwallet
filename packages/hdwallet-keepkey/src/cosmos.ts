import {
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

import * as ProtoMessages from '@keepkey/device-protocol/lib/messages_pb'
import * as ProtoExchange from '@keepkey/device-protocol/lib/exchange_pb'
import * as ProtoTypes from '@keepkey/device-protocol/lib/types_pb'

const { default: { ExchangeType } } = ProtoMessages as any

// import javascript
// @ts-ignore


/**
 * Mixin Constructor that adds ETH support to a KeepKeyHDWallet
 */
export function KeepKeyETHWallet<TBase extends Constructor>(Base: TBase) {
  return class KeepKeyETHWallet extends Base implements ETHWallet {
    _supportsETH: boolean = true
    transport: KeepKeyTransport

    //TODO find cosmos chainId
    // public async cosmosSupportsNetwork (chain_id: number): Promise<boolean> {
    //   return true
    // }

    public async cosmosSupportsSecureTransfer (): Promise<boolean> {
      return true
    }

    public async cosmosSupportsNativeShapeShift (): Promise<boolean> {
      return true
    }

    public cosmosGetAccountPaths (msg: ETHGetAccountPath): Array<ETHAccountPath> {
      return [{
        hardenedPath: [ 0x80000000 + 44, 0x80000000 + slip44ByCoin(msg.coin), 0x80000000 + msg.accountIdx ],
        relPath: [ 0, 0 ],
        description: "KeepKey"
      }]
    }

    public async cosmosSignTx (msg: ETHSignTx): Promise<ETHSignedTx> {
      return this.transport.lockDuring(async () => {

        return "fake:txid"
      })
    }

    public async cosmosGetAddress (msg: ETHGetAddress): Promise<string> {
      const getAddr = new ProtoMessages.EthereumGetAddress()
      getAddr.setAddressNList(msg.addressNList)
      getAddr.setShowDisplay(msg.showDisplay !== false)
      const response = await this.transport.call(ProtoMessages.MessageType.MESSAGETYPE_ETHEREUMGETADDRESS, getAddr, LONG_TIMEOUT)
      const cosmosAddress = response.proto as ProtoMessages.EthereumAddress

      if(response.message_type === Events.FAILURE) throw response

      let address = null
      if (cosmosAddress.hasAddressStr())
        address = cosmosAddress.getAddressStr()
      else if (cosmosAddress.hasAddress())
        address = '0x' + toHexString(cosmosAddress.getAddress_asU8())
      else
        throw new Error('Unable to obtain ETH address from device.')

      return address
    }

    //TODO
    // public async cosmosSignMessage (msg: ETHSignMessage): Promise<ETHSignedMessage> {
    //   const m = new ProtoMessages.EthereumSignMessage()
    //   m.setAddressNList(msg.addressNList)
    //   m.setMessage(toUTF8Array(msg.message))
    //   const response = await this.transport.call(ProtoMessages.MessageType.MESSAGETYPE_ETHEREUMSIGNMESSAGE, m, LONG_TIMEOUT) as Event
    //   const sig = response.proto as ProtoMessages.EthereumMessageSignature
    //   return {
    //     address: EIP55.encode('0x' + toHexString(sig.getAddress_asU8())), // FIXME: this should be done in the firmware
    //     signature: '0x' + toHexString(sig.getSignature_asU8())
    //   }
    // }
    //
    // public async cosmosVerifyMessage (msg: ETHVerifyMessage): Promise<boolean> {
    //   const m = new ProtoMessages.EthereumVerifyMessage()
    //   m.setAddress(arrayify(msg.address))
    //   m.setSignature(arrayify(msg.signature))
    //   m.setMessage(toUTF8Array(msg.message))
    //   const event = await this.transport.call(ProtoMessages.MessageType.MESSAGETYPE_ETHEREUMVERIFYMESSAGE, m, LONG_TIMEOUT) as Event
    //   const success = event.proto as ProtoMessages.Success
    //   return success.getMessage() === 'Message verified'
    // }
  }
}
