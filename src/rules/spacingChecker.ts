import { LinterInterface } from "../interfaces";

export class SpacingChecker {
  private readonly expressionBlockPattern = /\{\{([^}]+)\}\}/g;
  private readonly statementBlockPattern = /\{%(-)?([^}]+?)(-)?%\}/g;

  constructor(private filename: string, private linter: LinterInterface) {}

  private checkFilterSpacing(content: string, index: number): void {
    const parts = content.trim().split("|");

    // Check variable part (first part)
    if (!parts[0].endsWith(" ")) {
      this.linter.addError(
        this.filename,
        index + 1,
        `Missing space before filter chain: "${parts[0]}|"`
      );
    }

    // Check filters (remaining parts)
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const isLastFilter = i === parts.length - 1;

      if (!part.startsWith(" ")) {
        this.linter.addError(
          this.filename,
          index + 1,
          `Missing space after '|': "|${part}"`
        );
      }

      if (!isLastFilter && !part.endsWith(" ")) {
        this.linter.addError(
          this.filename,
          index + 1,
          `Missing space before '|': "${part}|"`
        );
      }
    }
  }

  private checkExpressionBlock(line: string, index: number): void {
    let match;
    while ((match = this.expressionBlockPattern.exec(line)) !== null) {
      const [fullMatch, content] = match;
      if (!content.startsWith(" ") || !content.endsWith(" ")) {
        this.linter.addError(
          this.filename,
          index + 1,
          `Expression block should have spaces after '{{' and before '}}': "${fullMatch}"`
        );
      }

      if (content.includes("|")) {
        this.checkFilterSpacing(content, index);
      }
    }
  }

  private checkStatementBlock(line: string, index: number): void {
    let match;
    while ((match = this.statementBlockPattern.exec(line)) !== null) {
      const [fullMatch, startDash, content, endDash] = match;
      const hasStartDash = !!startDash;
      const hasEndDash = !!endDash;

      this.checkStatementSpacing(
        fullMatch,
        content,
        hasStartDash,
        hasEndDash,
        index
      );

      if (content.includes("|")) {
        this.checkFilterSpacing(content, index);
      }
    }
  }

  private checkStatementSpacing(
    fullMatch: string,
    content: string,
    hasStartDash: boolean,
    hasEndDash: boolean,
    index: number
  ): void {
    if (hasStartDash) {
      if (!content.startsWith(" ")) {
        this.linter.addError(
          this.filename,
          index + 1,
          `Statement block should have a space after '{%-': "${fullMatch}"`
        );
      }
    } else if (!content.startsWith(" ")) {
      this.linter.addError(
        this.filename,
        index + 1,
        `Statement block should have a space after '{%': "${fullMatch}"`
      );
    }

    if (hasEndDash) {
      if (!content.endsWith(" ")) {
        this.linter.addError(
          this.filename,
          index + 1,
          `Statement block should have a space before '-%}': "${fullMatch}"`
        );
      }
    } else if (!content.endsWith(" ")) {
      this.linter.addError(
        this.filename,
        index + 1,
        `Statement block should have a space before '%}': "${fullMatch}"`
      );
    }
  }

  public processContent(content: string): void {
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      if (line.includes("{#")) return;

      this.checkExpressionBlock(line, index);
      this.checkStatementBlock(line, index);
    });
  }
}
