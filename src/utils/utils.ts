import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

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