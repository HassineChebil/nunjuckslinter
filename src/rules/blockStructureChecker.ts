import {
  BLOCK_PATTERNS,
  CONDITIONAL_PATTERNS,
  SYNTAX_PATTERNS,
} from "../constants";
import { BlockPattern, BlockStackItem, LinterInterface } from "../interfaces";
import { endBlockType } from "../utils";

export class BlockStructureChecker {
  private blockStack: BlockStackItem[] = [];
  private inMultilineComment = false;
  private commentDepth = 0;

  constructor(private filename: string, private linter: LinterInterface) {}

  private handleCommentState(line: string): boolean {
    const commentStarts = [...line.matchAll(SYNTAX_PATTERNS.comments.open)];
    const commentEnds = [...line.matchAll(SYNTAX_PATTERNS.comments.close)];
    const startCount = commentStarts.length;
    const endCount = commentEnds.length;

    if (startCount === endCount && startCount > 0) return true;

    if (!this.inMultilineComment && startCount > endCount) {
      this.inMultilineComment = true;
      this.commentDepth = startCount - endCount;
      return true;
    }

    if (this.inMultilineComment) {
      this.commentDepth += startCount - endCount;
      if (this.commentDepth <= 0) {
        this.inMultilineComment = false;
        this.commentDepth = 0;
      }
      return true;
    }

    return false;
  }

  private checkBlockStart(line: string, index: number): void {
    for (const [name, pattern] of Object.entries(BLOCK_PATTERNS)) {
      const match = line.match(pattern.pattern);
      if (!match) continue;

      if (
        pattern.hasEnd &&
        (!pattern.isMultiline || pattern.isMultiline(match))
      ) {
        this.blockStack.push({
          name: match[1] || name,
          type: pattern.type,
          line: index + 1,
          hasEndDash: !!match[2],
        });
      }

      this.validateBlockSyntax(pattern, match, index);
      break;
    }
  }

  private validateBlockSyntax(
    pattern: BlockPattern,
    match: RegExpMatchArray,
    index: number
  ): void {
    if (pattern.type === "macro" && match[2]) {
      const params = match[2]
        .split(",")
        .map((param) => {
          const match = param.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
          return match?.[1] ?? "";
        })
        .filter(Boolean);

      params.forEach((param) => {
        if (!param.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
          this.linter.addError(
            this.filename,
            index + 1,
            `Invalid macro parameter name: ${param}`
          );
        }
      });
    }
  }

  private checkConditionalBlock(line: string, index: number): void {
    const elifMatch = line.match(CONDITIONAL_PATTERNS.elif);
    const elseMatch = line.match(CONDITIONAL_PATTERNS.else);

    if (elifMatch || elseMatch) {
      const lastBlock: BlockStackItem =
        this.blockStack[this.blockStack.length - 1];
      if (lastBlock?.type !== "if") {
        this.linter.addError(
          this.filename,
          index + 1,
          `${elifMatch ? "elif" : "else"} without matching if`
        );
      }
    }
  }

  private checkBlockEnd(line: string, index: number): void {
    for (const [name, pattern] of Object.entries(BLOCK_PATTERNS)) {
      if (!pattern.hasEnd || !pattern.endPattern) continue;

      const match = line.match(pattern.endPattern);
      if (!match) continue;

      if (this.blockStack.length === 0) {
        this.linter.addError(
          this.filename,
          index + 1,
          `Unexpected ${endBlockType(
            pattern.type
          )} without matching opening tag`
        );
        return;
      }

      const lastBlock = this.blockStack[this.blockStack.length - 1];
      this.validateBlockEnd(pattern, match, lastBlock, index);

      if (lastBlock.type === pattern.type) {
        this.blockStack.pop();
      }
      break;
    }
  }

  private validateBlockEnd(
    pattern: BlockPattern,
    match: RegExpMatchArray,
    lastBlock: BlockStackItem,
    index: number
  ): void {
    if (lastBlock.type !== pattern.type && !pattern.allowNested) {
      this.linter.addError(
        this.filename,
        index + 1,
        `Mismatched block ending: found end${pattern.type}, expected end${lastBlock.type} (opened at line ${lastBlock.line})`
      );
      return;
    }

    if (pattern.type === "block") {
      this.validateBlockNameAndWhitespace(match, lastBlock, index);
    }
  }

  private validateBlockNameAndWhitespace(
    match: RegExpMatchArray,
    lastBlock: BlockStackItem,
    index: number
  ): void {
    const endName = match[2]?.trim();
    const hasStartDash = !!match[1];

    if (endName && endName !== lastBlock.name) {
      this.linter.addError(
        this.filename,
        index + 1,
        `Block name mismatch: ${endName} doesn't match ${lastBlock.name}`
      );
    }

    if (lastBlock.hasEndDash !== hasStartDash) {
      const message = lastBlock.hasEndDash
        ? "opening tag uses '-' but closing tag doesn't"
        : "closing tag uses '-' but opening tag doesn't";
      this.linter.addError(
        this.filename,
        index + 1,
        `Whitespace control mismatch: ${message}`
      );
    }
  }

  private checkUnclosedBlocks(): void {
    if (!this.inMultilineComment && this.blockStack.length > 0) {
      this.blockStack.forEach((block) => {
        this.linter.addError(
          this.filename,
          block.line,
          `Unclosed ${block.type}${
            block.type === "block" ? ` "${block.name}"` : ""
          } at line ${block.line}`
        );
      });
    }
  }

  public processContent(content: string): void {
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      if (this.handleCommentState(line)) return;

      const lineWithoutComments = line.replace(/{#.*?#}/g, "").trim();
      if (!lineWithoutComments) return;

      this.checkBlockStart(lineWithoutComments, index);
      this.checkConditionalBlock(lineWithoutComments, index);
      this.checkBlockEnd(lineWithoutComments, index);
    });

    this.checkUnclosedBlocks();
  }
}
