import { describe, it, expect, beforeEach, vitest } from 'vitest'
import { SpacingChecker } from '../../src/rules/spacingChecker'
import { LinterInterface } from '../../src/interfaces'

describe('SpacingChecker', () => {
  let mockLinter: LinterInterface
  let spacingChecker: SpacingChecker

  beforeEach(() => {
    mockLinter = {
      addError: vitest.fn(),
      options: {
        shouldFix: false,
        defaultFilters: [],
        customFilters: []
      }
    } as unknown as LinterInterface

    spacingChecker = new SpacingChecker('test.njk', mockLinter)
  })

  describe('lint mode', () => {
    it('should detect missing spaces in expression blocks', () => {
      spacingChecker.processContent('{{value}}')
      expect(mockLinter.addError).toHaveBeenCalledWith(
        'test.njk',
        1,
        expect.stringContaining('should have spaces')
      )
    })

    it('should detect missing spaces in filter chains', () => {
      spacingChecker.processContent('{{ value|upper}}')
      expect(mockLinter.addError).toHaveBeenCalledWith(
        'test.njk',
        1,
        expect.stringContaining('Missing space before filter chain')
      )
    })

    it('should detect missing spaces in statement blocks', () => {
      spacingChecker.processContent('{%if condition%}')
      expect(mockLinter.addError).toHaveBeenCalledWith(
        'test.njk',
        1,
        expect.stringContaining('should have a space')
      )
    })
  })

  describe('fix mode', () => {
    beforeEach(() => {
      mockLinter.shouldFix = true
      spacingChecker = new SpacingChecker('test.njk', mockLinter)
    })

    it('should fix spaces in expression blocks', () => {
      const result = spacingChecker.processContent('{{value}}')
      expect(result).toBe('{{ value }}')
    })

    it('should fix spaces in filter chains', () => {
      const result = spacingChecker.processContent('{{value|upper|lower}}')
      expect(result).toBe('{{ value | upper | lower }}')
    })

    it('should fix spaces in statement blocks', () => {
      const result = spacingChecker.processContent('{%if condition%}')
      expect(result).toBe('{% if condition %}')
    })

    it('should fix spaces with whitespace control', () => {
      const result = spacingChecker.processContent('{%-if condition-%}')
      expect(result).toBe('{%- if condition -%}')
    })

    it('should fix multiple issues in one line', () => {
      const result = spacingChecker.processContent('{%if foo%}{{bar|upper}}{%endif%}')
      expect(result).toBe('{% if foo %}{{ bar | upper }}{% endif %}')
    })

    it('should preserve correct spacing', () => {
      const input = '{% if foo %}'
      const result = spacingChecker.processContent(input)
      expect(result).toBe(input)
    })

    it('should handle multiline content', () => {
      const input = '{%if foo%}\n{{bar|upper}}'
      const result = spacingChecker.processContent(input)
      expect(result).toBe('{% if foo %}\n{{ bar | upper }}')
    })

    it('should ignore comment blocks', () => {
      const input = '{# comment #}{{value}}'
      const result = spacingChecker.processContent(input)
      expect(result).toBe('{# comment #}{{ value }}')
    })
  })
})