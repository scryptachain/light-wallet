<template>
  <div id="app">
    <b-navbar v-if="user" toggleable="md" type="dark" variant="info">
      <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
      <b-navbar-brand href="/#/" class="mr-5"><img src="./assets/logo.png" height="30" class="mr-2">Scrypta</b-navbar-brand>

      <b-collapse is-nav id="nav_collapse">

        <b-navbar-nav>
          <b-nav-item href="/#/send" class="mr-3"><font-awesome-icon icon="wallet" /> Send</b-nav-item>
          <b-nav-item href="/#/upload" class="mr-3"><font-awesome-icon icon="upload" /> Upload</b-nav-item>
          <b-nav-item href="/#/archive" class="mr-3"><font-awesome-icon icon="archive" /> Archive</b-nav-item>
          <b-nav-item href="/#/contracts" class="mr-3"><font-awesome-icon icon="file-contract" /> Contracts</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">

          <b-nav-item-dropdown right>
            <!-- Using button-content slot -->
            <template slot="button-content">
              <em v-if="!user">No wallet</em>
              <em v-if="user">{{ user }}</em>
            </template>
            <b-dropdown-item v-if="user" href="#" @click.prevent="logoutUser">Signout</b-dropdown-item>
          </b-nav-item-dropdown>
        </b-navbar-nav>

      </b-collapse>
    </b-navbar><br>
    <router-view :user="user" :rawapikey="rawapikey" v-on:onFoundUser="changeUser"/>
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
      }
    }
  }
</script>


<style>
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
  }
  #nav {
    padding: 30px;
  }

  #nav a {
    font-weight: bold;
    color: #2c3e50;
  }

  #nav a.router-link-exact-active {
    color: #42b983;
  }
</style>
