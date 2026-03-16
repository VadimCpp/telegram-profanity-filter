import TelegramBot, { Message } from 'node-telegram-bot-api'
import CensorEngine from './censor-engine'
import Helpers from './helpers'
import { ExtendedMessage } from '../messenger/telegram'

export const censorMessage = (bot: TelegramBot, msg: ExtendedMessage): void => {
  console.log(' 📝[censor]: Censor message')

  try {
    const censorEngine = CensorEngine.getInstance()

    const { text, reply_to_message, forward_origin, forward_date, photo, caption, video, document } = msg
    
    if (photo) {
      console.log(' 📝[censor]: Photo message')

      if (caption) {
        const censoredCaption = censorEngine.censorText(caption)
        const isCensored = censoredCaption !== caption
        if (isCensored) {
          const name = Helpers.getName(msg)
          const answerCaption = `🕊 ${name} 🗣: ${censoredCaption}`

          try {
            bot.deleteMessage(msg.chat.id, msg.message_id)
          } catch (e: any) {
            console.log(' 📝[censor]: Error deleting photo, skip')
          }

          if (forward_date || forward_origin) {    
            if (reply_to_message && reply_to_message.is_topic_message) {
              // Photo, forwarded message, reply to message (forums)
              bot.sendPhoto(msg.chat.id, photo[0].file_id, {
                caption: `➡️${answerCaption}`,
                reply_to_message_id: reply_to_message.message_thread_id,
                has_spoiler: msg.has_media_spoiler
              })
            } else {
              // Photo, forwarded message
              bot.sendPhoto(msg.chat.id, photo[0].file_id, {
                caption: `➡️${answerCaption}`,
                has_spoiler: msg.has_media_spoiler
              })
            }
          } else if (reply_to_message) {
            // Photo, reply to message
            bot.sendPhoto(msg.chat.id, photo[0].file_id, {
              caption: answerCaption,
              reply_to_message_id: reply_to_message.message_id,
              has_spoiler: msg.has_media_spoiler
            })
          } else {
            // Photo without reply
            bot.sendPhoto(msg.chat.id, photo[0].file_id, {
              caption: answerCaption,  
              has_spoiler: msg.has_media_spoiler
            })
          }

        } else {
          console.log(" 📝[censor]: Photo's caption is okay")
        }
      } else {
        console.log(' 📝[censor]: Photo has no caption, skip')
      }

    } else if (video) {
      console.log(' 📝[censor]: Video message')

      if (caption) {
        const censoredCaption = censorEngine.censorText(caption)
        const isCensored = censoredCaption !== caption
        if (isCensored) {
          const name = Helpers.getName(msg)
          const answerCaption = `🕊 ${name} 🗣: ${censoredCaption}`

          try {
            bot.deleteMessage(msg.chat.id, msg.message_id)
          } catch (e: any) {
            console.log(' 📝[censor]: Error deleting video, skip')
          }

          if (forward_date || forward_origin) {  
            if (reply_to_message && reply_to_message.is_topic_message) {
              // Video, forwarded message, reply to message (forums)
              bot.sendVideo(msg.chat.id, video.file_id, {
                caption: `➡️${answerCaption}`,
                reply_to_message_id: reply_to_message.message_thread_id,
                has_spoiler: msg.has_media_spoiler
              })
            } else {
              // Video, forwarded message
              bot.sendVideo(msg.chat.id, video.file_id, {
                caption: `➡️${answerCaption}`,
                has_spoiler: msg.has_media_spoiler
              })
            }
          } else if (reply_to_message) {
            // Video, reply to message
            bot.sendVideo(msg.chat.id, video.file_id, {
              caption: answerCaption,
              reply_to_message_id: reply_to_message.message_id,
              has_spoiler: msg.has_media_spoiler
            })
          } else {
            // Video without reply
            bot.sendVideo(msg.chat.id, video.file_id, {
              caption: answerCaption,  
              has_spoiler: msg.has_media_spoiler
            })
          }
        } else {
          console.log(" 📝[censor]: Video's caption is okay")
        }
      } else {
        console.log(" 📝[censor]: Video has no caption, skip")
      }

    } else if (document) {
      console.log(' 📝[censor]: Document')

      if (caption) {
        const censoredCaption = censorEngine.censorText(caption)
        const isCensored = censoredCaption !== caption
        if (isCensored) {
          const name = Helpers.getName(msg)
          const answerCaption = `🕊 ${name} 🗣: ${censoredCaption}`

          try {
            bot.deleteMessage(msg.chat.id, msg.message_id)
          } catch (e: any) {
            console.log(' 📝[censor]: Error deleting message, skip')
          }

          if (forward_date || forward_origin) {    
            if (reply_to_message && reply_to_message.is_topic_message) {
              // Document, forwarded message, reply to message (forums)
              bot.sendDocument(msg.chat.id, document.file_id, {
                caption: `➡️${answerCaption}`, 
                reply_to_message_id: reply_to_message.message_thread_id 
              })
            } else {
              // Document, forwarded message
              bot.sendDocument(msg.chat.id, document.file_id, {
                caption: `➡️${answerCaption}`, 
              })
            }
          } else if (reply_to_message) {
            // Document, reply to message
            bot.sendDocument(msg.chat.id, document.file_id, {
              caption: answerCaption,
              reply_to_message_id: reply_to_message.message_id
            })
          } else {
            // Document without reply
            bot.sendDocument(msg.chat.id, document.file_id, {
              caption: answerCaption,  
            })
          }
        } else {
          console.log(" 📝[censor]: Document's caption is okay")
        }
      } else {
        console.log(' 📝[censor]: Document has no caption, skip')
      }
    } else if (text) {
      console.log(' 📝[censor]: Text message')
      
      const censoredText = censorEngine.censorText(text)
      const isCensored = censoredText !== text
      
      if (isCensored) {
        const name = Helpers.getName(msg)
        const answerText = `🕊 ${name} 🗣: ${censoredText}`

        try {
          bot.deleteMessage(msg.chat.id, msg.message_id)
        } catch (e: any) {
          console.log(' 📝[censor]: Error deleting message, skip')
        }

        if (forward_date || forward_origin) {      
          if (reply_to_message && reply_to_message.is_topic_message) {
            // Text, forwarded message, reply to message (forums)
            bot.sendMessage(msg.chat.id, `➡️${answerText}`, {
              reply_to_message_id: reply_to_message.message_thread_id
            })  
          } else {
            // Forwarded message
            bot.sendMessage(msg.chat.id, `➡️${answerText}`)
          }
        } else if (reply_to_message) {
          // Reply to message
          bot.sendMessage(msg.chat.id, answerText, {
            reply_to_message_id: reply_to_message.message_id
          })
        } else {
          // Regular message without reply
          bot.sendMessage(msg.chat.id, answerText)
        }
      } else {
        console.log(' 📝[censor]: Message is okay')
      }

    } else {
      console.log(' 📝[censor]: No handler for this message, skip')      
    }
  } catch (e: any) {
    console.log(' 📝[censor]: Error handling supergroup chat', e.message)
  }
} 


