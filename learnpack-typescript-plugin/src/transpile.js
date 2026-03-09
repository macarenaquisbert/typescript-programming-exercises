const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const { CompilationError } = require("learnpack/plugin");

const DEFAULT_TS_ENTRY = "app.ts";

function findFile(exercise, fileName) {
  return exercise.files
    .map((f) => "./" + f.path)
    .find((f) => f.endsWith(fileName) && fs.existsSync(f));
}

function resolveEntryPath(exercise) {
  // Always prioritize TypeScript source when present, even if LearnPack
  // UI/runtime entry is configured as app.js for compatibility.
  const tsPath = findFile(exercise, DEFAULT_TS_ENTRY);
  if (tsPath) return tsPath;

  const configuredEntry = exercise.entry || "app.js";
  const configuredPath = findFile(exercise, configuredEntry);
  if (configuredPath) return configuredPath;

  throw new Error(
    `No entry file found. Expected ${DEFAULT_TS_ENTRY} or ${configuredEntry} in exercise files.`
  );
}

function resolveOptions(configuration) {
  const rootDir = (configuration && configuration.dirPath) || process.cwd();
  const configPath = ts.findConfigFile(rootDir, ts.sys.fileExists, "tsconfig.json");

  let configOptions = {};
  if (configPath) {
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    if (configFile.error) {
      throw new Error(formatDiagnostic(configFile.error));
    }
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(configPath)
    );
    configOptions = parsedConfig.options || {};
  }

  return {
    ...configOptions,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2019,
    esModuleInterop: true,
    sourceMap: false,
    inlineSourceMap: false
  };
}

function formatDiagnostic(diagnostic) {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
  if (!diagnostic.file || typeof diagnostic.start !== "number") {
    return `TypeScript error: ${message}`;
  }
  const pos = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
  const line = pos.line + 1;
  const column = pos.character + 1;
  return `${diagnostic.file.fileName}:${line}:${column} - TS${diagnostic.code}: ${message}`;
}

function transpileExercise(exercise, configuration) {
  try {
    const entryPath = resolveEntryPath(exercise);
    const sourceCode = fs.readFileSync(entryPath, "utf8");
    const options = resolveOptions(configuration);

    const transpileResult = ts.transpileModule(sourceCode, {
      compilerOptions: options,
      fileName: entryPath,
      reportDiagnostics: true
    });

    const diagnostics = (transpileResult.diagnostics || []).filter(
      (d) => d.category === ts.DiagnosticCategory.Error
    );
    if (diagnostics.length > 0) {
      const message = diagnostics.slice(0, 20).map(formatDiagnostic).join("\n");
      throw new Error(message);
    }

    const outputPath = path.join(path.dirname(entryPath), "app.js");
    fs.writeFileSync(outputPath, transpileResult.outputText, "utf8");

    return { outputPath, sourceCode };
  } catch (error) {
    throw CompilationError(error.message || String(error));
  }
}

function withJsEntry(exercise) {
  return {
    ...exercise,
    entry: "app.js"
  };
}

module.exports = {
  transpileExercise,
  withJsEntry
};
