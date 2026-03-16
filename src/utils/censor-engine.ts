/** 
 * CensorEngine is a class that implements a censor engine.
 * It uses the Aho-Corasick algorithm to search for words in a text.
 * It is used to censor words in a text.
 * 
 * It is a singleton class.
 * 
 * Unit tests are in test/utils/censor-engine.spec.ts
 */
import AhoCorasick from 'modern-ahocorasick'
import { NAME_LIST } from '../lists/name-list'
import { BLACK_LIST } from '../lists/black-list'
import { WHITE_LIST } from '../lists/white-list'
import Stat from './stat'


class CensorEngine {
  private acBlackList: AhoCorasick
  private acWhiteList: AhoCorasick
  private acNameList: AhoCorasick
  private static instance: CensorEngine | null = null

  private constructor() {
    this.acBlackList = new AhoCorasick(BLACK_LIST.map(word => word.toLowerCase().replace(/ё/g, 'е').replace(/й/g, 'и')))
    this.acWhiteList = new AhoCorasick(WHITE_LIST)
    this.acNameList = new AhoCorasick(NAME_LIST)
  }

  public static getInstance(): CensorEngine {
    if (CensorEngine.instance === null) {
      CensorEngine.instance = new CensorEngine()
    }
    return CensorEngine.instance
  }

  public censorText(text: string): string {
    let censoredText: string = ''
    let firstLetterPos: number = -1
    let lastLetterPos: number = -1
    let currentWord: string = ''

    // Iterate through text and process every character
    for (let pos = 0; pos < text.length; pos++) {
      const char = text[pos];

      if (/[a-zA-Zа-яА-ЯёЁїЇєЄіІ]/.test(char)) {
        // Save first letter position and last letter position
        if (firstLetterPos === -1) {
          firstLetterPos = pos
        }
        lastLetterPos = pos
        currentWord += char
      } else {
        // If we have a word, need to process it
        if (firstLetterPos !== -1) {
          // Get word from the text
          const word = text.slice(firstLetterPos, lastLetterPos + 1)
          censoredText += this.censorWord(word)
          
          // Reset positions and current word
          firstLetterPos = -1
          lastLetterPos = -1
          currentWord = ''
        }

        // Add non-letter character to censored text
        censoredText += char
      }
    }

    // If we have a word at the end of text, need to process it
    if (firstLetterPos !== -1) {
      const word = text.slice(firstLetterPos, lastLetterPos + 1)
      censoredText += this.censorWord(word)
    }

    return censoredText
  }

  private censorWord(word: string): string {
    // Check if word is in name list
    const nameMatches = this.acNameList.search(word);
    if (nameMatches.length > 0 && nameMatches.some(([_, matches]) => matches.includes(word))) {
      return word;
    }

    // Normalize word
    const normalizedWord = word.toLowerCase().replace(/ё/g, 'е').replace(/й/g, 'и')
    
    // Find matches in black list
    const blackListMatches = this.acBlackList.search(normalizedWord);
    if (blackListMatches.length === 0) {
      return word;
    }

    // Find longest black listed word
    const longestBlackListedMatch = blackListMatches
      .map(([_, matches]) => matches[0])
      .sort((a, b) => b.length - a.length)[0];

    // Find matches in white list
    const whiteListMatches = this.acWhiteList.search(normalizedWord);
    
    // Find longest white listed word
    let longestWhiteListedMatch = null;
    if (whiteListMatches.length > 0) {
      longestWhiteListedMatch = whiteListMatches
        .map(([_, matches]) => matches[0])
        .sort((a, b) => b.length - a.length)[0];
    }

    // Check if should censor
    let shouldCensor = false;
    if (!longestWhiteListedMatch) {
      shouldCensor = true;
    } else if (longestBlackListedMatch.includes(longestWhiteListedMatch)) {
      shouldCensor = true;
    }

    // Calculate some statistics. 
    if (shouldCensor) {
      Stat.getInstance().calculateSwearByGroup(longestBlackListedMatch);
    }
    
    // Censor if needed
    if (shouldCensor) {
      // Create a censored version by replacing the middle part of the word with dots
      // Find the position of the blacklisted word in the original word
      // (after normalizing 'ё' to 'е', 'й' to 'и')
      const matchIndex = normalizedWord.indexOf(longestBlackListedMatch);

      // If the blacklisted word is at the beginning, prefix is empty
      // Otherwise, keep the characters before the blacklisted word
      const prefix = matchIndex > 0 ? word.substring(0, matchIndex) : '';
      
      // If the blacklisted word is at the end, suffix is empty
      // Otherwise, keep the characters after the blacklisted word
      const suffix = matchIndex + longestBlackListedMatch.length < word.length ? 
        word.substring(matchIndex + longestBlackListedMatch.length) : '';
      
      // Return the censored word: prefix + "..." + suffix
      // This preserves parts of the word that aren't offensive
      return prefix + '...' + suffix;
    } else {

      return word;
    }
  }
}

export default CensorEngine
