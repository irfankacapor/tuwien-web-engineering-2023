export class FormattedError extends Error {
  constructor(message: HtmlString, options: { cause?: Error } = {}) {
    super(message, options);
  }
}

export type HtmlString = string;
