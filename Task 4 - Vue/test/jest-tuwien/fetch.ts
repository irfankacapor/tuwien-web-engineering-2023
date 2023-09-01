import type {
  FetchMock,
  GlobalWithFetchMock,
  MockResponseInit,
} from "vitest-fetch-mock/types";

/**
 * Fetch mocking utils
 * Best used with `fetchMock.mockIf` and `fetchMock.mockOnceIf`
 * */
export const fm = {
  isHttpGet: (req: Request) => {
    return req.method === "GET";
  },
  isHttpPut: (req: Request) => {
    return req.method === "PUT";
  },
  isHttpPost: (req: Request) => {
    return req.method === "POST";
  },
  isHttpDelete: (req: Request) => {
    return req.method === "DELETE";
  },
  isHttpHead: (req: Request) => {
    return req.method === "HEAD";
  },
  isHttpOptions: (req: Request) => {
    return req.method === "OPTIONS";
  },
  isHttpPatch: (req: Request) => {
    return req.method === "PATCH";
  },
  and: (...predicates: ((req: Request) => boolean)[]) => {
    return (req: Request) => {
      return predicates.every((p) => p(req));
    };
  },
  urlIncludes: (value: string) => {
    return (req: Request) => {
      return req.url.includes(value);
    };
  },
  respondJson: (json: any, status = 200) => {
    return async (): Promise<MockResponseInit> => ({
      status,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(json),
    });
  },
  respondStatus: (status: number) => {
    return async (): Promise<MockResponseInit> => ({
      status,
    });
  },
  // Promise delay
  delay: (ms: number) => {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  },
  requests: (fetchMock: FetchMock) => {
    return fetchMock.requests();
  },
  getJson: async (req: Request) => {
    const body = await req.text();
    try {
      return JSON.parse(body);
    } catch (e) {
      throw new Error(
        "Could not parse response body as JSON, body was: " + body,
        { cause: e }
      );
    }
  },
  // This would be pretty for pattern matching URLs
  // https://www.npmjs.com/package/urlpattern-polyfill
};

const globalFetchMock: FetchMock = (globalThis as any as GlobalWithFetchMock)
  .fetchMock;

export { globalFetchMock as fetchMock };
