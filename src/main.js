import Vue from 'vue'
import App from './App.vue'
import { createRouter } from './router/router.js'

import AsyncComputed from 'vue-async-computed'
import VueSocketio from 'vue-socket.io-extended'
import socketio from 'socket.io-client'
import BootstrapVue from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.use(VueSocketio, socketio('http://localhost:8080'))
Vue.use(BootstrapVue)
Vue.use(AsyncComputed)

// export a factory function for creating fresh app, router and store
// instances
export function createApp () {
  // create router instance
  const router = createRouter()

  const app = new Vue({
    router,
    // the root instance simply renders the App component.
    render: h => h(App)
  })

  return { app, router }
}
