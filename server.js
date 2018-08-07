const Express = require('express')
const Fs = require('fs')
const Path = require('path')
const BodyParser = require('body-parser')
const SocketIo = require('socket.io')
const Session = require('express-session')
const SharedSession = require('express-socket.io-session')
const WhatsApp = require('./whatsapp')
// obtain bundle
const Bundle = require('./dist/server.bundle.js')

// get renderer from vue server renderer
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

// start server
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

      renderer.renderToString(vue, context, function (err, html) {
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

app.post('/conversation', (req, res) => {
  if (req.session.allowAccess) {
    res.json(JSON.stringify(WsapInstance.conversation.reverse()))
  }
})

// Init whatsapp module
let WsapInstance = new WhatsApp()
WsapInstance.start()

// Bind the app to this port.
let server = app.listen(8080)

// Init socket.io
let io = SocketIo(server)

io.use(SharedSession(session, { autoSave: true }))

const MAX_CONNECTION = 1
let connectionCount = 0

io.on('connection', (socket) => {
  socket.handshake.session.allowAccess = false
  socket.on('initialize', (func) => {
    if (connectionCount < MAX_CONNECTION) {
      connectionCount++
      socket.handshake.session.allowAccess = true
      socket.handshake.session.save()
    }
    func(socket.handshake.session.allowAccess)
  })
  socket.on('disconnect', () => {
    if (socket.handshake.session.allowAccess) {
      connectionCount--
    }
  })
  socket.on('check:ready', () => {
    io.to(socket.id).emit('isReady', WsapInstance.isReady)
  })
})
