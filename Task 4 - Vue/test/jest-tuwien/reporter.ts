import type { Reporter, File, Vitest, TaskResultPack, Task } from "vitest";
import { writeFileSync, readFileSync } from "fs";
import { join, basename } from "path";
import mustache from "mustache";
import stripAnsi from "strip-ansi";
import striptags from "striptags";
import { getTests } from "@vitest/runner/utils";

export class TestError extends Error {
  constructor(data: TestErrorData, options: { cause?: Error } = {}) {
    super(JSON.stringify(data), options);
  }
}

export type TestErrorData = {
  messageType: "html" | "text";
  steps: any[];
  errorMessage: string;
  minusPoints?: number;
};

function testSuiteInfoFromPath(p: string) {
  const [_, index, c, n] = p.match(/([0-9]+).(.)(.*).test.(js|ts)/) ?? [];
  return {
    index,
    name: c.toUpperCase() + n,
  };
}

function indentString(str: string, indent: number) {
  return str.replace(/^(?!\s*$)/gm, " ".repeat(indent));
}

export interface CustomReporterOptions {
  title: string;
  maxPoints: number;
  defaultMinusPoints: number;
  seed: number;
  outputFile?: string;
  jsonOutputFile?: string;
}

interface Report {
  title: string;
  maxPoints: number;
  minusPoints: number;
  sections: ReportSection[];
  startTime: string;
  numTotalTests: number;
  numFailedTests: number;
  numPassedTests: number;
  totalPoints: number;
  seed: number;
  partyFace?: string;
}

interface ReportSection {
  testFileName: string;
  testName: string;
  tests: ReportTest[];
  testExecError?: {
    minusPoints: number;
    errorMessage: string;
  };
}

type ReportTest =
  | {
      testId: string;
      title: string;
      status: "passed";
      minusPoints: number;
    }
  | {
      testId: string;
      title: string;
      status: "failed";
      minusPoints: number;
      errorMessage: string;
      steps?: any[];
    };

interface JsonResult {
  id: string;
  minusPoints: number;
  error?: string;
}

type TestId = string;

export class CustomReporter implements Reporter {
  _options: CustomReporterOptions;
  _startTime: number = Date.now();
  _tasks: Map<TestId, Task> = new Map();

  constructor(options: CustomReporterOptions) {
    this._options = options;
  }

  onInit(ctx: Vitest): void {
    this._startTime = Date.now();
  }

  onCollected(files?: File[]) {
    const tests = getTests(files ?? []);
    tests.forEach((task) => {
      task.file?.id ?? "";
      this._tasks.set(task.id, task);
    });
  }

  onTaskUpdate(packs: TaskResultPack[]) {
    // print while tests are running, so we can see the progress
    packs.forEach(([id, result]) => {
      const task = this._tasks.get(id);
      if (!task) return;
      if (task.type !== "test") return;

      // Vitest executes tests in parallel, so we can't just print all the results and expect them to be in order.
      // I did try some workarounds, but they all suck.
      // So we'll only log failed tests and call it a day.
      // Though the actual vitest reporter does do a better job https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/node/reporters/default.ts
      if (task.result?.state === "fail") {
        console.log(task.name + " failed");
      }
    });
  }

  async onFinished(results?: File[]) {
    if (!results) return;

    const templateFile = join(__dirname, "report.mustache.html");
    const outputFile = this._options.outputFile || "report.html";
    const report = this.generateReport(results);

    const testMessage =
      report.totalPoints < report.maxPoints
        ? ``
        : ` \u001b[1m\u001b[32mYou passed all tests!\u001b[0m`;
    console.log(
      `\nYou have \u001b[1m${report.totalPoints} out of ${report.maxPoints} points\u001b[0m on ${report.title}.${testMessage}`
    );

    const jsonReport = this.generateJson(report);
    const jsonOutputFile = this._options.jsonOutputFile || "report.json";
    writeFileSync(jsonOutputFile, jsonReport, { encoding: "utf-8" });

    const template = readFileSync(templateFile, "utf-8");
    const html = mustache.render(template, report);
    writeFileSync(outputFile, html, { encoding: "utf-8" });
    console.log(`See \u001b[1m${outputFile}\u001b[0m for details.`);
  }

