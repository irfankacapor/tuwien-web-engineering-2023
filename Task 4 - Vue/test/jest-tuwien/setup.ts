// This file needs to run before all tests
// Otherwise, the fetch mock might be applied ever so slightly too late

import createFetchMock from "vitest-fetch-mock";
import { vi } from "vitest";

const fetchMock = createFetchMock(vi);
fetchMock.enableMocks();

// Yeah, this library chooses to make the fetchMock a global variable. Not so pretty.
