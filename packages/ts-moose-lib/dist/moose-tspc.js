#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/moose-tspc.ts
var import_child_process = require("child_process");
var import_fs3 = require("fs");
var import_path3 = __toESM(require("path"));

// src/compiler-config.ts
var import_fs = require("fs");
var import_path = __toESM(require("path"));
var MOOSE_COMPILER_PLUGINS = [
  {
    transform: "./node_modules/@514labs/moose-lib/dist/compilerPlugin.js"
    // No longer using transformProgram - direct typia integration eliminates
    // the need for program replacement and the associated incremental compilation issues
  },
  {
    // Keep typia plugin for users who use typia directly (not through Moose resources)
    transform: "typia/lib/transform"
  }
];
var MOOSE_COMPILER_OPTIONS = {
  experimentalDecorators: true,
  esModuleInterop: true,
  // Disable strict module syntax checking to avoid dual-package type conflicts
  // This prevents errors where the same type imported with different resolution
  // modes (CJS vs ESM) is treated as incompatible
  verbatimModuleSyntax: false
};
var MOOSE_MODULE_OPTIONS = {
  module: "NodeNext",
  moduleResolution: "NodeNext"
};
function getSourceDir() {
  return process.env.MOOSE_SOURCE_DIR || "app";
}
var DEFAULT_OUT_DIR = ".moose/compiled";
function readUserOutDir(projectRoot = process.cwd()) {
  try {
    let content = (0, import_fs.readFileSync)(
      import_path.default.join(projectRoot, "tsconfig.json"),
      "utf-8"
    );
    if (content.charCodeAt(0) === 65279) {
      content = content.slice(1);
    }
    const tsconfig = eval(`(${content})`);
    return tsconfig.compilerOptions?.outDir || null;
  } catch {
    return null;
  }
}
function getOutDir(projectRoot3 = process.cwd()) {
  const userOutDir2 = readUserOutDir(projectRoot3);
  return userOutDir2 || DEFAULT_OUT_DIR;
}
function getCompiledIndexPath(projectRoot3 = process.cwd()) {
  const outDir2 = getOutDir(projectRoot3);
  const sourceDir = getSourceDir();
  return import_path.default.resolve(projectRoot3, outDir2, sourceDir, "index.js");
}
function hasCompiledArtifacts(projectRoot3 = process.cwd()) {
  return (0, import_fs.existsSync)(getCompiledIndexPath(projectRoot3));
}
function detectModuleSystem(projectRoot3 = process.cwd()) {
  const pkgPath = import_path.default.join(projectRoot3, "package.json");
  if ((0, import_fs.existsSync)(pkgPath)) {
    try {
      const pkgContent = (0, import_fs.readFileSync)(pkgPath, "utf-8");
      const pkg = JSON.parse(pkgContent);
      if (pkg.type === "module") {
        return "esm";
      }
    } catch (e) {
      console.debug(
        `[moose] Failed to parse package.json at ${pkgPath}, defaulting to CJS:`,
        e
      );
    }
  }
  return "cjs";
}
function getModuleOptions(moduleSystem) {
  if (moduleSystem === "esm") {
    return {
      module: "ES2022",
      moduleResolution: "bundler"
    };
  }
  return {
    module: "CommonJS",
    moduleResolution: "Node"
  };
}
async function loadModule(modulePath, projectRoot3 = process.cwd()) {
  const moduleSystem = detectModuleSystem(projectRoot3);
  if (moduleSystem === "esm") {
    const { pathToFileURL } = await import("url");
    const fileUrl = pathToFileURL(modulePath).href;
    return await import(fileUrl);
  }
  return require(modulePath);
}

