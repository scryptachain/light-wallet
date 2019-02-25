<template>
  <div class="home">
    <b-badge class="node-badge" v-if="connected" variant="success">{{ connected }}</b-badge>
    <div class="container">
      <b-modal v-model="passwordShow" hide-footer title="Unlock your wallet first">
        <b-form-input v-model="unlockPwd" type="password" placeholder="Enter wallet password"></b-form-input><br>
        <div @click.prevent="unlockWallet" class="btn btn-primary">UNLOCK WALLET</div>
      </b-modal>
      <div class="row">
        <div class="col-12" v-if="readreturn">
          <div style="float:left">
            <input type="checkbox" id="read_decrypt" v-model="decryptRead">
            <label for="read_decrypt">Decrypt data</label>
          </div>
          <div style="float:right">
            <button class="btn btn-primary" style="padding:3px 10px;" @click.prevent="readData">REFRESH</button>
          </div><br>
          <div v-for="item in readreturn" :key="item.uuid" class="text-left" style="border:1px solid #eee; padding:10px; margin-top:15px; -webkit-hyphens: auto; -moz-hyphens: auto; hyphens: auto;">
              <strong>UNIQUE IDENTIFIER:</strong> {{ item.uuid }} <br>
              <div v-if="item.collection !== ''">
                <strong>COLLECTION:</strong> {{ item.collection }} <br>
              </div>
              <div v-if="item.refID !== ''">
                <strong>REFERENCE:</strong> {{ item.refID }} <br>
              </div>
              <strong>BLOCK:</strong> {{ item.block }} <br>
              <strong>TIME:</strong> {{ item.time }} <br>
              <div v-if="item.text">
                <strong>TEXT:</strong> {{ item.text }} <br>
              </div>
              <div v-if="item.mimetype">
                <div v-if="item.mimetype === 'audio'">
                  <audio controls style="width:100%">
                    <source v-bind:src="item.data" type="audio/mpeg">
                    Your browser does not support the audio element.
                  </audio> 
                </div>
                <div v-if="item.mimetype === 'image'">
                  <img v-bind:src="item.data" width="100%">
                </div>
              </div>
              <div v-if="!item.mimetype">
                {{ item.data }}
              </div>
          </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script>
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
          app.readData()
        }
      },
      checkUser(){
        if(this.scrypta.keyExsist()){
          this.$emit('onFoundUser', this.scrypta.keyExsist(), this.scrypta.RAWsAPIKey)
          this.public_address = this.scrypta.PubAddress
          this.encrypted_wallet = this.scrypta.RAWsAPIKey
        }
      },
      openUnlockWallet(){
        if (this.fileToUpload !== '') {
          this.passwordShow = true
        }else{
          alert('Select a file first!')
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
              app.readData()
            }else{
              alert('Wrong password!')
            }
          })
        }else{
          alert('Write your password first')
        }
      },
      readData () {
        const app = this
        app.readerror = ''
        if(app.decryptRead === true && app.api_secret === ''){
          app.openUnlockWallet()
        }else{
          app.axios
            .post('https://' + app.connected + '/read', {
              api_secret: app.api_secret,
              decrypt: app.decryptRead,
              address: app.public_address,
              history: false
            })
            .then(function (response) {
              if(response.data.data !== "Provide api Secret first."){
                app.readreturn = response.data.data
                for(var i=0; i < app.readreturn.length; i++ ){
                  if(app.readreturn[i].is_file === true){
                    var hash = app.readreturn[i].ipfshash
                    app.retrieveInfo(hash,i)
                  }
                }
              }
            })
        }
      },
      retrieveInfo (hash, i) {
        const app = this
        app.axios.post('https://' + app.connected + '/ipfs/retrieve', {
          hash: hash
        })
        .then(function (response) {
            app.readreturn[i].mimetype = response.data.data.type
            app.readreturn[i].mimedetail = response.data.data.detai
            app.$forceUpdate()
        })
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
      decryptRead: false,
      api_secret: '',
      readreturn: []
    }
  }
}
</script>
<style>
  .node-badge{
    position:fixed; bottom:-3px; font-size:10px; padding:8px; right:10px; z-index:9999;
  }
</style>