import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import(/* webpackChunkName: "dashboard" */ '../views/Dashboard.vue')
  },
  {
    path: '/send',
    name: 'Send',
    component: () => import(/* webpackChunkName: "send" */ '../views/Send.vue')
  },
  {
    path: '/receive',
    name: 'Receive',
    component: () => import(/* webpackChunkName: "receive" */ '../views/Receive.vue')
  },
  {
    path: '/vault',
    name: 'Vault',
    component: () => import(/* webpackChunkName: "vault" */ '../views/Vault.vue')
  },
  {
    path: '/identities',
    name: 'Identities',
    component: () => import(/* webpackChunkName: "identities" */ '../views/Identities.vue')
  },
  {
    path: '/sign',
    name: 'Sign',
    component: () => import(/* webpackChunkName: "sign" */ '../views/Sign.vue')
  },
  {
    path: '/portfolio',
    name: 'Portfolio',
    component: () => import(/* webpackChunkName: "portfolio" */ '../views/Portfolio.vue')
  },
  {
    path: '/contacts',
    name: 'Contacts',
    component: () => import(/* webpackChunkName: "contacts" */ '../views/Contacts.vue')
  },
  {
    path: '/backup',
    name: 'Backup',
    component: () => import(/* webpackChunkName: "backup" */ '../views/Backup.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import(/* webpackChunkName: "settings" */ '../views/Settings.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
