import { FILTER_PATTERNS } from "../constants";
import { LinterInterface } from "../interfaces";

export class FilterChecker {
  private readonly filterPattern = FILTER_PATTERNS.simple;
  private readonly multiFilterPattern = FILTER_PATTERNS.multiple;

  constructor(private filename: string, private linter: LinterInterface) {}

  private validateFilter(filter: string, index: number): void {
    if (
      !this.linter.options.defaultFilters.includes(filter) &&
      !this.linter.options.customFilters.includes(filter)
    ) {
      const availableFilters = [
        ...this.linter.options.defaultFilters,
        ...this.linter.options.customFilters,
      ].join(", ");

      this.linter.addError(
        this.filename,
        index + 1,
        `Unknown filter "${filter}". Available filters: ${availableFilters}`
      );
    }
  }

  private processLine(line: string, index: number): void {
    if (line.includes("{#")) return;

    let match;
    while ((match = this.filterPattern.exec(line)) !== null) {
      const fullMatch = match[0];
      const filters = [...fullMatch.matchAll(this.multiFilterPattern)]
        .map((m) => m[1])
        .filter(Boolean);

      filters.forEach((filter) => this.validateFilter(filter, index));
    }
  }

  public processContent(content: string): void {
    const lines = content.split("\n");
    lines.forEach((line, index) => this.processLine(line, index));
  }
}
