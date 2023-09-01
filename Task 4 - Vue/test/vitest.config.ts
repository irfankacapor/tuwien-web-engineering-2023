import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";
import viteConfig from "../vite.config";
import { CustomSequencer } from "./jest-tuwien/sequencer";
import { CustomReporter } from "./jest-tuwien/reporter";
import { SEED } from "./seed";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      sequence: {
        sequencer: CustomSequencer,
      },
      setupFiles: ["./test/jest-tuwien/setup.ts"],
      reporters: [
        // Default test reporter, also prints a full stack trace and everything when an error occurs.
        // Currently commented out,  because it is usually not very useful for the students.
        // "default",
        new CustomReporter({
          title: "A4",
          maxPoints: 15,
          defaultMinusPoints: 0.5,
          seed: SEED,
        }),
      ],
    },
  })
);
