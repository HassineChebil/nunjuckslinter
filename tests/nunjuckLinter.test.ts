import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NunjucksLinter } from '../src/nunjuckLinter'
import { readFileSync, writeFileSync } from 'node:fs'

vi.mock('node:fs')

describe('NunjucksLinter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('with fix mode', () => {
    it('should fix and save file when shouldFix is true', () => {
      const linter = new NunjucksLinter(true )
      const mockContent = '{{value}}'
      const expectedFixed = '{{ value }}'
      
      vi.mocked(readFileSync).mockReturnValue(mockContent)
      
      linter.lintFile('test.njk')
      
      expect(writeFileSync).toHaveBeenCalledWith(
        'test.njk',
        expectedFixed,
        'utf8'
      )
    })

    it('should not save file when no fixes needed', () => {
      const linter = new NunjucksLinter(true )
      const mockContent = '{{ value }}'
      
      vi.mocked(readFileSync).mockReturnValue(mockContent)
      
      linter.lintFile('test.njk')
      
      expect(writeFileSync).not.toHaveBeenCalled()
    })
  })
})