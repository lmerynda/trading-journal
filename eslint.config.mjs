import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: [
      "src/app/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
      "src/App.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/backend/infrastructure/**"],
              message:
                "Frontend adapters must call backend use cases, not infrastructure.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/backend/application/**/*.ts",
      "src/backend/domain/**/*.ts",
      "src/backend/ports/**/*.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["next", "next/**", "react", "react/**", "server-only"],
              message:
                "Backend application, domain, and ports are framework-independent.",
            },
            {
              group: [
                "@/backend/infrastructure/**",
                "@/backend/composition/**",
              ],
              message:
                "Backend core cannot depend on infrastructure or composition.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "coverage/**",
    "dist/**",
    "node_modules/**",
    "next-env.d.ts",
  ]),
]);
