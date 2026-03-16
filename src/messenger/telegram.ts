import TelegramBot, { type Update, type Message } from 'node-telegram-bot-api'
import TelegramHandlers from '../utils/telegram-handlers'
import Stat from '../utils/stat'
// Extended Message type to include forward_origin
export interface ExtendedMessage extends Message {
  forward_origin?: MessageOrigin;
}

// Message origin types
type MessageOrigin = MessageOriginUser | MessageOriginHiddenUser | MessageOriginChat | MessageOriginChannel;

interface MessageOriginUser {
  type: 'user';
  date: number;
  sender_user: TelegramBot.User;
}

interface MessageOriginHiddenUser {
  type: 'hidden_user';
  date: number;
  sender_user_name: string;
}

interface MessageOriginChat {
  type: 'chat';
  date: number;
  sender_chat: TelegramBot.Chat;
  author_signature?: string;
}

interface MessageOriginChannel {
  type: 'channel';
  date: number;
  chat: TelegramBot.Chat;
  message_id: number;
  author_signature?: string;
}

export const CENSOR_CHAT_ID = 1; // TODO: Insert your chat ID here -10.....27;
export const ADMIN_ID = 2; // TODO: Insert your admin ID here 74...0;

class TelegramMessenger {
  bot: TelegramBot | null = null
  stat: Stat


  constructor() {
    this.stat = Stat.getInstance()
  }


  /**
   * Initialize the bot.
   * @param botToken - The bot token.
   * @param isDebug - Whether to run in debug mode.
   * @param url - The URL to set the webhook to.
   */
  init(botToken: string, isDebug: boolean, url: string | undefined): void {
    console.log(' 🤖[telegram]: Initializing bot')

    if (this.bot) {
      console.log(' 🤖[telegram]: Telegram bot already initialized. Skip')
      return
    }

    try {
      const that = this
      if (isDebug) {
        console.log(' 🤖[telegram]: Run in debug (use polling)')
        this.bot = new TelegramBot(botToken, { polling: true })
        this.bot.deleteWebHook()
      } else if (url) {
        console.log(' 🤖[telegram]: Run in production (set webhook)')
        this.bot = new TelegramBot(botToken)
        this.bot.setWebHook(url + botToken)
      } else {
        throw new Error('please set HEROKU_URL in .env file')
      }

      this.bot.on('message', this.handleMessage.bind(this))
      this.bot.on('channel_post', this.handleMessage.bind(this))
    } catch (e: any) {
      console.log(' 🤖[telegram]: Error, ' + e.message)
    }
  }


  /**
   * Process the update.
   * @param reqBody - The request body.
   */
  processUpdate(reqBody: Update): void {
    this.bot?.processUpdate(reqBody)
  }


  /**
   * Handle the message.
   * See https://core.telegram.org/bots/api#message 
   * @param msg - The message.
   */
  handleMessage(msg: Message): void {
    if (!this.bot) {
      console.log(' 🤖[telegram]: Bot not initialized. Skip')
      return
    }

    this.stat.calculate(msg, this.bot)

    console.log(' 🤖[telegram]: Handle message', JSON.stringify(msg))
    const { chat } = msg

    if (chat.id === CENSOR_CHAT_ID && msg.new_chat_members?.length) {
      TelegramHandlers.sendWelcomeToChatMessage(this.bot, chat.id)

    } else if (chat.type === 'private') {
      if (msg.text === '/start') {
        TelegramHandlers.sendWelcomeMessage(this.bot, chat.id)
      } else if (msg.text === '/help' && (msg.from?.id === ADMIN_ID)) {
        TelegramHandlers.sendHelpMessage(this.bot, chat.id)
      } else if (msg.text?.startsWith('/checkpermissions') && (msg.from?.id === ADMIN_ID)) {
        TelegramHandlers.checkPermissions(this.bot, msg)
      } else if (msg.text?.startsWith('/joinchat') && (msg.from?.id === ADMIN_ID)) {
        TelegramHandlers.joinChat(this.bot, msg)
      } else if (msg.text?.startsWith('/leavechat') && (msg.from?.id === ADMIN_ID)) {
        TelegramHandlers.leaveChat(this.bot, msg) 
      } else {
        TelegramHandlers.censorMessage(this.bot, msg as ExtendedMessage)
      }
    } else if (chat.type === 'group' || chat.type === 'supergroup') {
      if (msg.text === '/start' && chat.id === CENSOR_CHAT_ID) {
        TelegramHandlers.sendWelcomeMessage(this.bot, chat.id)
      } else {
        TelegramHandlers.censorMessage(this.bot, msg as ExtendedMessage)
      }
    } else if (chat.type === 'channel') {
      console.log(' 🤖[telegram]: Channel, skip')
    } else {
      console.log(' 🤖[telegram]: Broken message, skip')
    }
  }
}

export default TelegramMessenger
