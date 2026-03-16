import { jest, expect } from '@jest/globals'
import sinon from "sinon"
import assert from "assert"
import proxyquire from 'proxyquire'
import type { Message } from 'node-telegram-bot-api'
import CensorEngine from '../../src/utils/censor-engine'
import {
  censorMessage, 
  sendWelcomeMessage,
  sendWelcomeToChatMessage,
  sendHelpMessage,
  checkPermissions,
  joinChat,
  leaveChat
} from '../../src/utils/telegram-handlers'
// Supergroup messages
import exampleMessageSupergroupSimple from '../messanger/example-messages/supergroup/simple.json'
import exampleMessageSupergroupSimpleSwears from '../messanger/example-messages/supergroup/simple-swears.json'
import exampleMessageSupergroupForwarded from '../messanger/example-messages/supergroup/forwarded.json'
import exampleMessageSupergroupReply from '../messanger/example-messages/supergroup/reply.json'
import exampleMessageSupergroupDocumentNoCaption from '../messanger/example-messages/supergroup/document-no-caption.json'
import exampleMessageSupergroupDocumentCaption from '../messanger/example-messages/supergroup/document-caption.json'
import exampleMessageSupergroupDocumentCaptionSwears from '../messanger/example-messages/supergroup/document-caption-swears.json'
import exampleMessageSupergroupDocumentForwarded from '../messanger/example-messages/supergroup/document-forwarded.json'
import exampleMessageSupergroupDocumentReply from '../messanger/example-messages/supergroup/document-reply.json'
import exampleMessageSupergroupImageNoCaption from '../messanger/example-messages/supergroup/image-no-caption.json'
import exampleMessageSupergroupImageCaption from '../messanger/example-messages/supergroup/image-caption.json'
import exampleMessageSupergroupImageCaptionSwears from '../messanger/example-messages/supergroup/image-caption-swears.json'
import exampleMessageSupergroupImageReplySpoilerSwears from '../messanger/example-messages/supergroup/image-reply-spoiler-swears.json'
import exampleMessageSupergroupImageForwardedSwears from '../messanger/example-messages/supergroup/image-forward-swears.json'
import exampleMessageSupergroupVideoNoCaption from '../messanger/example-messages/supergroup/video-no-caption.json'
import exampleMessageSupergroupVideoCaption from '../messanger/example-messages/supergroup/video-caption.json'
import exampleMessageSupergroupVideoSpoilerSwears from '../messanger/example-messages/supergroup/video-spoiler-swears.json'
import exampleMessageSupergroupVideoForwarded from '../messanger/example-messages/supergroup/video-forwarded.json'
import exampleMessageSupergroupVideoReply from '../messanger/example-messages/supergroup/video-reply.json'
// Group messages
import exampleMessageGroupAudio from '../messanger/example-messages/group/audio.json'
// Forum messages
import exampleMessageForumSimple from '../messanger/example-messages/forum/simple.json'
import exampleMessageForumSwears from '../messanger/example-messages/forum/swears.json'
import exampleMessageForumForwarded from '../messanger/example-messages/forum/forwarded.json'
import exampleMessageForumForwardedDocument from '../messanger/example-messages/forum/forwarded-document.json'
import exampleMessageForumForwardedVideo from '../messanger/example-messages/forum/forwarded-video.json'
import exampleMessageForumForwardedPhoto from '../messanger/example-messages/forum/forwarded-photo.json'

// Create a fake TelegramBot class for testing
class FakeTelegramBot {
  public deleteMessage = sinon.stub().resolves()
  public sendMessage = sinon.stub().resolves()
  public sendDocument = sinon.stub().resolves()
  public sendPhoto = sinon.stub().resolves()
  public sendVideo = sinon.stub().resolves()
  public getMe = sinon.stub().resolves()
  public getChatMember = sinon.stub().resolves()
  public getChat = sinon.stub().resolves()
  public createChatInviteLink = sinon.stub().resolves()
  public leaveChat = sinon.stub().resolves()
  public copyMessage = sinon.stub().resolves()
}

