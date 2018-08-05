<template>
  <b-card-group columns>
    <b-card
      v-for="entry of chatEntries"
      :key="entry.index"
      :title="entry.name"
      :img-src="entry.picUrl"
      img-top
      tag="article"
      style="max-width: 40em"
      class="mb-3">
      <p class="card-text align-self-end">{{ entry.when }}</p>
    </b-card>
  </b-card-group>
</template>

<script>
import axios from "axios"

export default {
  name: "conversation-card",
  data() {
    return {
      chatEntries: []
    }
  },
  created() {
    console.log('created')
    // this.$socket.emit('get:conversation')
    axios({ method: "POST", "url": '/conversation', responseType: 'json' }).then(conversation => {
      this.chatEntries = conversation.data
    }, err => {})
  }
}
</script>
