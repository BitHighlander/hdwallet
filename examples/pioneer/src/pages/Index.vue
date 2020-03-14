<template>
  <div class="q-pa-md">

    <div v-if="openWallet">
      <div>
        <h4>Wallet Info: </h4>
        {{xpubs}}

        <q-btn color="primary" label="Get Xpubs:" @click="getXpubs" class="q-mt-md">
        </q-btn>

      </div>
    </div>

    <div v-if="openSelectLanguage">
      <div>
        <h4>Language: </h4>


      </div>
    </div>

		<div v-if="openWelcome">
      <div>

        <q-btn color="primary" @click="createNewWallet" label="Create New Wallet" class="q-mt-md">
          <q-tooltip content-class="bg-accent">Start a fresh wallet</q-tooltip>
        </q-btn>

        <!-- <q-btn color="primary" label="Configure Hardware Wallet" class="q-mt-md">
          <q-tooltip content-class="bg-accent">Keepkey, Ledger and Trezor wallets supported</q-tooltip>
        </q-btn> -->

        <q-btn color="primary" @click="openRestore" label="Import Seed Phrase" class="q-mt-md">
          <q-tooltip content-class="bg-accent">Restore Software wallet</q-tooltip>
        </q-btn>

      </div>
    </div>

    <div v-if="openCreateNewWallet">
      <div>
        <h3>Create a new wallet:</h3>
        <form>
          <div class="field">
            <label class="label">{{ $t("msg.password") }}</label>
            <div class="control">
              <input class="input" type="password" placeholder="********" required
                     :class="{'is-warning': error}" v-model="password">
            </div>
            <p class="help is-warning" v-if="error">{{ $t("msg.wrongPassword") }}</p>
          </div>

          <div class="field">
            <button class="button is-link" @click.prevent="tryCreateNewWallet">
              {{ $t("msg.login_") }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="openPassword">
        <form>
        <div class="field">
        <label class="label">{{ $t("msg.password") }}</label>
        <div class="control">
        <input class="input" type="password" placeholder="********" required
        :class="{'is-warning': error}" v-model="password">
        </div>
        <p class="help is-warning" v-if="error">{{ $t("msg.wrongPassword") }}</p>
        </div>

        <div class="field">
        <button class="button is-link" @click.prevent="tryLogin">
        {{ $t("msg.login_") }}
        </button>
        </div>
        </form>
    </div>

    <div v-if="openPasswordAgain">
      <form>
        <div class="field">
          <label class="label">{{ $t("msg.passwordAgain") }}</label>
          <div class="control">
            <input class="input" type="password" placeholder="********" required
                   :class="{'is-warning': error}" v-model="password2">
          </div>
          <p class="help is-warning" v-if="error">{{ $t("msg.wrongPassword") }}</p>
        </div>

        <div class="field">
          <button class="button is-link" @click.prevent="generateWallet">
            {{ $t("msg.login_") }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="openViewSeed">
      <div>
        Seed: {{mnemonic}}
      </div>
    </div>

  </div>
</template>

<script lang="ts">

import bcrypt from 'bcryptjs';
//import Cryptr from 'cryptr';
import SimpleCrypto from 'simple-crypto-js';
import * as Bip39 from 'bip39';


import * as debug from 'debug'

import {
  Keyring,
  supportsETH,
  supportsBTC,
  supportsCosmos,
  supportsDebugLink,
  bip32ToAddressNList,
  Events
} from '@bithighlander/hdwallet-core'

import { isKeepKey } from '@bithighlander/hdwallet-keepkey'
import { isPortis } from '@bithighlander/hdwallet-portis'

import { WebUSBKeepKeyAdapter } from '@bithighlander/hdwallet-keepkey-webusb'
import { TCPKeepKeyAdapter } from '@bithighlander/hdwallet-keepkey-tcp'
import { TrezorAdapter } from '@bithighlander/hdwallet-trezor-connect'
import { WebUSBLedgerAdapter } from '@bithighlander/hdwallet-ledger-webusb'
import { PortisAdapter } from '@bithighlander/hdwallet-portis'
import { PioneerAdapter } from '@bithighlander/hdwallet-pioneer'

import {
  BTCInputScriptType,
  BTCOutputScriptType,
  BTCOutputAddressType,
} from '@bithighlander/hdwallet-core/src/bitcoin'

const keyring = new Keyring()
const portisAppId = 'ff763d3d-9e34-45a1-81d1-caa39b9c64f9'

const keepkeyAdapter = WebUSBKeepKeyAdapter.useKeyring(keyring)
const kkemuAdapter = TCPKeepKeyAdapter.useKeyring(keyring)
const portisAdapter = PortisAdapter.useKeyring(keyring, { portisAppId })
const pioneerAdapter = PioneerAdapter.useKeyring(keyring,{})

const log = debug.default('hdwallet')

import Vue from 'vue'

import {
  initWallet,
  initConfig,
  getConfig,
  getWallet,
  checkConfigs
} from './config'

export default Vue.extend({
  name: 'PageIndex',
  data () {
    return {
      mnemonic:'',
      step: 1,
      bitcoinMaster:'',
      password:'',
      password2:'',
      error:'',
      errorInfo:'',
      openSelectLanguage:false,
      openWallet:false,
      isNewWallet:false,
      openWelcome:false,
      openPassword:false,
      openPasswordAgain:false,
      openViewSeed:false,
      openCreateNewWallet:false,
      //Import
      wallet:{},
      isLoading:false,
      runtime:'',
      isAdvancedMode:false,
      blockAnimated:false,
      syncStatus:'syncing',
      coins:['btc','dash','ltc','doge'],
      isRunning: true,
      xpubs:[],
      addresses:[],
      balance:0,
    }
  },
  mounted() {

    /*
				Setup stages

				isRightVersion?

				do I have a wallet already?
				  if not, setup(welcome)

				verifyPassword
				  else offer new wallet

				do I have a config file?
				  Should always

				does config file have a username?
				  else register

			 */

    console.log('checkpoint 1 mounted')

    //this.checkNewVersion()
    //console.log("checkpoint 2 passed version check")

    //detect configs
    this.loadConfig()


  },
  methods: {
    openRestore: function () {
      this.$router.push({ path: 'restore' })
    },
    loadConfig: function () {
      let configStatus = checkConfigs()
      let config = getConfig()
      console.log('config: ', config)
      if (!configStatus.isConfigured) {
        console.log('checkpoint 3 No config found!')
        //open settings modal
        this.openWelcome = true
      } else {
        console.log('checkpoint 3a config found!')
        this.openPassword = true
      }
    },
    getXpubs: async function () {
      try{
        //
        // Get Ethereum path
        //const { hardenedPath } = this.wallet.ethGetAccountPaths({coin: 'Ethereum', accountIdx: 0})[0]

        const result = await this.wallet.getPublicKeys([
          {
            addressNList: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 0],
            curve: 'secp256k1',
            showDisplay: true, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
            coin: 'Bitcoin'
          },
          {
            addressNList: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 1],
            curve: 'secp256k1',
            showDisplay: true, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
            coin: 'Bitcoin'
          },
          {
            addressNList: [0x80000000 + 49, 0x80000000 + 0, 0x80000000 + 0],
            curve: 'secp256k1',
            showDisplay: true, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
            coin: 'Bitcoin',
            scriptType: BTCInputScriptType.SpendP2SHWitness
          },
          {
            addressNList: [0x80000000 + 44, 0x80000000 + 2, 0x80000000 + 0],
            curve: 'secp256k1',
            showDisplay: true, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
            coin: 'Litecoin'
          },
          // {
          //   addressNList: hardenedPath,
          //   curve: 'secp256k1',
          //   showDisplay: true, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
          //   coin: 'Ethereum'
          // }
        ])
        console.log('get Xpubs: ',result)
        this.xpubs = result
      }catch(e){
        console.error(e)
      }
    },
    loadWallet: async function () {
      try{
        //

        let wallet = await pioneerAdapter.pairDevice()
        this.wallet = wallet
        console.log('wallet: ',wallet)
        wallet.loadDevice({ mnemonic:this.mnemonic })

      }catch(e){
        console.error(e)
      }
    },
    generateWallet: async function(){
      try{
        //close password2
        this.openPasswordAgain = false

        //verify not empty
        if(this.password.length == 0 ){
          this.error = true
          this.errorInfo = this.$t('msg.create.errorPasswdEmpty')
          return
        }

        //verify both password match
        if(this.password !== this.password2 ){
          this.error = true
          this.errorInfo = this.$t('msg.create.errorPasswdConsistency')
          return
        }

        //make seed
        let seed = Bip39.generateMnemonic()
        console.log('new Seed! ',seed)
        this.mnemonic = seed
        //make hash
        const hash = await bcrypt.hash(this.password, 10);

        let simpleCrypto = new SimpleCrypto(this.password);
        console.log('simpleCrypto: ',simpleCrypto)

        let encryptedString = simpleCrypto.encrypt(seed);

        //init wallet
        await initWallet(encryptedString,hash)

        //make config
        await initConfig('english')

        //load
        this.loadWallet()
      }catch(e){
        console.error(e)
      }
    },
    createNewWallet: function(){
      console.log('Create new wallet!')
      console.log('bip39:',Bip39)
      //open password
      this.isNewWallet = true
      this.openWelcome = false
      this.openCreateNewWallet = true
    },
    tryCreateNewWallet: function(){
      //TODO allow empty pw?
      //open password2
      this.openCreateNewWallet = false
      this.openPasswordAgain = true
    },
    async tryLogin() {
      console.log('tryLogin: ')
      let password = this.password
      console.log('password: ',password)

      //read seed from config
      let wallet = getWallet()
      wallet = JSON.parse(wallet)
      console.log('wallet: ',wallet)

      //validate pw
      let isValid = await bcrypt.compare(password, wallet.hash); // true
      console.log('isValid: ',isValid)

      if(isValid){
        console.log('login!')
        //this.openPassword = false
        console.log('password: ',password)

        //decrypt!
        let simpleCrypto = new SimpleCrypto(password);
        console.log('simpleCrypto: ',simpleCrypto)
        console.log('vault: ',wallet.vault)

        let mnemonic = simpleCrypto.decrypt(wallet.vault);
        console.log('mnemonic: ',mnemonic)

        //load hdwallet

        this.openWallet = true
        this.openPassword = false

        //load
        this.loadWallet()

      }else{
        this.error = true
        this.errors['Invalid Password!']
      }
    },
  }

})
</script>
