<template>
  <div class="home">
    <b-badge class="node-badge" v-if="connected" variant="success">{{ connected }}</b-badge>
    <b-modal v-model="passwordShow" hide-footer :title=translations.home.unlock_wallet_first>
      <b-form-input v-model="unlockPwd" type="password" :placeholder=translations.home.enter_wallet_password></b-form-input>
      <br>
      <div @click.prevent="unlockWallet" class="btn btn-primary">{{ translations.general.unlock_wallet }}</div>
    </b-modal>
    <b-container fluid v-if="user">
      <b-row>
        <b-col md="12">
          <b-card
            :title="translations.ui.sign_message"
            border-variant="light"
            class="mb-3 mt-3 shadow-sm"
          >
            <b-form-group id="message" :label="translations.sign.text" label-for="messageTextarea">
              <b-form-textarea
                id="messageTextarea"
                v-model="messageSign"
                :placeholder="translations.upload.insert_text"
                rows="4"
                max-rows="6"
              />
            </b-form-group>
            <div style="width:100%; font-size: 14px; margin-bottom:20px; background: #eee; border-radius: 5px; border:1px solid #ddd; padding: 10px;" v-if="signResponse">
              <pre>{{ signResponse }}</pre>
            </div>
            <button v-if="!isSigning" class="btn btn-primary float-right mb-3" v-on:click="openUnlockWallet">{{ translations.ui.sign }}</button>
          </b-card>
          <b-card
            :title="translations.ui.verify_message"
            border-variant="light"
            class="mb-3 mt-3 shadow-sm"
          >
            <b-form-group id="pubkey" :label="translations.sign.pubkey" label-for="pubkeyInput">
              <b-form-input
                id="pubkeyInput"
                type="text"
                v-model="pubkeyVerify"
                required
                :placeholder="translations.sign.insert_pubkey"
              />
            </b-form-group>
            <b-form-group id="signature" :label="translations.sign.signature" label-for="signatureInput">
              <b-form-input
                id="signatureInput"
                type="text"
                v-model="signatureVerify"
                required
                :placeholder="translations.sign.insert_signature"
              />
            </b-form-group>
            <b-form-group id="message" :label="translations.sign.text" label-for="messageTextarea">
              <b-form-textarea
                id="messageTextarea"
                v-model="messageVerify"
                :placeholder="translations.upload.insert_text"
                rows="4"
                max-rows="6"
              />
            </b-form-group>
            <div style="width:100%; font-size: 14px; margin-bottom:20px; background: #eee; border-radius: 5px; border:1px solid #ddd; padding: 10px;">
              <pre>{{ verifyResponse }}</pre>
            </div>
            <button v-if="!isSigning" class="btn btn-primary float-right mb-3" @click.prevent="verifyMessage">{{ translations.sign.verify }}</button>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import locales from "../locales.js";

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

    setTimeout(function() {
      app.backupAlert = false;
    }, 10000);
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
      }
    },
    openUnlockWallet() {
      this.passwordShow = true;
    },
    verifyMessage() {
      const app = this
      app.scrypta.verifyMessage(app.pubkeyVerify, app.signatureVerify, app.messageVerify).then(response => {
        app.verifyResponse = response
      })
    },
    unlockWallet() {
      if (this.unlockPwd !== "") {
        var app = this;
        app.decrypted_wallet = "WALLET LOCKED";
        app.scrypta.readKey(this.unlockPwd).then(function(response) {
          if (response !== false) {
            app.passwordShow = false;
            app.scrypta.signMessage(response.prv, app.messageSign).then(response => {
              app.signResponse = response
            })
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
        "address",
        "balance",
        "details"
      ],
      translations: locales["en"],
      connected: "",
      encrypted_wallet: "NO WALLET",
      unlockPwd: "",
      file: "",
      isSigning: false,
      isVerifying: false,
      messageVerify: "",
      signatureVerify: "",
      messageSign: "",
      pubkeyVerify: "",
      verifyResponse: "",
      createPwd: "",
      createPwdRepeat: "",
      public_address: "",
      public_qrcode: "",
      signResponse: "",
      public_qrcode_sync: "",
      address_balance: "BALANCE UNKNOWN",
      explorer_url: "",
      passwordShow: false,
      passwordShowSync: false,
      importShow: false,
      decrypted_wallet: "",
      backupAlert: false
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
