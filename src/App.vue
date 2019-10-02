<template>
  <div id="app" class="pb-5">
    <b-navbar v-if="user" toggleable="md" class="border-bottom">
      <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
      <b-navbar-brand href="/#/" class="mr-5 text-primary"><img src="./assets/logo.png" height="30" class="mr-2 logo">Manent</b-navbar-brand>

      <b-collapse is-nav id="nav_collapse">

        <b-navbar-nav variant="primary">
          <b-nav-item href="/#/" class="mr-3"><font-awesome-icon icon="tachometer-alt" class="mr-2" />Dashboard</b-nav-item>
          <b-nav-item href="/#/data-explorer" class="mr-3"><font-awesome-icon icon="search" class="mr-2" />Data Explorer</b-nav-item>
          <b-nav-item href="/#/archive" class="mr-3"><font-awesome-icon icon="archive" class="mr-2" />Vault</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">

          <b-nav-item v-if="user" href="#" @click.prevent="logoutUser"><font-awesome-icon icon="sign-out-alt" class="mr-2" />Logout</b-nav-item>

        </b-navbar-nav>

      </b-collapse>
    </b-navbar>
    <router-view :user="user" :rawapikey="rawapikey" v-on:onFoundUser="changeUser" class="pt-3"/>
    <div class="text-center footer bg-light">
      Open Source Project developed by <a href="https://scryptachain.org" target="_blank">Scrypta Task Force</a>.
    </div>
  </div>
</template>
<script>

  export default {
    name: 'appview',
    data () {
      return {
        user: null,
        rawapikey: null,
        scrypta: window.ScryptaCore
      }
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
