const Express = require('express')
const Fs = require('fs')
const Assert = require('assert')
const Path = require('path')
const BodyParser = require('body-parser')
const SocketIo = require('socket.io')
const Session = require('express-session')
const SharedSession = require('express-socket.io-session')
const Database = require('./database')
const WhatsApp = require('./whatsapp')
const Sleep = require('sleep')
// Obtain bundle
const Bundle = require('./dist/server.bundle.js')

Array.prototype.asyncForEach = async function (callback) {
  for (let index = 0; index < this.length; index++) {
    await callback(this[index], index, this)
  }
}

async function main() {
  // Get renderer from vue server renderer
  const renderer = require('vue-server-renderer').createRenderer({
    template: Fs.readFileSync('./index.html', 'utf-8')
  })

  // Create the express app.
  const app = Express()

  // BodyParser
  app.use(BodyParser.json())
  app.use(BodyParser.urlencoded({ extended: true }))
  // Session
  let session = Session({
    secret: 'wsap-tool',
    resave: true,
    saveUninitialized: true
  })
  app.use(session)

  app.use('/dist', Express.static(Path.join(__dirname, './dist')))

  // Init whatsapp module
  let WsapInstance = new WhatsApp()
  let qrListener = null
  // Connect mongodb
  let Record = null
  try {
    Record = await Database.connect()
  } catch (err) {
    console.error(err)
    process.exit()
  }

  // Define endpoints
  app.get('/contacts', async (req, res) => {
    if (req.session.allowAccess) {
      res.json(JSON.stringify(WsapInstance.recentContacts.reverse()))
    }
  })

  app.post('/contacts', async (req, res) => {
    if (['name', 'phoneNo'].every(field => req.body[field])) {
      let foundCount = await Record.where({ phoneNo: req.body.phoneNo }).count().exec()
      if (foundCount == 0) {
        let newRecord = req.body
        newRecord['probability'] = []
        for (let i = 0; i <= 7; i++) {
          let tmpProbability = { dayOfWeek: i, count: [] }
          for (let j = 0; j < 288; j++)
            tmpProbability.count.push(0)
          newRecord['probability'].push(tmpProbability)
        }
        (new Record(newRecord)).save()
      } else {
        res.status(403).end('Already have an entry with same phone number')
      }
    } else {
      res.status(404).end('Required parameter(s) not provided')
    }
  })

  app.get('/icon', async (req, res) => {
    if (req.query.e) {
      let buffer = await WsapInstance.getImage(decodeURIComponent(req.query.e))
      res.writeHead(200, { 'content-type': 'image/jpg' })
      res.end(buffer.split(',')[1], 'base64')
    } else {
      res.sendStatus(404)
    }
  })

  app.get('*', (req, res) => {
    if (req.url == '/' || req.session.allowAccess == true) {
      Bundle.default({ url: req.url }).then((vue) => {
        // context to use as data source
        // in the template for interpolation
        const context = {
          title: 'Whatsapp Tool',
          meta: `
            <meta description="vuejs server side render">
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
          `
        }

        renderer.renderToString(vue, context, async function (err, html) {
          if (err) {
            if (err.code === 404) {
              res.status(404).end('Page not found')
            } else {
              res.status(500).end('Internal Server Error')
            }
          } else {
            res.end(html)
          }
        })
      }, (err) => {
        console.log(err)
      })
    } else {
      res.redirect(302, '/')
    }
  })

  // Bind the app to this port.
  let server = app.listen(8080)

  // Init socket.io
  let io = SocketIo(server)

  io.use(SharedSession(session, { autoSave: true }))

  // SocketIo
  const MAX_CONNECTION = 1
  let connectionCount = 0

  io.on('connection', (socket) => {
    socket.handshake.session.allowAccess = false
    socket.on('initialize', (func) => {
      if (connectionCount < MAX_CONNECTION) {
        connectionCount++
        socket.handshake.session.allowAccess = true
        socket.handshake.session.save()
        qrListener = (newQr) => {
          io.to(socket.id).emit('qrChanged', newQr)
        }
        let tmpQr = WsapInstance.getCurrentQr()
        if (tmpQr) {
          qrListener(tmpQr)
        }
      }
      func(socket.handshake.session.allowAccess)
    })
    socket.on('disconnect', () => {
      if (socket.handshake.session.allowAccess) {
        connectionCount--
      }
    })
    socket.on('check:ready', (callback) => {
      callback(WsapInstance.isReady)
    })
  })

  function onQrChanged(newQr) {
    if (qrListener) {
      qrListener(newQr)
    }
  }
  function onLoggedIn() {
    io.emit('loggedIn')
  }
  // Start whatsapp module
  await WsapInstance.start(onQrChanged, onLoggedIn)

  Sleep.sleep(3)

  async function savePresenceChange(phoneNo, timestamp, state) {
    console.log('Presence changed: ', phoneNo, timestamp, state)
    try {
      let date = new Date(timestamp)
      if (state) {
        let lastUpdate = (await Record.aggregate([
          { $match: { phoneNo } },
          { $project: { _id: 0, lastUpdate: 1 } }
        ]).exec())[0].lastUpdate
        let newUpdateMargin = lastUpdate - lastUpdate % 300000 + 300000
        if (timestamp >= newUpdateMargin)
          await Record.findOneAndUpdate(
            { phoneNo },
            { $set: { lastOnline: timestamp } }
          ).exec()
      } else {
        let lastOnline = (await Record.aggregate([
          { $match: { phoneNo } },
          { $project: { _id: 0, lastOnline: 1 } }
        ]).exec())[0].lastOnline
        if (lastOnline < 0) {
          await Record.findOneAndUpdate(
            { phoneNo },
            { $set: { lastOnline: -1 } }
          ).exec()
          return
        }
        let lastDate = new Date(lastOnline)
        let timeslotIndex = Math.floor((lastDate.getHours()*60 + lastDate.getMinutes()) / 5)
        let affectCount = Math.ceil((date - lastOnline) / 300000)
        let updateObj = { $inc: {}, $set: { lastOnline: -1 } }
        for (let j = lastDate.getDay(); j <= date.getDay(); j++) {
          for (let i = timeslotIndex; i < 288 && affectCount > 0; i++, affectCount--) {
            updateObj['$inc'][`probability.${j}.count.${i}`] = 1
          }
          timeslotIndex = 0
        }
        updateObj['$set']['lastUpdate'] = Date.now()
        await Record.findOneAndUpdate(
          { phoneNo },
          updateObj
        ).exec()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Register online state listeners
  try {
    let recordList = await Record.aggregate([
      { $project: { _id: 0, phoneNo: 1 } },
    ])
    console.log(recordList)
    await Record.updateMany(
      {},
      { $set: { lastOnline: -2 } }
    ).exec()
    await recordList.map(v => v.phoneNo).asyncForEach(async phoneNo => {
      await WsapInstance.setPresenceHook(phoneNo)
    })
    let timer = setInterval(async () => {
      let history = await WsapInstance.getPresenceHistory()
      let promises = []
      for (let phoneNo in history) {
        promises.push(history[phoneNo].asyncForEach(async ([timestamp, state]) => {
          await savePresenceChange(parseInt(phoneNo), timestamp, state)
        }))
      }
      await Promise.all(promises)
    }, 10000)
  } catch (err) {
    console.error(err)
  }
}

if (require.main === module) {
  main()
}