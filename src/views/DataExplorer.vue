<template>
  <div class="home">
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
        <b-col md="6" lg="8" v-if="readreturn">
          <b-input-group>
            <b-form-input placeholder="Enter a public address to search"  v-on:change="searchByAddress" v-model="search_address"></b-form-input>
            <b-input-group-append>
              <b-button size="sm" v-on:click="searchByAddress" text="Button" variant="primary"><font-awesome-icon icon="search" class="ml-3 mr-3" /></b-button>
            </b-input-group-append>
          </b-input-group>
        </b-col>
        <b-col md="6" lg="4" v-if="readreturn">
          <div class="float-left">
            <!-- <b-form-checkbox switch v-model="decryptRead" name="check-button">Decrypt data</b-form-checkbox> -->
              <b-button v-if="viewGrid" size="sm" variant="light" :pressed.sync="viewGrid" class="text-center mt-1"><font-awesome-icon icon="th" /></b-button>
              <b-button v-if="!viewGrid" size="sm" variant="light" :pressed.sync="viewGrid" class="text-center mt-1"><font-awesome-icon icon="list" /></b-button>
          </div>
        </b-col>
      </b-row>
      <b-row class="mt-3" v-if="!viewGrid">
        <b-col lg="6" v-for="item in readreturn" :key="item.uuid" class="text-left mb-3" style="-webkit-hyphens: auto; -moz-hyphens: auto; hyphens: auto;">
          <b-card border-variant="light" class="mb-3 mt-3 shadow-sm">
            <b-card-body>
              <div class="mb-1">
                <small class="text-muted mr-3"><font-awesome-icon icon="clock" class="mr-1" />{{ item.time | moment("h:mm a") }}</small>
                <small class="text-muted"><font-awesome-icon icon="calendar" class="mr-1" />{{ item.time | moment("dddd, MMMM Do YYYY") }}</small>
              </div>
              <!-- <div v-if="item.collection !== ''" class="mb-1"><small class="text-muted">Collection:</small><br/>{{ item.collection }}</div>
              <div v-if="item.refID !== ''" class="mb-1"><small class="text-muted">Reference:</small><br />{{ item.refID }}</div> -->
              <div class="mb-1"><small class="text-muted">Address:</small><br/>{{ item.address }}</div>
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
              <div v-if="!item.mimetype || item.mimetype === 'text'" style="font-size:12px" class="mb-1">
                {{ item.data }}
              </div>
              <a :href="'https://proof.scryptachain.org/#/uuid/' + item.uuid" target="_blank"><b-button size="sm" style="margin-top:20px; width:100%" class="mr-1">Show details</b-button></a>
            </b-card-body>
          </b-card>

        </b-col>
      </b-row>
      <b-row v-if="viewGrid">
        <b-col cols="12" class="pt-3">
          <b-table
            border-variant="light"
            class="align-left mb-3 mt-3 shadow-sm bg-white"
            hover
            :items="tableItems"
            :fields="tableFields"
            :sort-by.sync="sortBy"
            :sort-desc.sync="sortDesc"
          >
          </b-table>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import Upload from './Upload'

export default {
  name: 'home',
  mounted : async function(){
    this.connected = await this.scrypta.connectNode()
    this.checkUser()
    this.readData()
  },
  components: {
    Upload
  },
  methods: {
      checkUser(){
        if(this.scrypta.keyExist()){
          this.$emit('onFoundUser', this.scrypta.keyExist(), this.scrypta.RAWsAPIKey)
          this.public_address = this.scrypta.PubAddress
          this.encrypted_wallet = this.scrypta.RAWsAPIKey
        }
      },
      searchByAddress () {
        const app = this
        app.readerror = ''
        if(app.search_address !== ''){
          app.axios
            .post(app.connected + '/read', {
              limit: 50,
              address: app.search_address,
              history: false
            })
            .then(function (response) {
              app.readreturn = response.data.data
              for(var i=0; i < app.readreturn.length; i++ ){
                if(app.readreturn[i].is_file === true){
                  var hash = app.readreturn[i].ipfshash
                  app.retrieveInfo(hash,i)
                }
              }
              app.returnTableItems()
            })
        }else{
          app.readData()
        }
      },
      readData () {
        const app = this
        app.readerror = ''
        app.axios
          .post(app.connected + '/read', {
            limit: 50,
            history: false
          })
          .then(function (response) {
            app.readreturn = response.data.data
            for(var i=0; i < app.readreturn.length; i++ ){
              if(app.readreturn[i].is_file === true){
                var hash = app.readreturn[i].data
                app.retrieveInfo(hash,i)
              }
            }
            app.returnTableItems()
          })
      },
      retrieveInfo (hash, i) {
        const app = this
        app.axios.get(app.connected + '/ipfs/type/' + hash)
        .then(function (response) {
            if(response.data.type !== undefined){
              app.readreturn[i].mimetype = response.data.type
              app.readreturn[i].mimedetail = response.data.detail
              app.$forceUpdate()
            }
        })
      },
      returnTableItems() {
        const app = this
        for(var i=0; i < app.readreturn.length; i++ ){
          app.tableItems.push({
              uuid: app.readreturn[i].uuid,
              block: app.readreturn[i].block,
              address: app.readreturn[i].address,
              title: app.readreturn[i].refID,
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
      search_address: '',
      tableFields: [
        { key: 'uuid', label: 'Unique Identifier', class: 'text-left' },
        { key: 'address', label: 'Public Address', class: 'text-left' },
        { key: 'block', label: 'Block', class: 'text-left' },
        { key: 'date', label: 'Date', sortDirection: 'desc', class: 'text-left' }
      ],
      sortBy: 'block',
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
