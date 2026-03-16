import assert from "assert"
import sinon from "sinon"
import proxyquire from 'proxyquire'
import type { Update, Message } from 'node-telegram-bot-api'
import TelegramHandlers from '../../src/utils/telegram-handlers'

// Private messages
import exampleMessagePrivateStart from './example-messages/private/start.json'

// Channel messages
import exampleMessageChannelSimple from './example-messages/channel/simple.json'
import { ADMIN_ID, CENSOR_CHAT_ID, ExtendedMessage } from "../../src/messenger/telegram"


// Create a fake constructor
class FakeTelegramBot {
  public deleteWebHook = sinon.stub().resolves()
  public setWebHook = sinon.stub().resolves()
  public processUpdate = sinon.stub()
  public on = sinon.stub()
  public sendMessage = sinon.stub().resolves()
  public sendSticker = sinon.stub().resolves()
  public stopPolling = sinon.stub()
  public sendPhoto = sinon.stub().resolves()
  public sendVideo = sinon.stub().resolves()
  public sendDocument = sinon.stub().resolves()
  public deleteMessage = sinon.stub().resolves()
  constructor(token: string, opts?: any) {
    // Store token and options if needed for assertions
    this.token = token
    this.opts = opts
    this.stat = {
      calculate: sinon.stub(),
    }
  }

  private token: string
  private opts?: any
  private stat: any
}

// Add call signature to make it callable
(FakeTelegramBot as any).prototype.call = function () { return this; }

// Proxyquire the module under test
const { default: TelegramMessenger } = proxyquire.noCallThru()(
  '../../src/messenger/telegram',
  { 'node-telegram-bot-api': FakeTelegramBot }
)

