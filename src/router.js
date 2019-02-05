import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/upload',
      name: 'upload',
      component: () => import(/* webpackChunkName: "about" */ './views/Upload.vue')
    },
    {
      path: '/storage',
      name: 'storage',
      component: () => import(/* webpackChunkName: "about" */ './views/Storage.vue')
    }
  ]
})
