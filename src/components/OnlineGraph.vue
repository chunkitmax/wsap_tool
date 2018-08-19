<template>
  <div class="col-sm-12 mt-2" role="tablist">
    <b-card no-body v-for="record of records" :key="record._id">
      <b-card-header header-tag="header" class="p-1" role="tab">
        <b-btn block href="#" v-b-toggle="'collapse_'+record._id" outline-primary>{{ record.name }}</b-btn>
      </b-card-header>
      <b-collapse :id="'collapse_'+record._id" accordion="my-accordion" role="tabpanel">
        <b-card-body>
          <b-progress class="my-2" :max="288" v-for="distribution of record.distributions" :key="distribution.dayOfWeek">
            <b-progress-bar
              v-for="timeslot of distribution.timeslots"
              :key="timeslot.index"
              :value="timeslot.value"
              :variant="timeslot.variant">
            </b-progress-bar>
          </b-progress>
        </b-card-body>
      </b-collapse>
    </b-card>
  </div>
</template>

<script>
import axios from "axios"

export default {
  name: "online-graph",
  data() {
    return {
      records: []
    }
  },
  created() {
    axios.get('/online-statistic', { responseType: 'json' }).then(res => {
      this.records = res.data.map(record => {
        record.distributions = record.distributions.map(distribution => {
          distribution.timeslots = []
          let lastVal = null
          let counter = 0

          function addTimeslot() {
            distribution.timeslots.push({
              index: distribution.timeslots.length,
              value: counter,
              variant: ((lastVal)? 'primary' : 'light')
            })
          }

          distribution.counts.forEach((val, index) => {
            if (lastVal == null) {
              lastVal = val
              counter++
            } else if (lastVal != val) {
              addTimeslot()
              lastVal = val
              counter = 1
            } else {
              counter++
            }
          })
          addTimeslot()
          delete distribution.counts

          return distribution
        })
        return record
      })
    })
  }
}
</script>
