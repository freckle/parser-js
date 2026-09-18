import freckle from "@freckle/eslint-config";

export default [
  ...freckle,
  {
    files: ["**/*.ts"],
    rules: {
      // This package's job is to validate arbitrary unvalidated input, so `any`
      // is the parameter type across the whole public surface (`parse`,
      // `Parser.run`, `saferStringify`). Switching to `unknown` would force a
      // cast at every call site in every consumer, which is a breaking change
      // to the published types rather than a lint fix.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