/**
 * Send welcome message to the user or group
 * @param bot - Telegram bot
 * @param chatId - Chat ID
 */
export const sendWelcomeMessage = (bot: TelegramBot, chatId: number): void => {
  const WELCOME_MESSAGE = 'Привет! Это цензор-бот. 😎\n\n'
  + 'Бот бережно удаляет нецензурные слова из вашего чата. '
  + 'В дополнение к основному словарю бот также удаляет язык вражды. '
  + 'Никаких «москалей» и «бандеровцев», «рашистов» и «рагулей», '
  + '«кацапов» и «хохлов», «расеи» и т.п.\n\n'
  + 'Установить бота очень просто:\n'
  + '1. Добавить бота в группу\n'
  + '2. Сделать бота админом группы'
  + 'Подписывайтесь на канал, чтобы ничего не пропустить: @censorchannel';

  const keyboard = {
    inline_keyboard: [[{
        text: '➕ Добавить в чат',
        url: 'https://t.me/gdgcensorbot?startgroup=true', // TODO: Insert your bot username here
    }]],
  };
  const options = {
    parse_mode: 'HTML' as const,
    disable_web_page_preview: true,
    reply_markup: keyboard,
  };
  bot.sendMessage(chatId, WELCOME_MESSAGE, options);
}


