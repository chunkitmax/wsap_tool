<template>
  <div class="container">
    <div class="row">
      <div id="loader">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="lading"></div>
      </div>
    </div>
    <b-modal ref="accessDenied" centered hide-footer hide-header hide-header-close no-close-on-backdrop no-close-on-esc>
      <div class="d-block text-center">
        <h2 class="text-danger">Only 1 connection at a time</h2>
      </div>
    </b-modal>
  </div>
</template>

<script>
export default {
  name: "app",
  data() {
    return {}
  },
  sockets: {
    connect() {
      // ...
      console.log("connected");
    },
    disconnect() {
      // ...
    },
    isReady(status) {
      if (status) {
        clearInterval(this.timer)
        this.$router.push('main')
      }
    }
  },
  methods: {
    initialize() {
      this.$socket.emit("initialize", isAllowed => {
        if (isAllowed) {
          console.log(isAllowed)
          this.timer = setInterval(() => this.$socket.emit('check:ready'), 3000)
        } else {
          this.showDeniedMsg()
        }
      })
    },
    showDeniedMsg() {
      this.$refs.accessDenied.show()
    }
  },
  mounted: function() {
    this.$nextTick(function() {
      this.initialize();
    });
  }
}
</script>

<style lang="scss">
#loader {
  bottom: 0;
  height: 175px;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
  width: 175px;
}
#loader {
  bottom: 0;
  height: 175px;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
  width: 175px;
}
#loader .dot {
  bottom: 0;
  height: 100%;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
  width: 87.5px;
}
#loader .dot::before {
  border-radius: 100%;
  content: "";
  height: 87.5px;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  transform: scale(0);
  width: 87.5px;
}
#loader .dot:nth-child(7n + 1) {
  transform: rotate(45deg);
}
#loader .dot:nth-child(7n + 1)::before {
  animation: 0.8s linear 0.1s normal none infinite running load;
  background: #00ff80 none repeat scroll 0 0;
}
#loader .dot:nth-child(7n + 2) {
  transform: rotate(90deg);
}
#loader .dot:nth-child(7n + 2)::before {
  animation: 0.8s linear 0.2s normal none infinite running load;
  background: #00ffea none repeat scroll 0 0;
}
#loader .dot:nth-child(7n + 3) {
  transform: rotate(135deg);
}
#loader .dot:nth-child(7n + 3)::before {
  animation: 0.8s linear 0.3s normal none infinite running load;
  background: #00aaff none repeat scroll 0 0;
}
#loader .dot:nth-child(7n + 4) {
  transform: rotate(180deg);
}
#loader .dot:nth-child(7n + 4)::before {
  animation: 0.8s linear 0.4s normal none infinite running load;
  background: #0040ff none repeat scroll 0 0;
}
#loader .dot:nth-child(7n + 5) {
  transform: rotate(225deg);
}
#loader .dot:nth-child(7n + 5)::before {
  animation: 0.8s linear 0.5s normal none infinite running load;
  background: #2a00ff none repeat scroll 0 0;
}
#loader .dot:nth-child(7n + 6) {
  transform: rotate(270deg);
}
#loader .dot:nth-child(7n + 6)::before {
  animation: 0.8s linear 0.6s normal none infinite running load;
  background: #9500ff none repeat scroll 0 0;
}
#loader .dot:nth-child(7n + 7) {
  transform: rotate(315deg);
}
#loader .dot:nth-child(7n + 7)::before {
  animation: 0.8s linear 0.7s normal none infinite running load;
  background: magenta none repeat scroll 0 0;
}
#loader .dot:nth-child(7n + 8) {
  transform: rotate(360deg);
}
#loader .dot:nth-child(7n + 8)::before {
  animation: 0.8s linear 0.8s normal none infinite running load;
  background: #ff0095 none repeat scroll 0 0;
}
#loader .lading {
  /* background-image: url("../images/loading.gif"); */
  background-position: 50% 50%;
  background-repeat: no-repeat;
  bottom: -40px;
  height: 20px;
  left: 0;
  position: absolute;
  right: 0;
  width: 180px;
}
@keyframes load {
  100% {
    opacity: 0;
    transform: scale(1);
  }
}
@keyframes load {
  100% {
    opacity: 0;
    transform: scale(1);
  }
}
</style>
