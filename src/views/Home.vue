<template>
  <div class="home">
    <b-badge class="node-badge" v-if="connected" variant="success">{{ connected }}</b-badge>
    
    <b-modal v-model="importShow" hide-footer :title=translations.home.import_wallet>
      <b-form-file
        v-model="file"
        :placeholder=translations.home.drag_drop
        :drop-placeholder=translations.home.drop
        @change="loadWalletFromFile"
        class="text-left mb-3 mt-3"
      />
    </b-modal>
    <b-modal id="qrModal" title="Wallet QR code">
      <img :src="public_qrcode" width="100%">
    </b-modal>
    <b-modal id="sendModal" :title=translations.home.send_lyra hide-footer>
      <Send/>
    </b-modal>
    <b-container v-if="!user">
      <b-row class="justify-content-center pt-5">
        <b-col xs="10" md="4" class="text-center">
          <img src="../assets/logo.png">
        </b-col>
      </b-row>
      <b-row class="justify-content-center">
        <b-col md="9" class="pt-5 pb-5">
          <p class="mt-2 text-muted text-justify">{{ translations.home.main_description }}</p>
        </b-col>
      </b-row>
      <b-row class="mt-3">
        <b-col md="6">
          <b-card bg-variant="light" class="border-0 mb-3 text-center">
            <h2>{{ translations.home.create_wallet }}</h2>
            <b-form-input
              v-model="createPwd"
              type="password"
              :placeholder=translations.home.enter_password
              class="mb-3"
            ></b-form-input>
            <b-form-input
              v-model="createPwdRepeat"
              type="password"
              :placeholder=translations.home.repeat_password
              class="mb-3"
            ></b-form-input>
            <b-button @click.prevent="createWallet" variant="primary">{{ translations.home.create_button }}</b-button>
          </b-card>
        </b-col>
        <b-col md="6">
          <b-card bg-variant="light" class="border-0 mb-3 pb-5 text-center">
            <h2>{{ translations.home.import_existing_wallet }}</h2>
            <p>{{ translations.home.select_sid }}</p>
            <b-button @click.prevent="openImportWallet" variant="primary" class="mt-3">{{ translations.home.import_button }}</b-button>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
    <b-container fluid v-if="user">
      <b-modal class="bg-danger text-center" title="Backup your .sid file" v-model="backupAlert">
        <h3 class="display-5">{{ translations.home.choose_backup_method }}</h3><br>
        <a v-on:click="downloadWallet" class="btn btn-primary" href="#">{{ translations.home.store_sid }}</a><br><br>
        <a @click.prevent="openUnlockWallet" class="btn btn-primary" href="#">{{ translations.home.print_paper_wallet }}</a><br><br>
        <a @click.prevent="openUnlockWalletSync" class="btn btn-primary" href="#">{{ translations.home.sync_mobile }}</a>
      </b-modal>
      <b-modal v-model="passwordShow" hide-footer :title=translations.home.unlock_wallet_first>
        <b-form-input v-model="unlockPwd" type="password" :placeholder=translations.home.enter_wallet_password></b-form-input>
        <br>
        <div @click.prevent="unlockWallet" class="btn btn-primary">{{ translations.general.unlock_wallet }}</div>
      </b-modal>
      <b-modal v-model="passwordShowSync" hide-footer :title=translations.home.sync_app_title>
        {{ translations.home.sync_app_description }}<br>
        <img :src="public_qrcode_sync" width="100%">
      </b-modal>
      <b-row>
        <b-col md="4" class="mb-3 text-left">
          <span class="text-muted">{{ translations.home.balance }}</span> 
          <h5 class="display-5 mb-0">{{ address_balance }}</h5>
          <b-link class="mr-5" :href="explorer_url" target="_blank">
            <small>{{ translations.home.open_block_explorer }}</small>
          </b-link>
        </b-col>
        <b-col md="4" class="mb-3 text-left">
          <span class="text-muted">{{ translations.home.your_address }}</span>
          <h5 class="display-5 mb-0">{{ user }}</h5>
          <b-link @click.stop.prevent="copyAddress">
            <small><font-awesome-icon icon="clipboard" class="mr-2" />{{ translations.home.copy_address }}</small>
            <input type="hidden" id="user-address" :value="user">
          </b-link>
        </b-col>
        <b-col md="4" class="text-right mt-3">
          <b-button size="sm" variant="primary" v-on:click="showBackup" class="text-center mr-2">
            <font-awesome-icon icon="shield-alt" class="mr-1"/>
            {{ translations.home.backup_or_sync }}
          </b-button>
          <b-button size="sm" variant="primary" v-b-modal.sendModal class="text-center mr-2">
            <font-awesome-icon icon="wallet" class="mr-2"/> {{ translations.general.send }}
          </b-button>
          <b-button size="sm" variant="secondary" v-b-modal.qrModal class="text-center">
            {{ translations.general.receive }}
          </b-button>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <b-jumbotron bg-variant="white" header lead class="pt-5 pb-0 pr-5 m-1 shadow-sm">
            <highcharts :options="chartOptions" ref="highcharts"></highcharts>
          </b-jumbotron>
        </b-col>
      </b-row>
      <b-row>
        <b-col md="12">
          <b-card :title=translations.home.latest_transactions border-variant="light" class="mb-3 mt-3 shadow-sm">
            <div v-if="!noTransactions">
              <b-table :current-page="currentPage" :per-page="10" responsive hover :items="items" sort-by="date DESC" />
              <b-pagination v-model="currentPage" :total-rows="countTransactions" :per-page="10"></b-pagination>
            </div>
            <div v-if="noTransactions">{{ transactionMessage }}</div>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import Send from "./Send";