/**
 * Check permissions for the bot in the chat
 * @param bot - Telegram bot
 * @param msg - Message
 */
export const checkPermissions = async (bot: TelegramBot, msg: Message): Promise<void> => {
  const { chat, from, text } = msg

  if (!text || !from) {
    console.log(' 🔑[permissions]: No text or user in message, skip')
    return
  }

  const chatId = text.split(' ')[1]
  if (!chatId) {
    console.log(' 🔑[permissions]: No chat ID in message, skip')
    bot.sendMessage(from.id, 'Пожалуйста, укажите корректный ID чата (например: -100234232323365)')
    return
  }

  const botInfo = await bot.getMe() 
  const chatMember = await bot.getChatMember(chatId, botInfo.id)
  const chatInfo = await bot.getChat(chatId)
  const permissions = chatMember.can_invite_users ? '✅' : '❌'
  const canManageChat = (chatMember as any).can_manage_chat ? '✅' : '❌'
  const canSendMessages = chatMember.can_send_messages ? '✅' : '❌'
  const canDeleteMessages = chatMember.can_delete_messages ? '✅' : '❌'
  
  const report = [
    '📋 Отчет о правах бота в чате:',
    `Название: ${chatInfo.title || 'Неизвестно'}`,
    `ID: ${chatId}`,
    '',
    `Приглашать пользователей: ${permissions}`,
    `Управлять чатом: ${canManageChat}`,
    `Отправлять сообщения: ${canSendMessages}`,
    `Удалять сообщения: ${canDeleteMessages}`,
  ].join('\n')
  
  bot.sendMessage(chat.id, report)
}


/**
 * Join the chat
 * @param bot - Telegram bot
 * @param msg - Message
 */
export const joinChat = async (bot: TelegramBot, msg: Message): Promise<void> => {
  const { chat, from, text } = msg

  if (!text || !from) {
    console.log(' 🔑[permissions]: No text or user in message, skip')
    return
  }

  const chatId = text.split(' ')[1]
  if (!chatId) {
    console.log(' 🔑[permissions]: No chat ID in message, skip')
    bot.sendMessage(from.id, 'Пожалуйста, укажите корректный ID чата (например: -100234232323365)')
    return
  }

  try {
    const chatInfo = await bot.getChat(chatId)
    const botInfo = await bot.getMe()
    
    // Check if bot has admin rights to invite users
    const botMember = await bot.getChatMember(chatId, botInfo.id)
    if (!botMember.can_invite_users) {
      bot.sendMessage(chat.id, 'Бот не имеет прав на приглашение пользователей в чат. Пожалуйста, сделайте бота администратором.')
      return
    }

    // Check if user is already in the chat
    try {
      const userMember = await bot.getChatMember(chatId, from.id)
      if (userMember.status !== 'left' && userMember.status !== 'kicked') {
        bot.sendMessage(chat.id, `Вы уже находитесь в чате "${chatInfo.title || 'Неизвестно'}"`)
        return
      }
    } catch (e: any) {
      // Only continue if the error is specifically about user not being found
      if (!e.message?.includes('user not found') && !e.message?.includes('Bad Request: user not found')) {
        throw e // Re-throw other types of errors
      }
    }

    // Generate invite link
    const inviteLink = await bot.createChatInviteLink(chatId, {
      member_limit: 1,
      expire_date: Math.floor(Date.now() / 1000) + 3600 // Link expires in 1 hour
    })

    // Send invite link to user
    await bot.sendMessage(from.id, `Приглашение в чат "${chatInfo.title || 'Неизвестно'}":\n${inviteLink.invite_link}`)
    bot.sendMessage(chat.id, `Приглашение отправлено пользователю ${from.first_name}`)
  } catch (e: any) {
    console.log(' 🔑[permissions]: Error joining chat:', e.message)
    bot.sendMessage(chat.id, 'Не удалось создать приглашение. Убедитесь, что ID чата указан верно и бот имеет необходимые права.')
  }
}


