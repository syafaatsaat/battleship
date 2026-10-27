import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist/", "coverage/"]),
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    rules: {
      "no-unused-vars": "warn",
    },
  },
  // Game code runs in the browser
  {
    files: ["src/**/*.js"],
    languageOptions: { globals: globals.browser },
  },
  // Tests run in Jest (some in jsdom, so browser globals stay available)
  {
    files: ["src/tests/**/*.js"],
    languageOptions: { globals: { ...globals.jest, ...globals.node } },
  },
  // Build and tool configs run in Node
  {
    files: ["*.config.js", "webpack.*.js"],
    languageOptions: { globals: globals.node },
  },
  // Formatting is Prettier's job
  prettier,
]);
