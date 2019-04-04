<template>
    <!-- <b-badge class="node-badge" v-if="connected" variant="success">{{ connected }}</b-badge> -->
    <b-container fluid class="text-left">
      <b-modal v-model="passwordShow" hide-footer title="Unlock your wallet first">
        <b-form-input v-model="unlockPwd" type="password" placeholder="Enter wallet password"></b-form-input><br>
        <div @click.prevent="unlockWallet" class="btn btn-primary">UNLOCK WALLET</div>
      </b-modal>
      <b-row>
        <b-col>
          <b-form-group id="title" label="Title" label-for="titleInput">
            <b-form-input
              id="titleInput"
              type="text"
              v-model="titleToWrite"
              required
              placeholder="Enter a title"
            />
          </b-form-group>
          <b-form-group id="file" label="File" label-for="fileInput">
            <b-form-file
              id="fileInput"
              placeholder="Upload data in the blockchain"
              drop-placeholder="Drop file here..."
              @change="loadFileData"
              class="text-left"
            />
          </b-form-group>
          <!-- <b-form-group id="collection" label="Collection" label-for="collectionInput">
            <b-form-input
              id="collectionInput"
              type="text"
              v-model="collectionToWrite"
              required
              placeholder="Enter collection name" />
          </b-form-group>
          <b-form-group id="referenceId" label="Reference ID" label-for="referenceIdInput">
            <b-form-input
              id="referenceIdInput"
              type="text"
              v-model="refIDToWrite"
              required
              placeholder="Enter your reference ID" />
          </b-form-group> -->
          <b-form-group id="message" label="Message" label-for="messageTextarea">
            <b-form-textarea
              id="messageTextarea"
              v-model="textToWrite"
              placeholder="Write a text"
              rows="3"
              max-rows="6"
            />
          </b-form-group>
          <b-form-checkbox switch v-model="encryptUpload" name="check-button" class="mb-2">Encrypt data</b-form-checkbox>
          <b-form-group v-if="encryptUpload" id="password" label="Password" label-for="passwordInput">
            <b-form-input
              id="passwordInput"
              type="password"
              placeholder="Choose a password to encrypt your file"
              required />
          </b-form-group>
          <b-form-group v-if="encryptUpload" id="passwordInput" label="Repeat Password" label-for="repeatPasswordinput" >
            <b-form-input
              id="repeatPasswordinput"
              type="password"
              placeholder="Confirm password you have choose"
              required />
          </b-form-group>
          <button v-if="!isUploading" class="btn btn-primary float-right mb-3" @click.prevent="openUnlockWallet">UPLOAD</button>
        </b-col>
      </b-row>
      <b-row v-if="isUploading">
        <b-col class="text-center"><small><b-spinner :variant="secondary" label="Loading..." class="mr-2"></b-spinner></small>Uploading, please wait..</b-col>
      </b-row>
    </b-container>
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
          var imagefile = document.querySelector('#fileInput');
          formData.append("file", imagefile.files[0]);
          formData.append("dapp_address", app.public_address);
          formData.append("api_secret", app.api_secret);
          formData.append("private_key", app.private_key);
          formData.append("encryption", app.encryptUpload);
          formData.append("collection", app.collectionToWrite);
          formData.append("data", app.textToWrite);
          formData.append("refID", app.titleToWrite);

          app.axios.post('https://' + app.connected + '/write', formData,
          {headers: {
            'Content-Type': 'multipart/form-data'
          }})
          .then(function (response) {
            if(response.data.data.txs !== undefined){
              app.isUploading = false
              app.dataToWrite = ''
              app.titleToWrite = ''
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
      titleToWrite: '',
      collectionToWrite: '',
      refIDToWrite: '',
      encryptUpload: false,
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
