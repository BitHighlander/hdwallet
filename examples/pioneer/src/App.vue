<template>
  <div id="q-app">
    <router-view/>
  </div>
</template>

<script lang="ts">

import * as debug from 'debug'

import {
  Keyring,
  supportsETH,
  supportsBTC,
  supportsCosmos,
  supportsDebugLink,
  bip32ToAddressNList,
  Events
} from '@shapeshiftoss/hdwallet-core'

import { isKeepKey } from '@shapeshiftoss/hdwallet-keepkey'
import { isPortis } from '@shapeshiftoss/hdwallet-portis'

import { WebUSBKeepKeyAdapter } from '@shapeshiftoss/hdwallet-keepkey-webusb'
import { TCPKeepKeyAdapter } from '@shapeshiftoss/hdwallet-keepkey-tcp'
import { TrezorAdapter } from '@shapeshiftoss/hdwallet-trezor-connect'
import { WebUSBLedgerAdapter } from '@shapeshiftoss/hdwallet-ledger-webusb'
import { PortisAdapter } from '@shapeshiftoss/hdwallet-portis'

import {
  BTCInputScriptType,
  BTCOutputScriptType,
  BTCOutputAddressType,
} from '@shapeshiftoss/hdwallet-core/src/bitcoin'

const keyring = new Keyring()
const portisAppId = 'ff763d3d-9e34-45a1-81d1-caa39b9c64f9'

const keepkeyAdapter = WebUSBKeepKeyAdapter.useKeyring(keyring)
const kkemuAdapter = TCPKeepKeyAdapter.useKeyring(keyring)
const portisAdapter = PortisAdapter.useKeyring(keyring, { portisAppId })

const log = debug.default('hdwallet')

// TODO this blows up ts rules
// keyring.onAny((name: string[], ...values: any[]) => {
//   const [[ deviceId, event ]] = values
//   const { from_wallet = false, message_type } = event
//   let direction = from_wallet ? '🔑' : '💻'
//   debug.default(deviceId)(`${direction} ${message_type}`, event)
// })

// const trezorAdapter = TrezorAdapter.useKeyring(keyring, {
//   debug: false,
//   manifest: {
//     email: 'oss@shapeshiftoss.io',
//     appUrl: 'https://shapeshift.com'
//   }
// })

// const ledgerAdapter = WebUSBLedgerAdapter.useKeyring(keyring)

import Vue from 'vue'

export default Vue.extend({
  name: 'App'
})
</script>
