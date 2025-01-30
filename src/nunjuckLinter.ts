import { readFileSync } from "node:fs";
import path from "node:path";
import { glob } from "glob";
import { createLintingRules } from "./rules/lintingRules";
import { LinterInterface, LinterOptions, LintError } from "./types";
import { DEFAULT_FILTERS } from "./constants";

export class NunjucksLinter implements LinterInterface {
    private errors: LintError[];
    public options: LinterOptions;
    private rules: Record<string, (content: string, filename: string) => void>;
    private blockErrors: Map<string, Set<number>>;
    constructor(options: Partial<LinterOptions> = {}) {
        this.errors = [];
        this.blockErrors = new Map();
        this.options = {
            ignore: options.ignore || [],
            extensions: options.extensions || [".njk", ".html"],
            customFilters: options.customFilters || [],
            defaultFilters: options.defaultFilters || DEFAULT_FILTERS,
            rules: {
                checkBlockStructure: true,
                checkSyntaxBalance: true,
                ...(typeof options.rules === "object" ? options.rules : {}),
            },
        };
        this.rules = createLintingRules(this);
    }

    public addError(filename: string, line: number, message: string): void {
        // Skip cascading block errors
        if (message.includes('Mismatched block ending')) {
            return;
        }
        // Track block errors to avoid duplicates
        if (message.includes('Unclosed')) {
            if (!this.blockErrors.has(filename)) {
                this.blockErrors.set(filename, new Set());
            }
            const fileErrors = this.blockErrors.get(filename)!;

            // If we already have an error for this line, skip it
            if (fileErrors.has(line)) {
                return;
            }
            fileErrors.add(line);
        }

        this.errors.push({
            file: filename,
            line,
            message,
        });
    }

    lintFile(filepath: string): void {
        try {
            const content = readFileSync(filepath, "utf8");

            // Filter and execute only enabled rules
            Object.entries(this.rules)
                .filter(([ruleName]) => this.options.rules[ruleName] === true)
                .forEach(([_, ruleFunction]) => {
                    ruleFunction(content, filepath);
                });
        } catch (error) {
            console.error(`Erreur lors de l'analyse de ${filepath}:`, error);
        }
    }

    lintDirectory(dirpath: string): void {
        const pattern = path.join(
            dirpath,
            `**/*{${this.options.extensions.join(",")}}`,
        );

        const files = glob.sync(pattern, {
            ignore: this.options.ignore,
        });

        files.forEach((file) => this.lintFile(file));
    }

    printResults(): void {
        if (this.errors.length === 0) {
            console.log("Aucune erreur trouvée! 🎉");
            return;
        }

        // Sort errors by file and line number
        const sortedErrors = this.errors.sort((a, b) => {
            if (a.file === b.file) {
                return a.line - b.line;
            }
            return a.file.localeCompare(b.file);
        });

        console.log(`\n \x1b[31mTrouvé ${sortedErrors.length} problème(s):\x1b[0m \n`);

        sortedErrors.forEach((error) => {
            console.log(`\x1b[32m${error.file}:${error.line}\x1b[0m - \x1b[31m${error.message}\x1b[0m`);
        });
    }
}