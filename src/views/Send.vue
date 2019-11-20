<template>
  <!-- <b-badge class="node-badge" v-if="connected" variant="success">{{ connected }}</b-badge> -->
  <b-container fluid class="text-left">
    <b-modal v-model="passwordShow" hide-footer :title=translations.send.unlock_wallet_first>
      <b-form-input v-model="unlockPwd" type="password" :placeholder=translations.send.enter_wallet_password></b-form-input><br>
      <div @click.prevent="unlockWallet" class="btn btn-primary">{{ translations.general.unlock_wallet }}</div>
    </b-modal>
    <b-row>
      <b-col>
        <b-form-group id="address" label="Address" label-for="addressInput">
          <b-form-input
            id="addressInput"
            type="text"
            v-model="addressToSend"
            required
            :placeholder=translations.send.insert_address />
        </b-form-group>
        <b-form-group id="amount" label="Amount" label-for="amountInput">
          <b-form-input
            id="amountToSend"
            type="number"
            v-model="amountToSend"
            required
            :placeholder=translations.send.insert_amount />
        </b-form-group>
        <!--
        <b-form-group id="message" label="Message" label-for="messageTextarea">
          <b-form-textarea
            id="messageTextarea"
            v-model="messageToSend"
            placeholder="Write an unecrypted message (Max 80 characters)"
            rows="3"
            max-rows="6"
          />
        </b-form-group>
        -->
        <button v-if="!isSending" class="btn btn-primary float-right mt-3 mb-3" @click.prevent="openUnlockWallet">{{ translations.general.send }}</button>
      </b-col>
    </b-row>
    <b-row v-if="isSending">
      <b-col class="text-center">{{ translations.send.sending }}</b-col>
    </b-row>
  </b-container>
</template>

<script>
import locales from '../locales.js'

export default {
  name: 'send',
  mounted : async function(){
    this.connected = await this.scrypta.connectNode()
    this.checkUser()
    const app = this
    let language = navigator.language.split('-')
    if(locales[language[0]] !== undefined){
      app.translations = locales[language[0]]
    }else{
      app.translations = locales['en']
    }
  },
  methods: {
      checkUser(){
        if(this.scrypta.keyExist()){
          this.$emit('onFoundUser', this.scrypta.keyExist(), this.scrypta.RAWsAPIKey)
          this.public_address = this.scrypta.PubAddress;
          this.encrypted_wallet = this.scrypta.RAWsAPIKey;
        }
      },
      openUnlockWallet(){
        if (this.addressToSend !== '' && this.amountToSend !== '' && this.amountToSend > 0) {
          this.passwordShow = true
        }else{
          alert('Write the form first!')
        }
      },
      unlockWallet(){
        if(this.unlockPwd !== ''){
          var app = this
          app.decrypted_wallet = 'WALLET LOCKED'
          app.scrypta.readKey(this.unlockPwd).then(function (response) {
            if(response !== false){
              app.private_key = response.prv
              app.api_secret = response.api_secret
              app.passwordShow = false
              app.sendLyra()
            }else{
              alert(app.translations.general.password_incorrect)
            }
          })
        }else{
          alert(app.translations.general.password_incorrect)
        }
      },
      sendLyra(){
        const app = this
        if(app.isSending === false){
          if(app.messageToSend.length <= 80){
            app.isSending = true;
            app.scrypta.send(app.unlockPwd, app.addressToSend, parseFloat(app.amountToSend), '', app.public_address+ ':' +app.encrypted_wallet).then(response => {
              alert(app.translations.send.successful + response)
              app.addressToSend = '';
              app.amountToSend = '';
              app.messageToSend = '';
              app.private_key = '';
              app.unlockPwd = '';
              app.isSending = false;
            })
          }else{
            alert('Message is too long!')
          }
        }
      }
  },
  props: {
    user: null,
    rawapikey: null
  },
  data () {
    return {
      scrypta: window.ScryptaCore,
      axios: window.axios,
      translations: locales['en'],
      passwordShow: false,
      nodes: [],
      connected: '',
      encrypted_wallet: 'NO WALLET',
      decrypted_wallet: 'WALLET LOCKED',
      unlockPwd: '',
      public_address: '',
      fileToUpload: '',
      fileName: '',
      isSending: false,
      messageToSend: '',
      addressToSend: '',
      amountToSend: '',
      private_key: '',
      api_secret: ''
    }
  }
}
</script>
<style>
  .node-badge{
    position:fixed; bottom:-3px; font-size:10px; padding:8px; right:10px; z-index:9999;
  }
</style>
