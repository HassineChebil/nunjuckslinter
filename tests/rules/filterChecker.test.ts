import { describe, it, expect, beforeEach, vitest } from 'vitest'
import { FilterChecker } from '../../src/rules/filterChecker'
import { LinterInterface } from '../../src/interfaces'

describe('FilterChecker', () => {
  let mockLinter: LinterInterface
  let filterChecker: FilterChecker

  beforeEach(() => {
    mockLinter = {
      options: {
        defaultFilters: ['upper', 'lower'],
        customFilters: ['custom'],
      },
      addError: vitest.fn(),
    } as unknown as LinterInterface

    filterChecker = new FilterChecker('test.njk', mockLinter)
  })

  it('should detect unknown filters', () => {
    filterChecker.processContent('{{ value | unknown }}')
    
    expect(mockLinter.addError).toHaveBeenCalledWith(
      'test.njk',
      1,
      expect.stringContaining('Unknown filter "unknown"')
    )
  })

  it('should allow known default filters', () => {
    filterChecker.processContent('{{ value | upper }}')
    expect(mockLinter.addError).not.toHaveBeenCalled()
  })

  it('should allow custom filters', () => {
    filterChecker.processContent('{{ value | custom }}')
    expect(mockLinter.addError).not.toHaveBeenCalled()
  })
})