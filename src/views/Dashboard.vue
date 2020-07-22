<template>
  <div class="page" v-if="!isLoading">
    <b-loading :is-full-page="true" :active.sync="isLoading"></b-loading>
    <h1 style="position:absolute; top: 0; right:0; font-size:22px; text-align:right"><span style="font-size:30px">LYRA</span><br>{{ balance }}</h1>
    <h1 class="is-title is-2" style="margin-top:8px">
      <v-gravatar style="float:left; border-radius:5px; margin-right: 25px; margin-top:-8px;" :email="wallet.address" />
      {{ configs.locales.ui.welcome_back }}
      <div style="font-size:18px; margin-top:-15px"><br>{{ wallet.address }}</div>
    </h1>
    <apexchart v-if="!isLoading" height="300px" width="100%" type="line" :options="options" :series="series"></apexchart>
    <div v-if="unconfirmed.length > 0">{{ configs.locales.home.unconfirmed_transactions }}</div>
    <b-table v-if="unconfirmed.length > 0" :data="unconfirmed" style="font-size:14px">
      <template slot-scope="props">
          <b-table-column field="type" label="Type">
            <b-icon icon="call-received" v-if="props.row.from !== wallet.address" style="color:green"></b-icon>
            <b-icon icon="call-made" v-if="props.row.from === wallet.address" style="color:red"></b-icon>
          </b-table-column>
          <b-table-column field="from" label="From">
            <v-gravatar style="float:left; border-radius:2px; margin-right: 10px; height:20px" :email="props.row.from" />
            {{ props.row.from }}
          </b-table-column>
          <b-table-column field="to" label="To">
            <v-gravatar style="float:left; border-radius:2px; margin-right: 10px; height:20px" :email="props.row.to" />
            {{ props.row.to }}
          </b-table-column>
          <b-table-column field="value" label="Value">
              {{ props.row.value.toFixed(8) }} LYRA
          </b-table-column>
      </template>
    </b-table>
    <div v-if="confirmed.length > 0">{{ configs.locales.home.latest_transactions174.138.100.175 }}</div>
    <b-table :data="confirmed" :pagination-simple="true" :paginated="true" :per-page="5" style="font-size:14px">
      <template slot-scope="props">
          <b-table-column field="type" label="Type">
            <b-icon icon="call-received" v-if="props.row.from !== wallet.address" style="color:green"></b-icon>
            <b-icon icon="call-made" v-if="props.row.from === wallet.address" style="color:red"></b-icon>
          </b-table-column>
          <b-table-column field="from" label="From">
            <v-gravatar style="float:left; border-radius:2px; margin-right: 10px; height:20px" :email="props.row.from" />
            {{ props.row.from }}
          </b-table-column>
          <b-table-column field="to" label="To">
            <v-gravatar style="float:left; border-radius:2px; margin-right: 10px; height:20px" :email="props.row.to" />
            {{ props.row.to }}
          </b-table-column>
          <b-table-column field="date" label="Date">
              {{ props.row.date }}
          </b-table-column>
          <b-table-column field="block" label="Block">
              {{ props.row.blockheight }}
          </b-table-column>
          <b-table-column field="value" label="Value">
              {{ props.row.value.toFixed(8) }} LYRA
          </b-table-column>
      </template>
      <template slot="empty">
          <section class="section">
              <div class="content has-text-grey has-text-centered">
                  <p>
                      <b-icon
                          icon="emoticon-sad"
                          size="is-large">
                      </b-icon>
                  </p>
                  <p>Nothing here.</p>
              </div>
          </section>
      </template>
    </b-table>
  </div>
</template>

