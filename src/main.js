import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import Buefy from 'buefy'
import './assets/style.scss'
import Gravatar from 'vue-gravatar';
import VueApexCharts from 'vue-apexcharts'

Vue.component('apexchart', VueApexCharts)
Vue.config.productionTip = false
Vue.component('v-gravatar', Gravatar);
Vue.use(Buefy)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
