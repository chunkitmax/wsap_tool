const Webdriver = require('selenium-webdriver')
const firefox = require('selenium-webdriver/firefox')
const chrome = require('selenium-webdriver/chrome')
const ie = require('selenium-webdriver/ie')
const edge = require('selenium-webdriver/edge')
const opera = require('selenium-webdriver/opera')
const safari = require('selenium-webdriver/safari')
const By = Webdriver.By
const Until = Webdriver.until
const Sleep = require('sleep')
const Https = require('https')

class Tab {
  constructor() {
    this._elem = null
    this.name = null
    this.lastMsg = null
    this.when = null
    this.picUrl = null
    this.isLastMsgFromMe = false
    this.isUnread = false
  }
  async fromElem(elem) {
    let lastMsgElem = await elem.findElement(By.xpath('.//span[@title!=""]/span[not(@title)]/..'))
    this.name = await elem.findElement(By.xpath('.//span[@title!=""]')).getAttribute('title')
    this.lastMsg = await lastMsgElem.getAttribute('title')
    // this.isLastMsgFromMe
    this.when = await elem.findElement(By.xpath(
      // './/div/div[not(@data-icon)]/span[not(@data-icon) and not(@title) and text()!="")]'
      './div/div[position()=2]/div[position()=1]/div[position()=2]/span'
    )).getText()
    try {
      this.picUrl = await elem.findElement(By.tagName('img')).getAttribute('src')
    } catch (e) { }
    let statusElem = null
    try {
      statusElem = await lastMsgElem.findElement(
        By.xpath('./div[position()=1 and starts-with(@data-icon,"status")]')
      )
    } catch (e) { }
    if (statusElem &&
      ['status-dblcheck-ack', 'status-dblcheck', 'status-check'].indexOf(await statusElem.getAttribute('data-icon')) >= 0) {
      this.isLastMsgFromMe = true
    } else {
      try {
        await elem.findElement(By.xpath('.//div/span[position()=1]/div/span[@class!=""]'))
        this.isUnread = true
      } catch (e) { }
    }
    return this
  }
}

Array.prototype.asyncForEach = async function (callback) {
  for (let index = 0; index < this.length; index++) {
    await callback(this[index], index, this)
  }
}

