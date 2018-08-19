const Mongoose = require('mongoose')

class Database {
  constructor(url = 'mongodb://localhost/wsap_tool') {
    this.url = url
  }
  connect() {
    return Mongoose.connect('mongodb://localhost:27017/wsap_tool').then(() => {
      return Mongoose.model('OnlineRecord', Database.OnlineRecord)
    })
  }
  static get OnlineRecord() {
    return new Mongoose.Schema({
      name: String,
      phoneNo: Number,
      distributions: [{ dayOfWeek: Number, counts: [Number] }],
      lastOnline: Number,
      lastUpdate: Number
    })
  }
}

module.exports = new Database