// src/commons.ts
var import_fs2 = require("fs");
var import_path2 = __toESM(require("path"));
var import_client = require("@clickhouse/client");
var import_kafka_javascript = require("@514labs/kafka-javascript");
var { Kafka } = import_kafka_javascript.KafkaJS;
function walkDirectory(dir, extensions) {
  const results = [];
  if (!(0, import_fs2.existsSync)(dir)) {
    return results;
  }
  try {
    const entries = (0, import_fs2.readdirSync)(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = import_path2.default.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules") {
          results.push(...walkDirectory(fullPath, extensions));
        }
      } else if (entry.isFile()) {
        const ext = import_path2.default.extname(entry.name);
        if (extensions.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  } catch (e) {
    console.debug(`[moose] Failed to read directory ${dir}:`, e);
  }
  return results;
}
function addJsExtensionToImports(content2, fileDir) {
  const fromPattern = /(from\s+['"])(\.\.?\/[^'"]*?)(['"])/g;
  const bareImportPattern = /(import\s+['"])(\.\.?\/[^'"]*?)(['"])/g;
  const dynamicPattern = /(import\s*\(\s*['"])(\.\.?\/[^'"]*?)(['"])/g;
  let result = content2;
  result = result.replace(fromPattern, (match, prefix, importPath, quote) => {
    return rewriteImportPath(match, prefix, importPath, quote, fileDir);
  });
  result = result.replace(
    bareImportPattern,
    (match, prefix, importPath, quote) => {
      return rewriteImportPath(match, prefix, importPath, quote, fileDir);
    }
  );
  result = result.replace(
    dynamicPattern,
    (match, prefix, importPath, quote) => {
      return rewriteImportPath(match, prefix, importPath, quote, fileDir);
    }
  );
  return result;
}
function rewriteImportPath(match, prefix, importPath, quote, fileDir) {
  if (/\.[cm]?js$/.test(importPath)) {
    return match;
  }
  if (/\.json$/.test(importPath)) {
    return match;
  }
  if (fileDir) {
    const resolvedPath = import_path2.default.resolve(fileDir, importPath);
    if ((0, import_fs2.existsSync)(`${resolvedPath}.js`)) {
      return `${prefix}${importPath}.js${quote}`;
    }
    if ((0, import_fs2.existsSync)(import_path2.default.join(resolvedPath, "index.js"))) {
      return `${prefix}${importPath}/index.js${quote}`;
    }
    if ((0, import_fs2.existsSync)(`${resolvedPath}.mjs`)) {
      return `${prefix}${importPath}.mjs${quote}`;
    }
    if ((0, import_fs2.existsSync)(import_path2.default.join(resolvedPath, "index.mjs"))) {
      return `${prefix}${importPath}/index.mjs${quote}`;
    }
    if ((0, import_fs2.existsSync)(`${resolvedPath}.cjs`)) {
      return `${prefix}${importPath}.cjs${quote}`;
    }
    if ((0, import_fs2.existsSync)(import_path2.default.join(resolvedPath, "index.cjs"))) {
      return `${prefix}${importPath}/index.cjs${quote}`;
    }
  }
  return `${prefix}${importPath}.js${quote}`;
}
function rewriteImportExtensions(outDir2) {
  const files = walkDirectory(outDir2, [".js", ".mjs"]);
  for (const filePath of files) {
    const content2 = (0, import_fs2.readFileSync)(filePath, "utf-8");
    const fileDir = import_path2.default.dirname(filePath);
    const rewritten = addJsExtensionToImports(content2, fileDir);
    if (content2 !== rewritten) {
      (0, import_fs2.writeFileSync)(filePath, rewritten, "utf-8");
    }
  }
}

// src/moose-tspc.ts
var args = process.argv.slice(2);
var watchMode = args.includes("--watch");
var cliOutDir = args.find((arg) => !arg.startsWith("--"));
var projectRoot2 = process.cwd();
var tsconfigPath = import_path3.default.join(projectRoot2, "tsconfig.json");
var tempTsconfigPath = import_path3.default.join(projectRoot2, "tsconfig.moose-build.json");
var userOutDir = readUserOutDir(projectRoot2);
var outDir = cliOutDir || userOutDir || DEFAULT_OUT_DIR;
var shouldAddOutDir = cliOutDir !== void 0 || !userOutDir;
function emitEvent(event) {
  console.log(JSON.stringify(event));
}
function createBuildTsconfig(moduleOptions) {
  return {
    extends: "./tsconfig.json",
    compilerOptions: {
      ...MOOSE_COMPILER_OPTIONS,
      ...moduleOptions,
      plugins: [...MOOSE_COMPILER_PLUGINS],
      // Skip type checking of declaration files to avoid dual-package conflicts
      skipLibCheck: true,
      skipDefaultLibCheck: true,
      // Additional settings to handle module resolution conflicts
      allowSyntheticDefaultImports: true,
      // Block emission on errors so build and dev behave consistently
      noEmitOnError: true,
      // Enable incremental compilation for faster rebuilds
      incremental: true,
      tsBuildInfoFile: import_path3.default.join(outDir, ".tsbuildinfo")
    }
  };
}
function runSingleCompilation(moduleSystem) {
  const moduleOptions = getModuleOptions(moduleSystem);
  const buildTsconfig = createBuildTsconfig(moduleOptions);
  (0, import_fs3.writeFileSync)(tempTsconfigPath, JSON.stringify(buildTsconfig, null, 2));
  console.log("Created temporary tsconfig with moose plugins...");
  const tspcArgs = [
    "tspc",
    "-p",
    tempTsconfigPath,
    "--rootDir",
    ".",
    "--sourceMap",
    "--inlineSources"
  ];
  if (shouldAddOutDir) {
    tspcArgs.push("--outDir", outDir);
  }
  (0, import_child_process.execFileSync)("npx", tspcArgs, {
    stdio: "inherit",
    cwd: projectRoot2
  });
  console.log("TypeScript compilation complete.");
  if (moduleSystem === "esm") {
    console.log("Post-processing ESM imports to add .js extensions...");
    const fullOutDir = import_path3.default.join(projectRoot2, outDir);
    rewriteImportExtensions(fullOutDir);
    console.log("ESM import rewriting complete.");
  }
}
function runWatchCompilation(moduleSystem) {
  const moduleOptions = getModuleOptions(moduleSystem);
  const buildTsconfig = createBuildTsconfig(moduleOptions);
  (0, import_fs3.writeFileSync)(tempTsconfigPath, JSON.stringify(buildTsconfig, null, 2));
  const fullOutDir = import_path3.default.join(projectRoot2, outDir);
  if (!(0, import_fs3.existsSync)(fullOutDir)) {
    (0, import_fs3.mkdirSync)(fullOutDir, { recursive: true });
  }
  let currentDiagnostics = [];
  let errorCount = 0;
  let warningCount = 0;
  const tspcArgs = [
    "tspc",
    "-p",
    tempTsconfigPath,
    "--rootDir",
    ".",
    "--sourceMap",
    "--inlineSources",
    "--watch",
    "--preserveWatchOutput"
  ];
  if (shouldAddOutDir) {
    tspcArgs.splice(6, 0, "--outDir", outDir);
  }
  const tspcProcess = (0, import_child_process.spawn)("npx", tspcArgs, {
    cwd: projectRoot2,
    stdio: ["ignore", "pipe", "pipe"]
  });
  const cleanup = () => {
    if ((0, import_fs3.existsSync)(tempTsconfigPath)) {
      (0, import_fs3.unlinkSync)(tempTsconfigPath);
    }
    tspcProcess.kill();
  };
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
  let buffer = "";
  const stripAnsi = (str) => str.replace(
    /[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d/#&.:=?%@~_]*)*)?[\u0007])|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g,
    ""
  );
  const compilationStartedRegex = /Starting compilation in watch mode|Starting incremental compilation/;
  const compilationCompleteRegex = /Found\s+(\d+)\s+error(?:s)?\..*Watching for file changes/;
  const diagnosticRegex = /\(\d+,\d+\):\s*(error|warning)\s+TS\d+:/;
  const processLine = (line) => {
    const cleanLine = stripAnsi(line);
    if (compilationStartedRegex.test(cleanLine)) {
      currentDiagnostics = [];
      errorCount = 0;
      warningCount = 0;
      emitEvent({ event: "compile_start" });
    } else if (compilationCompleteRegex.test(cleanLine)) {
      const match = cleanLine.match(/Found\s+(\d+)\s+error(?:s)?\./);
      if (match) {
        errorCount = parseInt(match[1], 10);
      }
      if (errorCount === 0 && moduleSystem === "esm") {
        try {
          rewriteImportExtensions(fullOutDir);
        } catch (e) {
          console.error("Warning: ESM import rewriting failed:", e);
        }
      }
      if (errorCount > 0) {
        emitEvent({
          event: "compile_error",
          errors: errorCount,
          warnings: warningCount,
          diagnostics: currentDiagnostics
        });
      } else {
        emitEvent({
          event: "compile_complete",
          errors: 0,
          warnings: warningCount,
          diagnostics: warningCount > 0 ? currentDiagnostics : void 0
        });
      }
    } else if (diagnosticRegex.test(cleanLine)) {
      currentDiagnostics.push(cleanLine.trim());
      if (cleanLine.includes(": error ")) {
        errorCount++;
      } else if (cleanLine.includes(": warning ")) {
        warningCount++;
      }
    }
  };
  tspcProcess.stdout.on("data", (data) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.trim()) {
        processLine(line);
      }
    }
  });
  tspcProcess.stderr.on("data", (data) => {
    process.stderr.write(data.toString());
  });
  tspcProcess.on("error", (err) => {
    console.error("Failed to start tspc:", err);
    cleanup();
    process.exit(1);
  });
  tspcProcess.on("exit", (code) => {
    cleanup();
    if (code !== 0) {
      process.exit(code || 1);
    }
  });
}
function writeCompileConfig() {
  const mooseDir = import_path3.default.join(projectRoot2, ".moose");
  if (!(0, import_fs3.existsSync)(mooseDir)) {
    (0, import_fs3.mkdirSync)(mooseDir, { recursive: true });
  }
  const configPath = import_path3.default.join(mooseDir, ".compile-config.json");
  (0, import_fs3.writeFileSync)(configPath, JSON.stringify({ outDir }, null, 2));
}
if (!(0, import_fs3.existsSync)(tsconfigPath)) {
  console.error("Error: tsconfig.json not found in", projectRoot2);
  process.exit(1);
}
try {
  writeCompileConfig();
  const moduleSystem = detectModuleSystem(projectRoot2);
  if (watchMode) {
    runWatchCompilation(moduleSystem);
  } else {
    console.log(`Compiling TypeScript to ${outDir}...`);
    console.log(
      `Using ${moduleSystem.toUpperCase()} module output (detected from package.json)...`
    );
    runSingleCompilation(moduleSystem);
    console.log("Compilation complete.");
    if ((0, import_fs3.existsSync)(tempTsconfigPath)) {
      (0, import_fs3.unlinkSync)(tempTsconfigPath);
    }
  }
} catch (error) {
  console.error("Build process failed:", error);
  if ((0, import_fs3.existsSync)(tempTsconfigPath)) {
    (0, import_fs3.unlinkSync)(tempTsconfigPath);
  }
  process.exit(1);
}
//# sourceMappingURL=moose-tspc.js.map