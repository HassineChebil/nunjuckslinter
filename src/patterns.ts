import { BlockPattern } from "./types";

export const BLOCK_PATTERNS: Record<string, BlockPattern> = {
    block: {
        type: 'block',
        hasEnd: true,
        pattern: /{%\s*block\s+([a-zA-Z][a-zA-Z0-9_-]*)\s*(-)?%}/,
        endPattern: /{%(-)?(?:\s*)endblock(?:\s+([a-zA-Z][a-zA-Z0-9_-]*))?\s*%}/,
    },
    for: {
        type: 'for',
        hasEnd: true,
        pattern: /{%-?\s*for\s+([^%}]+)\s*-?%}/,
        endPattern: /{%-?\s*endfor\s*-?%}/,
        allowNested: true  // Add this to allow nesting within blocks
    },
    if: {
        type: 'if',
        hasEnd: true,
        pattern: /{%-?\s*if\s+([^%}]+)\s*-?%}/,
        endPattern: /{%-?\s*endif\s*-?%}/,
        allowNested: true  // Add this to allow nesting within blocks
    },
    macro: {
        type: 'macro',
        hasEnd: true,
        pattern: /{%-?\s*macro\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(((?:[^(){}[\]]|\{[^{}]*\}|\[[^\[\]]*\])*)\)\s*-?%}/,
        endPattern: /{%-?\s*endmacro\s*-?%}/
    },
    set: {
        type: 'set',
        hasEnd: false,
        pattern: /{%-?\s*set\s+([^%}]+)\s*-?%}/
    },
    call: {
        type: 'call',
        hasEnd: true,
        pattern: /{%-?\s*call\s+([^%}]+)\s*-?%}/,
        endPattern: /{%-?\s*endcall\s*-?%}/,
        allowNested: true
    },
    asyncEach: {
        type: 'asyncEach',
        hasEnd: true,
        pattern: /{%-?\s*asyncEach\s+([^%}]+)\s*-?%}/,
        endPattern: /{%-?\s*endeach\s*-?%}/,
        allowNested: true
    },
    asyncAll: {
        type: 'asyncAll',
        hasEnd: true,
        pattern: /{%-?\s*asyncAll\s+([^%}]+)\s*-?%}/,
        endPattern: /{%-?\s*endall\s*-?%}/,
        allowNested: true
    },
    filter: {
        type: 'filter',
        hasEnd: true,
        pattern: /{%-?\s*filter\s+([^%}]+)\s*-?%}/,
        endPattern: /{%-?\s*endfilter\s*-?%}/,
        allowNested: true
    },
    // verbatim: {
    //     type: 'verbatim',
    //     hasEnd: true,
    //     pattern: /{%-?\s*verbatim\s*-?%}/,
    //     endPattern: /{%-?\s*endverbatim\s*-?%}/
    // }
};

export const CONDITIONAL_PATTERNS = {
    elif: /{%-?\s*elif\s+([^%}]+)\s*-?%}/,
    else: /{%-?\s*else\s*-?%}/
};

export const SYNTAX_PATTERNS = {
    braces: {
        open: /{{/g,
        close: /}}/g
    },
    tags: {
        open: /{%/g,
        close: /%}/g
    },
    comments: {
        open: /{#/g,
        close: /#}/g
    }
}