describe('TelegramMessenger', () => {
  let logStub: sinon.SinonStub

  beforeEach(() => {
    sinon.resetHistory()
    logStub = sinon.stub(console, 'log')
  })

  afterEach(() => {
    logStub.restore()
  })

  it('should create a new instance', () => {
    const tm = new TelegramMessenger()
    assert.notEqual(tm, null)
    assert.notEqual(tm, undefined)
    assert.equal(tm.bot, null)
  })

  describe('init', () => {
    it('should create a new bot in production', () => {
      const tm = new TelegramMessenger()
      tm.init('1234567890:ABC', false, 'https://test.herokuapp.com')
      assert.notEqual(tm.bot, null)

      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), " 🤖[telegram]: Initializing bot")
      sinon.assert.calledWith(logStub.getCall(1), ' 🤖[telegram]: Run in production (set webhook)')
      sinon.assert.calledWith((tm.bot as any).setWebHook, 'https://test.herokuapp.com1234567890:ABC')
    })

    it('should create a new bot in debug', () => {
      const tm = new TelegramMessenger()
      tm.init('1234567890:ABC', true, 'https://test.herokuapp.com')
      assert.notEqual(tm.bot, null)

      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), " 🤖[telegram]: Initializing bot")
      sinon.assert.calledWith(logStub.getCall(1), ' 🤖[telegram]: Run in debug (use polling)')
      sinon.assert.called((tm.bot as any).deleteWebHook)
    })

    it('should not init if bot has already exist', async () => {
      const tm = new TelegramMessenger()
      tm.bot = new FakeTelegramBot('1234567890:ABC')
      tm.init('1234567890:DEF', true, 'https://test.herokuapp.com')
      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), " 🤖[telegram]: Initializing bot")
      sinon.assert.calledWith(logStub.getCall(1), " 🤖[telegram]: Telegram bot already initialized. Skip")
    })

    it('should not create a new bot in production', () => {
      const tm = new TelegramMessenger()
      tm.init('1234567890:ABC', false, '')
      assert.equal(tm.bot, null)

      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), " 🤖[telegram]: Initializing bot")
      sinon.assert.calledWith(logStub.getCall(1), ' 🤖[telegram]: Error, please set HEROKU_URL in .env file')
    })
  })

  describe('processUpdate', () => {
    it('should call processUpdate', () => {
      const tm = new TelegramMessenger()
      tm.bot = new FakeTelegramBot('1234567890:ABC')
      tm.processUpdate({} as Update)
      sinon.assert.calledOnce((tm.bot as any).processUpdate)
    })

    it('should not call processUpdate when bot is null', () => {
      const tm = new TelegramMessenger()
      tm.bot = null
      tm.processUpdate({} as Update)
      // No need to assert on processUpdate since bot is null
      assert.equal(tm.bot, null)
    })
  })

  describe('handleMessage', () => {


    it('should handle private chat message', () => {  
      const tm = new TelegramMessenger()
      tm.bot = new FakeTelegramBot('1234567890:ABC')

      const mockMessage = {
        chat: { id: 123, type: 'private' },
        text: 'Hello bot'
      } as ExtendedMessage

      const censorMessageStub = sinon.stub(TelegramHandlers, 'censorMessage')
      const calculateStub = sinon.stub(tm.stat, 'calculate')

      tm.handleMessage(mockMessage as Message)

      sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
      sinon.assert.calledWith(censorMessageStub, tm.bot, mockMessage)
      sinon.assert.calledOnce(calculateStub)
      sinon.assert.calledWith(calculateStub, mockMessage, tm.bot)

      censorMessageStub.restore()
      calculateStub.restore()
    })

    it('should handle start command in private chat', () => {  
      const tm = new TelegramMessenger()
      tm.bot = new FakeTelegramBot('1234567890:ABC')

      const sendWelcomeMessageStub = sinon.stub(TelegramHandlers, 'sendWelcomeMessage')

      tm.handleMessage(exampleMessagePrivateStart as Message)

      sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(exampleMessagePrivateStart))
      sinon.assert.calledWith(sendWelcomeMessageStub, tm.bot, 123456789)

      sendWelcomeMessageStub.restore()
    })

    describe('test help command', () => {
      it('should handle help command in private chat for Admin', () => {
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const sendHelpMessageStub = sinon.stub(TelegramHandlers, 'sendHelpMessage')

        const mockMessage = {
          chat: { id: ADMIN_ID, type: 'private' },
          from: { id: ADMIN_ID },
          text: '/help'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(sendHelpMessageStub, tm.bot, ADMIN_ID)

        sendHelpMessageStub.restore()
      })

      it('should not handle help command in private chat for other user', () => {
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const sendHelpMessageStub = sinon.stub(TelegramHandlers, 'sendHelpMessage')

        const mockMessage = {
          chat: { id: 123, type: 'private' },
          from: { id: 123 },
          text: '/help'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.notCalled(sendHelpMessageStub)

        sendHelpMessageStub.restore()
      })

      it('should not handle help command without from', () => {
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const sendHelpMessageStub = sinon.stub(TelegramHandlers, 'sendHelpMessage')
        const censorMessageStub = sinon.stub(TelegramHandlers, 'censorMessage')

        const mockMessage = {
          chat: { id: ADMIN_ID, type: 'private' },
          text: '/help'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.notCalled(sendHelpMessageStub)
        sinon.assert.calledWith(censorMessageStub, tm.bot, mockMessage)

        sendHelpMessageStub.restore()
        censorMessageStub.restore()
      })
    })

    describe('test check permissions command', () => {
      it('should handle checkpermissions command in private chat for admin', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const checkPermissionsStub = sinon.stub(TelegramHandlers, 'checkPermissions')

        const mockMessage = {
          chat: { id: ADMIN_ID, type: 'private' },
          from: { id: ADMIN_ID },
          text: '/checkpermissions'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.calledWith(checkPermissionsStub, tm.bot, mockMessage)

        checkPermissionsStub.restore()
      })

      it('should handle checkpermissions command in private chat for Admin', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const checkPermissionsStub = sinon.stub(TelegramHandlers, 'checkPermissions')

        const mockMessage = {
          chat: { id: ADMIN_ID, type: 'private' },
          from: { id: ADMIN_ID },
          text: '/checkpermissions'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.calledWith(checkPermissionsStub, tm.bot, mockMessage)

        checkPermissionsStub.restore()
      })
      
      it('should not handle checkpermissions command without from', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const checkPermissionsStub = sinon.stub(TelegramHandlers, 'checkPermissions')

        const mockMessage = {
          chat: { id: ADMIN_ID, type: 'private' },
          text: '/checkpermissions some additional text'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.notCalled(checkPermissionsStub)

        checkPermissionsStub.restore()
      })

      it('should not handle checkpermissions command in private chat for other user', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const checkPermissionsStub = sinon.stub(TelegramHandlers, 'checkPermissions')

        const mockMessage = {
          chat: { id: 123, type: 'private' },
          from: { id: 123 },
          text: '/checkpermissions'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.notCalled(checkPermissionsStub)

        checkPermissionsStub.restore()
      })

      it('should not handle checkpermissions command in private chat has empty text', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const checkPermissionsStub = sinon.stub(TelegramHandlers, 'checkPermissions')

        const mockMessage = {
          chat: { id: ADMIN_ID, type: 'private' },
          from: { id: ADMIN_ID },
          text: undefined
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.notCalled(checkPermissionsStub)

        checkPermissionsStub.restore()
      })
    })

    describe('test join chat command', () => {
      it('should handle joinchat command in private chat for admin', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const joinChatStub = sinon.stub(TelegramHandlers, 'joinChat')

        const mockMessage = {
          chat: { id: ADMIN_ID, type: 'private' },
          from: { id: ADMIN_ID },
          text: '/joinchat'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.calledWith(joinChatStub, tm.bot, mockMessage)

        joinChatStub.restore()
      })

      it('should handle joinchat command with parameters in private chat for admin', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const joinChatStub = sinon.stub(TelegramHandlers, 'joinChat')

        const mockMessage = {
          chat: { id: ADMIN_ID, type: 'private' },
          from: { id: ADMIN_ID },
          text: '/joinchat some_parameter'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.calledWith(joinChatStub, tm.bot, mockMessage)

        joinChatStub.restore()
      })

      it('should handle joinchat command in private chat for Admin', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const joinChatStub = sinon.stub(TelegramHandlers, 'joinChat')

        const mockMessage = {
          chat: { id: ADMIN_ID, type: 'private' },
          from: { id: ADMIN_ID },
          text: '/joinchat'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.calledWith(joinChatStub, tm.bot, mockMessage)

        joinChatStub.restore()
      })

      it('should handle joinchat command with parameters in private chat for Admin', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const joinChatStub = sinon.stub(TelegramHandlers, 'joinChat')

        const mockMessage = {
          chat: { id: ADMIN_ID, type: 'private' },
          from: { id: ADMIN_ID },
          text: '/joinchat some_parameter'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.calledWith(joinChatStub, tm.bot, mockMessage)

        joinChatStub.restore()
      })

      it('should not handle joinchat command without from', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const joinChatStub = sinon.stub(TelegramHandlers, 'joinChat')

        const mockMessage = {
          chat: { id: ADMIN_ID, type: 'private' },
          text: '/joinchat'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.notCalled(joinChatStub)

        joinChatStub.restore()
      })

      it('should not handle joinchat command in private chat for other user', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const joinChatStub = sinon.stub(TelegramHandlers, 'joinChat')

        const mockMessage = {
          chat: { id: 123, type: 'private' },
          from: { id: 123 },
          text: '/joinchat'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.notCalled(joinChatStub)

        joinChatStub.restore()
      })
    })

    describe('test leave chat command', () => {
      it('should handle leavechat command in private chat for admin', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const leaveChatStub = sinon.stub(TelegramHandlers, 'leaveChat')

        const mockMessage = {
          chat: { id: ADMIN_ID, type: 'private' },
          from: { id: ADMIN_ID },
          text: '/leavechat'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.calledWith(leaveChatStub, tm.bot, mockMessage)

        leaveChatStub.restore()
      })

      it('should handle leavechat command with parameters in private chat for admin', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const leaveChatStub = sinon.stub(TelegramHandlers, 'leaveChat')

        const mockMessage = {
          chat: { id: ADMIN_ID, type: 'private' },
          from: { id: ADMIN_ID },
          text: '/leavechat some_parameter'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.calledWith(leaveChatStub, tm.bot, mockMessage)

        leaveChatStub.restore()
      })

      it('should handle leavechat command in private chat for Admin', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const leaveChatStub = sinon.stub(TelegramHandlers, 'leaveChat')

        const mockMessage = {
          chat: { id: ADMIN_ID, type: 'private' },
          from: { id: ADMIN_ID },
          text: '/leavechat'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.calledWith(leaveChatStub, tm.bot, mockMessage)

        leaveChatStub.restore()
      })

      it('should handle leavechat command with parameters in private chat for Admin', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const leaveChatStub = sinon.stub(TelegramHandlers, 'leaveChat')

        const mockMessage = {
          chat: { id: ADMIN_ID, type: 'private' },
          from: { id: ADMIN_ID },
          text: '/leavechat some_parameter'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.calledWith(leaveChatStub, tm.bot, mockMessage)

        leaveChatStub.restore()
      })

      it('should not handle leavechat command without from', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const leaveChatStub = sinon.stub(TelegramHandlers, 'leaveChat')

        const mockMessage = {
          chat: { id: ADMIN_ID, type: 'private' },
          text: '/leavechat'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.notCalled(leaveChatStub)

        leaveChatStub.restore()
      })

      it('should not handle leavechat command in private chat for other user', () => {  
        const tm = new TelegramMessenger()
        tm.bot = new FakeTelegramBot('1234567890:ABC')

        const leaveChatStub = sinon.stub(TelegramHandlers, 'leaveChat')

        const mockMessage = {
          chat: { id: 123, type: 'private' },
          from: { id: 123 },
          text: '/leavechat'
        } as ExtendedMessage

        tm.handleMessage(mockMessage as Message)

        sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
        sinon.assert.notCalled(leaveChatStub)

        leaveChatStub.restore()
      })
    })

    it('should fall back to censorMessage when private chat message is not a command', () => {
      const tm = new TelegramMessenger()
      tm.bot = new FakeTelegramBot('1234567890:ABC')

      const censorMessageStub = sinon.stub(TelegramHandlers, 'censorMessage')

      const mockMessage = {
        chat: { id: 123, type: 'private' },
        from: { id: 456 },
        text: 'some random text'
      } as ExtendedMessage

      tm.handleMessage(mockMessage as Message)

      sinon.assert.calledWith(censorMessageStub, tm.bot, mockMessage)

      censorMessageStub.restore()
    })

    it('should handle group chat message', () => {
      const tm = new TelegramMessenger()
      tm.bot = new FakeTelegramBot('1234567890:ABC')

      const mockMessage = {
        chat: { id: 123, type: 'group' },
        text: 'Hello group!'
      } as ExtendedMessage

      const censorMessageStub = sinon.stub(TelegramHandlers, 'censorMessage')

      tm.handleMessage(mockMessage as Message)

      sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
      sinon.assert.calledWith(censorMessageStub, tm.bot, mockMessage)

      censorMessageStub.restore()
    })

    it('should handle supergroup chat message', () => {
      const tm = new TelegramMessenger()
      tm.bot = new FakeTelegramBot('1234567890:ABC')

      const mockMessage = {
        chat: { id: 123, type: 'supergroup', is_forum: false },
        text: 'Hello supergroup'
      } as ExtendedMessage

      const censorMessageStub = sinon.stub(TelegramHandlers, 'censorMessage')

      tm.handleMessage(mockMessage as Message)

      sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
      sinon.assert.calledWith(censorMessageStub, tm.bot, mockMessage)
      censorMessageStub.restore()
    })

    it('should handle forum chat message', () => {
      const tm = new TelegramMessenger()
      tm.bot = new FakeTelegramBot('1234567890:ABC')

      const mockMessage = {
        chat: { id: 123, type: 'supergroup', is_forum: true },
        text: 'Hello forum'
      }

      const censorMessageStub = sinon.stub(TelegramHandlers, 'censorMessage')

      tm.handleMessage(mockMessage as Message)

      sinon.assert.calledWith(logStub, ' 🤖[telegram]: Handle message', JSON.stringify(mockMessage))
      sinon.assert.calledWith(censorMessageStub, tm.bot, mockMessage as ExtendedMessage)
      censorMessageStub.restore()
    })

    it('should not process message when bot is not initialized', () => {
      const tm = new TelegramMessenger()
      tm.bot = null

      const mockMessage = {
        chat: { id: 123, type: 'private' },
        text: 'Hello bot'
      }

      const censorMessageStub = sinon.stub(TelegramHandlers, 'censorMessage')
      const calculateStub = sinon.stub(tm.stat, 'calculate')

      tm.handleMessage(mockMessage as Message)

      sinon.assert.calledWith(logStub, ' 🤖[telegram]: Bot not initialized. Skip')
      sinon.assert.notCalled(censorMessageStub)
      sinon.assert.notCalled(calculateStub)

      censorMessageStub.restore()
      calculateStub.restore()
    })

    it('should skip channel message', () => {
      const tm = new TelegramMessenger()
      tm.bot = new FakeTelegramBot('1234567890:ABC')

      tm.handleMessage(exampleMessageChannelSimple as Message)  

      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 🤖[telegram]: Handle message', JSON.stringify(exampleMessageChannelSimple))
      sinon.assert.calledWith(logStub.getCall(1), ' 🤖[telegram]: Channel, skip')
    })

    it('should skip broken message', () => {
      const tm = new TelegramMessenger()
      tm.bot = new FakeTelegramBot('1234567890:ABC')

      tm.handleMessage({ chat: { type: 'broken' }} as any as Message)

      sinon.assert.callCount(logStub, 2)

      sinon.assert.calledWith(logStub.getCall(0), ' 🤖[telegram]: Handle message', JSON.stringify({ chat: { type: 'broken' }}))
      sinon.assert.calledWith(logStub.getCall(1), ' 🤖[telegram]: Broken message, skip')
    })
  })
})
