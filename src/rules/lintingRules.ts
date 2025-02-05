import {
  BlockPattern,
  BlockStackItem,
  LinterInterface,
  SyntaxBalanceState,
} from "../interfaces/types";
import {
  BLOCK_PATTERNS,
  CONDITIONAL_PATTERNS,
  SYNTAX_PATTERNS,
} from "../constants/patterns";

export const createLintingRules = (
  linter: LinterInterface
): Record<string, (content: string, filename: string) => void> => ({
  checkBlockStructure: (content: string, filename: string): void => {
    const lines = content.split("\n");
    const blockStack: BlockStackItem[] = [];
    let inMultilineComment = false;
    let commentDepth = 0;

    const processLine = (line: string, index: number): void => {
      // if (hasError) return;
      // Handle comments
      const commentStarts = [...line.matchAll(/{#/g)];
      const commentEnds = [...line.matchAll(/#}/g)];

      if (handleComments(commentStarts, commentEnds)) return;

      const lineWithoutComments = line.replace(/{#.*?#}/g, "").trim();
      if (!lineWithoutComments) return;

      // Check block starts
      for (const [name, pattern] of Object.entries(BLOCK_PATTERNS)) {
        const match = lineWithoutComments.match(pattern.pattern);
        if (!match) continue;

        if (pattern.hasEnd) {
          blockStack.push({
            name: match[1] || name,
            type: pattern.type,
            line: index + 1,
            hasEndDash: !!match[2],
          });
        }

        validateBlockSyntax(pattern, match, index);
        break;
      }

      // Check conditional blocks (elif/else)
      checkConditionalBlocks(lineWithoutComments, index);

      // Check block endings
      checkBlockEndings(lineWithoutComments, index);
    };

    const handleComments = (
      starts: Array<RegExpMatchArray>,
      ends: Array<RegExpMatchArray>
    ): boolean => {
      const startCount = [...starts].length;
      const endCount = [...ends].length;

      // Handle complete single-line comments
      if (startCount === endCount && startCount > 0) {
        return true;
      }

      if (!inMultilineComment && startCount > endCount) {
        inMultilineComment = true;
        commentDepth = startCount - endCount;
        return true;
      }

      if (inMultilineComment) {
        commentDepth += startCount - endCount;
        if (commentDepth <= 0) {
          inMultilineComment = false;
          commentDepth = 0;
        }
        return true;
      }

      return false;
    };

    const validateBlockSyntax = (
      pattern: BlockPattern,
      match: RegExpMatchArray,
      index: number
    ): void => {
      if (pattern.type === "macro" && match[2]) {
        const params = match[2].split(",").map((param) => {
          // Extract just the parameter name before any default value or whitespace
          const paramName = param.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
          return paramName ? paramName[1] : "";
        });

        params.forEach((param) => {
          if (param && !param.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
            linter.addError(
              filename,
              index + 1,
              `Invalid macro parameter name: ${param}`
            );
          }
        });
      }
    };

    const checkConditionalBlocks = (line: string, index: number): void => {
      const elifMatch = line.match(CONDITIONAL_PATTERNS.elif);
      const elseMatch = line.match(CONDITIONAL_PATTERNS.else);

      if (elifMatch || elseMatch) {
        const lastBlock = blockStack[blockStack.length - 1];
        if (!lastBlock || lastBlock.type !== "if") {
          linter.addError(
            filename,
            index + 1,
            `${elifMatch ? "elif" : "else"} without matching if`
          );
        }
      }
    };

    const checkBlockEndings = (line: string, index: number): void => {
      // if (hasError) return;
      for (const [name, pattern] of Object.entries(BLOCK_PATTERNS)) {
        if (!pattern.hasEnd || !pattern.endPattern) continue;

        const match = line.match(pattern.endPattern);
        if (!match) continue;

        if (blockStack.length === 0) {
          linter.addError(
            filename,
            index + 1,
            `Unexpected end${pattern.type} without matching opening tag`
          );
          // hasError = true;
          return;
        }

        const lastBlock = blockStack[blockStack.length - 1];
        // Allow nested blocks if they're marked as allowNested
        if (lastBlock.type !== pattern.type && !pattern.allowNested) {
          linter.addError(
            filename,
            index + 1,
            `Mismatched block ending: found end${pattern.type}, expected end${lastBlock.type} (opened at line ${lastBlock.line})`
          );
        } else if (pattern.type === "block") {
          const endName = match[2]?.trim();
          const hasStartDash = !!match[1];

          if (endName && endName !== lastBlock.name) {
            linter.addError(
              filename,
              index + 1,
              `Block name mismatch: ${endName} doesn't match ${lastBlock.name}`
            );
          }

          if (lastBlock.hasEndDash && !hasStartDash) {
            linter.addError(
              filename,
              index + 1,
              `Whitespace control mismatch: opening tag uses '-' but closing tag doesn't`
            );
          } else if (!lastBlock.hasEndDash && hasStartDash) {
            linter.addError(
              filename,
              index + 1,
              `Whitespace control mismatch: closing tag uses '-' but opening tag doesn't`
            );
          }
        }

        if (lastBlock.type === pattern.type) {
          blockStack.pop();
        }
        break;
      }
    };
    // Process each line
    lines.forEach((line, index) => processLine(line, index));

    // Check for unclosed blocks
    if (!inMultilineComment && blockStack.length > 0) {
      blockStack.forEach((block) => {
        linter.addError(
          filename,
          block.line,
          `Unclosed ${block.type}${
            block.type === "block" ? ` "${block.name}"` : ""
          } at line ${block.line}`
        );
      });
    }
  },
  checkSyntaxBalance: (content: string, filename: string): void => {
    const lines = content.split("\n");
    const state: SyntaxBalanceState = {
      openBraces: [],
      openTags: [],
      openComments: [],
      inMultilineComment: false,
      commentDepth: 0,
    };

    const handleComments = (line: string): boolean => {
      const starts = [...line.matchAll(SYNTAX_PATTERNS.comments.open)];
      const ends = [...line.matchAll(SYNTAX_PATTERNS.comments.close)];
      const startCount = starts.length;
      const endCount = ends.length;

      if (startCount === endCount && startCount > 0) {
        return true;
      }

      if (!state.inMultilineComment && startCount > endCount) {
        state.inMultilineComment = true;
        state.commentDepth = startCount - endCount;
        return true;
      }

      if (state.inMultilineComment) {
        state.commentDepth += startCount - endCount;
        if (state.commentDepth <= 0) {
          state.inMultilineComment = false;
          state.commentDepth = 0;
        }
        return true;
      }

      return false;
    };

    lines.forEach((line, index) => {
      if (handleComments(line)) return;

      const lineWithoutComments = line.replace(/{#.*?#}/g, "");

      // Check braces balance
      const braceMatches = [
        ...lineWithoutComments.matchAll(SYNTAX_PATTERNS.braces.open),
      ].length;
      const braceCloses = [
        ...lineWithoutComments.matchAll(SYNTAX_PATTERNS.braces.close),
      ].length;

      if (braceMatches > 0) {
        state.openBraces.push({ line: index + 1, count: braceMatches });
      }
      for (let i = 0; i < braceCloses; i++) {
        if (state.openBraces.length === 0) {
          linter.addError(
            filename,
            index + 1,
            `Unexpected closing braces '}}' without matching opening braces`
          );
          return;
        }
        const lastOpen = state.openBraces[state.openBraces.length - 1];
        lastOpen.count--;
        if (lastOpen.count === 0) {
          state.openBraces.pop();
        }
      }

      // Check tags balance
      const tagMatches = [
        ...lineWithoutComments.matchAll(SYNTAX_PATTERNS.tags.open),
      ].length;
      const tagCloses = [
        ...lineWithoutComments.matchAll(SYNTAX_PATTERNS.tags.close),
      ].length;

      if (tagMatches > 0) {
        state.openTags.push({ line: index + 1, count: tagMatches });
      }
      for (let i = 0; i < tagCloses; i++) {
        if (state.openTags.length === 0) {
          linter.addError(
            filename,
            index + 1,
            `Unexpected closing tag '%}' without matching opening tag`
          );
          return;
        }
        const lastOpen = state.openTags[state.openTags.length - 1];
        lastOpen.count--;
        if (lastOpen.count === 0) {
          state.openTags.pop();
        }
      }

      // Check comments balance
      const commentMatches = [
        ...lineWithoutComments.matchAll(SYNTAX_PATTERNS.comments.open),
      ].length;
      const commentCloses = [
        ...lineWithoutComments.matchAll(SYNTAX_PATTERNS.comments.close),
      ].length;

      if (commentMatches > 0) {
        state.openComments.push({ line: index + 1, count: commentMatches });
      }

      for (let i = 0; i < commentCloses; i++) {
        if (state.openComments.length === 0) {
          linter.addError(
            filename,
            index + 1,
            `Unexpected closing tag '#}' without matching opening tag`
          );
          return;
        }
        const lastOpen = state.openComments[state.openComments.length - 1];
        lastOpen.count--;
        if (lastOpen.count === 0) {
          state.openComments.pop();
        }
      }
    });

    // Check for unclosed delimiters at end of file
    if (!state.inMultilineComment) {
      if (state.openBraces.length > 0) {
        const totalUnclosed = state.openBraces.reduce(
          (sum, pos) => sum + pos.count,
          0
        );
        linter.addError(
          filename,
          state.openBraces[0].line,
          `Unclosed braces '{{': missing ${totalUnclosed} closing brace(s)`
        );
      }
      if (state.openTags.length > 0) {
        const totalUnclosed = state.openTags.reduce(
          (sum, pos) => sum + pos.count,
          0
        );
        linter.addError(
          filename,
          state.openTags[0].line,
          `Unclosed tag '{%': missing ${totalUnclosed} closing tag(s)`
        );
      }
      if (state.openComments.length > 0) {
        const totalUnclosed = state.openComments.reduce(
          (sum, pos) => sum + pos.count,
          0
        );
        linter.addError(
          filename,
          state.openComments[0].line,
          `Unclosed comment '{#': missing ${totalUnclosed} closing tag(s)`
        );
      }
    }
  },
  checkFilters: (content: string, filename: string): void => {
    const lines = content.split("\n");
    const filterPattern =
      /\{\{[^}]+?\|[ ]*([a-zA-Z_][a-zA-Z0-9_]*)[ ]*(?:\([^)]*\))?[ ]*[^}]*}}/g;
    const multiFilterPattern = /\|[ ]*([a-zA-Z_][a-zA-Z0-9_]*)[ ]*/g;

    lines.forEach((line, index) => {
      // Skip comments
      if (line.includes("{#")) return;

      // Check for filters in expressions
      let match;
      while ((match = filterPattern.exec(line)) !== null) {
        const fullMatch = match[0];
        const filters = [...fullMatch.matchAll(multiFilterPattern)]
          .map((m) => m[1])
          .filter(Boolean);
        filters.forEach((filter) => {
          if (
            !linter.options.defaultFilters.includes(filter) &&
            !linter.options.customFilters.includes(filter)
          ) {
            linter.addError(
              filename,
              index + 1,
              `Unknown filter "${filter}". Available filters: ${[
                ...linter.options.defaultFilters,
                ...linter.options.customFilters,
              ].join(", ")}`
            );
          }
        });
      }
    });
  },
  checkSpacing: (content: string, filename: string): void => {
    const lines = content.split("\n");

    // Patterns to check spacing
    const expressionBlockPattern = /\{\{([^}]+)\}\}/g;
    const statementBlockPattern = /\{%(-)?([^}]+?)(-)?%\}/g;

    const checkFilterSpacing = (content: string, index: number) => {
      const parts = content.trim().split("|");

      // Check variable part (first part)
      if (!parts[0].endsWith(" ")) {
        linter.addError(
          filename,
          index + 1,
          `Missing space before filter chain: "${parts[0]}|"`
        );
      }

      // Check filters (remaining parts)
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const isLastFilter = i === parts.length - 1;

        if (!part.startsWith(" ")) {
          linter.addError(
            filename,
            index + 1,
            `Missing space after '|': "|${part}"`
          );
        }

        if (!isLastFilter && !part.endsWith(" ")) {
          linter.addError(
            filename,
            index + 1,
            `Missing space before '|': "${part}|"`
          );
        }
      }
    };

    lines.forEach((line, index) => {
      if (line.includes("{#")) return;

      // Check expression blocks {{ }}
      let match;
      while ((match = expressionBlockPattern.exec(line)) !== null) {
        const [fullMatch, content] = match;
        if (!content.startsWith(" ") || !content.endsWith(" ")) {
          linter.addError(
            filename,
            index + 1,
            `Expression block should have spaces after '{{' and before '}}': "${fullMatch}"`
          );
        }

        // Check filter spacing
        if (content.includes("|")) {
          checkFilterSpacing(content, index);
        }
      }

      // Check statement blocks {% %}
      while ((match = statementBlockPattern.exec(line)) !== null) {
        const [fullMatch, startDash, content, endDash] = match;
        const hasStartDash = !!startDash;
        const hasEndDash = !!endDash;

        if (hasStartDash) {
          if (!content.startsWith(" ")) {
            linter.addError(
              filename,
              index + 1,
              `Statement block should have a space after '{%-': "${fullMatch}"`
            );
          }
        } else if (!content.startsWith(" ")) {
          linter.addError(
            filename,
            index + 1,
            `Statement block should have a space after '{%': "${fullMatch}"`
          );
        }

        if (hasEndDash) {
          if (!content.endsWith(" ")) {
            console.log(content);

            linter.addError(
              filename,
              index + 1,
              `Statement block should have a space before '-%}': "${fullMatch}"`
            );
          }
        } else if (!content.endsWith(" ")) {
          linter.addError(
            filename,
            index + 1,
            `Statement block should have a space before '%}': "${fullMatch}"`
          );
        }

        // Check filter spacing
        if (content.includes("|")) {
          checkFilterSpacing(content, index);
        }
      }
    });
  },
});
