import { BaseSequencer, type WorkspaceSpec } from "vitest/node";

export class CustomSequencer extends BaseSequencer {
  async sort(tests: WorkspaceSpec[]) {
    // Sort by test file name
    return tests.sort((a, b) => a[1].localeCompare(b[1]));
  }
}
