<template>
  <div class="container-fluid">
    <div class="container-fluid text-center">    
      <div class="row justify-content-md-center">
        <div class="col-sm-10 col-md-8 col-lg-8 text-left"> 
           <conversation-card class="card-container"></conversation-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Conversation from './ConversationCard'

export default {
  name: "main-console",
  components: {
    'conversation-card': Conversation
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
