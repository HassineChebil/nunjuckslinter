import { describe, it, expect, beforeEach, vitest } from "vitest";
import { SyntaxBalanceChecker } from "../../src/rules/syntaxBalanceChecker";
import { LinterInterface } from "../../src/interfaces";

describe("SyntaxBalanceChecker", () => {
  let mockLinter: LinterInterface;
  let syntaxChecker: SyntaxBalanceChecker;

  beforeEach(() => {
    mockLinter = {
      addError: vitest.fn(),
    } as unknown as LinterInterface;

    syntaxChecker = new SyntaxBalanceChecker("test.njk", mockLinter);
  });

  it("should detect unbalanced expression delimiters", () => {
    syntaxChecker.processContent("{{ value }");

    expect(mockLinter.addError).toHaveBeenCalledWith(
      "test.njk",
      1,
      expect.stringContaining(
        "Unclosed braces '{{': missing 1 closing braces(s)"
      )
    );
  });

  it("should detect unbalanced statement delimiters", () => {
    syntaxChecker.processContent("{% if condition");

    expect(mockLinter.addError).toHaveBeenCalledWith(
      "test.njk",
      1,
      expect.stringContaining("Unclosed tag '{%': missing 1 closing tag(s)")
    );
  });

  it("should detect unbalanced comment delimiters", () => {
    syntaxChecker.processContent("{# comment");

    expect(mockLinter.addError).toHaveBeenCalledWith(
      "test.njk",
      1,
      expect.stringContaining(
        "Unclosed comment '{#': missing 1 closing comment(s)"
      )
    );
  });

  it("should accept properly balanced delimiters", () => {
    syntaxChecker.processContent(`
      {{ value }}
      {% if condition %}{% endif %}
      {# comment #}
    `);

    expect(mockLinter.addError).not.toHaveBeenCalled();
  });

  it("should handle multiple unbalanced delimiters", () => {
    syntaxChecker.processContent(`
      {{ value
      {% if condition
    `);

    expect(mockLinter.addError).toHaveBeenCalledTimes(2);
  });

  it("should handle nested delimiters", () => {
    syntaxChecker.processContent(`
      {% if condition %}
        {{ value }}
        {# comment #}
      {% endif %}
    `);

    expect(mockLinter.addError).not.toHaveBeenCalled();
  });

  it("should detect unexpected closing delimiters", () => {
    syntaxChecker.processContent("value }}");

    expect(mockLinter.addError).toHaveBeenCalledWith(
      "test.njk",
      1,
      expect.stringContaining(
        "Unexpected closing braces '}}' without matching opening braces"
      )
    );
  });

  it("should detect unbalanced multiline set", () => {
    syntaxChecker.processContent(`{% set 
      x = "value"
    `);

    expect(mockLinter.addError).toHaveBeenCalledWith(
      "test.njk",
      1,
      expect.stringContaining(
        "Unclosed tag '{%': missing 1 closing tag(s)"
      )
    );
  });

  it("should detect unclosed multiline comment", () => {
    syntaxChecker.processContent(`{#  
      x = "value"
    `);

    expect(mockLinter.addError).toHaveBeenCalledWith(
      "test.njk",
      1,
      expect.stringContaining(
        "Unclosed comment '{#': missing 1 closing comment(s)"
      )
    );
  });

  it("should detect unbalanced multiline comment", () => {
    syntaxChecker.processContent(` 
      x = "value"
      some other comments put in here
      #}
    `);

    expect(mockLinter.addError).toHaveBeenCalledWith(
      "test.njk",
      4,
      expect.stringContaining(
        "Unexpected closing comments '#}' without matching opening comments"
      )
    );
  });

  it("should detect unbalanced multiline comment", () => {
    syntaxChecker.processContent(`{% set
      x = "value"
    }      
    `);

    expect(mockLinter.addError).toHaveBeenCalledWith(
      "test.njk",
      1,
      expect.stringContaining(
        "Unclosed tag '{%': missing 1 closing tag(s)"
      )
    );
  });
  
  describe.skip("edge cases", () => {
    it("should handle empty content", () => {
      const result = syntaxChecker.processContent("");
      expect(result).toBe("");
    });

    it("should handle whitespace only content", () => {
      const result = syntaxChecker.processContent("   \n   \t   ");
      expect(result).toBe("   \n   \t   ");
    });

    it("should handle multiple empty lines", () => {
      const result = syntaxChecker.processContent("\n\n\n");
      expect(result).toBe("\n\n\n");
    });
  });
});