  generateReport(results: File[]) {
    const maxPoints = this._options.maxPoints;
    let minusPoints = 0;
    const sections: ReportSection[] = [];

    for (const testFile of results) {
      const section: ReportSection = {
        testFileName: basename(testFile.filepath),
        testName: testSuiteInfoFromPath(basename(testFile.filepath)).name,
        tests: [],
      };
      sections.push(section);

      const testsInFile = getTests([testFile]);
      for (const testResult of testsInFile) {
        const titleParts = /(([0-9]+) - )?(.*)/.exec(testResult.name);
        // There are other test non-successes, how should we handle those?
        const testFailed = testResult.result?.state === "fail";
        const test: ReportTest = {
          testId: titleParts?.[2] ?? "0",
          title: titleParts?.[3] ?? "",
          minusPoints: 0,
          ...(testFailed
            ? {
                status: "failed",
                errorMessage: testResult.result?.errors?.[0]?.message ?? "",
              }
            : { status: "passed" }),
        };
        section.tests.push(test);

        if (test.status !== "failed") {
          continue;
        }

        test.minusPoints = this._options.defaultMinusPoints;

        if (test.errorMessage.startsWith("{")) {
          try {
            const errorObj: TestErrorData = JSON.parse(test.errorMessage);
            test.minusPoints =
              errorObj.minusPoints ?? this._options.defaultMinusPoints;
            test.steps = errorObj.steps;
            test.errorMessage =
              errorObj.messageType === "html"
                ? stripAnsi(errorObj.errorMessage)
                : striptags(stripAnsi(errorObj.errorMessage));
          } catch (e) {
            console.log(e);
          }
        } else if (
          // TODO: Does the error message really start with that?
          test.errorMessage.startsWith("Error: net::ERR_FILE_NOT_FOUND") ||
          test.errorMessage.startsWith("Error: ENOENT: no such file")
        ) {
          test.errorMessage = "File not found";
          test.minusPoints = maxPoints;
        } else {
          test.errorMessage = stripAnsi(test.errorMessage);
        }

        minusPoints += test.minusPoints;
      }

      // If the entire test file could not be executed, we give the full minus points
      // Not sure if this is the best way to do it
      const entireFileFailed =
        testFile.result?.state === "fail" && testsInFile.length === 0;
      if (entireFileFailed) {
        minusPoints += maxPoints;
        section.testExecError = {
          minusPoints: maxPoints,
          errorMessage: stripAnsi(testFile.result?.errors?.[0]?.message ?? ""),
        };
      }
    }

    sections.sort((a, b) => a.testFileName.localeCompare(b.testFileName));

    const tests = getTests(results);
    const numTotalTests = tests.length;
    const numFailedTests = tests.filter(
      (t) => t.result?.state === "fail"
    ).length;
    const numPassedTests = numTotalTests - numFailedTests;
    const report: Report = {
      title: this._options.title,
      maxPoints,
      minusPoints,
      totalPoints: Math.max(0, maxPoints - minusPoints),
      sections,
      startTime:
        new Date(this._startTime)
          .toISOString()
          .replace(/T/, " ")
          .replace(/\..+/, "") + " UTC",
      numTotalTests,
      numFailedTests,
      numPassedTests,
      seed: this._options.seed,
    };

    if (report.totalPoints >= report.maxPoints) {
      report.partyFace = "🥳";
    }

    return report;
  }

  generateJson(report: Report) {
    const jsonResults: JsonResult[] = [];
    for (const section of report.sections) {
      for (const test of section.tests) {
        const jsonResult: JsonResult = {
          id: test.testId,
          minusPoints: test.minusPoints,
        };
        if (test.status === "failed") {
          const errs: string[] = [];
          for (const step of test.steps ?? []) {
            errs.push("- " + striptags(step.description));
            if (step.more) {
              if (step.more.info) {
                errs.push(indentString(striptags(step.more.info), 2));
              }
              for (const substep of step.more.substeps ?? []) {
                errs.push("  - " + striptags(substep.description));
                if (substep.more && substep.more.info) {
                  errs.push(indentString(striptags(substep.more.info), 4));
                }
              }
            }
          }
          errs.push(test.errorMessage);
          jsonResult.error = errs.join("\n\n");
        }
        jsonResults.push(jsonResult);
      }
    }
    return JSON.stringify({
      timestamp: new Date(this._startTime).toISOString(),
      maxPoints: report.maxPoints,
      minusPoints: report.minusPoints,
      seed: report.seed,
      results: jsonResults,
    });
  }
}
