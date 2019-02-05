<template>
  <div class="home">
    <b-badge class="node-badge" v-if="connected" variant="success">{{ connected }}</b-badge>
    <div class="container">
      <b-modal v-model="importShow" hide-footer title="Import a wallet">
        Just drag and drop here or select a .sid file
        <input type="file" @change="loadWalletFromFile">
      </b-modal>
      <div class="row" v-if="!user">
        <div class="col-12">
          <h2>:(<br>No wallet detected<br><h6>Please start creating a new wallet or import an exsisting one.</h6></h2>
          <b-form-input v-model="createPwd" style="margin-bottom:15px" type="password" placeholder="Enter a strong wallet password and don't forget it!"></b-form-input>
          <div @click.prevent="createWallet" class="btn btn-primary">CREATE WALLET</div> 
          <div @click.prevent="openImportWallet" style="margin-left:15px" class="btn btn-primary">IMPORT WALLET</div>
        </div>
      </div>
      <div v-if="user">
        <b-modal v-model="passwordShow" hide-footer title="Unlock your wallet first">
          <b-form-input v-model="unlockPwd" type="password" placeholder="Enter wallet password"></b-form-input><br>
          <div @click.prevent="unlockWallet" class="btn btn-primary">UNLOCK WALLET</div>
        </b-modal>
        <div class="row">
          <div class="col-sm-8 col-12 text-left">
            <h6>
              This is the encrypted version, 
              <a @click.prevent="downloadWallet" href="#">store it in your device</a> or 
              <a @click.prevent="printWallet" href="#">print it</a>.
            </h6>
            <a id="downloadsid" style="display:none"></a>
            <div class="wallet-block">
              {{ public_address }}:{{ encrypted_wallet }}
            </div><br>
            <h6>This is the decrypted version (please do not store unencrypted values)</h6>
            <div class="wallet-block">
              {{ decrypted_wallet }}
            </div><br>
            <div @click.prevent="openUnlockWallet" class="btn btn-primary">UNLOCK WALLET</div>
          </div>
          <div class="col-sm-4 col-12 text-center">
              <img :src="public_qrcode" width="100%">
              <strong>Account balance</strong><br>
              <h4 style="margin-bottom:0px">{{ address_balance }}</h4>
              <a :href="explorer_url" target="_blank">View history</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import jsPDF from 'jspdf'
const QRious = require('qrious')

export default {
  name: 'home',
  mounted : function(){
    this.checkIdaNodes()
    this.checkUser()
  },
  methods: {
      checkIdaNodes(){
        var checknodes = this.scrypta.returnNodes()
        const app = this
        for(var i = 0; i < checknodes.length; i++){
          this.axios.get('https://' + checknodes[i] + '/check')
          .then(function (response) {
             app.nodes.push(response.data.name)
             if(i == checknodes.length){
               app.connectToNode()
             }
          });
        }
      },
      connectToNode(){
        var app = this
        if(app.connected == ''){
          app.connected = app.nodes[Math.floor(Math.random()*app.nodes.length)];
          app.checkBalance()
        }
      },
      checkUser(){
        if(this.scrypta.keyExsist()){
          this.$emit('onFoundUser', this.scrypta.keyExsist(), this.scrypta.RAWsAPIKey)
          this.public_address = this.scrypta.PubAddress
          this.encrypted_wallet = this.scrypta.RAWsAPIKey
          var qr = new QRious({ value: this.scrypta.PubAddress, size: 500 });
          this.public_qrcode = qr.toDataURL()
          this.explorer_url = 'https://chainz.cryptoid.info/lyra/address.dws?' + this.scrypta.PubAddress + '.htm'
        }
      },
      openImportWallet(){
        this.importShow = true
      },
      loadWalletFromFile (ev) {
        const file = ev.target.files[0]
        const reader = new FileReader()
        var app = this
        reader.onload = function () {
          var dataKey = reader.result
          app.scrypta.saveKey(dataKey).then(function () {
            setTimeout(function () { location.reload() }, 1000)
          })
        }
        reader.readAsText(file)
      },
      createWallet(){
        var app = this
        if(this.createPwd !== ''){
          app.scrypta.createAddress(this.createPwd,true).then(function (response) {
            app.axios.post('https://' + app.connected + '/init', {
                address: response.pub,
                api_secret: response.api_secret
              })
              .then(function () {
                location.reload()
              })
              .catch(function () {
                alert("Seems there's a problem, please retry or change node!")
              });
          })
        }else{
          alert('Insert a password first!')
        }
      },
      openUnlockWallet(){
        this.passwordShow = true
      },
      unlockWallet(){
        if(this.unlockPwd !== ''){
          var app = this
          app.decrypted_wallet = 'WALLET LOCKED'
          app.scrypta.readKey(this.unlockPwd).then(function (response) {
            if(response !== false){
              app.decrypted_wallet = JSON.stringify(response)
              app.passwordShow = false
            }else{
              alert('Wrong password!')
            }
          })
        }else{
          alert('Write your password first')
        }
      },
      checkBalance(){
        var app = this
        if(app.public_address !== ''){
          app.axios.post('https://' + app.connected + '/getbalance', {
                address: app.public_address
              })
              .then(function (response) {
                app.address_balance = response.data.data + ' LYRA'
              })
              .catch(function () {
                alert("Seems there's a problem, please retry or change node!")
              });
        }
      },
      downloadWallet(){
        if(this.encrypted_wallet !== ''){
          var a = document.getElementById("downloadsid");
          var file = new Blob([this.public_address+':'+this.encrypted_wallet], {type: 'sid'});
          a.href = URL.createObjectURL(file);
          a.download = this.public_address+'.sid';
          var clickEvent = new MouseEvent("click", {
              "view": window,
              "bubbles": true,
              "cancelable": false
          });
          a.dispatchEvent(clickEvent);
        }else{
          alert('Need a wallet first')
        }
      },
      printWallet(){
        if(this.decrypted_wallet !== 'WALLET LOCKED'){
          var doc = new jsPDF()
          doc.text('This is your paper wallet. Print it and don\'t share this informations.', 10, 10)
          
          doc.text('Encrypted wallet.', 57, 38)
          var qr = new QRious({ value: this.public_address+':'+this.encrypted_wallet, size: 500 });
          doc.addImage(qr.toDataURL(), 'JPEG', 55, 40, 100, 100);

          doc.text('Public address', 10, 158)
          qr = new QRious({ value: this.public_address, size: 500 });
          doc.addImage(qr.toDataURL(), 'JPEG', 10, 160, 60, 60);

          doc.text('Private key', 140, 158)
          var wallet = JSON.parse(this.decrypted_wallet)
          qr = new QRious({ value: wallet.prv, size: 500 });
          doc.addImage(qr.toDataURL(), 'JPEG', 140, 160, 60, 60);
          
          doc.save(this.public_address + '.pdf')
        }else{
          alert('Decrypt your wallet first')
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
      nodes: [],
      connected: '',
      encrypted_wallet: 'NO WALLET',
      decrypted_wallet: 'WALLET LOCKED',
      unlockPwd: '',
      createPwd: '',
      public_address: '',
      public_qrcode: '',
      address_balance: 'BALANCE UNKNOWN',
      explorer_url: '',
      passwordShow: false,
      importShow: false
    }
  }
}
</script>
<style>
  .wallet-block{
    background:#eee; padding:15px; text-align:left; border:1px solid #ccc; border-radius:5px; word-wrap: break-word;
  }
  .node-badge{
    position:fixed; bottom:-3px; font-size:10px; padding:8px; right:10px; z-index:9999;
  }
</style>