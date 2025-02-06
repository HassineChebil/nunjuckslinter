import { describe, it, expect, beforeEach, vitest } from 'vitest'
import { SpacingChecker } from '../../src/rules/spacingChecker'
import { LinterInterface } from '../../src/interfaces'

describe('SpacingChecker', () => {
  let mockLinter: LinterInterface
  let spacingChecker: SpacingChecker

  beforeEach(() => {
    mockLinter = {
      addError: vitest.fn(),
    } as unknown as LinterInterface

    spacingChecker = new SpacingChecker('test.njk', mockLinter)
  })

  it('should detect missing spaces in expression blocks', () => {
    spacingChecker.processContent('{{value}}')
    
    expect(mockLinter.addError).toHaveBeenCalledWith(
      'test.njk',
      1,
      expect.stringContaining('should have spaces')
    )
  })

  it('should accept correct spacing in expression blocks', () => {
    spacingChecker.processContent('{{ value }}')
    expect(mockLinter.addError).not.toHaveBeenCalled()
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