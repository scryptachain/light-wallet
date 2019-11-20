<template>
  <div class="home">
    <b-badge class="node-badge" v-if="connected" variant="success">{{ connected }}</b-badge>
    <b-modal v-model="passwordShow" hide-footer :title=tranlations.archive.unlock_wallet_first>
      <b-form-input v-model="unlockPwd" type="password" placeholder="Enter wallet password"></b-form-input><br>
      <div @click.prevent="unlockWallet" class="btn btn-primary">{{ translations.general.unlock_wallet }}</div>
    </b-modal>
    <b-modal id="uploadModal" ref="upload-modal" title="Upload data" hide-footer>
      <Upload @hide-upload="hideModalUpload" />
    </b-modal>
    <b-container fluid>
      <b-row>
        <b-col v-if="readreturn">
          <div style="float:right">
            <b-button size="sm" variant="primary" v-b-modal.uploadModal class="text-center mr-2"><font-awesome-icon icon="upload" class="mr-2" />{{ translations.archive.upload }}</b-button>
            <b-button size="sm" variant="primary" @click.prevent="readData" class="text-center"><font-awesome-icon icon="sync" class="mr-2" />{{ translations.archive.refresh }}</b-button>
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
              <div class="mb-1"><small class="text-muted">{{ translations.general.unique_identifier }}:</small><br/>{{ item.uuid }}</div>
              <div class="mb-1"><small class="text-muted">{{ translations.general.block }}</small><br />{{ item.block }}</div>
              <div v-if="item.text" class="mb-1"><small class="text-muted">{{ translations.general.text }}</small><br />{{ item.text }}</div>
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
              <a :href="'https://proof.scryptachain.org/#/uuid/' + item.uuid" target="_blank"><b-button size="sm" style="margin-top:20px; width:100%" class="mr-1">{{ translations.archive.details_button }}</b-button></a>
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
            <template slot="dataModal">
              <b-modal v-model="passwordShow" hide-footer title="Record content">{ row.data }</b-modal>
            </template>
          </b-table>
        </b-col>
      </b-row>
      <div class="row" v-if="isLoading"><div class="col-12 text-center">{{ tranlations.archive.loading_data }}</div></div>
    </b-container>
  </div>
</template>

<script>
import Upload from './Upload'
import locales from '../locales.js'

export default {
  name: 'home',
  mounted : async function(){
    this.connected = await this.scrypta.connectNode()
    await this.checkUser()
    this.readData()
    const app = this
    let language = navigator.language.split('-')
    if(locales[language[0]] !== undefined){
      app.translations = locales[language[0]]
    }else{
      app.translations = locales['en']
    }
  },
  components: {
    Upload
  },
  methods: {
      hideModalUpload(){
        this.$refs['upload-modal'].hide()
      },
      checkUser(){
        if(this.scrypta.keyExist()){
          this.$emit('onFoundUser', this.scrypta.keyExist(), this.scrypta.RAWsAPIKey)
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
            .post(app.connected + '/read', {
              api_secret: app.api_secret,
              decrypt: app.decryptRead,
              address: app.public_address,
              history: false
            })
            .then(function (response) {
              app.isLoading = false
              if(response.data.data !== "Provide api Secret first."){
                app.readreturn = response.data.data
                for(var i=0; i < app.readreturn.length; i++ ){
                  if(app.readreturn[i].is_file === true){
                    var hash = app.readreturn[i].data
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
      translations: locales['en'],
      passwordShow: false,
      nodes: [],
      connected: '',
      encrypted_wallet: 'NO WALLET',
      decrypted_wallet: 'WALLET LOCKED',
      unlockPwd: '',
      public_address: '',
      isLoading: true,
      decryptRead: false,
      api_secret: '',
      readreturn: [],
      tableItems: [],
      tableFields: [
        { key: 'uuid', label: 'Unique Identifier', class: 'text-left' },
        { key: 'block', label: 'Block', class: 'text-left' },
        { key: 'date', label: 'Date', sortDirection: 'desc', class: 'text-left' }
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
