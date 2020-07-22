<template>
  <div class="page" v-if="!isLoading">
    <b-loading :is-full-page="true" :active.sync="isLoading"></b-loading>
    <h1>Receive</h1>
  </div>
</template>

<script>
  let ScryptaCore = require("@scrypta/core");
  import User from '@/user'
  export default {
    name: 'Receive',
    data() {
      return {
        scrypta: new ScryptaCore(true),
        configs: {},
        wallet: "",
        isLogging: true,
        isLoading: true
      };
    },
    async mounted() {
      const app = this;
      app.wallet = await User.auth()
      if(app.wallet !== false){
        app.configs = await User.configs()
        app.isLoading = false
      }
    },
    methods: {
      
    }
  };
</script>