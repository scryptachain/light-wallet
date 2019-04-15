<template>
  <div class="home">
    <b-badge class="node-badge" v-if="connected" variant="success">{{ connected }}</b-badge>

    <b-modal v-model="importShow" hide-footer title="Import a wallet">
      <b-form-file
        v-model="file"
        placeholder="Just drag and drop here or select a .sid file"
        drop-placeholder="Drop file here..."
        @change="loadWalletFromFile"
        class="text-left mb-3 mt-3"
      />
    </b-modal>
    <b-modal id="qrModal" title="Wallet QR code">
      <img :src="public_qrcode" width="100%">
    </b-modal>
    <b-modal id="sendModal" title="Send LYRA" hide-footer>
      <Send/>
    </b-modal>
    <b-container v-if="!user">
      <b-row class="justify-content-center pt-5">
        <b-col xs="10" md="4">
          <img src="../assets/logo.png" class="mr-2">
          <h1 class="displa-5 mt-2">Manent</h1>
        </b-col>
      </b-row>
      <b-row class="justify-content-center">
        <b-col md="10">
          <p
            class="mt-2 text-muted"
          >Scrypta Manent: this is a beta version Web dApp running on Scrypta Blockchain. An application that you can use as a Wallet in  Cloud, which will allow you to send and recive LYRA. 
          <br>You can also use it to upload files directly into the blockchain and encrypt them, thanks to IPFS technology and IdANodes. <br><br>
          You have to make a backup. Please remind, you are ONLY responsible for this .sid file and password associated. No one will have to copy or to rescue it, so keep it safe.
          <br><br>
          This application is still in the testing phase, use it for research and development purposes.</p>
        </b-col>
      </b-row>
      <b-row class="mt-3">
        <b-col md="6">
          <b-card bg-variant="light" class="border-0 mb-3">
            <h2>Start creating a new wallet.</h2>
            <b-form-input
              v-model="createPwd"
              type="password"
              placeholder="Enter a strong wallet password and don't forget it!"
              class="mb-3"
            ></b-form-input>
            <b-form-input
              v-model="createPwdRepeat"
              type="password"
              placeholder="Repeat again your password."
              class="mb-3"
            ></b-form-input>
            <b-button @click.prevent="createWallet" variant="primary">CREATE WALLET</b-button>
          </b-card>
        </b-col>
        <b-col md="6">
          <b-card bg-variant="light" class="border-0 mb-3 pb-5">
            <h2>Or import an exsisting one.</h2>
            <p>Please select a valid wallet .sid file</p>
            <b-button @click.prevent="openImportWallet" variant="primary" class="mt-3">IMPORT WALLET</b-button>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
    <b-container fluid v-if="user">
      <b-modal class="bg-danger" title="Backup your .sid file" v-model="backupAlert">
        <h3 class="display-5">Please stay safe and make a backup.</h3>
        <a v-on:click="downloadWallet" href="#">Store it in your device</a> or
        <a @click.prevent="openUnlockWallet" href="#">print it</a>.
      </b-modal>
      <b-modal v-model="passwordShow" hide-footer title="Unlock your wallet first">
        <b-form-input v-model="unlockPwd" type="password" placeholder="Enter wallet password"></b-form-input>
        <br>
        <div @click.prevent="unlockWallet" class="btn btn-primary">UNLOCK WALLET</div>
      </b-modal>
      <b-row>
        <b-col md="4" class="mb-3 text-left">
          <span class="text-muted">Your balance</span>
          <h5 class="display-5 mb-0">{{ address_balance }}</h5>
          <b-link class="mr-5" :href="explorer_url" target="_blank">
            <small>Open block explorer</small>
          </b-link>
        </b-col>
        <b-col md="4" class="mb-3 text-left">
          <span class="text-muted">Your address</span>
          <h5 class="display-5 mb-0">{{ user }}</h5>
          <b-link @click.stop.prevent="copyAddress">
            <small><font-awesome-icon icon="clipboard" class="mr-2" />Copy address to clipboard</small>
            <input type="hidden" id="user-address" :value="user">
          </b-link>
        </b-col>
        <b-col md="4" class="text-right">
          <b-button size="sm" variant="primary" v-on:click="showBackup" class="text-center mr-2">
            <font-awesome-icon icon="shield-alt" class="mr-1"/>
            Backup Wallet
          </b-button>
          <b-button size="sm" variant="primary" v-b-modal.sendModal class="text-center mr-2">
            <font-awesome-icon icon="wallet" class="mr-2"/>Send
          </b-button>
          <b-button size="sm" variant="success" v-b-modal.qrModal class="text-center">
            <font-awesome-icon icon="wallet" class="mr-2"/>QR code
          </b-button>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <b-jumbotron bg-variant="white" header lead class="p-0 mt-5">
            <highcharts :options="chartOptions" ref="highcharts"></highcharts>
          </b-jumbotron>
        </b-col>
      </b-row>
      <b-row>
        <b-col md="12">
          <b-card title="Latest transactions" class="mb-3">
            <div v-if="!noTransactions">
              <b-table :current-page="currentPage" :per-page="10" responsive hover :items="items" sort-by="date"/>
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

