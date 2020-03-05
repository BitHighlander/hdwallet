<template>
  <div id="q-app">
    <router-view/>
  </div>
</template>

<script>

// import {
//   Keyring,
//   supportsETH,
//   supportsBTC,
//   supportsCosmos,
//   supportsDebugLink,
//   bip32ToAddressNList,
//   Events
// } from '@shapeshiftoss/hdwallet-core'
//
// import { isKeepKey } from '@shapeshiftoss/hdwallet-keepkey'
// import { isPortis } from '@shapeshiftoss/hdwallet-portis'
//
// import { WebUSBKeepKeyAdapter } from '@shapeshiftoss/hdwallet-keepkey-webusb'
// import { TCPKeepKeyAdapter } from '@shapeshiftoss/hdwallet-keepkey-tcp'
// import { TrezorAdapter } from '@shapeshiftoss/hdwallet-trezor-connect'
// import { WebUSBLedgerAdapter } from '@shapeshiftoss/hdwallet-ledger-webusb'
// import { PortisAdapter } from '@shapeshiftoss/hdwallet-portis'
//
// import {
//   BTCInputScriptType,
//   BTCOutputScriptType,
//   BTCOutputAddressType,
// } from '@shapeshiftoss/hdwallet-core/src/bitcoin'
//
// const keyring = new Keyring()
// const keepkeyAdapter = WebUSBKeepKeyAdapter.useKeyring(keyring)
// const kkemuAdapter = TCPKeepKeyAdapter.useKeyring(keyring)
// const portisAdapter = PortisAdapter.useKeyring(keyring, { portisAppId })
//
// keyring.onAny((name: string[], ...values: any[]) => {
//   const [[ deviceId, event ]] = values
//   const { from_wallet = false, message_type } = event
//   let direction = from_wallet ? "🔑" : "💻"
//   debug.default(deviceId)(`${direction} ${message_type}`, event)
// })

export default {
  name: 'App'
}
</script>
