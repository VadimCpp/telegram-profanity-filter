import assert from "assert"
import sinon from "sinon"

import CensorEngine from '../../src/utils/censor-engine'

describe('CensorEngine', () => {
  let censorEngine: CensorEngine
  let statStub: sinon.SinonStub
  let statMock: any

  before(() => {
    // Get the Stat singleton instance and stub its calculateSwearByGroup method
    const StatModule = require('../../src/utils/stat')
    const statInstance = StatModule.default.getInstance()
    statMock = sinon.stub(statInstance, 'calculateSwearByGroup')
    
    // Get CensorEngine instance
    censorEngine = CensorEngine.getInstance()
  })

  afterEach(() => {
    // Reset history but don't restore the stub itself
    if (statMock && statMock.resetHistory) {
      statMock.resetHistory()
    }
  })

  after(() => {
    // Restore all stubs after all tests are done
    sinon.restore()
  })

  describe('censorText, simple tests', () => {
    it('only dots', () => {
      const result = censorEngine.censorText('...')
      assert.equal(result, '...')      
    })

    it('only digits', () => {
      const result = censorEngine.censorText('1234567890')
      assert.equal(result, '1234567890')      
    })

    it('special characters', () => {
      const result = censorEngine.censorText('.?$%^&*()_+-=[]{}|;:,.<>?/')
      assert.equal(result, '.?$%^&*()_+-=[]{}|;:,.<>?/')      
    })

    it('short russian word', () => {
      const result = censorEngine.censorText('дуб')
      assert.equal(result, 'дуб')
    })

    it('short russian word with pre underscore', () => {
      const result = censorEngine.censorText('_дуб')
      assert.equal(result, '_дуб')
    })

    it('short russian word with post underscore', () => {
      const result = censorEngine.censorText('дуб_')
      assert.equal(result, 'дуб_')
    })

    it('short russian word with pre and post underscore', () => {
      const result = censorEngine.censorText('_дуб_')
      assert.equal(result, '_дуб_')
    })

    it('swear word', () => {
      const result = censorEngine.censorText('хуй')
      assert.equal(result, '...')
    })

    it('swear word with a word', () => {
      const result = censorEngine.censorText('мнепохуй')
      assert.equal(result, 'мне...')
    })
  })


  describe('censorText, name list', () => {
    it('Should not censor "Хохлов"', () => {
      const result = censorEngine.censorText('Андрей Хохлов')
      assert.equal(result, 'Андрей Хохлов')
    })

    it('Should censor "не люблю хохлов"', () => {
      const result = censorEngine.censorText('не люблю хохлов')
      assert.equal(result, 'не люблю ...')
    })

    it('Should not censor "Гренобля"', () => {
      const result = censorEngine.censorText('В предгорьях Гренобля')
      assert.equal(result, 'В предгорьях Гренобля')
    })

    it('Should censor "гренобля"', () => {
      const result = censorEngine.censorText('гренобля')
      assert.equal(result, 'грено...')
    })

    it('Should not censor "Еббінгауз"', () => {
      const result = censorEngine.censorText('Герман Еббінгауз был известным психологом')
      assert.equal(result, 'Герман Еббінгауз был известным психологом')
    })

    it('Should censor "еббінгауз" in lowercase (partial censor due to "еб" pattern)', () => {
      const result = censorEngine.censorText('ебашились еббінгауз')
      assert.equal(result, '...сь ...бінгауз')
    })

    it('Should not censor "Бебрис"', () => {
      const result = censorEngine.censorText('Александр Бебрис')
      assert.equal(result, 'Александр Бебрис')
    })

    it('Should censor "бебрис" in lowercase (partial censor due to "еб" pattern)', () => {
      const result = censorEngine.censorText('бебрис')
      assert.equal(result, 'б...рис')
    })

    it('Should not censor "Беблинген"', () => {
      const result = censorEngine.censorText('Город Беблинген в Германии')
      assert.equal(result, 'Город Беблинген в Германии')
    })

    it('Should censor "беблинген" in lowercase (partial censor due to "еб" pattern)', () => {
      const result = censorEngine.censorText('беблинген')
      assert.equal(result, 'б...линген')
    })

    it('Should not censor "Бебра"', () => {
      const result = censorEngine.censorText('Город Бебра в Германии')
      assert.equal(result, 'Город Бебра в Германии')
    })

    it('Should censor "бебра" in lowercase (partial censor due to "еб" pattern)', () => {
      const result = censorEngine.censorText('бебра')
      assert.equal(result, 'б...ра')
    })

    it('Should not censor "Самандар"', () => {
      const result = censorEngine.censorText('Самандар - афганское имя')
      assert.equal(result, 'Самандар - афганское имя')
    })

    it('Should censor "самандар" in lowercase (partial censor due to "еб" pattern)', () => {
      const result = censorEngine.censorText('самандар')
      assert.equal(result, 'са...р')
    })

    it('Should censor "бебрис" when not used as proper name (partial censor)', () => {
      const result = censorEngine.censorText('бебрис')
      assert.equal(result, 'б...рис')
    })

    it('Should censor "беблинген" when not used as proper name (partial censor)', () => {
      const result = censorEngine.censorText('беблинген')
      assert.equal(result, 'б...линген')
    })

    it('Should censor "бебра" when not used as proper name (partial censor)', () => {
      const result = censorEngine.censorText('бебра')
      assert.equal(result, 'б...ра')
    })

    it('Should censor "самандар" when not used as proper name (partial censor)', () => {
      const result = censorEngine.censorText('самандар')
      assert.equal(result, 'са...р')
    })

    it('Should censor "еббінгауз" when not used as proper name (partial censor)', () => {
      const result = censorEngine.censorText('еббінгауз')
      assert.equal(result, '...бінгауз')
    })
  })


  describe('censorText, white list', () => {
    it('Should censor "бебр" (no longer in white list, partial censor due to "еб" pattern)', () => {
      const result = censorEngine.censorText('бебр')
      assert.equal(result, 'б...р')
    })

    it('Should not censor "бебут" (still in white list)', () => {
      const result = censorEngine.censorText('бебут')
      assert.equal(result, 'бебут')
    })

    it('Should not censor "бебрик" (still in white list)', () => {
      const result = censorEngine.censorText('бебрик')
      assert.equal(result, 'бебрик')
    })

    it('Should not censor "бебко" (still in white list)', () => {
      const result = censorEngine.censorText('бебко')
      assert.equal(result, 'бебко')
    })

    it('Should not censor "беби" (still in white list)', () => {
      const result = censorEngine.censorText('беби')
      assert.equal(result, 'беби')
    })

    it('Should not censor "беби-бумер" (still in white list)', () => {
      const result = censorEngine.censorText('беби-бумер')
      assert.equal(result, 'беби-бумер')
    })
  })


  describe('censorText, complex swears', () => {
    it('Should censor "ебашились"', () => {
      const result = censorEngine.censorText('ебашились')
      assert.equal(result, '...сь')
    })

    it('Should censor "ебет"', () => {
      const result = censorEngine.censorText('ебет')
      assert.equal(result, '...')
    })

    it('Should censor "сам ебет"', () => {
      const result = censorEngine.censorText('сам ебет')
      assert.equal(result, 'сам ...')
    })

    it('Should censor "не ебля"', () => {
      const result = censorEngine.censorText('Гребля - не ебля')
      assert.equal(result, 'Гребля - не ...')
    })

    it('Should censor "переблядок"', () => {
      const result = censorEngine.censorText('переблядок')
      assert.equal(result, '...')
    })

    it('Should not censor "психомандат"', () => {
      const result = censorEngine.censorText('психомандат')
      assert.equal(result, 'психомандат')
    })

    it('Should censor "серьЁзныйхуй"', () => {
      const result = censorEngine.censorText('серьЁзныйхуй')
      assert.equal(result, 'серьЁзный...')
    })

    it('Should censor "ёжикоёб"', () => {
      const result = censorEngine.censorText('ёжикоёб')
      assert.equal(result, 'ёжико...')
    })

    it('Should censor "долбоёб"', () => {
      const result = censorEngine.censorText('долбоёб')
      assert.equal(result, '...')
    })

    it('Should censor "расЄі"', () => {
      const result = censorEngine.censorText('расЄі')
      assert.equal(result, '...')
    })

    it('Should censor "расєї"', () => {
      const result = censorEngine.censorText('расєї')
      assert.equal(result, '...')
    })

    it('Should censor "пйзда', () => {
      const result = censorEngine.censorText('пйзда')
      assert.equal(result, '...')
    })

    it('Should censor "пЙздецовый', () => {
      const result = censorEngine.censorText('пЙздецовый')
      assert.equal(result, '...овый')
    })

    it('Should censor "залупоглазый', () => {
      const result = censorEngine.censorText('залупоглазый')
      assert.equal(result, '...ый')
    })
  })


  describe('censorText, long texts', () => {
    it('Text with "долбоеб"', () => {
      const originalText = 'долбоеб останется долбоебом независимо от того, что он смотрит'
      const expectedText = '... останется ...ом независимо от того, что он смотрит'
      const result = censorEngine.censorText(originalText)
      assert.equal(result, expectedText)
    })

    it('Text with "ебет"', () => {
      const originalText = 'Ну, типо, вон, смотрите, большой, толстый, сам ебет, ей хорошо, аж визжит.'
      const expectedText = 'Ну, типо, вон, смотрите, большой, толстый, сам ..., ей хорошо, аж визжит.'
      const result = censorEngine.censorText(originalText)
      assert.equal(result, expectedText)
    })

    it('Text with "нахуй"', () => {
      const originalText = 'Потому что - пошли нахуй, обезьяны!!!'
      const expectedText = 'Потому что - пошли ..., обезьяны!!!'
      const result = censorEngine.censorText(originalText)
      assert.equal(result, expectedText)
    })

    it('Text with "доебётся"', () => {
      const originalText = 'Думаю что если какая бородатая рожа доебётся летом до меня по поводу шорт то окажется в лучшем случае в реанимации.'
      const expectedText = 'Думаю что если какая бородатая рожа до...ся летом до меня по поводу шорт то окажется в лучшем случае в реанимации.'
      const result = censorEngine.censorText(originalText)
      assert.equal(result, expectedText)
    })
    
    it('Text with "хуятьями"', () => {
      const originalText = 'У них чуть что так сразу брат, сват, хуят, сосед со своими братьями хуятьями и всем кланом в любую движуху за своего впрягается.'
      const expectedText = 'У них чуть что так сразу брат, сват, ...т, сосед со своими братьями ...тьями и всем кланом в любую движуху за своего впрягается.'
      const result = censorEngine.censorText(originalText)
      assert.equal(result, expectedText)
    })

    it('Text with "овцеёбам" and "ебало"', () => {
      const originalText = 'Потому что это их страна уже. А мы так, ебало завалить, работать и не отсвечивать. Не мешать уважаемым овцеёбам кайфовать жыесть'
      const expectedText = 'Потому что это их страна уже. А мы так, ... завалить, работать и не отсвечивать. Не мешать уважаемым ...м кайфовать жыесть'
      const result = censorEngine.censorText(originalText)
      assert.equal(result, expectedText)
    })

    it('Should censor hate speech words', () => {
      const originalText = 'Никаких москалей и бандеровцев, рашистов и рагулей, кацапов и хохлов, расеи и т.п.'
      const expectedText = 'Никаких ...ей и ...вцев, ...ов и ...й, ...ов и ..., ... и т.п.'
      const result = censorEngine.censorText(originalText)
      assert.equal(result, expectedText)
    })

    it('Should recognize name "Бандера" in proper context', () => {
      const originalText = 'Степан Бандера был историческим деятелем.'
      const expectedText = 'Степан Бандера был историческим деятелем.'
      const result = censorEngine.censorText(originalText)
      assert.equal(result, expectedText)
    })

    it('Should recognize name "Хохлов" in proper context', () => {
      const originalText = 'Александр Хохлов выступил с докладом.'
      const expectedText = 'Александр Хохлов выступил с докладом.'
      const result = censorEngine.censorText(originalText)
      assert.equal(result, expectedText)
    })

    it('Should censor "ебанутые"', () => {
      const originalText = 'ТС, ебанутые они и есть ебанутые не переживайте вы все сделали правильно, о таких надо сообщать, а бабок при их убер-возмущение еще и пропиздить, ну или на куях прокатить, они этого заслуживают. вы молодец, добра вам.'
      const expectedText = 'ТС, ... они и есть ... не переживайте вы все сделали правильно, о таких надо сообщать, а бабок при их убер-возмущение еще и про..., ну или на куях прокатить, они этого заслуживают. вы молодец, добра вам.'
      const result = censorEngine.censorText(originalText)
      assert.equal(result, expectedText)
    })

    it('Should not censor "Москалик"', () => {
      const originalText = 'Злоумышленники припарковали машину с бомбой рядом с подъездом дома, в котором жил генерал-майор Ярослав Москалик и вели наружнее наблюдение. Когда генерал вышел из подъезда, они привели бомбу в действие с помощью дистанционного устройства.'
      const expectedText = 'Злоумышленники припарковали машину с бомбой рядом с подъездом дома, в котором жил генерал-майор Ярослав Москалик и вели наружнее наблюдение. Когда генерал вышел из подъезда, они привели бомбу в действие с помощью дистанционного устройства.'
      const result = censorEngine.censorText(originalText)
      assert.equal(result, expectedText)
    })
  })

  describe('Stat integration tests', () => {
    it('should call calculateSwearByGroup when censoring swear words', () => {
      const result = censorEngine.censorText('хуй')
      assert.equal(result, '...')
      assert(statMock.calledOnce)
      assert(statMock.calledWith('хуи')) // normalized form (й -> и)
    })

    it('should call calculateSwearByGroup when censoring partial swear words', () => {
      const result = censorEngine.censorText('мнепохуй')
      assert.equal(result, 'мне...')
      assert(statMock.calledOnce)
      assert(statMock.calledWith('похуи')) // normalized form (й -> и)
    })

    it('should not call calculateSwearByGroup when no censoring occurs', () => {
      const result = censorEngine.censorText('дуб')
      assert.equal(result, 'дуб')
      assert(statMock.notCalled)
    })

    it('should not call calculateSwearByGroup for white-listed words', () => {
      const result = censorEngine.censorText('бебут')
      assert.equal(result, 'бебут')
      assert(statMock.notCalled)
    })

    it('should not call calculateSwearByGroup for name-listed words', () => {
      const result = censorEngine.censorText('Андрей Хохлов')
      assert.equal(result, 'Андрей Хохлов')
      assert(statMock.notCalled)
    })

    it('should call calculateSwearByGroup for each censored word in a sentence', () => {
      const result = censorEngine.censorText('хуй и ебет')
      assert.equal(result, '... и ...')
      assert(statMock.calledTwice)
      assert(statMock.calledWith('хуи')) // normalized form (й -> и)
      assert(statMock.calledWith('ебет'))
    })
  })
})
