<template>
  <div class="q-pa-md">
    <q-stepper
      v-model="step"
      ref="stepper"
      color="primary"
      animated
    >
      <q-step
        :name="1"
        title="Wallet settings"
        icon="settings"
        :done="step > 1"
      >
        

      <div class="row">
      <div>Do you have a wallet you would like to import?</div>
      <div>
        <q-btn color="primary" label="Create New Wallet" class="q-mt-md">
          <q-tooltip content-class="bg-accent">Start a fresh wallet</q-tooltip>
        </q-btn>

        <q-btn color="primary" label="Configure Hardware Wallet" class="q-mt-md">
          <q-tooltip content-class="bg-accent">Keepkey, Ledger and Trezor wallets supported</q-tooltip>
        </q-btn>

        <q-btn color="primary" label="Import Seed Phrase" class="q-mt-md">
          <q-tooltip content-class="bg-accent">Restore Software wallet</q-tooltip>
        </q-btn>
      </div>
      </div>


      </q-step>

      <q-step
        :name="2"
        title="Configure Node Settings"
        caption="Optional"
        icon="create_new_folder"
        :done="step > 2"
      >
        Select Pioneer URL:
      </q-step>

      <q-step
        :name="3"
        title="Configure Privacy Settings"
        icon="assignment"
        disable
      >
        This step won't show up because it is disabled.
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation>
          <q-btn @click="$refs.stepper.next()" disable color="primary" :label="step === 4 ? 'Finish' : 'Continue'" />
          <q-btn v-if="step > 1" flat color="primary" @click="$refs.stepper.previous()" label="Back" class="q-ml-sm" />
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'PageIndex',
  data () {
    return {
      step: 1,
      stepOneComplete:false
    }
  }
})
</script>
