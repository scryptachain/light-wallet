<template>
  <div id="app">
    <div v-if="!isLogging && wallet && backup">
      <b-navbar>
        <template slot="brand">
          <b-navbar-item tag="router-link" :to="{ path: '/' }">
            <img src="/logo.png" />
          </b-navbar-item>
        </template>
        
        <template slot="start" class="nav-bar">
          <b-navbar-item href="/#/"><b-icon class="menu-icon" icon="view-dashboard"></b-icon><span>Dashboard</span></b-navbar-item>
          <b-navbar-item href="/#/send"><b-icon class="menu-icon" icon="send"></b-icon><span>{{ configs.locales.menu.send }}</span></b-navbar-item>
          <b-navbar-item href="/#/receive"><b-icon class="menu-icon" icon="call-received"></b-icon><span>{{ configs.locales.menu.receive }}</span></b-navbar-item>
          <b-navbar-item href="/#/vault"><b-icon class="menu-icon" icon="folder"></b-icon><span>{{ configs.locales.menu.vault }}</span></b-navbar-item>
          <b-navbar-item href="/#/identities"><b-icon class="menu-icon" icon="account-box-multiple"></b-icon><span>{{ configs.locales.menu.identities }}</span></b-navbar-item>
          <b-navbar-item href="/#/sign"><b-icon class="menu-icon" icon="qrcode"></b-icon><span>{{ configs.locales.menu.sign }}</span></b-navbar-item>
          <b-navbar-item href="/#/portfolio"><b-icon class="menu-icon" icon="wallet"></b-icon><span>{{ configs.locales.menu.portfolio }}</span></b-navbar-item>
          <b-navbar-item href="/#/contacts"><b-icon class="menu-icon" icon="contacts"></b-icon><span>{{ configs.locales.menu.contacts }}</span></b-navbar-item>
          <b-navbar-item href="/#/backup"><b-icon class="menu-icon" icon="cloud-download"></b-icon><span>Backup</span></b-navbar-item>
          <b-navbar-item href="/#/settings"><b-icon class="menu-icon" icon="wrench"></b-icon><span>{{ configs.locales.menu.settings }}</span></b-navbar-item>
          <b-navbar-item href="#" v-on:click="logout"><b-icon class="menu-icon" icon="logout"></b-icon><span>Logout</span></b-navbar-item>
        </template>
      </b-navbar>

      <div class="content">
        <router-view />
      </div>
      <div class="footer">
        Scrypta Manent Web
        <a
          href="https://github.com/scryptachain/scrypta-manent-web"
          target="_blank"
        >open-source</a> project by
        <a href="https://scrypta.foundation" target="_blank">Scrypta Foundation</a>.
      </div>
    </div>

    <div v-if="!isLogging && wallet && !backup">
      <section class="hero">
        <div class="hero-body" style="padding: 0;">
          <div class="container" id="backup" style="margin-top:50px;">
            <div class="card">
              <div style="padding: 50px 20px;">
                <h1 class="title is-1">Backup your .sid file</h1>
                <p>In order to prevent data loss you must download a backup.</p><br>
                <b-button v-on:click="downloadBackup" type="is-primary" size="is-large">BACKUP NOW</b-button>
                <a id="downloadid" style="display:none"></a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-if="!wallet">
      <section class="hero">
        <div class="hero-body" style="padding: 0;">
          <div class="container" id="create" style="margin-top:50px;">
            <div class="card">
              <div style="padding: 50px 20px;">
                <h1 class="title is-2">Scrypta Manent</h1>
                <h2 class="title is-3">Official Scrypta Wallet</h2>
                <br />
                <h2 class="subtitle">
                  <br />You need a Scrypta Identity to enter the platform.
                  <br />
                  <br />Use <a href="https://id.scryptachain.org/" target="_blank">Scrypta ID Extension</a> or <a v-on:click="showCreate">create a new wallet</a>.
                  <br />
                  <br />
                  <div id="scrypta-login" gateway="0240f294ef20c7bbb82bae24d8d22c7ab94d195adf153162482b6bf540393d7dd5" dapp="Manent"></div>
                </h2>
              </div>
            </div>
            <br />Scrypta Manent Web
            <a
              href="https://github.com/scryptachain/scrypta-manent-web"
              target="_blank"
            >open-source</a> project by
            <a href="https://scrypta.foundation" target="_blank">Scrypta Foundation</a>.
            <br />
            <br />
          </div>
        </div>
      </section>
    </div>

    <b-loading :is-full-page="true" :active.sync="isLogging" :can-cancel="false"></b-loading>
    <b-modal :active.sync="showCreateModal" has-modal-card trap-focus aria-role="dialog" aria-modal>
      <form action>
        <div class="modal-card" style="width: auto">
          <header class="modal-card-head">
            <p class="modal-card-title">Create new Identity</p>
          </header>
          <section class="modal-card-body">
            <b-field label="Insert Password">
              <b-input
                type="password"
                v-model="password"
                password-reveal
                placeholder="Your main password"
                required
              ></b-input>
            </b-field>

            <b-field v-if="!wallet" label="Repeat password">
              <b-input
                type="password"
                v-model="passwordrepeat"
                password-reveal
                placeholder="Repeat password"
                required
              ></b-input>
            </b-field>
          </section>
          <footer v-if="!isCreating && !isUpdating" class="modal-card-foot">
            <button
              v-if="!wallet"
              class="button is-primary"
              style="width:100%"
              v-on:click="createUser"
            >CREATE</button>
          </footer>
          <footer v-if="isCreating" class="modal-card-foot">
            <div style="text-align:center">Creating identity, please wait...</div>
          </footer>
        </div>
      </form>
    </b-modal>
  </div>
