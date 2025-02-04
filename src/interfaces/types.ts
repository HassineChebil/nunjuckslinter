export interface LinterOptions {
  ignore: string[];
  extensions: string[];
  rules: RulesConfig;
  customFilters: string[];
  defaultFilters: string[];
}

export interface LinterInterface {
  addError: (filename: string, line: number, message: string) => void;
  options: {
      defaultFilters: string[];
      customFilters: string[];
  };
}

export interface RulesConfig {
  checkBlockStructure?: boolean;
  checkIncludes?: boolean;
  checkVariables?: boolean;
  checkMacros?: boolean;
  checkSyntax?: boolean;
  checkFilters?: boolean;
  [key: string]: boolean | undefined;
}

export interface LintError {
  file: string;
  line: number;
  message: string;
}

export interface BlockStackItem {
  name: string;
  type: BlockType;
  line: number;
  hasEndDash?: boolean;
}

export type BlockType = 'if' | 'for' | 'macro' | 'block' | 'set' | 'filter' | 'call' | 'asyncEach' | 'asyncAll';

export interface BlockPattern {
    type: BlockType;
    hasEnd: boolean;
    pattern: RegExp;
    endPattern?: RegExp;
    allowNested?: boolean;
    subTypes?: string[];  // For if/elif/else blocks
}

export interface MacroStackItem {
  name: string;
  line: number;
}

export interface SyntaxBalanceState {
  openBraces: DelimiterPosition[];
  openTags: DelimiterPosition[];
  openComments: DelimiterPosition[];
  inMultilineComment: boolean;
  commentDepth: number;
}

export interface DelimiterPosition {
  line: number;
  count: number;
}