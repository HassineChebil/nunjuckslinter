import { LinterInterface } from "../interfaces";
import { BlockStructureChecker } from "./blockStructureChecker";
import { SyntaxBalanceChecker } from "./syntaxBalanceChecker";
import { FilterChecker } from "./filterChecker";
import { SpacingChecker } from "./spacingChecker";

export const createLintingRules = (
  linter: LinterInterface
): Record<string, (content: string, filename: string) => void> => ({
  checkBlockStructure: (content: string, filename: string): void => {
    new BlockStructureChecker(filename, linter).processContent(content);
  },
  checkSyntaxBalance: (content: string, filename: string): void => {
    new SyntaxBalanceChecker(filename, linter).processContent(content);
  },
  checkFilters: (content: string, filename: string): void => {
    new FilterChecker(filename, linter).processContent(content);
  },
  checkSpacing: (content: string, filename: string): void => {
    new SpacingChecker(filename, linter).processContent(content);
  },
});
