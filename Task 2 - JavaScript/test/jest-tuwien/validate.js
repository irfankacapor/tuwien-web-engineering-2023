import { HtmlValidate } from 'html-validate';
import path from 'path';

function testValidHtml(testId, file) {
  test(`${testId} - Valid HTML`, () => {
    const htmlvalidate = new HtmlValidate({
      plugins: ["<rootDir>/jest-tuwien/html-validate-tuwien"],
      extends: ["html-validate:recommended"],
      rules: {
        "no-unknown-elements": "error",
        "missing-doctype": "error",
        "no-missing-references": "error",
        "no-trailing-whitespace": "warn",
        "tuwien/input-missing-label": "error",
        "no-inline-style": "off"
      }
    });
    const report = htmlvalidate.validateFile(path.normalize(file));
    if (!report.valid) {
      let errorMessage = `HTML does not validate (${report.errorCount} errors, ${report.warningCount} warnings).\n`;
      for (const r of report.results) {
        for (const e of r.messages) {
          const type = e.severity == 2 ? 'error' : 'warning';
          errorMessage += `\n[${type}] ${path.basename(r.filePath)}:${e.line}:${e.column}: ${e.message}\n`;
        }
      }
      const minusPoints = 0.5 * report.errorCount;
      throw Error(JSON.stringify({ errorMessage, minusPoints }));
    }
  });
}

module.exports = { testValidHtml }