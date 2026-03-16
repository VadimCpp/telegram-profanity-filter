import { type Message } from 'node-telegram-bot-api'

/**
 * Get user name
 *
 * @param {Message} msg - Telegram message
 * @returns {string} User name
 * @private
 */
export const getName = (msg: Message): string => {
  /**
   * @type {string}
   */
  let result = 'Без имени 👤';

  if (!msg.from) {
    return result;
  }

  const fname = msg.from.first_name;
  const lname = msg.from.last_name;
  const uname = msg.from.username;

  if (uname) {
    result = `@${uname}`;
  } else if (fname) {
    result = fname + (lname ? ' ' + lname : '');
  }

  return result;
}

/**
 * Misc utils
 */
export default {
  getName
}
