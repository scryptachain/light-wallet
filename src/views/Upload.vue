<template>
  <div class="home">
    <b-badge class="node-badge" v-if="connected" variant="success">{{ connected }}</b-badge>
    <div class="container">
      <b-modal v-model="passwordShow" hide-footer title="Unlock your wallet first">
        <b-form-input v-model="unlockPwd" type="password" placeholder="Enter wallet password"></b-form-input><br>
        <div @click.prevent="unlockWallet" class="btn btn-primary">UNLOCK WALLET</div>
      </b-modal>
      <div class="row">
        <div class="col-sm-12" style="margin-bottom:20px;">        
          <h2>Upload data in the blockchain</h2>
          <input type="file" id="file" @change="loadFileData">
        </div>
        <div class="col-sm-6 col-12">
          <input type="text" placeholder="Collection" class="form-control" v-model="collectionToWrite"><br>
        </div>
        <div class="col-sm-6 col-12">
          <input type="text" placeholder="Reference ID" class="form-control" v-model="refIDToWrite"><br>
        </div>
        <div class="col-sm-12 col-12">
          <textarea type="text" placeholder="Write a text" style="height:100px;" class="form-control" v-model="textToWrite"></textarea><br>
        </div>
        <div class="col-sm-12">
          <input type="checkbox" id="encryptUpload" v-model="encryptUpload">
          <label for="encryptUpload">Encrypt Data</label>
        </div>
        <div class="col-sm-12" v-if="!isUploading">
          <button class="btn btn-primary" @click.prevent="openUnlockWallet">Upload</button>
        </div>
        <div class="col-sm-12" v-if="isUploading">
          Uploading, please wait..
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const fileReaderPullStream = require('pull-file-reader')
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
        }
      },
      checkUser(){
        if(this.scrypta.keyExsist()){
          this.$emit('onFoundUser', this.scrypta.keyExsist(), this.scrypta.RAWsAPIKey)
          this.public_address = this.scrypta.PubAddress;
          this.encrypted_wallet = this.scrypta.RAWsAPIKey;
        }
      },
      openUnlockWallet(){
        if (this.fileToUpload !== '' || this.textToWrite !== '') {
          this.passwordShow = true
        }else{
          alert('Select a file or write a text first!')
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
              app.uploadData()
            }else{
              alert('Wrong password!')
            }
          })
        }else{
          alert('Write your password first')
        }
      },
      loadFileData (ev) {
        const file = ev.target.files[0]
        this.fileToUpload = fileReaderPullStream(file)
        this.fileName = file.name
      },
      uploadData () {
        const app = this
        if (app.fileToUpload !== '' || app.textToWrite !== '') {
          app.isUploading = true
          var formData = new FormData();
          var imagefile = document.querySelector('#file');
          formData.append("file", imagefile.files[0]);
          formData.append("dapp_address", app.public_address);
          formData.append("api_secret", app.api_secret);
          formData.append("private_key", app.private_key);
          formData.append("encryption", app.encryptUpload);
          formData.append("collection", app.collectionToWrite);
          formData.append("data", app.textToWrite);
          formData.append("refID", app.refIDToWrite);

          app.axios.post('https://' + app.connected + '/write', formData, 
          {headers: {
            'Content-Type': 'multipart/form-data'
          }})
          .then(function (response) {
            console.log(response)
            if(response.data.status === 200){
              app.isUploading = false
              alert('Data written correctly!')
            }else{
              alert(app.data.data)
            }
          })
          .catch(function () {
            alert("Seems there's a problem, please retry or change node!")
          });
        } else {
          alert('Select a file or write a text first!')
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
      isUploading: false,
      dataToWrite: '',
      collectionToWrite: '',
      refIDToWrite: '',
      encryptUpload: true,
      private_key: '',
      api_secret: '',
      textToWrite: ''
    }
  }
}
</script>
<style>
  .node-badge{
    position:fixed; bottom:-3px; font-size:10px; padding:8px; right:10px; z-index:9999;
  }
</style>