export default {
  name: "home",
  mounted: function() {
    const app = this;
    this.fetchGraph();
    this.checkIdaNodes();
    this.checkUser();
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
    checkIdaNodes() {
      var checknodes = this.scrypta.returnNodes();
      const app = this;
      for (var i = 0; i < checknodes.length; i++) {
        this.axios
          .get("https://" + checknodes[i] + "/check")
          .then(function(response) {
            app.nodes.push(response.data.name);
            if (i == checknodes.length) {
              app.connectToNode();
            }
          });
      }
    },
    connectToNode() {
      var app = this;
      if (app.connected == "") {
        app.connected = app.nodes[Math.floor(Math.random() * app.nodes.length)];
        app.checkBalance();
        app.fetchTransactions();
      }
    },
    checkUser() {
      if (this.scrypta.keyExsist()) {
        this.$emit(
          "onFoundUser",
          this.scrypta.keyExsist(),
          this.scrypta.RAWsAPIKey
        );
        this.public_address = this.scrypta.PubAddress;
        this.encrypted_wallet = this.scrypta.RAWsAPIKey;
        var qr = new QRious({ value: this.scrypta.PubAddress, size: 500 });
        this.public_qrcode = qr.toDataURL();
        this.explorer_url =
          "https://chainz.cryptoid.info/lyra/address.dws?" +
          this.scrypta.PubAddress +
          ".htm";
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
              .post("https://" + app.connected + "/init", {
                address: response.pub,
                api_secret: response.api_secret
              })
              .then(function() {
                location.reload();
              })
              .catch(function() {
                alert("Seems there's a problem, please retry or change node!");
              });
          });
      } else {
        alert("Password is incorrect!");
      }
    },
    checkBalance() {
      var app = this;
      if (app.public_address !== "") {
        app.axios
          .post("https://" + app.connected + "/getbalance", {
            address: app.public_address
          })
          .then(function(response) {
            app.address_balance = response.data.data + " LYRA";
          })
          .catch(function() {
            alert("Seems there's a problem, please retry or change node!");
          });
      }
    },
    fetchTransactions() {
      var app = this;
      app.axios
        .post("https://" + app.connected + "/transactions", {
          address: app.public_address
        })
        .then(function(response) {
          app.items = response.data.data;
          app.countTransactions = response.data.data.length;
          if (response.data.data.length > 0) {
            app.noTransactions = false;
          } else {
            app.transactionMessage = "No transactions.";
          }
        });
    },
    fetchGraph() {
      var app = this;
      app.axios
        .get("https://api.coingecko.com/api/v3/coins/scrypta/market_chart?vs_currency=usd&days=30")
        .then(function(response) {
          app.chartOptions.series[0].data = response.data.prices
        });
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
            alert("Wrong password!");
          }
        });
      } else {
        alert("Write your password first");
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
          "This is your paper wallet. Print it and don't share this informations.",
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
        alert("Decrypt your wallet first");
      }
    },
    copyAddress () {
      let addressToCopy = document.querySelector('#user-address')
      addressToCopy.setAttribute('type', 'text')
      addressToCopy.select()
      const app = this
      try {
        document.execCommand('copy');
        app.$msg({text:'Address was copied', background: 'green'})
      } catch (err) {
        alert('Oops, unable to copy');
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
      connected: "",
      encrypted_wallet: "NO WALLET",
      unlockPwd: "",
      file: "",
      createPwd: "",
      createPwdRepeat: "",
      public_address: "",
      public_qrcode: "",
      address_balance: "BALANCE UNKNOWN",
      explorer_url: "",
      passwordShow: false,
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
            name: "Price USD"
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