class WhatsApp {
  constructor(type = 'firefox', trackOnline = false) {
    const screen = {
      width: 640,
      height: 480
    };
    let webDriverBuilder = new Webdriver.Builder()
    this.browser = (() => {
      let tmpBuilder = webDriverBuilder.forBrowser(type)
      if (process.env.NODE_ENV == 'production') {
        switch (type) {
          case 'firefox':
            return tmpBuilder.setFirefoxOptions(new firefox.Options().headless().windowSize(screen))
          case 'chrome':
            return tmpBuilder.setChromeOptions(new chrome.Options().headless().windowSize(screen))
          case 'ie':
            return tmpBuilder.setIeOptions(new ie.Options().headless().windowSize(screen))
          case 'edge':
            return tmpBuilder.setEdgeOptions(new edge.Options().headless().windowSize(screen))
          case 'opera':
            return tmpBuilder.setOperaOptions(new opera.Options().headless().windowSize(screen))
          case 'safari':
            return tmpBuilder.setSafariOptions(new safari.Options().headless().windowSize(screen))
        }
      } else {
        return tmpBuilder
      }
    })().build()
    this.browser.get('https://web.whatsapp.com/')
  }
  async start(onQrChanged) {
    // wait for qr code
    await this.browser.wait(Until.elementLocated(By.css('* img')))
    // don't remember me
    let rememberMe = await this.browser.findElement(By.xpath('//input[@name="rememberMe"]'))
    if (rememberMe) {
      rememberMe.click()
    }
    // get base64 string of qr code and shown as image (from my python code)
    // img_src = browser.find_element('* img').get_attribute('src')
    // img_base64 = re.search(r'^data:image/png;base64,(.+)$', img_src).group(1)
    // img = Image.open(io.BytesIO(base64.b64decode(img_base64)))
    // img.show()
    // wait for login
    const getQrRelatedElement = async () => {
      // wait for qr code
      await this.browser.wait(Until.elementLocated(By.css('* img')))
      let r1 = await this.browser.findElement(By.css('* img'))
      let r2 = await r1.findElement(By.xpath('./..'))
      return [r1, r2, await r2.getAttribute('data-ref')]
    }
    let [qrImg, imgParent, imgDataRef] = await getQrRelatedElement()
    this.lastQr = await qrImg.getAttribute('src')
    onQrChanged(this.lastQr)
    Sleep.sleep(1)
    while (true) {
      await this.keepQrAlive()
      try {
        let tmpDataRef = await imgParent.getAttribute('data-ref')
        if (tmpDataRef != imgDataRef) {
          imgDataRef = tmpDataRef
          this.lastQr = await qrImg.getAttribute('src')
          onQrChanged(this.lastQr)
        }
      } catch (e) {
        [qrImg, imgParent, imgDataRef] = await getQrRelatedElement()
        Sleep.sleep(1)
      }
      if (await this.checkLogin())
        break
    }
    delete this.lastQr
    this.isLoggedIn = true
    // wait for side panel
    await this.browser.wait(Until.elementLocated(By.css('#pane-side')))
    Sleep.msleep(500)
    // get all recent contacts
    let tabs = await this.browser.findElements(By.xpath("//div[@id='pane-side']//div[@tabindex='-1']/div[@class!='']/.."))
    this.recentContacts = []
    await tabs.asyncForEach(async tab => {
      let tmpTabObj = await (new Tab()).fromElem(tab)
      this.recentContacts.push(tmpTabObj)
      if (tmpTabObj.isUnread) {
        console.info(`Name: ${tmpTabObj.name}, Last Message: ${tmpTabObj.lastMsg}`)
      }
    })
    this.initApi()
    this.isReady = true
    // this.browser.close()
  }
  async keepQrAlive() {
    let locator = By.xpath(`//div[text()="Click to reload QR code"]`)
    try {
      await this.browser.wait(
        Until.elementLocated(locator),
        1000
      )
    } catch (e) {
      return
    }
    (await this.browser.findElement(locator)).click()
    // sleep?
  }
  async checkLogin() {
    try {
      await this.browser.findElement(By.xpath(`//div[text()="WhatsApp Web"]`))
      Sleep.sleep(2)
      return false
    } catch (e) {
      return true
    }
  }
  getCurrentQr() {
    return this.lastQr
  }
  async initApi() {
    // get all scripts
    let scripts = await this.browser.findElements(By.css('script'))
    let appSrcExtractors = [
      new RegExp(/\/app\..+js/),
      new RegExp(/\/app2\..+js/)
    ]
    let appSrcLoc = []
    // find app script location
    await scripts.asyncForEach(async script => {
      try {
        let src = await script.getAttribute('src')
        appSrcExtractors.forEach((extractor, index) => {
          if (extractor.test(src)) {
            appSrcLoc.push([src, index])
          }
        })
      } catch (e) { } // some script elements may not have src attribute
    })
    // prepare members in window object
    let memberNames = ['window.WLAPWAPStore', 'window.WLAPStore']
    let funcNameExtractor = [
      new RegExp(/Wap:n\(\'"(\w+)"\'\)/),
      new RegExp(/\'"(\w+)"\':function\(e,t,a\)\{\"use strict\";e\.exports=\{AllStarredMsgs:/)
    ]
    await appSrcLoc.reverse().asyncForEach(async ([loc, index]) => {
      let jsData = await new Promise((resolve, reject) => {
        Https.get(loc, (res) => {
          let data = ''
          res.setEncoding('utf8')
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => resolve(data))
        })
      })
      let funcName = funcNameExtractor[index].exec(jsData)[1]
      this.browser.executeScript(`${memberNames[index]} = {}`)
      this.browser.executeScript(
        `webpackJsonp([], { ["${funcName}"]: (x, y, z) => ${memberNames[index]} = z(\'"${funcName}"\') }, "${funcName}")`
      )
      // console.info(`Init ${memberNames[index]}`)
    })
  }
}

module.exports = WhatsApp