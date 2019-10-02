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
          <b-form-group id="encryptlabel" label="Encryption method" label-for="encrypt">
            <b-form-select id="encrypt" v-model="encryptUpload" :options="options"></b-form-select>
          </b-form-group>
          <b-form-group v-if="encryptUpload" id="password" label="Password" label-for="passwordInput">
            <b-form-input
              id="passwordInput"
              type="password"
              v-model="encryptionPassword"
              placeholder="Choose a password to encrypt your file"
              required />
          </b-form-group>
          <b-form-group id="file" label="File" label-for="fileInput">
            <b-form-file
              id="fileInput"
              placeholder="Select file to upload..."
              drop-placeholder="Drop file here..."
              @change="loadFileData"
              class="text-left"
            />
          </b-form-group>
          <b-form-group id="message" label="Message" label-for="messageTextarea">
            <b-form-textarea
              id="messageTextarea"
              v-model="textToWrite"
              placeholder="Write a text"
              rows="4"
              max-rows="6"
            />
          </b-form-group>
          <button v-if="!isUploading" class="btn btn-primary float-right mb-3" @click.prevent="openUnlockWallet">UPLOAD</button>
        </b-col>
      </b-row>
      <b-row v-if="isUploading">
        <b-col class="text-center"><small><b-spinner label="Loading..." class="mr-2"></b-spinner></small>{{ workingmessage }}</b-col>
      </b-row>
    </b-container>
</template>

<script>
export default {
  name: 'home',
  mounted : async function(){
    const app = this
    app.connected = await this.scrypta.connectNode()
    app.checkUser()
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
        this.fileToUpload = file
        this.fileName = file.name
      },
      async uploadData () {
        const app = this
        if (app.fileToUpload !== '' || app.textToWrite !== '') {
          app.isUploading = true
          var errors = false
          var message = ''
          var protocol = ''
          var refID = ''
          let config = {
            headers: {
              'Content-type': 'multipart/form-data',
            }
          }
          
          if(app.titleToWrite !== ''){
            refID = app.titleToWrite
          }
          
          if(app.fileToUpload !== ''){
            if(app.encryptUpload === true){
              const form_data = new FormData()
              app.workingmessage = 'Crypting file...'
              let crypted = await app.scrypta.cryptFile(app.fileToUpload,app.encryptionPassword)
              form_data.append("buffer", crypted)
              app.workingmessage = 'Uploading file to IPFS...'
              let ipfs = await app.axios.post(app.connected + '/ipfs/add', form_data, config)
              let hash = ipfs.data.data[0].hash
              if(hash !== undefined){
                app.workingmessage = 'Verifying IPFS file...'
                let buffer = await app.axios.get(app.connected + '/ipfs/buffer/' + hash)
                let data = buffer.data.data[0].content.data
                app.workingmessage = 'Verifying crypted file...'
                let decrypted = await app.scrypta.decryptFile(data, app.encryptionPassword)
                if(decrypted !== false){
                  message = 'ipfs:' + hash
                  protocol = 'E://'
                }else{
                  errors = true
                  alert('Something goes wrong encryption, please retry.')
                }
              }else{
                errors = true
                alert('Something goes wrong with IPFS, please make sure your file is less than 10MB.')
              }
            }else{
              const form_data = new FormData()
              form_data.append("file", app.fileToUpload)
              app.workingmessage = 'Uploading file to IPFS...'
              var ipfs = await app.axios.post(app.connected + '/ipfs/add', form_data, config)
              var hash = ipfs.data.data.hash
              if(hash !== undefined){
                message = 'ipfs:' + hash
              }else{
                errors = true
                alert('Something goes wrong with IPFS, please make sure your file is less than 10MB.')
              }
              if(app.textToWrite !== undefined){
                message += '***' + app.textToWrite
              }
            }
            
          }
          
          if(app.textToWrite !== '' && app.fileToUpload === ''){
            if(app.encryptUpload === true){
              app.workingmessage = 'Encrypting data...'
              let crypted = await app.scrypta.cryptData(app.textToWrite, app.encryptionPassword)
              app.workingmessage = 'Verifying data...'
              let decrypted = await app.scrypta.decryptData(crypted, app.encryptionPassword)
              if(decrypted === app.textToWrite){
                message = crypted
                protocol = 'E://'
              }else{
                alert('Something goes wrong with encryption, please retry!')
                errors = true
              }
            }else{
              message = app.textToWrite
            }
          }

          if(errors === false){
            app.workingmessage = 'Uploading data to the blockchain...'
            app.scrypta.write(app.unlockPwd, message, '', refID , protocol, app.public_address + ':' + app.encrypted_wallet).then(res => {
              if(res.uuid !== undefined){
                alert('Data written correctly into the blockchain, wait at least 2 minutes and refresh the page!')
                app.$emit('hide-upload')
                this.isUploading = false
              }else{
                alert('There\'s an error in the upload, please retry!')
                this.isUploading = false
              }
            }).catch(() => {
              alert('There\'s an error in the upload, please retry!')
              this.isUploading = false
            })
          }else{
            this.isUploading = false
          }
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
      options: [
        { value: false, text: 'Don\'t encrypt the data' },
        { value: true, text: 'Encrypt the data' }
      ],
      scrypta: window.ScryptaCore,
      axios: window.axios,
      passwordShow: false,
      workingmessage: '',
      nodes: [],
      connected: '',
      encrypted_wallet: 'NO WALLET',
      decrypted_wallet: 'WALLET LOCKED',
      unlockPwd: '',
      encryptionPassword: '',
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