</template>

<script>
  let ScryptaCore = require("@scrypta/core");
  import User from '@/user'

  export default {
    data() {
      return {
        scrypta: new ScryptaCore(true),
        address: "",
        configs: {},
        wallet: "",
        isLogging: true,
        file: [],
        isCreating: false,
        backup: false,
        isUpdating: false,
        showCreateModal: false,
        password: "",
        passwordrepeat: ""
      };
    },
    async mounted() {
      const app = this;
      app.configs = await User.configs()
      app.wallet = await User.auth()
      if(app.wallet !== false){
        let check_backup = localStorage.getItem('sid_backup')
        if(check_backup !== null && check_backup !== undefined && check_backup === app.wallet.address){
          app.backup = true
        }
        app.isLogging = false;
      } else {
        app.isLogging = false;
      }
    },
    methods: {
      showCreate() {
        const app = this;
        app.showCreateModal = true;
      },
      logout() {
        localStorage.setItem("SID", "");
        location.reload();
      },
      async createUser() {
        const app = this;
        if (app.password !== "") {
          if (app.passwordrepeat === app.password) {
            app.isCreating = true;
            setTimeout(async function() {
              let id = await app.scrypta.createAddress(app.password, true);
              let identity = await app.scrypta.returnIdentity(id.pub);
              app.address = id.pub;
              app.wallet = identity;
              localStorage.setItem("SID", id.walletstore);
              app.showCreateModal = false;
              app.password = "";
              app.passwordrepeat = "";
              let tx = await app.scrypta.post("/init", {
                address: id.pub,
                airdrop: true
              });
              if (tx.airdrop_tx === false) {
                app.$buefy.toast.open({
                  message: "Sorry, airdrop was not successful!",
                  type: "is-danger"
                });
              }
              app.isCreating = false;
            }, 500);
          } else {
            app.$buefy.toast.open({
              message: "Passwords doesn't matches.",
              type: "is-danger"
            });
          }
        } else {
          app.$buefy.toast.open({
            message: "Write a password first!",
            type: "is-danger"
          });
        }
      },
      downloadBackup(){
        const app = this
        app.$buefy.dialog.prompt({
          message: `Enter wallet password`,
          inputAttrs: {
            type: "password"
          },
          trapFocus: true,
          onConfirm: async password => {
            let SID = localStorage.getItem('SID')
            let key = await app.scrypta.readKey(password, SID);
            if (key !== false) {
              var a = document.getElementById("downloadid");
              app.backup = true
              localStorage.setItem('sid_backup', app.address)
              var file = new Blob(
                [SID],
                { type: "sid" }
              );
              a.href = URL.createObjectURL(file);
              a.download = app.address + ".sid";
              var clickEvent = new MouseEvent("click", {
                view: window,
                bubbles: true,
                cancelable: false
              });
              a.dispatchEvent(clickEvent);
            }else{
              app.$buefy.toast.open({
                message: "Wrong password!",
                type: "is-danger"
              });
            }
          }
        })
      }
    }
  };
</script>