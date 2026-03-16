import dotenv from 'dotenv'
import express, { type Application } from 'express'
import TelegramMessenger from './messenger/telegram'
import semverInfo from '../sem-ver.json'

dotenv.config()

class App {
  expressWebServer: Application | null = null
  telegramMessenger: TelegramMessenger | null = null

  init(): void {
    if (this.expressWebServer || this.telegramMessenger) {
      console.log('⚡️[app]: App already initialized')
      return
    } 

    const TELEGRAM_BOT_TOKEN: string | null = process.env.TELEGRAM_BOT_TOKEN || null
    const DEBUG: boolean = process.env.DEBUG === 'false' ? false : true
    const HEROKU_URL: string | undefined = process.env.HEROKU_URL

    if (TELEGRAM_BOT_TOKEN) {
      try {
        const messenger = new TelegramMessenger()
        messenger.init(TELEGRAM_BOT_TOKEN, DEBUG, HEROKU_URL)
        this.telegramMessenger = messenger
        this.expressWebServer = this.initExpress(messenger)
      } catch (e: any) {
        console.log('⚡️[app]: Error, ' + e.message)
      }
    } else {
      console.log('⚡️[app]: Error, please set TELEGRAM_BOT_TOKEN in .env file')
    }
  }

  initExpress(messenger: TelegramMessenger): Application {
    const PORT = process.env.PORT || 3000
    console.log('⚡️[app]: Initializing express web server')
    const server = express()
    
    // Use built-in Express middleware for parsing
    server.use(express.urlencoded({ extended: false }))
    server.use(express.json())
    
    server.get('/', function (req, res) {
      console.log(`⚡️[app]: Received GET request from ${req.ip}`)
      res.json(semverInfo)
    })
    server.listen(PORT, () => {
      console.log(`⚡️[app]: Server is running on port ${PORT}`)
    })
    server.post('/' + process.env.TELEGRAM_BOT_TOKEN, function (req, res) {
      console.log('⚡️[app]: Get request from Telegram')
      messenger.processUpdate(req.body)
      res.sendStatus(200)
    });
    return server;
  }
}

export default App
  