<template>
  <div id="app" class="pb-5">
    <b-navbar v-if="user" toggleable="md" class="border-bottom">
      <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
      <b-navbar-brand href="/#/" class="mr-3 text-primary"><img src="./assets/logo.png" height="30" class="logo"></b-navbar-brand>

      <b-collapse is-nav id="nav_collapse">

        <b-navbar-nav variant="primary">
          <b-nav-item href="/#/" class="mr-3"><font-awesome-icon icon="tachometer-alt" class="mr-2" />Dashboard</b-nav-item>
          <!-- <b-nav-item href="/#/data-explorer" class="mr-3"><font-awesome-icon icon="search" class="mr-2" />{{ translations.ui.data_explorer }}</b-nav-item>-->
          <b-nav-item href="/#/sign" class="mr-3"><font-awesome-icon icon="pen-square" class="mr-2" />{{ translations.ui.sign }}</b-nav-item>
          <b-nav-item href="/#/archive" class="mr-3"><font-awesome-icon icon="lock" class="mr-2" />{{ translations.ui.vault }}</b-nav-item>
          <b-nav-item href="/#/token" class="mr-3"><font-awesome-icon icon="wallet" class="mr-2" />Token</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">

          <b-nav-item v-if="user" href="#" @click.prevent="logoutUser"><font-awesome-icon icon="sign-out-alt" class="mr-2" />{{ translations.ui.logout }}</b-nav-item>

        </b-navbar-nav>

      </b-collapse>
    </b-navbar>
    <router-view :user="user" :rawapikey="rawapikey" v-on:onFoundUser="changeUser" class="pt-3"/>
    <div class="text-center footer bg-light">
      {{ translations.ui.footer_description }} <a href="https://scryptachain.org" target="_blank">Scrypta Task Force</a>.
    </div>
  </div>
</template>
<script>
  import locales from './locales.js'

  export default {
    name: 'appview',
    data () {
      return {
        user: null,
        rawapikey: null,
        translations: locales['en'],
        scrypta: window.ScryptaCore
      }
    },
    mounted(){
      const app = this
      let language = 'en'
      app.translations = locales[language]
    },
    methods: {
      changeUser: function (user,rawapikey) {
        this.user = user
        this.rawapikey = rawapikey
      },
      logoutUser: function () {
        this.user = null
        this.rawapikey = null
        this.scrypta.forgetKey()
        this.$router.push('/')
      }
    }
  }
</script>
