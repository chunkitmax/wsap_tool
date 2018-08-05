import Vue from 'vue'
import Router from 'vue-router'

import Loader from '../components/Loader.vue'
import MainConsole from '../components/MainConsole.vue'
// import Home from '../components/Home.vue';
// import About from '../components/About.vue';

Vue.use(Router)


export function createRouter () {
  return new Router({
    mode: 'history',
    routes: [
      { path: '/', component: Loader },
      { path: '/main', component: MainConsole }
      // { path: '/', component: Home },
      // { path: '/about', component: About }
    ]
  })
}
