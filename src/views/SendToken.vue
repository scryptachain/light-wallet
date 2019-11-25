<template>
  <b-container fluid class="text-left">
    <h2>{{ translations.send.unlock_wallet_first }}</h2>
    <b-modal v-model="passwordShow" hide-footer :title=translations.send.unlock_wallet_first>
      <b-form-input v-model="unlockPwd" type="password" :placeholder=translations.send.enter_wallet_password></b-form-input><br>
      <div @click.prevent="unlockWallet" class="btn btn-primary">{{ translations.general.unlock_wallet }}</div>
    </b-modal>
    <b-row>
      <b-col>
        <b-form-group id="token" label="Token" label-for="tokenInput">
          <b-form-select v-model="tokenSelected" :options="tokenOptions"></b-form-select>
        </b-form-group>
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
  name: 'sendToken',
  mounted : async function(){
    this.connected = await this.scrypta.connectNode()
    await this.checkUser()
    this.fetchTokens()
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
      fetchTokens() {
        var app = this;
        if (app.public_address !== undefined && app.public_address !== "") {
          app.axios
            .post(app.connected + "/sidechain/scan/address", {
              dapp_address: app.public_address
            })
            .then(function(response) {
              if (response.data.data.length > 0) {
                app.tokenOptions = []
                app.tokens = response.data.data;
                let select = {
                  value: '',
                  text: app.translations.token.select_token
                }
                app.tokenOptions.push(select)
                for(let x in app.tokens){
                  let token = {
                    value: app.tokens[x].sidechain,
                    text: app.tokens[x].sidechain + ' (' + app.tokens[x].balance + ' ' + app.tokens[x].symbol + ')'
                  }
                  app.tokenOptions.push(token)
                }
              } 
            });
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
              app.pubkey = response.key
              app.passwordShow = false
              app.sendToken()
            }else{
              alert(app.translations.general.password_incorrect)
            }
          })
        }else{
          alert(app.translations.general.password_incorrect)
        }
      },
      async sendToken(){
        const app = this
        if(app.isSending === false){
          app.isSending = true;
          let balanceRequest = await app.axios.post(app.connected + '/sidechain/balance',{ dapp_address: app.public_address, sidechain_address: app.tokenSelected })
          let balance = balanceRequest.data.balance
          if(balance >= app.amountToSend){
            let sendRequest = await app.axios.post(app.connected + '/sidechain/send',
              {
                from: app.public_address, 
                sidechain_address: app.tokenSelected,
                private_key: app.private_key,
                pubkey: app.pubkey,
                to: app.addressToSend,
                amount: app.amountToSend
              })
            if(sendRequest.data.uuid !== undefined){
              alert(app.translations.token.send_success)
              app.private_key = ''
              app.pubkey = ''
              app.tokenSelected = ''
              app.addressToSend = ''
              app.amountToSend = ''
            }else{
              alert(app.translations.token.send_fail)
            }
            app.isSending = false
          }else{
            alert(app.translations.token.no_balance)
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
      tokenSelected: '',
      nodes: [],
      tokens: [],
      tokenOptions: [],
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
      pubkey: ''
    }
  }
}
</script>
<style>
  .node-badge{
    position:fixed; bottom:-3px; font-size:10px; padding:8px; right:10px; z-index:9999;
  }
</style>
