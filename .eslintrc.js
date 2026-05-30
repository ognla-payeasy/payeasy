module.exports = {
  extends: ["next/core-web-vitals"],
  plugins: ["@typescript-eslint"],
  rules: {
    // Enforce consistent error handling: disallow empty blocks (incl. empty
    // catch blocks) so errors are never silently swallowed.
    "no-empty": ["error", { allowEmptyCatch: false }],
    // Discourage `any`; prefer precise types or `unknown` for caught errors.
    "@typescript-eslint/no-explicit-any": "warn",
  },
  overrides: [
    {
      files: ["lib/stellar/**/*.{js,jsx,ts,tsx}"],
      rules: {
        "no-console": [
          "error",
          {
            allow: ["warn", "error"],
          },
        ],
      },
    },
    {
      files: ["lib/stellar/actions/**/*.{js,jsx,ts,tsx}"],
      rules: {
        "no-restricted-syntax": [
          "warn",
          {
            selector: "CallExpression[callee.name='setTimeout']",
            message:
              "Avoid setTimeout in escrow action files; prefer transaction-driven flow or explicit polling helpers.",
          },
        ],
      },
    },
  ],
};
