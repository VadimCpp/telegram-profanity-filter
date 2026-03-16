import assert from 'assert'
import sinon, { type SinonStub } from 'sinon'
import express from 'express'
import proxyquire from 'proxyquire'
import TelegramMessenger from '../src/messenger/telegram'

// Define types for our fake express
interface IFakeExpress {
  use: SinonStub;
  get: SinonStub;
  post: SinonStub;
  listen: SinonStub;
  json: SinonStub;
  urlencoded: SinonStub;
  sendStatus: SinonStub;
}

// Create a fake constructor
function FakeExpress(this: IFakeExpress | undefined) {
  if (!(this instanceof FakeExpress)) {
    return new (FakeExpress as any)();
  }

  // Initialize instance properties
  this.use = sinon.stub().returnsThis();
  this.get = sinon.stub().callsFake((path: string, callback: (req: any, res: any) => void) => {
    callback({ ip: '127.0.0.1' }, { json: sinon.stub().returnsThis() });
    return this;
  });
  this.post = sinon.stub().callsFake((path: string, callback: (req: any, res: any) => void) => {
    callback({ body: { message: { text: 'test' } } }, { sendStatus: sinon.stub().returnsThis() });
    return this;
  });
  this.listen = sinon.stub().callsFake((port: string | number, callback?: () => void) => {
    if (callback) callback();
    return this;
  });
  this.json = sinon.stub();
  this.urlencoded = sinon.stub().returns({});
  this.sendStatus = sinon.stub();
  
}

// Add static methods
FakeExpress.urlencoded = sinon.stub().returns({});
FakeExpress.json = sinon.stub().returns({});

// Proxyquire the module under test
const { default: App } = proxyquire.noCallThru()(
  '../src/app',
  { 'express': FakeExpress }
)


describe('App', () => {
  it('should create a new instance', () => {
    const result = new App()
    assert.notEqual(result, null)
    assert.notEqual(result, undefined)
    assert.equal(result.expressWebServer, null)
    assert.equal(result.telegramMessenger, null)
  });

  describe('init', () => {
    it('sinon mock should work correctly', () => {
      const initStub = sinon.stub(App.prototype, 'init');
      const app = new App()
      app.init()
      sinon.assert.calledOnce(initStub)
      initStub.restore()
    })

    it('should not create a bot without bot token', () => {
      process.env.TELEGRAM_BOT_TOKEN = ""
      const initStub = sinon.stub(TelegramMessenger.prototype, 'init');
      const logStub = sinon.stub(console, 'log');
      const app = new App()
      app.init()      
      sinon.assert.notCalled(initStub)
      sinon.assert.callCount(logStub, 1)
      sinon.assert.calledWith(logStub, '⚡️[app]: Error, please set TELEGRAM_BOT_TOKEN in .env file')  
      logStub.restore()
      initStub.restore()    
    })

    it ('should not create a server', async () => {
      process.env.TELEGRAM_BOT_TOKEN = "6611992266:AAGGooffSSKKaaIIkkRRFFEEhhLL11llkk"
      const initStub = sinon.stub(TelegramMessenger.prototype, 'init').throws(new Error('it happens'));
      const logStub = sinon.stub(console, 'log');
      const app = new App()
      app.init()
      sinon.assert.calledOnce(initStub)
      sinon.assert.callCount(logStub, 1)
      sinon.assert.calledWith(logStub, "⚡️[app]: Error, it happens")  
      logStub.restore()
      initStub.restore()
    })

    it ('should not init if bot and server has already exist', async () => {
      process.env.HEROKU_URL = ""
      const logStub = sinon.stub(console, 'log');
      const app = new App()
      app.expressWebServer = express()
      app.telegramMessenger = new TelegramMessenger()
      app.init()
      sinon.assert.callCount(logStub, 1)
      sinon.assert.calledWith(logStub, "⚡️[app]: App already initialized")  
      logStub.restore()
    })

    it ('should succesfully call initExpress method', async () => {
      process.env.TELEGRAM_BOT_TOKEN = "6611992266:AAGGooffSSKKaaIIkkRRFFEEhhLL11llkk"
      process.env.DEBUG = "false"
      process.env.HEROKU_URL = "https://test.herokuapp.com"
      const logStub = sinon.stub(console, 'log');
      const initExpressStub = sinon.stub(App.prototype, 'initExpress');
      const app = new App()
      app.init()
      sinon.assert.calledOnce(app.initExpress as SinonStub)
      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), " 🤖[telegram]: Initializing bot")
      sinon.assert.calledWith(logStub.getCall(1), ' 🤖[telegram]: Run in production (set webhook)')
      logStub.restore()
      initExpressStub.restore()
    })
  })

  describe('initExpress', () => {
    it('should create a new instance and call all methods', () => {
      const logStub = sinon.stub(console, 'log');
      const messenger = new TelegramMessenger()
      const app = new App()
      const server = app.initExpress(messenger)
      assert.notEqual(server, null)
      assert.notEqual(server, undefined)
      sinon.assert.callCount(logStub, 4)
      sinon.assert.calledWith(logStub.getCall(0), '⚡️[app]: Initializing express web server')
      sinon.assert.calledWith(logStub.getCall(1), `⚡️[app]: Received GET request from 127.0.0.1`)
      sinon.assert.calledWith(logStub.getCall(2), `⚡️[app]: Server is running on port ${process.env.PORT || 3000}`)
      sinon.assert.calledWith(logStub.getCall(3), `⚡️[app]: Get request from Telegram`)
      logStub.restore()
    })
  })
})