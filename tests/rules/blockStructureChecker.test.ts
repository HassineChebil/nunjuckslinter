import { describe, it, expect, beforeEach, vitest } from 'vitest'
import { BlockStructureChecker } from '../../src/rules/blockStructureChecker'
import { LinterInterface } from '../../src/interfaces'

describe('BlockStructureChecker', () => {
  let mockLinter: LinterInterface
  let blockChecker: BlockStructureChecker

  beforeEach(() => {
    mockLinter = {
      addError: vitest.fn(),
    } as unknown as LinterInterface

    blockChecker = new BlockStructureChecker('test.njk', mockLinter)
  })

  it('should detect unclosed blocks', () => {
    blockChecker.processContent(`{% block content %}
      <h1>Title</h1>`)
    
    expect(mockLinter.addError).toHaveBeenCalledWith(
      'test.njk',
      1,
      expect.stringContaining('Unclosed block')
    )
  })

  it('should accept properly closed blocks', () => {
    blockChecker.processContent(`{% block content %}
      <h1>Title</h1>
    {% endblock content %}`)
    
    expect(mockLinter.addError).not.toHaveBeenCalled()
  })

  it('should detect block name mismatch', () => {
    blockChecker.processContent(`{% block content %}
      <h1>Title</h1>
    {% endblock wrong %}`)
    
    expect(mockLinter.addError).toHaveBeenCalledWith(
      'test.njk',
      3,
      expect.stringContaining('Block name mismatch')
    )
  })

  it('should detect unclosed set blocks', () => {
    blockChecker.processContent(`{% set something -%}
      {{ I put something here }}`)
    
    expect(mockLinter.addError).toHaveBeenCalledWith(
      'test.njk',
      1,
      expect.stringContaining('Unclosed set')
    )
  })
})