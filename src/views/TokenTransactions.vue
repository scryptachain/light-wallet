<template>
  <div class="home">
    <b-badge class="node-badge" v-if="connected" variant="success">{{ connected }}</b-badge>
    <b-modal id="sendModal" :title="translations.token.send_token" hide-footer>
      <SendToken :token="$route.params.sidechain" />
    </b-modal>
    <b-container fluid v-if="user">
      <b-row>
        <b-col md="12">
          <b-card
            :title="sidechainName"
            border-variant="light"
            class="mb-3 mt-3 shadow-sm"
          >
            <b-button v-if="!noTransactions" size="sm" variant="primary" style="float:right; margin-top:-45px" v-b-modal.sendModal class="text-center mr-2">
              <font-awesome-icon icon="wallet" class="mr-2" />
              {{ translations.general.send }} token
            </b-button>
            <div v-if="!noTransactions">
              <b-table responsive hover :items="tokens" :fields="fields">
                <template v-slot:cell(sxid)="data">
                  {{ data.item.sxid.substr(0,6) }}...{{ data.item.sxid.substr(-6) }}
                </template>
                <template v-slot:cell(amount)="data">
                  {{ data.item.amount }} {{ sidechainSymbol }}
                </template>
                <template v-slot:cell(details)="data">
                  <a target="_blank" :href = "'https://sidechain.scryptachain.org/#/sxid/' + $route.params.sidechain + '/' + data.item.sxid"><div class="btn btn-primary" style="padding:2px; width:100%; text-align:center">></div></a>
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
            app.sidechainName = app.raw_sidechains[app.$route.params.sidechain]['name'] + ' (' + app.raw_sidechains[app.$route.params.sidechain]['symbol'] + ')'
          });
        app.axios
          .post(app.connected + "/sidechain/transactions", {
            dapp_address: app.public_address,
            sidechain_address: app.$route.params.sidechain
          })
          .then(function(response) {
            if (response.data.transactions.length > 0) {
              app.tokens = response.data.transactions;
              app.sidechainSymbol = response.data.symbol
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
      fields: [
        "sxid",
        "from",
        "to",
        "amount",
        "memo",
        "block",
        "details"
      ],
      sidechainName: '',
      raw_sidechains: {},
      translations: locales["en"],
      connected: "",
      encrypted_wallet: "NO WALLET",
      unlockPwd: "",
      sidechainSymbol: '',
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
