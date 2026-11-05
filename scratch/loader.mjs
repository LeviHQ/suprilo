import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

export async function resolve(specifier, context, nextResolve) {
  // Handle @/ path aliases
  if (specifier.startsWith("@/")) {
    const relPath = specifier.slice(2);
    const resolvedPath = path.resolve(process.cwd(), "src", relPath);
    for (const ext of [".ts", ".tsx", ".js", ".mjs", "/index.ts", "/index.tsx", ""]) {
      const candidate = resolvedPath + ext;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return {
          shortCircuit: true,
          url: pathToFileURL(candidate).href,
        };
      }
    }
  }

  // Handle relative imports without extension (.ts, .tsx)
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    const resolvedPath = path.resolve(parentDir, specifier);
    for (const ext of [".ts", ".tsx", ".js", ".mjs"]) {
      const candidate = resolvedPath + ext;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return {
          shortCircuit: true,
          url: pathToFileURL(candidate).href,
        };
      }
    }
  }

  // Handle next/server and next package subpaths
  if (specifier === "next/server" || specifier.startsWith("next/")) {
    const subpath = specifier.slice("next/".length);
    const candidate = path.resolve(process.cwd(), "node_modules", "next", `${subpath}.js`);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return {
        shortCircuit: true,
        url: pathToFileURL(candidate).href,
      };
    }
  }

  return nextResolve(specifier, context);
}
