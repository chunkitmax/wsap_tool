<template>
  <b-card-group columns>
    <b-card
      v-for="contact of contacts"
      :key="contact.index"
      :title="contact.name"
      :img-src="contact.picUrl"
      img-top
      tag="article"
      style="max-width: 20em"
      class="mb-2">
      <p class="card-text align-self-end">{{ contact.when }}</p>
    </b-card>
  </b-card-group>
</template>

<script>
import axios from "axios"

export default {
  name: "contact-card",
  data() {
    return {
      contacts: []
    }
  },
  created() {
    console.log('created')
    // this.$socket.emit('get:contact')
    axios({ method: "POST", "url": '/contacts', responseType: 'json' }).then(res => {
      this.contacts = res.data
    }, err => {})
  }
}
</script>
