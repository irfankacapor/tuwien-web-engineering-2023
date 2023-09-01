const fs = require('fs');
const path = require('path');
const mustache = require('mustache');
const stripAnsi = require('strip-ansi');
const chalk = require('chalk');
const striptags = require('striptags');

function testNameFromPath(p) {
  const [_, c, n] = p.match(/test.[0-9].(.)(.*).js/)
  return c.toUpperCase() + n;
}

function indentString(str,indent) {
	return str.replace(/^(?!\s*$)/gm, ' '.repeat(indent));
}

class MyCustomReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunStart(results, options) {
    const timeStr = options.estimatedTime ? chalk.gray(` (estimated time: ${options.estimatedTime}s)`) : ''
    console.log('\nRunning tests...' + timeStr)
  }

  onTestResult(test, testResult, aggResult) {
    console.log(`\n${testNameFromPath(testResult.testFilePath)}`)
    const statusSymbol = (s) => {
      switch (s) {
        case 'passed': return chalk.green('✔');
        case 'failed': return chalk.red('✖');
        case 'skipped': return chalk.gray('⊘');
        default: return chalk.yellow('?');
      }
    }

    console.group();

    for (let result of testResult.testResults) {
      const dur = (result.duration / 1000).toFixed(3);
      console.log(`${statusSymbol(result.status)} ${result.title}` + chalk.gray(` (${dur}s)`));
    }

    if (testResult.testExecError) {
      console.log(`${statusSymbol('failed')} Test execution error`);
      console.group();
      console.log('\n' + testResult.testExecError.message);
      console.groupEnd();
    }

    console.groupEnd();
  }

  onRunComplete(contexts, results) {
    this.seed = contexts.values().next().value.config.globals.__SEED__;

    const templateFile = path.join(__dirname, 'report.mustache.html');
    const outputFile = this._options.outputFile || 'report.html';
    const report = this.generateReport(results);

    console.log(`\nYou have \u001b[1m${report.totalPoints} points\u001b[0m on ${report.title}.`)

    const jsonReport = this.generateJson(results, report);
    const jsonOutputFile = this._options.jsonOutputFile || 'report.json';
    fs.writeFileSync(jsonOutputFile, jsonReport, { encoding: 'utf-8' });

    const template = fs.readFileSync(templateFile, 'utf-8');
    const html = mustache.render(template, report);
    fs.writeFileSync(outputFile, html, { encoding: 'utf-8' });
    console.log(`See \u001b[1m${outputFile}\u001b[0m for details.`);
  }

  generateReport(results) {
    var report = {
      title: this._options.title,
      maxPoints: this._options.maxPoints,
      minusPoints: 0,
      sections: [],
      startTime: new Date(results.startTime).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' UTC',
      numTotalTests: results.numTotalTests,
      numFailedTests: results.numFailedTests,
      numPassedTests: results.numPassedTests,
      seed: this.seed
    };

    for (const testFile of results.testResults) {
      var section = {
        testFileName: path.basename(testFile.testFilePath),
        testName: testNameFromPath(testFile.testFilePath),
        tests: []
      }
      report.sections.push(section);

      for (const result of testFile.testResults) {
        const titleParts = /(([0-9]+) - )?(.*)/.exec(result.title);
        var test = {
          testId: titleParts[2] ?? 0,
          title: titleParts[3],
          status: result.status,
          minusPoints: 0
        }
        section.tests.push(test);

        if (result.status != 'failed') {
          continue;
        }

        test.errorMessage = result.failureMessages[0];
        test.minusPoints = this._options.defaultMinusPoints;

        if (test.errorMessage.startsWith('Error: {')) {
          try {
            const rawJson = test.errorMessage.substr(7, test.errorMessage.indexOf('\n') - 7);
            const errorObj = JSON.parse(rawJson);
            test.minusPoints = errorObj.minusPoints ?? this._options.defaultMinusPoints;
            test.steps = errorObj.steps;
            test.errorMessage = stripAnsi(errorObj.errorMessage);
          } catch (e) {
            console.log(e);
          }
        }

        else if (
          test.errorMessage.startsWith('Error: net::ERR_FILE_NOT_FOUND') ||
          test.errorMessage.startsWith('Error: ENOENT: no such file')
        ) {
          test.errorMessage = 'File not found';
          test.minusPoints = this.maxPoints;
        }

        else {
          test.errorMessage = stripAnsi(test.errorMessage);
        }

        report.minusPoints += test.minusPoints;
      }

      if (testFile.testExecError) {
        report.minusPoints += report.maxPoints;
        section.testExecError = {
          minusPoints: report.maxPoints,
          errorMessage: stripAnsi(testFile.testExecError.message)
        }
      }
    }

    report.totalPoints = Math.max(0, report.maxPoints - report.minusPoints);

    if (report.totalPoints >= report.maxPoints) {
      report.partyFace = '🥳';
    }

    report.sections.sort((a, b) => a.testFileName.localeCompare(b.testFileName));

    return report;
  }

  generateJson(results, report) {
    let jsonResults = [];
    for (const section of report.sections) {
      for (const test of section.tests) {
        let jsonResult = { id: test.testId, minusPoints: test.minusPoints }
        if (test.status == 'failed') {
          let errs = [];
          for (const step of test.steps ?? []) {
            errs.push('- ' + striptags(step.description));
            if (step.more) {
              if (step.more.info) {
                errs.push(indentString(striptags(step.more.info), 2));
              }
              for (const substep of step.more.substeps ?? []) {
                errs.push('  - ' + striptags(substep.description));
                if (substep.more && substep.more.info) {
                  errs.push(indentString(striptags(substep.more.info), 4));
                }
              }
            }
          }
          errs.push(test.errorMessage);
          jsonResult.error = errs.join('\n\n')
        }
        jsonResults.push(jsonResult);
      }
    }
    return JSON.stringify({
      timestamp: new Date(results.startTime).toISOString(),
      maxPoints: report.maxPoints,
      minusPoints: report.minusPoints,
      seed: report.seed,
      results: jsonResults
    });
  }

}

module.exports = MyCustomReporter;
