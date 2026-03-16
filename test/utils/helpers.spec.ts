
import assert from "assert"
import { Message } from "node-telegram-bot-api"

import Helpers from '../../src/utils/helpers'

describe('Helpers', () => {
  describe('getName', () => {
    it('should return default name when from is undefined', () => {
      const msg = {} as Message
      assert.equal(Helpers.getName(msg), 'Без имени 👤')
    })

    it('should return username when available', () => {
      const msg = {
        from: {
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User'
        }
      } as Message
      assert.equal(Helpers.getName(msg), '@testuser')
    })

    it('should return first name and last name when username is not available', () => {
      const msg = {
        from: {
          first_name: 'Test',
          last_name: 'User'
        }
      } as Message
      assert.equal(Helpers.getName(msg), 'Test User')
    })
    
    it('should return first name and last name when username is not available', () => {
      const msg = {
        from: {
          first_name: 'Test',
        }
      } as Message
      assert.equal(Helpers.getName(msg), 'Test')
    })
  })
})
