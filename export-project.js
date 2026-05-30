const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const OUTPUT_FILE = "project-review.txt";

const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".turbo",
  "dist",
  "build",
  "coverage",
  ".vscode",
  ".idea"
]);

const EXCLUDE_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  "project-review.txt",
  "project-export.txt",
  "export-project.js"
]);

const INCLUDE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".sql",
  ".md"
]);

const ALWAYS_INCLUDE = new Set([
  "package.json",
  "README.md",
  "tsconfig.json",
  "next.config.ts",
  "next.config.js",
  "components.json",
  "eslint.config.mjs",
  "postcss.config.mjs"
]);

let output = "";

function shouldInclude(filePath) {
  const fileName = path.basename(filePath);

  if (EXCLUDE_FILES.has(fileName)) {
    return false;
  }

  if (ALWAYS_INCLUDE.has(fileName)) {
    return true;
  }

  const ext = path.extname(fileName);

  return INCLUDE_EXTENSIONS.has(ext);
}

function walk(dir) {
  const entries = fs.readdirSync(dir, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) {
        continue;
      }

      walk(fullPath);
      continue;
    }

    if (!shouldInclude(fullPath)) {
      continue;
    }

    try {
      const content = fs.readFileSync(fullPath, "utf8");
      const relativePath = path.relative(ROOT, fullPath);

      output += "\n";
      output += "=".repeat(120) + "\n";
      output += `FILE: ${relativePath}\n`;
      output += "=".repeat(120) + "\n\n";
      output += content;
      output += "\n\n";
    } catch (err) {
      console.log(`Skipped: ${fullPath}`);
    }
  }
}

console.log("Exporting project...");

walk(ROOT);

fs.writeFileSync(OUTPUT_FILE, output, "utf8");

console.log("\nExport completed successfully.");
console.log(`Created: ${OUTPUT_FILE}`);
console.log(`Size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);