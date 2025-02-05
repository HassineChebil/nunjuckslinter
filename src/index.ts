#!/usr/bin/env node

import { statSync } from "node:fs";
import { NunjucksLinter } from "./nunjuckLinter";
import { argsChecker, getTargetPath } from "./utils";
import { loadConfig } from "./utils";

async function main() {
    const args = argsChecker();
    const config = await loadConfig(process.cwd());

    const linter = new NunjucksLinter({
        ignore: config.ignore || ["node_modules/**", "dist/**"],
        extensions: config.extensions || [".njk", ".html"],
        rules: config.rules || {},
        customFilters: config.customFilters || []
    });

    let targetPath = getTargetPath(args[0]);

    try {
        // Check if it's a file or directory
        const stats = statSync(targetPath);

        if (stats.isDirectory()) {
            console.log(`Linting directory: ${targetPath}`);
            linter.lintDirectory(targetPath);
        } else if (stats.isFile()) {
            console.log(`Linting file: ${targetPath}`);
            linter.lintFile(targetPath);
        } else {
            console.error("Error: Path is neither a file nor a directory");
            process.exit(1);
        }

        // Print the results
        linter.printResults();
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error:", error.message);
        }
        process.exit(1);
    }
}

main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
})