describe('TelegramHandlers', () => {
  describe('censorMessage', () => {
    let logStub: sinon.SinonStub
    let bot: FakeTelegramBot

    beforeEach(() => {
      sinon.resetHistory()
      logStub = sinon.stub(console, 'log')
      bot = new FakeTelegramBot()
    })

    afterEach(() => {
      logStub.restore()
    })

    it('should handle error when processing supergroup message', () => {
      // Force an error by making CensorEngine.getInstance throw
      const getInstanceStub = sinon.stub(CensorEngine, 'getInstance').throws(new Error('Test error'))
      
      censorMessage(bot as any, exampleMessageSupergroupSimple as Message)
      
      sinon.assert.calledWith(logStub.lastCall, ' 📝[censor]: Error handling supergroup chat', 'Test error')
      getInstanceStub.restore()
    })

    it('should skip censoring normal message', () => {
      censorMessage(bot as any, exampleMessageSupergroupSimple as Message)

      sinon.assert.notCalled(bot.sendMessage)
      sinon.assert.callCount(logStub, 3)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Text message')
      sinon.assert.calledWith(logStub.getCall(2), ' 📝[censor]: Message is okay')
    })

    it('should censor message with swear words', () => {
      const censorStub = sinon.stub(CensorEngine.prototype, 'censorText').returns('Вот ... ...')

      censorMessage(bot as any, exampleMessageSupergroupSimpleSwears as Message)

      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendMessage)
      sinon.assert.calledWith(bot.sendMessage, -1001234567890, '🕊 @johndoe 🗣: Вот ... ...')
      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Text message')
      censorStub.restore()
    })

    it('should censor forwarded message', () => {
      censorMessage(bot as any, exampleMessageSupergroupForwarded as Message)

      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendMessage)
      sinon.assert.calledWith(bot.sendMessage, -1001234567890, '➡️🕊 @johndoe 🗣: ..., как же ... работа, скроей бы выходные')
      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Text message')
    })

    it('should censor reply message', () => {
      censorMessage(bot as any, exampleMessageSupergroupReply as Message)

      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendMessage)
      sinon.assert.calledWith(bot.sendMessage, -1001234567890, '🕊 @johndoe 🗣: А теперь ответик с матом, ...!', {
        reply_to_message_id: 13311
      })
      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Text message')
    })

    it('should raise error when deleting original message with reply', () => {
      bot.deleteMessage.throws(new Error('Error deleting message'))

      censorMessage(bot as any, exampleMessageSupergroupReply as Message)

      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendMessage)
      sinon.assert.calledWith(bot.sendMessage, -1001234567890, '🕊 @johndoe 🗣: А теперь ответик с матом, ...!', {
        reply_to_message_id: 13311
      })
      sinon.assert.callCount(logStub, 3)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Text message')
      sinon.assert.calledWith(logStub.getCall(2), ' 📝[censor]: Error deleting message, skip')
    })

    it('should skip document without caption', () => {
      censorMessage(bot as any, exampleMessageSupergroupDocumentNoCaption as Message)

      sinon.assert.callCount(logStub, 3)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Document')
      sinon.assert.calledWith(logStub.getCall(2), ' 📝[censor]: Document has no caption, skip')      
    })

    it('should accept document with caption', () => {
      censorMessage(bot as any, exampleMessageSupergroupDocumentCaption as Message)

      sinon.assert.callCount(logStub, 3)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Document')
      sinon.assert.calledWith(logStub.getCall(2), " 📝[censor]: Document's caption is okay")
    })

    it('should censor document with caption', () => {
      censorMessage(bot as any, exampleMessageSupergroupDocumentCaptionSwears as Message)

      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendDocument)
      sinon.assert.calledWith(bot.sendDocument, -1001234567890, 'BQACAgIAAx0CYAhuSAACNB5oCU5GV1cRN5s8FIuodZa0-EmpWgACFHYAAlLOSEgtZMnbZYfr1TYE',
        { caption: '🕊 @johndoe 🗣: Котик ... с матом. Мат тут важен' })
      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Document')
    })

    it('should censor forwarded document with caption', () => {
      censorMessage(bot as any, exampleMessageSupergroupDocumentForwarded as Message)

      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendDocument)
      sinon.assert.calledWith(bot.sendDocument, -1001234567890, 'BQACAgIAAx0CYAhuSAACNCBoCVd2cA6RmTkDpXV3ZmN0ImYroQACq20AAn9yUUhJ8sYYeByH-jYE',
        { caption: '➡️🕊 @johndoe 🗣: три ... кота'})
      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Document')
    })

    it('should censor reply document with caption', () => {
      censorMessage(bot as any, exampleMessageSupergroupDocumentReply as Message)

      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendDocument)
      sinon.assert.calledWith(bot.sendDocument, -1001234567890, 'BQACAgIAAx0CYAhuSAACNCFoCVjxt2YUmBHKvThfWZuxMF5RGwACV3YAAlLOSEimftaxo-H8njYE',
        {
          caption: '🕊 @johndoe 🗣: ... кот, в ответе на сообщение!',
          reply_to_message_id: 13335
        })
      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Document')
    })

    it('should censor reply document with caption, and fail to delete original message', () => {
      bot.deleteMessage.throws(new Error('Error deleting message'))

      censorMessage(bot as any, exampleMessageSupergroupDocumentReply as Message)

      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendDocument)
      sinon.assert.calledWith(bot.sendDocument, -1001234567890, 'BQACAgIAAx0CYAhuSAACNCFoCVjxt2YUmBHKvThfWZuxMF5RGwACV3YAAlLOSEimftaxo-H8njYE',
        {
          caption: '🕊 @johndoe 🗣: ... кот, в ответе на сообщение!',
          reply_to_message_id: 13335
        })
      sinon.assert.callCount(logStub, 3)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Document')
      sinon.assert.calledWith(logStub.getCall(2), ' 📝[censor]: Error deleting message, skip')
    })

    it('should skip photo without caption', () => {
      censorMessage(bot as any, exampleMessageSupergroupImageNoCaption as Message)

      sinon.assert.callCount(logStub, 3)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Photo message')
      sinon.assert.calledWith(logStub.getCall(2), ' 📝[censor]: Photo has no caption, skip')
    })

    it('should accept photo with caption without swear words', () => {
      censorMessage(bot as any, exampleMessageSupergroupImageCaption as Message)

      sinon.assert.callCount(logStub, 3)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Photo message')
      sinon.assert.calledWith(logStub.getCall(2), " 📝[censor]: Photo's caption is okay")
    })

    it('should censor photo with caption', () => {
      censorMessage(bot as any, exampleMessageSupergroupImageCaptionSwears as Message)

      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendPhoto)
      sinon.assert.calledWith(bot.sendPhoto, -1001234567890, 'AgACAgIAAx0CYAhuSAACNEVoClWpwksNTJ8YBK6hFokdcRlXPAACY-4xG6D-UEhdG1GsOvYvlwEAAwIAA3MAAzYE',
        {
          caption: '🕊 @johndoe 🗣: С ...м матом',
          has_spoiler: undefined
        })
      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Photo message')
    })

    it('should censor photo with caption, fail to delete original message', () => {
      bot.deleteMessage.throws(new Error('Error deleting message'))

      censorMessage(bot as any, exampleMessageSupergroupImageCaptionSwears as Message)

      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendPhoto)
      sinon.assert.calledWith(bot.sendPhoto, -1001234567890, 'AgACAgIAAx0CYAhuSAACNEVoClWpwksNTJ8YBK6hFokdcRlXPAACY-4xG6D-UEhdG1GsOvYvlwEAAwIAA3MAAzYE',
        {
          caption: '🕊 @johndoe 🗣: С ...м матом',
          has_spoiler: undefined
        })
      sinon.assert.callCount(logStub, 3)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Photo message')
      sinon.assert.calledWith(logStub.getCall(2), ' 📝[censor]: Error deleting photo, skip')
    })

    it('should censor photo with caption and spoiler', () => {
      censorMessage(bot as any, exampleMessageSupergroupImageReplySpoilerSwears as Message)

      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendPhoto)
      sinon.assert.calledWith(bot.sendPhoto, -1001234567890, 'AgACAgIAAx0CYAhuSAACNEVoClWpwksNTJ8YBK6hFokdcRlXPAACY-4xG6D-UEhdG1GsOvYvlwEAAwIAA3MAAzYE',
        {
          caption: '🕊 @johndoe 🗣: Спойлер, ответ на сообщение, да еще ... и с матом',
          reply_to_message_id: 13382,
          has_spoiler: true,
        })  
      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Photo message')
    })

    it('should censor forwarded photo with caption', () => {
      censorMessage(bot as any, exampleMessageSupergroupImageForwardedSwears as Message)
      
      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendPhoto)
      sinon.assert.calledWith(bot.sendPhoto, -1001234567890, 'AgACAgIAAx0CYAhuSAACNEVoClWpwksNTJ8YBK6hFokdcRlXPAACY-4xG6D-UEhdG1GsOvYvlwEAAwIAA3MAAzYE',
        {
          caption: '➡️🕊 @johndoe 🗣: А я продолжаю кормить себя ... мотивационными картинками…',
          has_spoiler: undefined,
        })
      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Photo message')
    })

    it('should skip video with no caption', () => {
      censorMessage(bot as any, exampleMessageSupergroupVideoNoCaption as Message)

      sinon.assert.callCount(logStub, 3)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Video message')
      sinon.assert.calledWith(logStub.getCall(2), " 📝[censor]: Video has no caption, skip")
    })

    it('should accept video with caption without swear words', () => {
      censorMessage(bot as any, exampleMessageSupergroupVideoCaption as Message)

      sinon.assert.callCount(logStub, 3)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Video message')
      sinon.assert.calledWith(logStub.getCall(2), " 📝[censor]: Video's caption is okay")
    })

    it('should censor video with caption and spoiler, fail to delete original message', () => {
      bot.deleteMessage.throws(new Error('Error deleting message'))

      censorMessage(bot as any, exampleMessageSupergroupVideoSpoilerSwears as Message)

      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendVideo)
      sinon.assert.calledWith(bot.sendVideo, -1001234567890, 'BAACAgIAAx0CYAhuSAACNFdoClzhBdZ7xY6IeZAUXuzQwBrdiAACr3MAAqD-UEjZEBzqrWOphjYE',
        {
          caption: '🕊 @johndoe 🗣: Спойлер ... с матом',
          has_spoiler: true,
        }
      )
      sinon.assert.callCount(logStub, 3)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Video message')
      sinon.assert.calledWith(logStub.getCall(2), ' 📝[censor]: Error deleting video, skip')
    })

    it('should censor forwarded video with caption', () => {
      censorMessage(bot as any, exampleMessageSupergroupVideoForwarded as Message)

      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendVideo)
      sinon.assert.calledWith(bot.sendVideo, -1001234567890, 'BAACAgIAAx0CYAhuSAACNFhoCl5fb_CiGWuNK9XB-I5g8L98yAAC4WgAApoeWEg8kAci1Be_VzYE',
        {
          caption: '➡️🕊 @johndoe 🗣: Вот у меня короткое видео с подписью. Добавил спойлер на видео. Переместил подпись наверх. Сжал ... качество до 480. ..., сколько в телеге настроек!',
          has_spoiler: true
        }
      )
      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Video message')
    })

    it('should censor reply video with caption', () => {
      censorMessage(bot as any, exampleMessageSupergroupVideoReply as Message)

      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendVideo)
      sinon.assert.calledWith(bot.sendVideo, -1001234567890, 'BAACAgIAAx0CYAhuSAACNFpoCl-PFuOPxXi4mCX71-nSJQJLGgAC43MAAqD-UEjDfioDv9y-tDYE',
        {
          caption: '🕊 @johndoe 🗣: Реплай с ...й подписью',
          reply_to_message_id: 13401,
          has_spoiler: undefined
        }
      )
      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Video message')
    })

    it('should skip audio message', () => {
      censorMessage(bot as any, exampleMessageGroupAudio as Message)

      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: No handler for this message, skip')
    })

    it('should accept simple forum message', () => {
      censorMessage(bot as any, exampleMessageForumSimple as Message)

      sinon.assert.callCount(logStub, 3)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Text message')
      sinon.assert.calledWith(logStub.getCall(2), ' 📝[censor]: Message is okay')
    })

    it('should censor forum message with swear words', () => {
      censorMessage(bot as any, exampleMessageForumSwears as Message)

      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendMessage)
      sinon.assert.calledWith(bot.sendMessage, -1001234567890, '🕊 @johndoe 🗣: Мат в топике ...-сабака', { reply_to_message_id: 3 })

      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Text message')
    })

    it('should censor forwarded message to forum', () => {
      censorMessage(bot as any, exampleMessageForumForwarded as Message)

      sinon.assert.calledOnce(bot.deleteMessage) 
      sinon.assert.calledOnce(bot.sendMessage)
      sinon.assert.calledWith(bot.sendMessage, -1001234567890, '➡️🕊 @johndoe 🗣: Ты не понял сути. Факт в том, что он делал салют флагу. А подано НАМЕРЕННО так, будто он зигует. Ты не сможешь переубедить после этого массы, которые это увидели. Они не имеют критического мышления и всегда жрут, что дают. Им уже ..., что это на самом деле было, они рисуют свастоны на теслах', { reply_to_message_id: 2 })

      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Text message')
    })

    it('should censor forwarded document to forum', () => {
      censorMessage(bot as any, exampleMessageForumForwardedDocument as Message)
      
      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendDocument)
      sinon.assert.calledWith(bot.sendDocument, -1001234567890, 'BQACAgIAAx0CYAhuSAACNCBoCVd2cA6RmTkDpXV3ZmN0ImYroQACq20AAn9yUUhJ8sYYeByH-jYE',
        {
          caption: '➡️🕊 @johndoe 🗣: три ... кота',
          reply_to_message_id: 2
        })  

      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Document')
    })

    it('should censor forwarded video to forum', () => {
      censorMessage(bot as any, exampleMessageForumForwardedVideo as Message)

      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendVideo)
      sinon.assert.calledWith(bot.sendVideo, -1001234567890, 'BAACAgIAAx0CYAhuSAACNFhoCl5fb_CiGWuNK9XB-I5g8L98yAAC4WgAApoeWEg8kAci1Be_VzYE',
        {
          caption: '➡️🕊 @johndoe 🗣: Вот у меня короткое видео с подписью. Добавил спойлер на видео. Переместил подпись наверх. Сжал ... качество до 480. ..., сколько в телеге настроек!',
          reply_to_message_id: 3,
          has_spoiler: true
        }
      )

      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Video message')
    })

    it('should censor forwarded photo to forum', () => {
      censorMessage(bot as any, exampleMessageForumForwardedPhoto as Message)
      
      sinon.assert.calledOnce(bot.deleteMessage)
      sinon.assert.calledOnce(bot.sendPhoto)
      sinon.assert.calledWith(bot.sendPhoto, -1001234567890, 'AgACAgIAAx0CYAhuSAACNEVoClWpwksNTJ8YBK6hFokdcRlXPAACY-4xG6D-UEhdG1GsOvYvlwEAAwIAA3MAAzYE',
        {
          caption: '➡️🕊 @johndoe 🗣: А я продолжаю кормить себя ... мотивационными картинками…',
          reply_to_message_id: 2,
          has_spoiler: undefined
        })

      sinon.assert.callCount(logStub, 2)
      sinon.assert.calledWith(logStub.getCall(0), ' 📝[censor]: Censor message')
      sinon.assert.calledWith(logStub.getCall(1), ' 📝[censor]: Photo message')
    })
  }) 

  describe('sendWelcomeMessage', () => {
    let bot: FakeTelegramBot

    beforeEach(() => {
      bot = new FakeTelegramBot()
    })

    it('should send welcome message with correct content and options', () => {
      const chatId = 123456789
      sendWelcomeMessage(bot as any, chatId)

      sinon.assert.calledOnce(bot.sendMessage)
      sinon.assert.calledWith(bot.sendMessage, chatId, sinon.match.string, {
        parse_mode: 'HTML' as const,
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [[{
            text: '➕ Добавить в чат',
            url: 'https://t.me/gdgcensorbot?startgroup=true',
          }]]
        }
      })
    })

    it('should include all welcome message content', () => {
      const chatId = 123456789
      sendWelcomeMessage(bot as any, chatId)

      const message = bot.sendMessage.getCall(0).args[1]
      sinon.assert.match(message, /Привет! Это цензор-бот/)
      sinon.assert.match(message, /Бот бережно удаляет нецензурные слова/)
      sinon.assert.match(message, /Установить бота очень просто/)
      sinon.assert.match(message, /@censorchannel/)
    })
  })

  describe('sendWelcomeToChatMessage', () => {
    let bot: FakeTelegramBot

    beforeEach(() => {
      bot = new FakeTelegramBot()
    })

    it('should send welcome to chat message with correct content and options', () => {
      const chatId = 123456789
      sendWelcomeToChatMessage(bot as any, chatId)

      sinon.assert.calledOnce(bot.sendMessage)
      sinon.assert.calledWith(bot.sendMessage, chatId, sinon.match.string, {
        parse_mode: 'HTML' as const,
        disable_web_page_preview: true
      })
    })

    it('should include all welcome to chat message content', () => {
      const chatId = 123456789
      sendWelcomeToChatMessage(bot as any, chatId)

      const message = bot.sendMessage.getCall(0).args[1]
      sinon.assert.match(message, /Здравствуйте!/)
      sinon.assert.match(message, /Этот чат предназначен для тестирования бота/)
      sinon.assert.match(message, /Просим вас ругаться матом/)
    })
  })

  describe('sendHelpMessage', () => {
    let bot: FakeTelegramBot

    beforeEach(() => {
      bot = new FakeTelegramBot()
    })

    it('should send help message with parse_mode HTML', () => {
      const chatId = 123456789
      sendHelpMessage(bot as any, chatId)

      sinon.assert.calledOnce(bot.sendMessage)
      sinon.assert.calledWith(bot.sendMessage, chatId, sinon.match.string, { parse_mode: 'HTML' })
    })

    it('should include admin commands in help text', () => {
      const chatId = 123456789
      sendHelpMessage(bot as any, chatId)

      const message = bot.sendMessage.getCall(0).args[1]
      sinon.assert.match(message, /Команды бота/)
      sinon.assert.match(message, /\/help/)
      sinon.assert.match(message, /\/checkpermissions/)
      sinon.assert.match(message, /\/joinchat/)
      sinon.assert.match(message, /\/leavechat/)
    })
  })

  describe('checkPermissions', () => {
    let bot: FakeTelegramBot
    let logStub: sinon.SinonStub

    beforeEach(() => {
      bot = new FakeTelegramBot()
      logStub = sinon.stub(console, 'log')
    })

    afterEach(() => {
      logStub.restore()
    })

    it('should skip if message has no text or user', async () => {
      const msg = {
        chat: { id: 123456789 },
      } as Message

      await checkPermissions(bot as any, msg)

      sinon.assert.calledWith(logStub, ' 🔑[permissions]: No text or user in message, skip')
      sinon.assert.notCalled(bot.sendMessage)
    })

    it('should skip if message has no chat ID', async () => {
      const msg = {
        chat: { id: 123456789 },
        from: { id: 987654321 },
        text: '/check'
      } as Message

      await checkPermissions(bot as any, msg)

      sinon.assert.calledWith(logStub, ' 🔑[permissions]: No chat ID in message, skip')
      sinon.assert.calledWith(bot.sendMessage, 987654321, 'Пожалуйста, укажите корректный ID чата (например: -100234232323365)')
    })

    it('should check permissions and send report for positive chat ID', async () => {
      const msg = {
        chat: { id: 123456789 },
        from: { id: 987654321 },
        text: '/check 1234567890'
      } as Message

      const botInfo = { id: 'bot123' }
      const chatMember = {
        can_invite_users: true,
        can_manage_chat: false,
        can_send_messages: true,
        can_delete_messages: true
      }
      const chatInfo = { title: 'Test Chat' }

      bot.getMe = sinon.stub().resolves(botInfo)
      bot.getChatMember = sinon.stub().resolves(chatMember)
      bot.getChat = sinon.stub().resolves(chatInfo)

      await checkPermissions(bot as any, msg)

      sinon.assert.calledWith(bot.getMe)
      sinon.assert.calledWith(bot.getChatMember, '1234567890', 'bot123')
      sinon.assert.calledWith(bot.getChat, '1234567890')
      sinon.assert.calledWith(bot.sendMessage, 123456789, [
        '📋 Отчет о правах бота в чате:',
        'Название: Test Chat',
        'ID: 1234567890',
        '',
        'Приглашать пользователей: ✅',
        'Управлять чатом: ❌',
        'Отправлять сообщения: ✅',
        'Удалять сообщения: ✅',
      ].join('\n'))
    })

    it('should check permissions and send report for negative chat ID', async () => {
      const msg = {
        chat: { id: 123456789 },
        from: { id: 987654321 },
        text: '/check -100234232323365'
      } as Message

      const botInfo = { id: 'bot123' }
      const chatMember = {
        can_invite_users: true,
        can_manage_chat: false,
        can_send_messages: true,
        can_delete_messages: true
      }
      const chatInfo = { title: 'Test Chat' }

      bot.getMe = sinon.stub().resolves(botInfo)
      bot.getChatMember = sinon.stub().resolves(chatMember)
      bot.getChat = sinon.stub().resolves(chatInfo)

      await checkPermissions(bot as any, msg)

      sinon.assert.calledWith(bot.getMe)
      sinon.assert.calledWith(bot.getChatMember, '-100234232323365', 'bot123')
      sinon.assert.calledWith(bot.getChat, '-100234232323365')
      sinon.assert.calledWith(bot.sendMessage, 123456789, [
        '📋 Отчет о правах бота в чате:',
        'Название: Test Chat',
        'ID: -100234232323365',
        '',
        'Приглашать пользователей: ✅',
        'Управлять чатом: ❌',
        'Отправлять сообщения: ✅',
        'Удалять сообщения: ✅',
      ].join('\n'))
    })

    it('should handle unknown chat title', async () => {
      const msg = {
        chat: { id: 123456789 },
        from: { id: 987654321 },
        text: '/check -100234232323365'
      } as Message

      const botInfo = { id: 'bot123' }
      const chatMember = {
        can_invite_users: false,
        can_manage_chat: true,
        can_send_messages: false,
        can_delete_messages: false
      }
      const chatInfo = { title: undefined }

      bot.getMe = sinon.stub().resolves(botInfo)
      bot.getChatMember = sinon.stub().resolves(chatMember)
      bot.getChat = sinon.stub().resolves(chatInfo)

      await checkPermissions(bot as any, msg)

      sinon.assert.calledWith(bot.sendMessage, 123456789, [
        '📋 Отчет о правах бота в чате:',
        'Название: Неизвестно',
        'ID: -100234232323365',
        '',
        'Приглашать пользователей: ❌',
        'Управлять чатом: ✅',
        'Отправлять сообщения: ❌',
        'Удалять сообщения: ❌',
      ].join('\n'))
    })
  })

  describe('joinChat', () => {
    let bot: FakeTelegramBot
    let logStub: sinon.SinonStub

    beforeEach(() => {
      bot = new FakeTelegramBot()
      logStub = sinon.stub(console, 'log')
    })

    afterEach(() => {
      logStub.restore()
    })

    it('should skip if no text or user in message', async () => {
      const msgWithoutText = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' }
      } as Message

      const msgWithoutUser = {
        chat: { id: 123 },
        text: '/join -100234232323365'
      } as Message

      await joinChat(bot as any, msgWithoutText)
      sinon.assert.notCalled(bot.sendMessage)

      await joinChat(bot as any, msgWithoutUser)
      sinon.assert.notCalled(bot.sendMessage)
    })

    it('should ask for chat ID if not provided', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/join'
      } as Message

      await joinChat(bot as any, msg)
      sinon.assert.calledWith(bot.sendMessage, 456, 'Пожалуйста, укажите корректный ID чата (например: -100234232323365)')
    })

    it('should check bot permissions and return if bot cannot invite users', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/join -100234232323365'
      } as Message

      bot.getChat = sinon.stub().resolves({ title: 'Test Chat' })
      bot.getMe = sinon.stub().resolves({ id: 789 })
      bot.getChatMember = sinon.stub().resolves({ can_invite_users: false })

      await joinChat(bot as any, msg)
      sinon.assert.calledWith(bot.sendMessage, 123, 'Бот не имеет прав на приглашение пользователей в чат. Пожалуйста, сделайте бота администратором.')
    })

    it('should notify if user is already in the chat', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/join -100234232323365'
      } as Message

      bot.getChat = sinon.stub().resolves({ title: 'Test Chat' })
      bot.getMe = sinon.stub().resolves({ id: 789 })
      bot.getChatMember = sinon.stub()
        .onFirstCall().resolves({ can_invite_users: true })
        .onSecondCall().resolves({ status: 'member' })

      await joinChat(bot as any, msg)
      sinon.assert.calledWith(bot.sendMessage, 123, 'Вы уже находитесь в чате "Test Chat"')
    })

    it('should notify if user is already in chat with unknown title', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/join -100234232323365'
      } as Message

      bot.getChat = sinon.stub().resolves({ title: undefined })
      bot.getMe = sinon.stub().resolves({ id: 789 })
      bot.getChatMember = sinon.stub()
        .onFirstCall().resolves({ can_invite_users: true })
        .onSecondCall().resolves({ status: 'member' })

      await joinChat(bot as any, msg)
      sinon.assert.calledWith(bot.sendMessage, 123, 'Вы уже находитесь в чате "Неизвестно"')
    })

    it('should allow user to rejoin if they left the chat', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/join -100123456789'
      } as Message

      bot.getChat = sinon.stub().resolves({ title: 'Test Chat' })
      bot.getMe = sinon.stub().resolves({ id: 789 })
      bot.getChatMember = sinon.stub()
        .onFirstCall().resolves({ can_invite_users: true })
        .onSecondCall().resolves({ status: 'left' })
      bot.createChatInviteLink = sinon.stub().resolves({ invite_link: 'https://t.me/+abc123' })

      await joinChat(bot as any, msg)
      sinon.assert.calledWith(bot.createChatInviteLink, '-100123456789', {
        member_limit: 1,
        expire_date: sinon.match.number
      })
    })

    it('should allow user to rejoin if they were kicked', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/join -100123456789'
      } as Message

      bot.getChat = sinon.stub().resolves({ title: 'Test Chat' })
      bot.getMe = sinon.stub().resolves({ id: 789 })
      bot.getChatMember = sinon.stub()
        .onFirstCall().resolves({ can_invite_users: true })
        .onSecondCall().resolves({ status: 'kicked' })
      bot.createChatInviteLink = sinon.stub().resolves({ invite_link: 'https://t.me/+abc123' })

      await joinChat(bot as any, msg)
      sinon.assert.calledWith(bot.createChatInviteLink, '-100123456789', {
        member_limit: 1,
        expire_date: sinon.match.number
      })
    })

    it('should handle user not found error correctly', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/join -100123456789'
      } as Message

      bot.getChat = sinon.stub().resolves({ title: 'Test Chat' })
      bot.getMe = sinon.stub().resolves({ id: 789 })
      bot.getChatMember = sinon.stub()
        .onFirstCall().resolves({ can_invite_users: true })
        .onSecondCall().rejects(new Error('user not found'))
      bot.createChatInviteLink = sinon.stub().resolves({ invite_link: 'https://t.me/+abc123' })

      await joinChat(bot as any, msg)
      sinon.assert.calledWith(bot.createChatInviteLink, '-100123456789', {
        member_limit: 1,
        expire_date: sinon.match.number
      })
    })

    it('should handle bad request user not found error correctly', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/join -100123456789'
      } as Message

      bot.getChat = sinon.stub().resolves({ title: 'Test Chat' })
      bot.getMe = sinon.stub().resolves({ id: 789 })
      bot.getChatMember = sinon.stub()
        .onFirstCall().resolves({ can_invite_users: true })
        .onSecondCall().rejects(new Error('Bad Request: user not found'))
      bot.createChatInviteLink = sinon.stub().resolves({ invite_link: 'https://t.me/+abc123' })

      await joinChat(bot as any, msg)
      sinon.assert.calledWith(bot.createChatInviteLink, '-100123456789', {
        member_limit: 1,
        expire_date: sinon.match.number
      })
    })

    it('should handle error with undefined message property', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/join -100234232323365'
      } as Message

      bot.getChat = sinon.stub().resolves({ title: 'Test Chat' })
      bot.getMe = sinon.stub().resolves({ id: 789 })
      bot.getChatMember = sinon.stub()
        .onFirstCall().resolves({ can_invite_users: true })
        .onSecondCall().rejects({}) // Error without message property

      await joinChat(bot as any, msg)
      sinon.assert.calledWith(bot.sendMessage, 123, 'Не удалось создать приглашение. Убедитесь, что ID чата указан верно и бот имеет необходимые права.')
    })

    it('should handle error with null message property', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/join -100123456789'
      } as Message

      bot.getChat = sinon.stub().resolves({ title: 'Test Chat' })
      bot.getMe = sinon.stub().resolves({ id: 789 })
      bot.getChatMember = sinon.stub()
        .onFirstCall().resolves({ can_invite_users: true })
        .onSecondCall().rejects({ message: null }) // Error with null message

      await joinChat(bot as any, msg)
      sinon.assert.calledWith(bot.sendMessage, 123, 'Не удалось создать приглашение. Убедитесь, что ID чата указан верно и бот имеет необходимые права.')
    })

    it('should rethrow other types of errors when checking user membership', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/join -100234232323365'
      } as Message

      bot.getChat = sinon.stub().resolves({ title: 'Test Chat' })
      bot.getMe = sinon.stub().resolves({ id: 789 })
      bot.getChatMember = sinon.stub()
        .onFirstCall().resolves({ can_invite_users: true })
        .onSecondCall().rejects(new Error('Some other error'))

      await joinChat(bot as any, msg)
      sinon.assert.calledWith(bot.sendMessage, 123, 'Не удалось создать приглашение. Убедитесь, что ID чата указан верно и бот имеет необходимые права.')
    })

    it('should create and send invite link successfully', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/join -100123456789'
      } as Message

      bot.getChat = sinon.stub().resolves({ title: 'Test Chat' })
      bot.getMe = sinon.stub().resolves({ id: 789 })
      bot.getChatMember = sinon.stub()
        .onFirstCall().resolves({ can_invite_users: true })
        .onSecondCall().rejects(new Error('user not found'))
      bot.createChatInviteLink = sinon.stub().resolves({ invite_link: 'https://t.me/+abc123' })

      await joinChat(bot as any, msg)

      sinon.assert.calledWith(bot.createChatInviteLink, '-100123456789', {
        member_limit: 1,
        expire_date: sinon.match.number
      })

      sinon.assert.calledWith(bot.sendMessage, 456, 'Приглашение в чат "Test Chat":\nhttps://t.me/+abc123')
      sinon.assert.calledWith(bot.sendMessage, 123, 'Приглашение отправлено пользователю Test User')
    })

    it('should handle unknown chat title when creating invite link', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/join -100123456789'
      } as Message

      bot.getChat = sinon.stub().resolves({ title: undefined })
      bot.getMe = sinon.stub().resolves({ id: 789 })
      bot.getChatMember = sinon.stub()
        .onFirstCall().resolves({ can_invite_users: true })
        .onSecondCall().rejects(new Error('user not found'))
      bot.createChatInviteLink = sinon.stub().resolves({ invite_link: 'https://t.me/+abc123' })

      await joinChat(bot as any, msg)

      sinon.assert.calledWith(bot.createChatInviteLink, '-100123456789', {
        member_limit: 1,
        expire_date: sinon.match.number
      })

      sinon.assert.calledWith(bot.sendMessage, 456, 'Приглашение в чат "Неизвестно":\nhttps://t.me/+abc123')
      sinon.assert.calledWith(bot.sendMessage, 123, 'Приглашение отправлено пользователю Test User')
    })

    it('should handle errors gracefully', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/join -100123456789'
      } as Message

      bot.getChat = sinon.stub().rejects(new Error('Chat not found'))

      await joinChat(bot as any, msg)
      sinon.assert.calledWith(bot.sendMessage, 123, 'Не удалось создать приглашение. Убедитесь, что ID чата указан верно и бот имеет необходимые права.')
    })
  })

  describe('leaveChat', () => {
    let bot: FakeTelegramBot
    let logStub: sinon.SinonStub

    beforeEach(() => {
      bot = new FakeTelegramBot()
      logStub = sinon.stub(console, 'log')
    })

    afterEach(() => {
      logStub.restore()
    })

    it('should skip if no text or user in message', async () => {
      const msgWithoutText = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' }
      } as Message

      const msgWithoutUser = {
        chat: { id: 123 },
        text: '/leave -100123456789'
      } as Message

      await leaveChat(bot as any, msgWithoutText)
      sinon.assert.notCalled(bot.sendMessage)

      await leaveChat(bot as any, msgWithoutUser)
      sinon.assert.notCalled(bot.sendMessage)
    })

    it('should ask for chat ID if not provided', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/leave'
      } as Message

      await leaveChat(bot as any, msg)
      sinon.assert.calledWith(bot.sendMessage, 456, 'Пожалуйста, укажите корректный ID чата (например: -100234232323365)')
    })

    it('should notify if bot is not in the chat', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/leave -100234232323365'
      } as Message

      bot.getChat = sinon.stub().resolves({ title: 'Test Chat' })
      bot.getMe = sinon.stub().resolves({ id: 789 })
      bot.getChatMember = sinon.stub().rejects(new Error('Bot not in chat'))

      await leaveChat(bot as any, msg)
      sinon.assert.calledWith(bot.sendMessage, 123, 'Бот не находится в чате "Test Chat"')
    })

    it('should notify if bot is not in chat with unknown title', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/leave -100123456789'
      } as Message

      bot.getChat = sinon.stub().resolves({ title: undefined })
      bot.getMe = sinon.stub().resolves({ id: 789 })
      bot.getChatMember = sinon.stub().rejects(new Error('Bot not in chat'))

      await leaveChat(bot as any, msg)
      sinon.assert.calledWith(bot.sendMessage, 123, 'Бот не находится в чате "Неизвестно"')
    })

    it('should leave chat successfully', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/leave -100123456789'
      } as Message

      bot.getChat = sinon.stub().resolves({ title: 'Test Chat' })
      bot.getMe = sinon.stub().resolves({ id: 789 })
      bot.getChatMember = sinon.stub().resolves({})
      bot.leaveChat = sinon.stub().resolves()

      await leaveChat(bot as any, msg)

      sinon.assert.calledWith(bot.leaveChat, '-100123456789')
      sinon.assert.calledWith(bot.sendMessage, 123, 'Бот успешно покинул чат "Test Chat"')
    })

    it('should handle unknown chat title when leaving chat', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/leave -100123456789'
      } as Message

      bot.getChat = sinon.stub().resolves({ title: undefined })
      bot.getMe = sinon.stub().resolves({ id: 789 })
      bot.getChatMember = sinon.stub().resolves({})
      bot.leaveChat = sinon.stub().resolves()

      await leaveChat(bot as any, msg)

      sinon.assert.calledWith(bot.leaveChat, '-100123456789')
      sinon.assert.calledWith(bot.sendMessage, 123, 'Бот успешно покинул чат "Неизвестно"')
    })

    it('should handle errors gracefully', async () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/leave -100123456789'
      } as Message

      bot.getChat = sinon.stub().rejects(new Error('Chat not found'))

      await leaveChat(bot as any, msg)
      sinon.assert.calledWith(bot.sendMessage, 123, 'Не удалось покинуть чат. Убедитесь, что ID чата указан верно.')
    })
  })
}) 
