<template>
  <div class="container-fluid">
    <div class="container-fluid text-center">    
      <div class="row justify-content-md-center">
        <div class="col-sm-10 col-md-8 col-lg-8 text-left"> 
           <contacts class="card-container"></contacts>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Contacts from './Contacts'

export default {
  name: "main-console",
  components: {
    'contacts': Contacts
  },
  data() {
    return {}
  }
}
</script>

<style lang="scss">
.card-container {
  padding-top: 20px
}
</style>
