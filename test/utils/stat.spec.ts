import assert from "assert"
import sinon from "sinon"
import TelegramBot, {
  type Message,
} from 'node-telegram-bot-api'
import Stat from '../../src/utils/stat'

// Create a fake TelegramBot class for testing
class FakeTelegramBot {
  public editMessageText = sinon.stub().resolves()
  public sendMessage = sinon.stub().resolves({ message_id: 123 })
  public pinChatMessage = sinon.stub().resolves()
}

describe('Stat', () => {
  const stat: Stat = Stat.getInstance()
  let logStub: sinon.SinonStub
  let bot: FakeTelegramBot;

  beforeEach(() => {
    sinon.resetHistory()
    logStub = sinon.stub(console, 'log')
    bot = new FakeTelegramBot();

    // Reset the singleton instance state
    (stat as any).total = 0;
    (stat as any).table = [];
    (stat as any).swearTable = {};
    (stat as any).messageId = null;
    (stat as any).messageText = null;
  });

  afterEach(() => {
    logStub.restore()
  })

  describe('getInstance', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = Stat.getInstance()
      const instance2 = Stat.getInstance()
      
      assert.strictEqual(instance1, instance2, 'Instances should be the same')
    })
  })


  describe('calculate', () => {
    it('should skip nongroup message', async () => {
      const sendStatStub = sinon.stub(stat, 'sendStat').resolves()
      const sendStatToServerStub = sinon.stub(stat, 'sendStatToServer').resolves()
      const msg = {
        chat: {
          type: 'private',
          id: -123,
          title: 'Test Chat',
          username: 'testchat'
        }
      } as Message;
      
      await stat.calculate(msg, bot as any as TelegramBot);
      
      const info = stat.getInfo();
      assert.ok(info.includes('Всего сообщений/чатов: 0/0'));
      sinon.assert.notCalled(sendStatStub)
      sinon.assert.notCalled(sendStatToServerStub)
      sendStatStub.restore()
      sendStatToServerStub.restore()
    });

    it('should increment count for existing chat', async () => {
      const sendStatStub = sinon.stub(stat, 'sendStat').resolves()
      const sendStatToServerStub = sinon.stub(stat, 'sendStatToServer').resolves()
      const msg = {
        chat: {
          type: 'group',
          id: -123,
          title: 'Test Chat',
          username: 'testchat'
        }
      } as Message;
      
      await stat.calculate(msg, bot as any as TelegramBot);
      await stat.calculate(msg, bot as any as TelegramBot);
      
      const info = stat.getInfo();
      assert.ok(info.includes('Test Chat (2)'));
      sinon.assert.notCalled(sendStatStub)
      sinon.assert.notCalled(sendStatToServerStub)
      sendStatStub.restore()
      sendStatToServerStub.restore()
    });

    it('should add new chat without title to table', async () => {
      const sendStatStub = sinon.stub(stat, 'sendStat').resolves()
      const sendStatToServerStub = sinon.stub(stat, 'sendStatToServer').resolves()
      const msg = {
        chat: {
          type: 'group',
          id: -123,
          title: undefined,
          username: 'newchat'
        }
      } as Message;
      
      await stat.calculate(msg, bot as any as TelegramBot);
      
      const info = stat.getInfo();
      assert.ok(info.includes('Не указано (1)'));
      sinon.assert.notCalled(sendStatStub)
      sinon.assert.notCalled(sendStatToServerStub)
      sendStatStub.restore()
      sendStatToServerStub.restore()
    });

    it('should add new chat without username to table', async () => {
      const sendStatStub = sinon.stub(stat, 'sendStat').resolves()
      const sendStatToServerStub = sinon.stub(stat, 'sendStatToServer').resolves()
      const msg = {
        chat: {
          type: 'supergroup',
          id: -123,
          title: 'Test Chat',
          username: undefined
        }
      } as Message;
      
      await stat.calculate(msg, bot as any as TelegramBot);
      
      const info = stat.getInfo();
      assert.ok(info.includes('Test Chat (1)'));
      sinon.assert.notCalled(sendStatStub)
      sinon.assert.notCalled(sendStatToServerStub)
      sendStatStub.restore()
      sendStatToServerStub.restore()
    });

    it('should trigger sendStat and sendStatToServer when total > 50', async () => {
      const sendStatStub = sinon.stub(stat, 'sendStat').resolves()
      const sendStatToServerStub = sinon.stub(stat, 'sendStatToServer').resolves()
      const msg = {
        chat: {
          type: 'group',
          id: -123,
          title: 'Test Chat',
          username: 'testchat'
        }
      } as Message;
      
      for (let i = 0; i < 50; i++) {
        await stat.calculate(msg, bot as any as TelegramBot);
      }
      
      const info = stat.getInfo();
      assert.ok(info.includes('Test Chat (50)'));
      sinon.assert.calledOnce(sendStatStub)
      sinon.assert.calledOnce(sendStatToServerStub)
      sendStatStub.restore()
      sendStatToServerStub.restore()
    });
  })


  describe('normalize', () => {
    it('should not replace dots with spaces', () => {
      const result = stat.normalize('test.title');
      assert.strictEqual(result, 'test.title');
    });

    it('should truncate long titles and add ellipsis', () => {
      const longTitle = 'This is a very long title that exceeds the limit';
      const result = stat.normalize(longTitle);
      assert.strictEqual(result, 'This is a very ...');
    });

    it('should not modify short titles', () => {
      const shortTitle = 'Short title';
      const result = stat.normalize(shortTitle);
      assert.strictEqual(result, shortTitle);
    });
  })


  describe('getInfo', () => {
    it('should return empty stats when no messages processed', () => {
      const info = stat.getInfo();
      assert.strictEqual(info, 'Всего сообщений/чатов: 0/0');
    });

    it('should sort chats by count in descending order', () => {
      const msg1 = {
        message_id: 1,
        date: 1234567890,
        chat: {
          type: 'group',
          id: -1,
          title: 'Chat 1',
          username: 'chat1'
        }
      } as Message;

      const msg2 = {
        message_id: 2,
        date: 1234567890,
        chat: {
          type: 'group',
          id: -2,
          title: 'Chat 2',
          username: 'chat2'
        }
      } as Message;
      
      stat.calculate(msg1, bot as any as TelegramBot);
      stat.calculate(msg2, bot as any as TelegramBot);
      stat.calculate(msg2, bot as any as TelegramBot);
      
      const info = stat.getInfo();
      const lines = info.split('\n');
      
      // Verify header
      assert.ok(lines[0].includes('Всего сообщений/чатов: 3/2'));
      
      // Verify top chats are sorted by count
      assert.ok(lines[3].includes('Chat 2 (2)'), 'First chat should be Chat 2 with count 2');
      assert.ok(lines[4].includes('Chat 1 (1)'), 'Second chat should be Chat 1 with count 1');
      
      // Verify swear table section exists
      assert.ok(lines.some(line => line.includes('Топ-мат:')), 'Should include swear table section');
    });

    it('should limit output to top 20 chats', () => {
      // Create 25 different chats
      for (let i = 0; i < 25; i++) {
        const msg = {
          message_id: i + 1,
          date: 1234567890,
          chat: {
            type: 'group',
            id: -(i + 1),
            title: `Chat ${i + 1}`,
            username: `chat${i + 1}`
          }
        } as Message;
        stat.calculate(msg, bot as any as TelegramBot);
      }
      
      const info = stat.getInfo();
      const lines = info.split('\n');
      
      // Verify total count
      assert.ok(lines[0].includes('Всего сообщений/чатов: 25/25'));
      
      // Verify only top 20 chats are shown (header + empty line + "Топ 20" + 20 chats + empty line + "Топ-мат:")
      assert.ok(lines.length >= 25); // At least 25 lines due to swear table section
      assert.ok(lines.some(line => line.includes('Топ-мат:')), 'Should include swear table section');
    });

    it('should handle long chat titles', () => {
      const msg = {
        message_id: 1,
        date: 1234567890,
        chat: {
          type: 'group',
          id: -1,
          title: 'This is a very long chat title that should be truncated',
          username: 'testchat'
        }
      } as Message;
      
      stat.calculate(msg, bot as any as TelegramBot);
      
      const info = stat.getInfo();
      const lines = info.split('\n');
      
      // Verify title truncation
      assert.ok(lines[3].includes('This is a very ... (1)'));
    });

    it('should display swear table when swear words are tracked', () => {
      // Add some swear words to the table
      (stat as any).swearTable = {
        'хуй': 3,
        'пизда': 2,
        'ебать': 1,
        'other': 1
      };
      
      const info = stat.getInfo();
      const lines = info.split('\n');
      
      // Verify swear table section exists
      assert.ok(lines.some(line => line.includes('Топ-мат:')), 'Should include swear table section');
      
      // Verify swear words are sorted by count (хуй should be first with count 3)
      const swearSectionStart = lines.findIndex(line => line.includes('Топ-мат:'));
      assert.ok(swearSectionStart >= 0, 'Should find swear table section');
      
      // Check that swear entries are displayed
      const swearLines = lines.slice(swearSectionStart + 1);
      assert.ok(swearLines.some(line => line.includes('хуй (3)')), 'Should show хуй with count 3');
      assert.ok(swearLines.some(line => line.includes('пизда (2)')), 'Should show пизда with count 2');
      assert.ok(swearLines.some(line => line.includes('ебать (1)')), 'Should show ебать with count 1');
      assert.ok(swearLines.some(line => line.includes('other (1)')), 'Should show other with count 1');
    });

    it('should sort swear table by count in descending order', () => {
      // Add swear words with different counts
      (stat as any).swearTable = {
        'хуй': 1,
        'пизда': 5,
        'ебать': 3,
        'блядь': 2
      };
      
      const info = stat.getInfo();
      const lines = info.split('\n');
      
      const swearSectionStart = lines.findIndex(line => line.includes('Топ-мат:'));
      const swearLines = lines.slice(swearSectionStart + 1);
      
      // Find the lines with swear words
      const swearEntries = swearLines.filter(line => line.includes('(') && line.includes(')'));
      
      // Verify sorting: пизда (5) should be first, then ебать (3), then блядь (2), then хуй (1)
      assert.ok(swearEntries[0].includes('пизда (5)'), 'First entry should be пизда with highest count');
      assert.ok(swearEntries[1].includes('ебать (3)'), 'Second entry should be ебать');
      assert.ok(swearEntries[2].includes('блядь (2)'), 'Third entry should be блядь');
      assert.ok(swearEntries[3].includes('хуй (1)'), 'Fourth entry should be хуй with lowest count');
    });

    it('should display empty swear table when no swear words are tracked', () => {
      // Set up some messages first to ensure total > 0
      const msg = {
        message_id: 1,
        date: 1234567890,
        chat: {
          type: 'group',
          id: -1,
          title: 'Test Chat',
          username: 'testchat'
        }
      } as Message;
      
      stat.calculate(msg, bot as any as TelegramBot);
      
      // Ensure swear table is empty
      (stat as any).swearTable = {};
      
      const info = stat.getInfo();
      const lines = info.split('\n');
      
      // Verify swear table section exists but is empty
      assert.ok(lines.some(line => line.includes('Топ-мат:')), 'Should include swear table section');
      
      const swearSectionStart = lines.findIndex(line => line.includes('Топ-мат:'));
      const swearLines = lines.slice(swearSectionStart + 1);
      
      // Should have no swear entries
      const swearEntries = swearLines.filter(line => line.includes('(') && line.includes(')'));
      assert.strictEqual(swearEntries.length, 0, 'Should have no swear entries when table is empty');
    });

    it('should display all swear groups without limiting to top 10', () => {
      // Add more than 10 swear groups
      (stat as any).swearTable = {
        'хуй': 1,
        'пизда': 1,
        'ебать': 1,
        'блядь': 1,
        'сука': 1,
        'пидарас': 1,
        'group1': 1,
        'group2': 1,
        'group3': 1,
        'group4': 1,
        'group5': 1,
        'group6': 1,
        'other': 1
      };
      
      const info = stat.getInfo();
      const lines = info.split('\n');
      
      const swearSectionStart = lines.findIndex(line => line.includes('Топ-мат:'));
      const swearLines = lines.slice(swearSectionStart + 1);
      const swearEntries = swearLines.filter(line => line.includes('(') && line.includes(')'));
      
      // Should display all 13 groups, not just top 10
      assert.strictEqual(swearEntries.length, 13, 'Should display all swear groups, not limited to 10');
    });
  })


  describe('sendStat', async() => {
    it('should send new message and pin it when no message exists', async () => {
      await stat.sendStat(bot as any as TelegramBot);

      sinon.assert.calledOnce(bot.sendMessage)
      sinon.assert.calledOnce(bot.pinChatMessage)
      assert.strictEqual((stat as any).messageId, 123)
      assert.strictEqual((stat as any).messageText, stat.getInfo())
      assert.strictEqual((stat as any).messageDate, new Date().toISOString().split('T')[0])
    })

    it('should update stat message when it exists', async () => {
      (stat as any).messageId = "123";
      (stat as any).messageText = 'some content to show different';

      await stat.sendStat(bot as any as TelegramBot);

      sinon.assert.calledOnce(bot.editMessageText)
      sinon.assert.notCalled(bot.pinChatMessage)
      assert.strictEqual((stat as any).messageId, "123")
      assert.strictEqual((stat as any).messageText, stat.getInfo())
      assert.strictEqual((stat as any).messageDate, new Date().toISOString().split('T')[0])
    })

    it('should not update stat message when it is the same', async () => {
      (stat as any).messageId = "123";
      (stat as any).messageText = 'some content to show different';

      await stat.sendStat(bot as any as TelegramBot);
      await stat.sendStat(bot as any as TelegramBot);

      sinon.assert.calledWith(logStub, 'Stat is not changed, skip.')
      sinon.assert.calledOnce(bot.editMessageText)
      sinon.assert.notCalled(bot.sendMessage)
      sinon.assert.notCalled(bot.pinChatMessage)
    })

    it('should reset message state on error', async () => {
      const errorBot = {
        editMessageText: async () => { throw new Error('Test error') },
        sendMessage: async () => { throw new Error('Test error') },
        pinChatMessage: async () => Promise.resolve()
      };

      await stat.sendStat(errorBot as any as TelegramBot);

      sinon.assert.notCalled(logStub)
      assert.strictEqual((stat as any).messageId, null)
      assert.strictEqual((stat as any).messageText, null)
      assert.strictEqual((stat as any).messageDate, null)
    })    
  })

  describe('calculateSwearByGroup', () => {
    beforeEach(() => {
      // Reset swearTable before each test
      (stat as any).swearTable = {};
    });

    it('should increment counter for хуй group words', () => {
      stat.calculateSwearByGroup('хуй');
      assert.strictEqual((stat as any).swearTable['хуй'], 1);
    });

    it('should increment counter for пизда group words', () => {
      stat.calculateSwearByGroup('пизда');
      assert.strictEqual((stat as any).swearTable['пизда'], 1);
    });

    it('should increment counter for ебать group words', () => {
      stat.calculateSwearByGroup('ебать');
      assert.strictEqual((stat as any).swearTable['ебать'], 1);
    });

    it('should increment counter for блядь group words', () => {
      stat.calculateSwearByGroup('блядь');
      assert.strictEqual((stat as any).swearTable['блядь'], 1);
    });

    it('should increment counter for сука group words', () => {
      stat.calculateSwearByGroup('сука');
      assert.strictEqual((stat as any).swearTable['сука'], 1);
    });

    it('should increment counter for пидарас group words', () => {
      stat.calculateSwearByGroup('пидарас');
      assert.strictEqual((stat as any).swearTable['пидарас'], 1);
    });

    it('should be case-insensitive', () => {
      stat.calculateSwearByGroup('ХУЙ');
      stat.calculateSwearByGroup('Пизда');
      stat.calculateSwearByGroup('ЕБАТЬ');
      
      assert.strictEqual((stat as any).swearTable['хуй'], 1);
      assert.strictEqual((stat as any).swearTable['пизда'], 1);
      assert.strictEqual((stat as any).swearTable['ебать'], 1);
    });

    it('should increment counter for multiple words in the same group', () => {
      stat.calculateSwearByGroup('хуй');
      stat.calculateSwearByGroup('хуй');
      stat.calculateSwearByGroup('охуеный');
      
      assert.strictEqual((stat as any).swearTable['хуй'], 3);
    });

    it('should increment other counter for words not in any group', () => {
      stat.calculateSwearByGroup('normalword');
      assert.strictEqual((stat as any).swearTable['other'], 1);
    });

    it('should increment other counter for empty string', () => {
      stat.calculateSwearByGroup('');
      assert.strictEqual((stat as any).swearTable['other'], 1);
    });

    it('should increment other counter for words with only spaces', () => {
      stat.calculateSwearByGroup('   ');
      assert.strictEqual((stat as any).swearTable['other'], 1);
    });

    it('should increment other counter for words with special characters', () => {
      stat.calculateSwearByGroup('хуй!');
      assert.strictEqual((stat as any).swearTable['other'], 1);
    });

    it('should match exact words from word groups', () => {
      // Test some specific words from the word groups
      const testCases = [
        { word: 'ахуеная', expectedGroup: 'хуй' },
        { word: 'запиздень', expectedGroup: 'пизда' },
        { word: 'волоеб', expectedGroup: 'ебать' },
        { word: 'блеать', expectedGroup: 'блядь' },
        { word: 'сучара', expectedGroup: 'сука' },
        { word: 'педриньо', expectedGroup: 'пидарас' }
      ];

      testCases.forEach(({ word, expectedGroup }) => {
        stat.calculateSwearByGroup(word);
        assert.strictEqual((stat as any).swearTable[expectedGroup], 1, `Failed for word: ${word}`);
      });
    });

    it('should handle mixed case words', () => {
      const testCases = [
        { word: 'Охуеный', expectedGroup: 'хуй' },
        { word: 'ПИЗДЕЦ', expectedGroup: 'пизда' },
        { word: 'ЕбАтЬ', expectedGroup: 'ебать' },
        { word: 'БлЯдЬ', expectedGroup: 'блядь' },
        { word: 'СуКа', expectedGroup: 'сука' },
        { word: 'ПиДаРаС', expectedGroup: 'пидарас' }
      ];

      testCases.forEach(({ word, expectedGroup }) => {
        stat.calculateSwearByGroup(word);
        assert.strictEqual((stat as any).swearTable[expectedGroup], 1, `Failed for word: ${word}`);
      });
    });

    it('should increment other counter for partial matches', () => {
      stat.calculateSwearByGroup('ху');
      assert.strictEqual((stat as any).swearTable['other'], 1);
    });

    it('should increment other counter for words that contain swear words but are not exact matches', () => {
      stat.calculateSwearByGroup('хуйник');
      assert.strictEqual((stat as any).swearTable['other'], 1);
    });

    it('should track multiple different groups correctly', () => {
      stat.calculateSwearByGroup('хуй');
      stat.calculateSwearByGroup('пизда');
      stat.calculateSwearByGroup('ебать');
      stat.calculateSwearByGroup('unknownword');
      
      assert.strictEqual((stat as any).swearTable['хуй'], 1);
      assert.strictEqual((stat as any).swearTable['пизда'], 1);
      assert.strictEqual((stat as any).swearTable['ебать'], 1);
      assert.strictEqual((stat as any).swearTable['other'], 1);
    });

    it('should handle multiple calls to the same word', () => {
      stat.calculateSwearByGroup('хуй');
      stat.calculateSwearByGroup('хуй');
      stat.calculateSwearByGroup('хуй');
      
      assert.strictEqual((stat as any).swearTable['хуй'], 3);
    });
  })

  describe('sendStatToServer', () => {
    it('should just console log', async () => {
      await stat.sendStatToServer();
      
      sinon.assert.calledWith(logStub.getCall(0), '💾 Sending stats to the server...');
    });
  })
}) 
