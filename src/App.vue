<template>
  <div id="app">
    <b-navbar style="background:#0000F0!important" v-if="user" toggleable="md" type="dark" variant="info">
      <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
      <b-navbar-brand href="/#/" class="mr-5"><img src="./assets/logo.png" height="30" class="mr-2 logo">Manent</b-navbar-brand>

      <b-collapse is-nav id="nav_collapse">

        <b-navbar-nav>
          <b-nav-item href="/#/" class="mr-3"><font-awesome-icon icon="tachometer-alt" class="mr-2" />Dashboard</b-nav-item>
          <b-nav-item href="/#/archive" class="mr-3"><font-awesome-icon icon="archive" class="mr-2" />Archive</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">

          <b-nav-item v-if="user" href="#" @click.prevent="logoutUser"><font-awesome-icon icon="sign-out-alt" class="mr-2" />Logout</b-nav-item>

        </b-navbar-nav>

      </b-collapse>
    </b-navbar>
    <router-view :user="user" :rawapikey="rawapikey" v-on:onFoundUser="changeUser" class="pt-3"/>
    <div class="text-center footer">
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

<style>
  .logo{
    float: left;
    margin-top: -2px;
    margin-right: 10px;
    height: 28px;
  }
 .footer{
    position:fixed;
    bottom:0;
    left:0;
    font-size:12px; 
    text-align:center;
    width:100%;
    padding:5px;
    border-top:1px solid #eee;
    background:#fff;
    z-index:99;
  }

  .vue-Message .vue-Message-Detail{
    font-family: 'karmillaregular'!important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  #app {
    font-family: 'karmillaregular'!important;
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
