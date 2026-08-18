import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "*.bak",
      "*.backup",
      "*.backup2",
      "app-backup-before-alias-fix/**",
      "app-before-grid-migration/**",
      "app/_empty-pages-backup/**",
    ],
  },

  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript"
  ),

  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
