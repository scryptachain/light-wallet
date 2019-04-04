<template>
  <div class="home bg-light">
    <b-badge class="node-badge" v-if="connected" variant="success">{{ connected }}</b-badge>
    <b-modal v-model="passwordShow" hide-footer title="Unlock your wallet first">
      <b-form-input v-model="unlockPwd" type="password" placeholder="Enter wallet password"></b-form-input><br>
      <div @click.prevent="unlockWallet" class="btn btn-primary">UNLOCK WALLET</div>
    </b-modal>
    <b-modal id="uploadModal" title="Upload data" hide-footer>
      <Upload />
    </b-modal>
    <b-container fluid>
      <b-row>
        <b-col v-if="readreturn">
          <div style="float:left">
            <!-- <b-form-checkbox switch v-model="decryptRead" name="check-button">Decrypt data</b-form-checkbox> -->
              <b-button v-if="viewGrid" size="sm" variant="light" :pressed.sync="viewGrid" class="text-center"><font-awesome-icon icon="th" /></b-button>
              <b-button v-if="!viewGrid" size="sm" variant="light" :pressed.sync="viewGrid" class="text-center"><font-awesome-icon icon="list" /></b-button>
          </div>
          <div style="float:right">
            <b-button size="sm" variant="primary" v-b-modal.uploadModal class="text-center mr-2"><font-awesome-icon icon="upload" class="mr-2" />Upload</b-button>
            <b-button size="sm" variant="primary" @click.prevent="readData" class="text-center"><font-awesome-icon icon="sync" class="mr-2" />Refresh</b-button>
          </div>
        </b-col>
      </b-row>
      <b-row class="mt-3" v-if="!viewGrid">
        <b-col lg="4" v-for="item in readreturn" :key="item.uuid" class="text-left mb-3" style="-webkit-hyphens: auto; -moz-hyphens: auto; hyphens: auto;">
          <b-card>
            <b-card-body>
              <div class="mb-1">
                <small class="text-muted mr-3"><font-awesome-icon icon="clock" class="mr-1" />{{ item.time | moment("h:mm a") }}</small>
                <small class="text-muted"><font-awesome-icon icon="calendar" class="mr-1" />{{ item.time | moment("dddd, MMMM Do YYYY") }}</small>
              </div>
              <!-- <div v-if="item.collection !== ''" class="mb-1"><small class="text-muted">Collection:</small><br/>{{ item.collection }}</div>
              <div v-if="item.refID !== ''" class="mb-1"><small class="text-muted">Reference:</small><br />{{ item.refID }}</div> -->
              <div class="mb-1"><small class="text-muted">Unique identifier:</small><br/>{{ item.uuid }}</div>
              <div class="mb-1"><small class="text-muted">Block</small><br />{{ item.block }}</div>
              <div v-if="item.text" class="mb-1"><small class="text-muted">Text</small><br />{{ item.text }}</div>
              <div v-if="item.mimetype" class="mb-1">
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
              <div v-if="!item.mimetype" class="mb-1">
                {{ item.data }}
              </div>
            </b-card-body>
          </b-card>

        </b-col>
      </b-row>
      <b-row v-if="viewGrid">
        <b-col cols="12" class="pt-3">
          <b-table
            class="align-left"
            striped
            hover
            :items="tableItems"
            :fields="tableFields"
            :sort-by.sync="sortBy"
            :sort-desc.sync="sortDesc"
          >
            <template slot="actions">
              <b-button size="sm" class="mr-1">Show</b-button>
            </template>
            <template slot="dataModal">
              <b-modal v-model="passwordShow" hide-footer title="Record content">{ row.data }</b-modal>
            </template>
          </b-table>
        </b-col>
      </b-row>
    </b-container>

    <!-- <b-card-group columns>
      <b-card
         v-for="item in readreturn"
         :key="item.uuid"
      >
        <b-card-header>
          <small class="text-muted mr-3"><font-awesome-icon icon="clock" class="mr-1" />{{ item.time | moment("h:mm a") }}</small>
          <small class="text-muted"><font-awesome-icon icon="calendar" class="mr-1" />{{ item.time | moment("dddd, MMMM Do YYYY") }}</small>
        </b-card-header>
        <b-card-text>
          <div v-if="item.collection !== ''" class="mb-1"><small class="text-muted">Collection:</small><br/>{{ item.collection }}</div>
          <div v-if="item.refID !== ''" class="mb-1"><small class="text-muted">Reference:</small><br />{{ item.refID }}</div>
          <div class="mb-1"><small class="text-muted">Unique identifier:</small><br/>{{ item.uuid }}</div>
          <div class="mb-1"><small class="text-muted">Block</small><br />{{ item.block }}</div>
          <div v-if="item.text" class="mb-1"><small class="text-muted">Text</small><br />{{ item.text }}</div>
          <div v-if="item.mimetype" class="mb-1">
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
          <div v-if="!item.mimetype" class="mb-1">
            {{ item.data }}
          </div>
        </b-card-text>
      </b-card>
    </b-card-group> -->
  </div>
</template>

<script>
import Upload from './Upload'

export default {
  name: 'home',
  mounted : function(){
    this.checkIdaNodes()
    this.checkUser()
  },
  components: {
    Upload
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
                app.returnTableItems()
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
      },
      returnTableItems() {
        const app = this
        for(var i=0; i < app.readreturn.length; i++ ){
          app.tableItems.push({
              uuid: app.readreturn[i].uuid,
              block: app.readreturn[i].block,
              date: app.$moment.unix(app.readreturn[i].time).format("hh:mm a, MM/DD/YYYY"),
              data: app.readreturn[i].data,
          })
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
      decryptRead: false,
      api_secret: '',
      readreturn: [],
      tableItems: [],
      tableFields: [
        { key: 'uuid', label: 'Unique Identifier', class: 'text-left' },
        { key: 'block', label: 'Block', class: 'text-left' },
        { key: 'date', label: 'Date', sortDirection: 'desc', class: 'text-left' },
        { key: 'actions', label: 'Actions', class: 'text-right' }
      ],
      sortBy: 'date',
      sortDesc: true,
      viewGrid: false,
      chooseViewIcon: "upload",
    }
  }
}
</script>
<style>
  .node-badge{
    position:fixed; bottom:-3px; font-size:10px; padding:8px; right:10px; z-index:9999;
  }
</style>
