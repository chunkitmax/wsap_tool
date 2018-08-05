import Vue from 'vue'
import Router from 'vue-router'

import Loader from '../components/Loader.vue'
import MainConsole from '../components/MainConsole.vue'

Vue.use(Router)


export function createRouter () {
  return new Router({
    mode: 'history',
    routes: [
      { path: '/', component: Loader },
      { path: '/main', component: MainConsole }
    ]
  })
}
