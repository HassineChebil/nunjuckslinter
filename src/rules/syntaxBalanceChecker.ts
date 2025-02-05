import { SYNTAX_PATTERNS } from "../constants";
import {
  DelimiterPosition,
  LinterInterface,
  SyntaxBalanceState,
} from "../interfaces";

export class SyntaxBalanceChecker {
  private state: SyntaxBalanceState = {
    openBraces: [],
    openTags: [],
    openComments: [],
    inMultilineComment: false,
    commentDepth: 0,
  };

  constructor(private filename: string, private linter: LinterInterface) {}

  private handleComments(line: string): boolean {
    const starts = [...line.matchAll(SYNTAX_PATTERNS.comments.open)];
    const ends = [...line.matchAll(SYNTAX_PATTERNS.comments.close)];
    const startCount = starts.length;
    const endCount = ends.length;

    if (startCount === endCount && startCount > 0) return true;

    if (!this.state.inMultilineComment && startCount > endCount) {
      this.state.inMultilineComment = true;
      this.state.commentDepth = startCount - endCount;
      return true;
    }

    if (this.state.inMultilineComment) {
      this.state.commentDepth += startCount - endCount;
      if (this.state.commentDepth <= 0) {
        this.state.inMultilineComment = false;
        this.state.commentDepth = 0;
      }
      return true;
    }

    return false;
  }

  private checkDelimiterBalance(
    line: string,
    index: number,
    type: "braces" | "tags" | "comments"
  ): void {
    const patterns = SYNTAX_PATTERNS[type];
    const openMatches = [...line.matchAll(patterns.open)].length;
    const closeMatches = [...line.matchAll(patterns.close)].length;
    const stateKey = `open${
      type.charAt(0).toUpperCase() + type.slice(1)
    }` as keyof SyntaxBalanceState;
    const delimiters = {
      braces: { open: "{{", close: "}}" },
      tags: { open: "{%", close: "%}" },
      comments: { open: "{#", close: "#}" },
    };

    if (openMatches > 0) {
      (this.state[stateKey] as DelimiterPosition[]).push({
        line: index + 1,
        count: openMatches,
      });
    }

    for (let i = 0; i < closeMatches; i++) {
      if ((this.state[stateKey] as DelimiterPosition[]).length === 0) {
        this.linter.addError(
          this.filename,
          index + 1,
          `Unexpected closing ${type} '${delimiters[type].close}' without matching opening ${type}`
        );
        return;
      }

      const lastOpen = (this.state[stateKey] as DelimiterPosition[])[
        (this.state[stateKey] as DelimiterPosition[]).length - 1
      ];
      lastOpen.count--;
      if (lastOpen.count === 0) {
        (this.state[stateKey] as []).pop();
      }
    }
  }

  private checkUnclosedDelimiters(): void {
    if (!this.state.inMultilineComment) {
      const delimiters = [
        { type: "braces", open: "{{", stack: this.state.openBraces },
        { type: "tag", open: "{%", stack: this.state.openTags },
        { type: "comment", open: "{#", stack: this.state.openComments },
      ];

      delimiters.forEach(({ type, open, stack }) => {
        if (stack.length > 0) {
          const totalUnclosed = stack.reduce((sum, pos) => sum + pos.count, 0);
          this.linter.addError(
            this.filename,
            stack[0].line,
            `Unclosed ${type} '${open}': missing ${totalUnclosed} closing ${type}(s)`
          );
        }
      });
    }
  }

  public processContent(content: string): void {
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      if (this.handleComments(line)) return;

      const lineWithoutComments = line.replace(/{#.*?#}/g, "");

      this.checkDelimiterBalance(lineWithoutComments, index, "braces");
      this.checkDelimiterBalance(lineWithoutComments, index, "tags");
      this.checkDelimiterBalance(lineWithoutComments, index, "comments");
    });

    this.checkUnclosedDelimiters();
  }
}
