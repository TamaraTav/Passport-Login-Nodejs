import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.jest },
      sourceType: "commonjs",
    },
  },
  {
    files: ["**/*.mjs"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      sourceType: "module",
    },
  },
]);