/**
 * Leave the chat
 * @param bot - Telegram bot
 * @param msg - Message
 */
export const leaveChat = async (bot: TelegramBot, msg: Message): Promise<void> => {
  const { chat, from, text } = msg

  if (!text || !from) {
    console.log(' 🔑[permissions]: No text or user in message, skip')
    return
  }

  const chatId = text.split(' ')[1]
  if (!chatId) {
    console.log(' 🔑[permissions]: No chat ID in message, skip')
    bot.sendMessage(from.id, 'Пожалуйста, укажите корректный ID чата (например: -100234232323365)')
    return
  }

  try {
    const chatInfo = await bot.getChat(chatId)
    const botInfo = await bot.getMe()
    
    // Check if bot is in the chat
    try {
      await bot.getChatMember(chatId, botInfo.id)
    } catch (e) {
      bot.sendMessage(chat.id, `Бот не находится в чате "${chatInfo.title || 'Неизвестно'}"`)
      return
    }

    // Leave the chat
    await bot.leaveChat(chatId)
    bot.sendMessage(chat.id, `Бот успешно покинул чат "${chatInfo.title || 'Неизвестно'}"`)
  } catch (e: any) {
    console.log(' 🔑[permissions]: Error leaving chat:', e.message)
    bot.sendMessage(chat.id, 'Не удалось покинуть чат. Убедитесь, что ID чата указан верно.')
  }
}


/**
 * Send help message with list of admin commands (admin only).
 * @param bot - Telegram bot
 * @param chatId - Chat ID
 */
export const sendHelpMessage = (bot: TelegramBot, chatId: number): void => {
  const helpText = [
    '📋 <b>Команды бота (только для администратора)</b>',
    '',
    '/start — приветствие и ссылка на добавление в чат',
    '/help — этот список команд',
    '',
    '/checkpermissions &lt;chat_id&gt; — права бота в указанном чате',
    '/joinchat &lt;chat_id&gt; — создать инвайт-ссылку в чат',
    '/leavechat &lt;chat_id&gt; — выйти из чата'
  ].join('\n')

  bot.sendMessage(chatId, helpText, { parse_mode: 'HTML' })
}


/**
 * Send welcome message to the chat
 * @param bot - Telegram bot
 * @param chatId - Chat ID
 */
export const sendWelcomeToChatMessage = (bot: TelegramBot, chatId: number): void => {
  const WELCOME_TO_CHAT_MESSAGE = 'Здравствуйте!\n\n'
    + 'Этот чат предназначен для тестирования бота @gdgcensorbot. '
    + 'Просим вас ругаться матом. Хорошо: «пиздец вы охуели тут блять». '
    + 'Плохо: «я тупой осел, не знаю что и написать».';
    
  const options = {
    parse_mode: 'HTML' as const,
    disable_web_page_preview: true 
  };
  bot.sendMessage(chatId, WELCOME_TO_CHAT_MESSAGE, options);
}

/**
 * Default export for Telegram handlers
 * Good for testing
 */
export default {
  censorMessage,
  sendWelcomeMessage,
  sendWelcomeToChatMessage,
  checkPermissions,
  joinChat,
  leaveChat,
  sendHelpMessage
}
