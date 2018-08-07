<template>
  <div class="container-fluid">
    <div class="container-fluid text-center">    
      <div class="row justify-content-md-center">
        <div class="col-sm-10 col-md-8 col-lg-8 text-left"> 
           <contact-card class="card-container"></contact-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ContactCard from './ContactCard'

export default {
  name: "main-console",
  components: {
    'contact-card': ContactCard
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
