<template>
  <div class="home">
    <b-badge class="node-badge" v-if="connected" variant="success">{{ connected }}</b-badge>
    <b-modal id="sendModal" :title="translations.token.send_token" hide-footer>
      <SendToken />
    </b-modal>
    <b-container fluid v-if="user">
      <b-row>
        <b-col md="12">
          <b-card
            :title="translations.token.your_tokens"
            border-variant="light"
            class="mb-3 mt-3 shadow-sm"
          >
            <b-button v-if="!noTransactions" size="sm" variant="primary" style="float:right; margin-top:-45px" v-b-modal.sendModal class="text-center mr-2">
              <font-awesome-icon icon="wallet" class="mr-2" />
              {{ translations.general.send }} token
            </b-button>
            <div v-if="!noTransactions">
              <b-table responsive hover stacked="md" :items="tokens" :fields="fields">
                <template v-slot:cell(sidechain)="data">
                  <v-gravatar :email="data.item.sidechain" style="width:27px; height:27px; float:left; margin-right:10px;" />
                  <strong>{{ raw_sidechains[data.item.sidechain].name }} ({{ raw_sidechains[data.item.sidechain].symbol }})</strong>
                </template>
                <template v-slot:cell(balance)="data">
                  {{ data.item.balance }} <i style="font-size:11px"> {{ data.item.symbol }}</i>
                </template>
                <template v-slot:cell(details)="data">
                  <a :href = "'/#/sidechain/' + data.item.sidechain"><div class="btn btn-primary" style="padding:2px; width:100%; text-align:center">></div></a>
                </template>
              </b-table>
            </div>
            <div v-if="noTransactions">{{ transactionMessage }}</div>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import locales from "../locales.js";
import SendToken from "./SendToken";

export default {
  name: "home",
  mounted: async function() {
    const app = this;
    this.connected = await this.scrypta.connectNode();
    this.checkUser();

    let language = navigator.language.split("-");
    if (locales[language[0]] !== undefined) {
      app.translations = locales[language[0]];
    } else {
      app.translations = locales["en"];
    }

    app.transactionMessage = app.translations.token.no_tokens;

    setTimeout(function() {
      app.backupAlert = false;
    }, 10000);
  },
  components: {
    SendToken
  },
  methods: {
    checkUser() {
      if (this.scrypta.keyExist()) {
        this.$emit(
          "onFoundUser",
          this.scrypta.keyExist(),
          this.scrypta.RAWsAPIKey
        );
        this.public_address = this.scrypta.PubAddress;
        this.encrypted_wallet = this.scrypta.RAWsAPIKey;
        this.explorer_url =
          "https://explorer.scryptachain.org/address/" +
          this.scrypta.PubAddress;
        this.fetchTokens();
      }
    },
    fetchTokens() {
      var app = this;
      if (app.public_address !== undefined && app.public_address !== "") {
        app.axios
          .get(app.connected + "/sidechain/list")
          .then(function(response) {
            for(let x in response.data.data){
              let sidechain = response.data.data[x]
              app.raw_sidechains[sidechain.address] = sidechain.genesis
            }
          });
        app.axios
          .post(app.connected + "/sidechain/scan/address", {
            dapp_address: app.public_address
          })
          .then(function(response) {
            if (response.data.data.length > 0) {
              app.tokens = response.data.data;
              app.noTransactions = false;
            } else {
              app.transactionMessage = app.translations.tokens.no_tokens;
            }
          });
      }
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
      raw_sidechains: [],
      fields: [
        "sidechain",
        "balance",
        "details"
      ],
      translations: locales["en"],
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
      tokens: []
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
