import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/", "coverage/"],
  },
  {
    files: ["**/*.ts"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // This package's job is to validate arbitrary unvalidated input, so `any`
      // is the parameter type across the whole public surface (`parse`,
      // `Parser.run`, `saferStringify`). Switching to `unknown` would force a
      // cast at every call site in every consumer, which is a breaking change
      // to the published types rather than a lint fix.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