<script>
  let ScryptaCore = require("@scrypta/core")
  import User from '@/user'
  export default {
    name: 'Dashboard',
    data() {
      return {
        scrypta: new ScryptaCore(true),
        configs: {},
        wallet: "",
        options: {
          xaxis: {
            categories: [],
            type: 'datetime'
          },
          colors: ['#D8213B']
        },
        series: [{
          name: 'LYRA',
          data: []
        }],
        transactions: [],
        confirmed: [],
        unconfirmed: [],
        movements: {},
        graph: {},
        balance: 0,
        isLogging: true,
        isLoading: true
      };
    },
    async mounted() {
      const app = this;
      app.wallet = await User.auth()
      if(app.wallet !== false){
        app.configs = await User.configs()
        if(app.configs.chain === 'LYRA'){
          await app.fetchLYRATransactions()
          app.isLoading = false
          setInterval(function(){
            app.fetchLYRATransactions()
          }, 15000)
        }else{
          await app.fetchPlanumTransactions()
          app.isLoading = false
          setInterval(function(){
            app.fetchPlanumTransactions()
          }, 15000)
        }
      }
    },
    methods: {
      fetchLYRATransactions(){
        const app = this
        return new Promise(async response => {
          let balance = await app.scrypta.get('/balance/' + app.wallet.address)
          app.balance = balance.balance
          app.options.xaxis.categories = []
          app.series[0].data = []
          app.transactions = await app.scrypta.get('/transactions/' + app.wallet.address)
          let transactions = app.transactions.data.reverse()
          let initDate
          let endDate
          let last = transactions.length - 1

          for(let x in transactions){
            let transaction = app.transactions.data[x]
            let date = app.getDate(transaction.time * 1000)
            if(initDate === undefined){
              initDate = date
            }
            if(parseFloat(x) === parseFloat(last)){
              endDate = date
            }
            if(app.movements[date] === undefined){
              app.movements[date] = 0
            }
            app.movements[date] += transaction.value
          }

          var getDaysArray = function(s,e) {for(var a=[],d=new Date(s);d<=e;d.setDate(d.getDate()+1)){ a.push(app.getDate(d));}return a;};
          var daylist = getDaysArray(new Date(initDate),new Date(endDate))

          for(let y in daylist){
            let day = daylist[y]
            let timestamp = new Date(day).getTime()
            let prev = new Date(daylist[(y-1)]).getTime()

            let daybalance = 0
            let previous = app.graph[prev]
            if(previous !== undefined){
              daybalance = previous
            }
            if(app.movements[day] !== undefined){
              daybalance += app.movements[day]
            }
            app.graph[timestamp] = parseFloat(daybalance.toFixed(8))
          }

          for(let time in app.graph){
            app.options.xaxis.categories.push(parseInt(time))
            app.series[0].data.push(app.graph[time])
          }
          if(app.transactions.unconfirmed.length > 0){
            for(let x in app.transactions.unconfirmed){
              let transaction = app.transactions.unconfirmed[x]
              if(transaction.to[1] !== undefined || transaction.from[0] !== transaction.to[1]){
                transaction.date = app.getDate(transaction.time*1000)
                let expdate = transaction.date.split('-')
                transaction.date = expdate[2] + '/' + expdate[1] + '/' + expdate[0] + ' at ' + app.getTime(transaction.time*1000)
                transaction.from = transaction.from[0]
                if(transaction.to[1] !== undefined){
                  transaction.to = transaction.to[1]
                }
                app.unconfirmed.push(transaction)
              }
            }
          }

          app.transactions = app.transactions.data.reverse()
          for(let x in app.transactions){
            let transaction = app.transactions[x]
            if(transaction.to[1] !== undefined || transaction.from[0] !== transaction.to[1]){
              transaction.date = app.getDate(transaction.time*1000)
              let expdate = transaction.date.split('-')
              transaction.date = expdate[2] + '/' + expdate[1] + '/' + expdate[0] + ' at ' + app.getTime(transaction.time*1000)
              transaction.from = transaction.from[0]
              if(transaction.to[1] !== undefined){
                transaction.to = transaction.to[1]
              }
              app.confirmed.push(transaction)
            }
          }
          response(true)
        })
      },
      fetchPlanumTransactions(){
        const app = this
        return new Promise(async response => {
          response(true)
        })
      },
      getDate(time){
        let date = new Date(time)
        let y = date.getFullYear()
        let m = date.getMonth() + 1
        let d = date.getDate()
        return y + '-' + m + '-' + d
      },
      getTime(time){
        let date = new Date(time)
        let h = `${date.getHours()}`.padStart(2, '0')
        let m = `${date.getMinutes()}`.padStart(2, '0')
        let s = `${date.getSeconds()}`.padStart(2, '0')
        return h + ':' + m + ':' + s
      }
    }
  };
</script>