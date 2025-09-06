import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import importPlugin from 'eslint-plugin-import';

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      "jest.config.ts",   // ← ここで Jest 設定を無視
      "dist/**",          // ← ビルド成果物も無視
      "node_modules/**",  // ← 依存パッケージも無視
    ],
  },
  {
    files: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      import: importPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "import/no-cycle": "warn",
      "import/no-internal-modules": ["off"], // barrel 経由推奨なら "warn" でも
      "no-unused-vars": "warn",
      "no-underscore-dangle": ["error", { "allowAfterThis": false }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
