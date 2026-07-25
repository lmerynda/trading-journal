#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import {
  dirname,
  extname,
  join,
  normalize,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(repositoryRoot, "src");
const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const importPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[^"'()]*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function resolveLocalImport(importer, specifier) {
  const candidate = specifier.startsWith("@/")
    ? join(sourceRoot, specifier.slice(2))
    : specifier.startsWith(".")
      ? resolve(dirname(importer), specifier)
      : undefined;

  if (!candidate) {
    return undefined;
  }

  const paths = [
    candidate,
    ...sourceExtensions.map((extension) => candidate + extension),
    ...sourceExtensions.map((extension) =>
      join(candidate, "index" + extension),
    ),
  ];

  return normalize(paths.find(existsSync) ?? candidate);
}

function isWithin(path, directory) {
  const child = relative(directory, path);
  return child === "" || (!child.startsWith("..") && !child.startsWith(sep));
}

const files = walk(sourceRoot).filter((path) =>
  sourceExtensions.includes(extname(path)),
);
const violations = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const isClientModule = /^\s*["']use client["'];/m.test(source);
  const isFrontend =
    isWithin(file, join(sourceRoot, "app")) ||
    isWithin(file, join(sourceRoot, "components")) ||
    isClientModule;
  const isFrameworkIndependentBackend = ["application", "domain", "ports"].some(
    (layer) => isWithin(file, join(sourceRoot, "backend", layer)),
  );

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1] ?? match[2];
    const importedFile = resolveLocalImport(file, specifier);

    if (
      isFrontend &&
      importedFile &&
      isWithin(importedFile, join(sourceRoot, "backend", "infrastructure"))
    ) {
      violations.push([
        file,
        specifier,
        "frontend must use backend use cases, not infrastructure",
      ]);
    }

    if (
      isClientModule &&
      importedFile &&
      (isWithin(importedFile, join(sourceRoot, "backend", "composition")) ||
        isWithin(importedFile, join(sourceRoot, "backend", "infrastructure")))
    ) {
      violations.push([
        file,
        specifier,
        "client modules cannot import server-only modules",
      ]);
    }

    if (isFrameworkIndependentBackend) {
      if (
        specifier === "next" ||
        specifier.startsWith("next/") ||
        specifier === "react" ||
        specifier.startsWith("react/")
      ) {
        violations.push([
          file,
          specifier,
          "backend application/domain/ports must be framework-independent",
        ]);
      }

      if (
        importedFile &&
        (isWithin(
          importedFile,
          join(sourceRoot, "backend", "infrastructure"),
        ) ||
          isWithin(importedFile, join(sourceRoot, "backend", "composition")))
      ) {
        violations.push([
          file,
          specifier,
          "backend core cannot depend on infrastructure or composition",
        ]);
      }
    }
  }
}

if (violations.length > 0) {
  console.error("Architecture boundary violations:");
  for (const [file, specifier, reason] of violations) {
    console.error(
      `- ${relative(repositoryRoot, file)} imports ${specifier}: ${reason}`,
    );
  }
  process.exitCode = 1;
} else {
  console.log(
    `Architecture boundaries OK (${files.length} source files checked).`,
  );
}
