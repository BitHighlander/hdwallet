<template>
  <div class="q-pa-md">

		<div v-if="openWelcome">
      <div>
        <q-btn color="primary" label="Create New Wallet" class="q-mt-md">
          <q-tooltip content-class="bg-accent">Start a fresh wallet</q-tooltip>
        </q-btn>

        <!-- <q-btn color="primary" label="Configure Hardware Wallet" class="q-mt-md">
          <q-tooltip content-class="bg-accent">Keepkey, Ledger and Trezor wallets supported</q-tooltip>
        </q-btn> -->

        <q-btn color="primary" label="Import Seed Phrase" class="q-mt-md">
          <q-tooltip content-class="bg-accent">Restore Software wallet</q-tooltip>
        </q-btn>
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

    <div v-if="openViewSeed">
      <div>
        Seed: {{mnemonic}}
      </div>
    </div>

  </div>
</template>

<script lang="ts">


import bcrypt from 'bcryptjs';
import Cryptr from 'cryptr';

import Vue from 'vue'

import {
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
      openWelcome:false,
      openPassword:false,
      openViewSeed:false
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
    async tryLogin() {
      console.log('tryLogin: ')
      let password = this.password
      console.log('password: ',password)
      const cryptr = new Cryptr(password);

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

        //decrypt!
        const cryptr = new Cryptr(password);

        console.log('vault: ',wallet.vault)

        let mnemonic = cryptr.decrypt(wallet.vault);
        console.log('mnemonic: ',mnemonic)
        // mnemonic = mnemonic.replace(/,/g, ' ');
        // mnemonic = mnemonic.trim()
        //
        // this.mnemonic = mnemonic

        //promt backup
        //this.openViewSeed = true


      }else{
        this.error = true
        this.errors['Invalid Password!']
      }
    },
  }

})
</script>
