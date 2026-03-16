/** 
 * Stat is a class that implements statistics functionality.
 * It is a singleton class.
 */
import TelegramBot, {
  type Message,
} from 'node-telegram-bot-api'
import { CENSOR_CHAT_ID } from '../messenger/telegram';
import { type StatRecord, type ChatRecord } from '../types';
import { WORD_GROUPS } from '../lists/word-groups';



class Stat {
  private static instance: Stat | null = null;
  private total: number = 0;
  private table: ChatRecord[] = [];
  private swearTable: Record<string, number> = {};
  private messageId: number | null = null;
  private messageText: string | null = null;
  private messageDate: string | null = null; // YYYY-MM-DD

  private constructor() {}


  /**
   * Get the instance of the Stat class.
   * @returns The instance of the Stat class.
   */
  public static getInstance(): Stat {
    if (Stat.instance === null) {
      Stat.instance = new Stat();
    }
    return Stat.instance;
  }


  /**
   * Calculate the statistics of the message.
   * @param msg - The message to calculate the statistics of.
   * @param bot - The bot to send the statistics to.
   */
  public async calculate(msg: Message, bot: TelegramBot): Promise<void> {
    if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
      return;
    }

    const idx = this.table.findIndex(r => r.id === msg.chat.id);
    if (idx >= 0) {
      this.table[idx].count += 1;
    } else {
      this.table.push({
        id: msg.chat.id,
        title: msg.chat.title || 'Не указано',
        username: msg.chat.username || 'Не указано',
        count: 1,
      });
    }
    this.total += 1;
    if (this.total > 0 && (this.total % 50) === 0) {
      await this.sendStat(bot);
      await this.sendStatToServer();
    }
  }


  /**
   * Calculate the statistics of the word by group.
   * @param word - The word to calculate the statistics of.
   * @returns The key of the first word group that contains the word, or null if not found.
   */
  public calculateSwearByGroup(word: string): void {
    // Normalize the word to lowercase for case-insensitive comparison
    const normalizedWord = word.toLowerCase();
    
    // Iterate through each word group
    for (const [groupKey, wordList] of Object.entries(WORD_GROUPS)) {
      // Check if the word exists in the current group's array
      if (wordList.includes(normalizedWord)) {
        this.swearTable[groupKey] = (this.swearTable[groupKey] || 0) + 1;
        return;
      }
    }
    
    // Return null if no match is found
    this.swearTable["other"] = (this.swearTable["other"] || 0) + 1;
  }


  /**
   * Normalize the title of the chat.
   * @param title - The title of the chat to normalize.
   * @returns The normalized title of the chat.
   */
  public normalize(title: string): string {
    const MAX_TITLE_LENGTH = 15;
    let result = title;

    // Truncate long titles to 15 characters and add ellipsis
    if (result.length > MAX_TITLE_LENGTH) {
      result = result.slice(0, MAX_TITLE_LENGTH);
      result += '...';
    }

    return result;
  }


  /**
   * Get the information of the statistics.
   * @returns The information of the statistics.
   */
  public getInfo(): string {
    const sorted = this.table.sort((a, b) => b.count - a.count);
    const top = sorted.length > 20 ? sorted.slice(0, 20) : sorted;
    let result = '';
    top.forEach((record, idx) => {
      result += `${idx + 1}. ${this.normalize(record.title)} (${record.count})`;
      if (idx < top.length - 1) result += '\n';
    });
    
    // Add swear table statistics
    const swearEntries = Object.entries(this.swearTable);
    const sortedSwearTable = swearEntries.sort((a, b) => b[1] - a[1]);
    let swearResult = '';
    sortedSwearTable.forEach(([group, count], idx) => {
      swearResult += `${idx + 1}. ${group} (${count})`;
      if (idx < sortedSwearTable.length - 1) swearResult += '\n';
    });
    
    // Include swear table section when there are swear entries or when total > 0
    const hasSwearEntries = swearEntries.length > 0;
    const hasTotal = this.total > 0;
    
    if (hasTotal) {
      result = `Всего сообщений/чатов: ${this.total}/${this.table.length}\n\nТоп 20\n${result}`;
      // Always include swear table section when there are messages, even if empty
      result += `\n\nТоп-мат:\n${swearResult}`;
    } else if (hasSwearEntries) {
      result = `Всего сообщений/чатов: 0/0\n\nТоп-мат:\n${swearResult}`;
    } else {
      result = 'Всего сообщений/чатов: 0/0';
    }
    
    return result;
  }


  /**
   * Send the statistics to the chat.
   * @param bot - The bot to send the statistics to.
   */
  public async sendStat(bot: TelegramBot): Promise<void> {
    try {
      // To keep stats for the current day
      // we need to reset the stats if the date is changed
      const now = new Date();
      const nowDate = now.toISOString().split('T')[0];
      if (this.messageDate !== nowDate) {
        this.messageDate = nowDate;
        this.messageId = null;
        this.messageText = null;
        this.table = [];
        this.total = 0;
      }

      const statText = this.getInfo();
      if (this.messageText !== statText) {
        this.messageText = statText;
        if (this.messageId) {
          await bot.editMessageText(statText, {
            chat_id: CENSOR_CHAT_ID.toString(),
            message_id: this.messageId,
          });
        } else {
          const newMsg = await bot.sendMessage(CENSOR_CHAT_ID.toString(), statText);
          this.messageId = newMsg.message_id;
          await bot.pinChatMessage(
            CENSOR_CHAT_ID.toString(),
            newMsg.message_id,
            { disable_notification: true },
          );
        }
      } else {
        console.log('Stat is not changed, skip.');
      }
    } catch (e) {
      this.messageId = null;
      this.messageText = null;
      this.messageDate = null;
    }
  }


  /**
   * Send the statistics to the server.
   */
  public async sendStatToServer(): Promise<void> {
    console.log('💾 Sending stats to the server...');

    // Ups! This piece of code is deleted forever.
  }
}

export default Stat;
