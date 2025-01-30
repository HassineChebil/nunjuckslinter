import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

function levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1,
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

export function argsChecker(): string[] {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error("Usage: node index.js lint <file-or-directory-path>");
        console.error("       node index.js lint .  (to lint current directory)");
        process.exit(1);
    }

    // Check if path is provided
    if (args.length < 1) {
        console.error("Error: No path provided");
        console.error("Usage: node index.js lint <file-or-directory-path>");
        console.error("       node index.js lint .  (to lint current directory)");
        process.exit(1);
    }

    return args;
}

export function getTargetPath(arg0: string): string {
    let targetPath = arg0;
    if (targetPath === ".") {
        targetPath = process.cwd();
    } else {
        // Convert relative path to absolute path
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        console.log(__dirname);
        targetPath = path.resolve(process.cwd(), targetPath);
    }

    if (!existsSync(targetPath)) {
        console.error(`Error: Path "${targetPath}" does not exist`);
        process.exit(1);
    }

    return targetPath;
}