<template>
  <!-- <b-badge class="node-badge" v-if="connected" variant="success">{{ connected }}</b-badge> -->
  <b-container fluid class="text-left">
    <b-modal v-model="passwordShow" hide-footer title="Unlock your wallet first">
      <b-form-input v-model="unlockPwd" type="password" placeholder="Enter wallet password"></b-form-input><br>
      <div @click.prevent="unlockWallet" class="btn btn-primary">UNLOCK WALLET</div>
    </b-modal>
    <b-row>
      <!-- <div class="col-sm-12" style="margin-bottom:20px;">
        <h2>Send LYRA</h2>
      </div> -->
      <b-col>
        <b-form-group id="address" label="Address" label-for="addressInput">
          <b-form-input
            id="addressInput"
            type="text"
            v-model="addressToSend"
            required
            placeholder="Enter a valid LYRA address" />
        </b-form-group>
        <b-form-group id="amount" label="Amount" label-for="amountInput">
          <b-form-input
            id="amountToSend"
            type="number"
            v-model="amountToSend"
            required
            placeholder="Amount you mean to send" />
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
        <button v-if="!isSending" class="btn btn-primary float-right mt-3 mb-3" @click.prevent="openUnlockWallet">SEND</button>
      </b-col>
    </b-row>
    <b-row v-if="isSending">
      <b-col class="text-center">Sending, please wait..</b-col>
    </b-row>
  </b-container>
</template>

<script>
export default {
  name: 'send',
  mounted : async function(){
    this.connected = await this.scrypta.connectNode()
    this.checkUser()
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
              alert('Wrong password!')
            }
          })
        }else{
          alert('Write your password first')
        }
      },
      sendLyra(){
        const app = this
        if(app.isSending === false){
          if(app.messageToSend.length <= 80){
            app.isSending = true;
            app.scrypta.send(app.unlockPwd, app.addressToSend, parseFloat(app.amountToSend), '', app.public_address+ ':' +app.encrypted_wallet).then(response => {
              alert('Send was successful, TXID is: ' + response)
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