import jsPDF from "jspdf";
const QRious = require("qrious");
import locales from '../locales.js';

export default {
  name: "home",
  mounted: async function() {
    const app = this;
    this.fetchGraph();
    this.connected = await this.scrypta.connectNode();
    this.checkUser();

    let language = navigator.language.split('-')
    if(locales[language[0]] !== undefined){
      app.translations = locales[language[0]]
    }else{
      app.translations = locales['en']
    }

    app.transactionMessage = app.translations.home.no_transactions

    setTimeout(function() {
      app.backupAlert = false;
    }, 10000);
  },
  components: {
    Send
  },
  methods: {
    showBackup(){
      this.backupAlert = true
    },
    checkUser() {
      if (this.scrypta.keyExist()) {
        this.$emit(
          "onFoundUser",
          this.scrypta.keyExist(),
          this.scrypta.RAWsAPIKey
        );
        this.public_address = this.scrypta.PubAddress;
        this.encrypted_wallet = this.scrypta.RAWsAPIKey;
        var qr = new QRious({ value: this.scrypta.PubAddress, size: 500 });
        this.public_qrcode = qr.toDataURL();

        qr = new QRious({ value: this.scrypta.PubAddress + ':' + this.scrypta.RAWsAPIKey, size: 500 });
        this.public_qrcode_sync = qr.toDataURL();
        this.explorer_url =
          "https://explorer.scryptachain.org/address/" + this.scrypta.PubAddress
        this.checkBalance()
        this.fetchTransactions()
      }
    },
    openImportWallet() {
      this.importShow = true;
    },
    loadWalletFromFile(ev) {
      const file = ev.target.files[0];
      const reader = new FileReader();
      var app = this;
      reader.onload = function() {
        var dataKey = reader.result;
        app.scrypta.saveKey(dataKey).then(function() {
          setTimeout(function() {
            location.reload();
          }, 1000);
        });
      };
      reader.readAsText(file);
    },
    createWallet() {
      var app = this;
      if (app.createPwd !== "" && app.createPwd === app.createPwdRepeat) {
        app.scrypta
          .createAddress(this.createPwd, true)
          .then(function(response) {
            app.axios
              .post(app.connected + "/init", {
                address: response.pub,
                api_secret: response.api_secret
              })
              .then(function() {
                location.reload();
              })
              .catch(function() {
                alert(app.translations.idanode_problem);
              });
          });
      } else {
        alert(app.translations.password_incorrect);
      }
    },
    checkBalance() {
      var app = this;
      if (app.public_address !== "") {
        app.axios
          .get(app.connected + "/balance/" + app.public_address)
          .then(function(response) {
            app.address_balance = response.data.balance + " LYRA";
          })
          .catch(function() {
            alert(app.translations.idanode_problem);
          });
      }
    },
    fetchTransactions() {
      var app = this;
      if(app.public_address !== undefined && app.public_address !== ''){
        app.axios
          .get(app.connected + "/transactions/" + app.public_address)
          .then(function(response) {
            for(var i = 0; i < response.data.data.length; i++ ){
              var d = new Date(response.data.data[i].time * 1000)
              var date = d.toLocaleDateString() + ' at ' + d.toLocaleTimeString() 
              var recipient
              if(response.data.data[i].value > 0){
                recipient = response.data.data[i].from[0]
              }else{
                recipient = response.data.data[i].to[0]
              }
              var tx = {}

              tx[app.translations.general.date] = date
              tx[app.translations.general.recipient] = recipient
              tx[app.translations.general.value] = response.data.data[i].value.toFixed(4) + ' LYRA'
              tx[app.translations.general.txid] = response.data.data[i].txid
              tx[app.translations.general.block] = response.data.data[i].blockheight

              app.items.push(tx)
            }
            app.countTransactions = response.data.data.length;
            if (response.data.data.length > 0) {
              app.noTransactions = false;
            } else {
              app.transactionMessage = app.translations.general.no_transactions;
            }
          })
      }
    },
    fetchGraph() {
      var app = this;
      app.axios
        .get("https://api.coingecko.com/api/v3/coins/scrypta/market_chart?vs_currency=usd&days=30")
        .then(function(response) {
          app.chartOptions.series[0].data = response.data.prices
        });
    },
    openUnlockWalletSync() {
      this.passwordShowSync = true;
    },
    openUnlockWallet() {
      this.passwordShow = true;
    },
    unlockWallet() {
      if (this.unlockPwd !== "") {
        var app = this;
        app.decrypted_wallet = "WALLET LOCKED";
        app.scrypta.readKey(this.unlockPwd).then(function(response) {
          if (response !== false) {
            app.decrypted_wallet = response.prv;
            app.printWallet();
          } else {
            alert(app.translations.general.password_incorrect);
          }
        });
      } else {
        alert(app.translations.general.password_incorrect);
      }
    },
    downloadWallet() {
      if (this.encrypted_wallet !== "") {
        var a = document.getElementById("downloadsid");
        var file = new Blob(
          [this.public_address + ":" + this.encrypted_wallet],
          { type: "sid" }
        );
        a.href = URL.createObjectURL(file);
        a.download = this.public_address + ".sid";
        var clickEvent = new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: false
        });
        a.dispatchEvent(clickEvent);
      } else {
        alert("Need a wallet first");
      }
    },
    printWallet() {
      const app = this;
      if (app.decrypted_wallet !== "WALLET LOCKED") {
        var doc = new jsPDF();
        doc.text(
          app.translations.home.paper_wallet_description,
          10,
          10
        );
        doc.text("Encrypted wallet.", 57, 38);
        var qr = new QRious({
          value: app.public_address + ":" + app.encrypted_wallet,
          size: 500
        });
        doc.addImage(qr.toDataURL(), "JPEG", 55, 40, 100, 100);
        doc.text("Public address", 10, 158);
        qr = new QRious({ value: app.public_address, size: 500 });
        doc.addImage(qr.toDataURL(), "JPEG", 10, 160, 60, 60);
        doc.text("Private key", 140, 158);
        qr = new QRious({ value: app.decrypted_wallet, size: 500 });
        doc.addImage(qr.toDataURL(), "JPEG", 140, 160, 60, 60);
        doc.save(app.public_address + ".pdf");
        app.passwordShow = false;
        app.unlockPwd = "";
      } else {
        alert(app.translations.general.decrypt_wallet_first);
      }
    },
    copyAddress () {
      let addressToCopy = document.querySelector('#user-address')
      addressToCopy.setAttribute('type', 'text')
      addressToCopy.select()
      const app = this
      try {
        document.execCommand('copy');
        app.$msg({text:app.translations.home.address_copied, position: 'top', duration: 1000})
      } catch (err) {
        app.$msg({text:app.translations.home.address_copy_error, position: 'top', duration: 1000});
      }

      /* unselect the range */
      addressToCopy.setAttribute('type', 'hidden')
      window.getSelection().removeAllRanges()
    }
  },
  props: {
    user: null,
    rawapikey: null
  },
  data() {
    return {
      scrypta: window.ScryptaCore,
      axios: window.axios,
      nodes: [],
      translations: locales['en'],
      connected: "",
      encrypted_wallet: "NO WALLET",
      unlockPwd: "",
      file: "",
      createPwd: "",
      createPwdRepeat: "",
      public_address: "",
      public_qrcode: "",
      public_qrcode_sync: "",
      address_balance: "BALANCE UNKNOWN",
      explorer_url: "",
      passwordShow: false,
      passwordShowSync: false,
      importShow: false,
      decrypted_wallet: "",
      transactionMessage: "Loading transactions...",
      backupAlert: false,
      noTransactions: true,
      currentPage: 1,
      countTransactions: 0,
      items: [],
      chartOptions: {
        series: [
          {
            data: [],
            type: "spline",
            zIndex: 0,
            marker: {
              enabled: false
            },
            name: "Price USD",
            color: '#D43F51'
          }
        ],
        yAxis: {
          title: {
            text: "price"
          }
        },
        xAxis: {
          type: "datetime",
          tickInterval: 24 * 3600 * 1000
        },
        credits: {
          enabled: false
        },
        chart: {
          backgroundColor: "transparent"
        },
        title: {
          text: undefined
        }
      }
    };
  }
};
</script>
<style>
.wallet-block {
  background: #eee;
  padding: 15px;
  text-align: left;
  border: 1px solid #ccc;
  border-radius: 5px;
  word-wrap: break-word;
}
.node-badge {
  position: fixed;
  bottom: -3px;
  font-size: 10px;
  padding: 8px;
  right: 10px;
  z-index: 9999;
}
</style>
