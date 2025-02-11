import { describe, it, expect, beforeEach, vi } from 'vitest'
import { argsChecker } from '../../src/utils/utils'

describe('argsChecker', () => {
  const originalArgv = process.argv
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
  const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    vi.clearAllMocks()
    process.argv = [...originalArgv]
  })

  it('should handle --fix flag', () => {
    process.argv = ['node', 'script.js', '--fix', 'file.njk']
    const result = argsChecker()
    expect(result.shouldFix).toBe(true)
    expect(result.paths).toEqual(['file.njk'])
  })

  it('should handle multiple paths with --fix flag', () => {
    process.argv = ['node', 'script.js', '--fix', 'file1.njk', 'file2.njk']
    const result = argsChecker()
    expect(result.shouldFix).toBe(true)
    expect(result.paths).toEqual(['file1.njk', 'file2.njk'])
  })
})