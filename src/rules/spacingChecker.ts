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

  private fixFilterSpacing(content: string): string {
    const parts = content.trim().split("|");
    return parts
      .map((part, index) => {
        const trimmedPart = part.trim();
        return index === 0 ? trimmedPart : ` ${trimmedPart}`;
      })
      .join(" |");
  }

  private fixExpressionBlock(line: string): string {
    return line.replace(this.expressionBlockPattern, (match, content) => {
      const trimmedContent = content.trim();
      const fixedContent = trimmedContent.includes("|") 
        ? this.fixFilterSpacing(trimmedContent)
        : trimmedContent;
      return `{{ ${fixedContent} }}`;
    });
  }

  private fixStatementBlock(line: string): string {
    return line.replace(this.statementBlockPattern, (match, startDash, content, endDash) => {
      const trimmedContent = content.trim();
      const fixedContent = trimmedContent.includes("|")
        ? this.fixFilterSpacing(trimmedContent)
        : trimmedContent;
      const start = startDash ? '{%-' : '{%';
      const end = endDash ? '-%}' : '%}';
      return `${start} ${fixedContent} ${end}`;
    });
  }
  private fixContent(contentLines: string[]): string {
    const lines = contentLines;
    const fixedLines = lines.map((line, index) => {
      //if (line.includes("{#")) return line;
      let fixedLine = line;
      fixedLine = this.fixExpressionBlock(fixedLine);
      fixedLine = this.fixStatementBlock(fixedLine);
      return fixedLine;
    });
    return fixedLines.join("\n");
  }

  public processContent(content: string): string | void {
    const lines = content.split("\n");

    if(this.linter.shouldFix) {
     return this.fixContent(lines)
    }

    lines.forEach((line, index) => {
      if (line.includes("{#")) return;

      this.checkExpressionBlock(line, index);
      this.checkStatementBlock(line, index);
    });
  }
}
