<template>
  <div class="container-fluid">
    <div class="row">
      <b-input-group prepend="Contact">
        <b-form-input v-model.trim="name" placeholder="Name"></b-form-input>
        <b-form-input v-model.number="phoneNo" placeholder="Phone Number"></b-form-input>
        <b-btn variant="outline-success" @click="sendContact">Add</b-btn>
      </b-input-group>
    </div>
    <div class="row">
      <online-graph></online-graph>
    </div>
  </div>
</template>

<script>
import OnlineGraph from "./OnlineGraph"
import axios from "axios"

export default {
  name: "online-stat",
  components: {
    'online-graph': OnlineGraph
  },
  data() {
    return {
      name: "",
      phoneNo: null
    }
  },
  methods: {
    sendContact(e) {
      axios.post('/contacts', { name: this.name, phoneNo: this.phoneNo }).then((res) => {
        console.log(res)
      })
    }
  }
}
</script>

<style lang="scss">

</style>

