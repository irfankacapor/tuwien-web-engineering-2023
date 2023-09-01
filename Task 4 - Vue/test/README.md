# Unit tests

This folder contains all the tests for this exercise.

As a typical student, you shouldn't ever need to look at this. The reports should be decent enough, and if not, please ask us on Tuwel!

## For the curious student

So, if you're still curious about the tests:

They're written using the vitest framework. [Vitest](https://vitest.dev/) is compatible with the commonly used [Jest](https://jestjs.io/) framework.

The tests run a lot of your code by mounting a single component in a simulated browser environment (Jsdom). And then they do things with that component, and check if the results match what we're expecting.

The tests can also intercept `fetch` requests, and return responses that are randomly generated using the [chance library](https://github.com/chancejs/chancejs). Randomly generated here means "we're using a seeded random number generator, which gives one random looking results. However, with the same seed, it always returns the same sequence of random numbers. Yes, that works just like Minecraft world seeds."

For then generating the `report.html` file, we set up our own custom test result reporter in the `vitest.config.ts` file. If you're really interested in debugging a certain test case, despite that absolutely not being your job, you can enable the `default` reporter.
