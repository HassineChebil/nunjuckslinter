import path from "node:path";
import { existsSync } from "node:fs";
import { ArgsResult } from "../interfaces";

export function argsChecker(): ArgsResult {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  const paths = args.filter(arg => !arg.startsWith('--'));

  if (args.length === 0) {
    console.error("Usage: njklint [--fix] <file-or-directory-path>");
    console.error("       njklint [--fix] .  (to lint current directory)");
    process.exit(1);
  }

  // Check if path is provided
  if (args.length < 1) {
    console.error("Error: No path provided");
    console.error("Usage: njklint [--fix] <file-or-directory-path>");
    console.error("       njklint [--fix] .  (to lint current directory)");
    process.exit(1);
  }

  return { paths, shouldFix };
}

export function getTargetPath(arg0: string): string {
  let targetPath = arg0;
  if (targetPath === ".") {
    targetPath = process.cwd();
  } else {
    targetPath = path.resolve(process.cwd(), targetPath);
  }

  if (!existsSync(targetPath)) {
    console.error(`Error: Path "${targetPath}" does not exist`);
    process.exit(1);
  }

  return targetPath;
}

export function endBlockType(blockType: string): string {
  switch (blockType) {
    case "asyncAll":
      return "endall";
    case "asyncEach":
      return "endeach";
    default:
      return `end${blockType}`;
  }
}
