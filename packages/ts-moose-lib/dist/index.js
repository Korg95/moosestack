"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/commons.ts
var commons_exports = {};
__export(commons_exports, {
  ACKs: () => ACKs,
  MAX_RETRIES: () => MAX_RETRIES,
  MAX_RETRIES_PRODUCER: () => MAX_RETRIES_PRODUCER,
  MAX_RETRY_TIME_MS: () => MAX_RETRY_TIME_MS,
  RETRY_FACTOR_PRODUCER: () => RETRY_FACTOR_PRODUCER,
  RETRY_INITIAL_TIME_MS: () => RETRY_INITIAL_TIME_MS,
  antiCachePath: () => antiCachePath,
  cliLog: () => cliLog,
  compilerLog: () => compilerLog,
  createProducerConfig: () => createProducerConfig,
  getClickhouseClient: () => getClickhouseClient,
  getFileName: () => getFileName,
  getKafkaClient: () => getKafkaClient,
  getKafkaProducer: () => getKafkaProducer,
  logError: () => logError,
  mapTstoJs: () => mapTstoJs,
  rewriteImportExtensions: () => rewriteImportExtensions
});
function isTruthy(value) {
  if (!value) return false;
  switch (value.trim().toLowerCase()) {
    case "1":
    case "true":
    case "yes":
    case "on":
      return true;
    default:
      return false;
  }
}
function mapTstoJs(filePath) {
  return filePath.replace(/\.ts$/, ".js").replace(/\.cts$/, ".cjs").replace(/\.mts$/, ".mjs");
}
function walkDirectory(dir, extensions) {
  const results = [];
  if (!(0, import_fs.existsSync)(dir)) {
    return results;
  }
  try {
    const entries = (0, import_fs.readdirSync)(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = import_path.default.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules") {
          results.push(...walkDirectory(fullPath, extensions));
        }
      } else if (entry.isFile()) {
        const ext = import_path.default.extname(entry.name);
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
    const resolvedPath = import_path.default.resolve(fileDir, importPath);
    if ((0, import_fs.existsSync)(`${resolvedPath}.js`)) {
      return `${prefix}${importPath}.js${quote}`;
    }
    if ((0, import_fs.existsSync)(import_path.default.join(resolvedPath, "index.js"))) {
      return `${prefix}${importPath}/index.js${quote}`;
    }
    if ((0, import_fs.existsSync)(`${resolvedPath}.mjs`)) {
      return `${prefix}${importPath}.mjs${quote}`;
    }
    if ((0, import_fs.existsSync)(import_path.default.join(resolvedPath, "index.mjs"))) {
      return `${prefix}${importPath}/index.mjs${quote}`;
    }
    if ((0, import_fs.existsSync)(`${resolvedPath}.cjs`)) {
      return `${prefix}${importPath}.cjs${quote}`;
    }
    if ((0, import_fs.existsSync)(import_path.default.join(resolvedPath, "index.cjs"))) {
      return `${prefix}${importPath}/index.cjs${quote}`;
    }
  }
  return `${prefix}${importPath}.js${quote}`;
}
function rewriteImportExtensions(outDir) {
  const files = walkDirectory(outDir, [".js", ".mjs"]);
  for (const filePath of files) {
    const content2 = (0, import_fs.readFileSync)(filePath, "utf-8");
    const fileDir = import_path.default.dirname(filePath);
    const rewritten = addJsExtensionToImports(content2, fileDir);
    if (content2 !== rewritten) {
      (0, import_fs.writeFileSync)(filePath, rewritten, "utf-8");
    }
  }
}
function createProducerConfig(maxMessageBytes) {
  return {
    kafkaJS: {
      idempotent: false,
      // Not needed for at-least-once delivery
      acks: ACKs,
      retry: {
        retries: MAX_RETRIES_PRODUCER,
        maxRetryTime: MAX_RETRY_TIME_MS
      }
    },
    "linger.ms": 0,
    // This is to make sure at least once delivery with immediate feedback on the send
    ...maxMessageBytes && { "message.max.bytes": maxMessageBytes }
  };
}
async function getKafkaProducer(cfg, logger, maxMessageBytes) {
  const kafka = await getKafkaClient(cfg, logger);
  const producer = kafka.producer(createProducerConfig(maxMessageBytes));
  await producer.connect();
  return producer;
}
var import_fs, import_path, import_client, import_kafka_javascript, Kafka, compilerLog, antiCachePath, getFileName, getClickhouseClient, cliLog, MAX_RETRIES, MAX_RETRY_TIME_MS, RETRY_INITIAL_TIME_MS, MAX_RETRIES_PRODUCER, RETRY_FACTOR_PRODUCER, ACKs, parseBrokerString, logError, buildSaslConfig, getKafkaClient;
var init_commons = __esm({
  "src/commons.ts"() {
    "use strict";
    import_fs = require("fs");
    import_path = __toESM(require("path"));
    import_client = require("@clickhouse/client");
    import_kafka_javascript = require("@514labs/kafka-javascript");
    ({ Kafka } = import_kafka_javascript.KafkaJS);
    compilerLog = (message) => {
      if (!isTruthy(process.env.MOOSE_DISABLE_COMPILER_LOGS)) {
        console.log(message);
      }
    };
    antiCachePath = (path6) => `${path6}?num=${Math.random().toString()}&time=${Date.now()}`;
    getFileName = (filePath) => {
      const regex = /\/([^\/]+)\.ts/;
      const matches = filePath.match(regex);
      if (matches && matches.length > 1) {
        return matches[1];
      }
      return "";
    };
    getClickhouseClient = ({
      username,
      password,
      database,
      useSSL,
      host,
      port
    }) => {
      const protocol = useSSL === "1" || useSSL.toLowerCase() === "true" ? "https" : "http";
      console.log(`Connecting to Clickhouse at ${protocol}://${host}:${port}`);
      return (0, import_client.createClient)({
        url: `${protocol}://${host}:${port}`,
        username,
        password,
        database,
        application: "moose"
        // Note: wait_end_of_query is configured per operation type, not globally
        // to preserve SELECT query performance while ensuring INSERT/DDL reliability
      });
    };
    cliLog = (log) => {
      const level = log.message_type === "Error" ? "error" : log.message_type === "Warning" ? "warn" : "info";
      const structuredLog = {
        __moose_structured_log__: true,
        level,
        message: log.message,
        resource_type: "runtime",
        cli_action: log.action,
        cli_message_type: log.message_type ?? "Info",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      process.stderr.write(JSON.stringify(structuredLog) + "\n");
    };
    MAX_RETRIES = 150;
    MAX_RETRY_TIME_MS = 1e3;
    RETRY_INITIAL_TIME_MS = 100;
    MAX_RETRIES_PRODUCER = 150;
    RETRY_FACTOR_PRODUCER = 0.2;
    ACKs = -1;
    parseBrokerString = (brokerString) => brokerString.split(",").map((b) => b.trim()).filter((b) => b.length > 0);
    logError = (logger, e) => {
      logger.error(e.message);
      const stack = e.stack;
      if (stack) {
        logger.error(stack);
      }
    };
    buildSaslConfig = (logger, args) => {
      const mechanism = args.saslMechanism ? args.saslMechanism.toLowerCase() : "";
      switch (mechanism) {
        case "plain":
        case "scram-sha-256":
        case "scram-sha-512":
          return {
            mechanism,
            username: args.saslUsername || "",
            password: args.saslPassword || ""
          };
        default:
          logger.warn(`Unsupported SASL mechanism: ${args.saslMechanism}`);
          return void 0;
      }
    };
    getKafkaClient = async (cfg, logger) => {
      const brokers = parseBrokerString(cfg.broker || "");
      if (brokers.length === 0) {
        throw new Error(`No valid broker addresses found in: "${cfg.broker}"`);
      }
      logger.log(`Creating Kafka client with brokers: ${brokers.join(", ")}`);
      logger.log(`Security protocol: ${cfg.securityProtocol || "plaintext"}`);
      logger.log(`Client ID: ${cfg.clientId}`);
      const saslConfig = buildSaslConfig(logger, cfg);
      return new Kafka({
        kafkaJS: {
          clientId: cfg.clientId,
          brokers,
          ssl: cfg.securityProtocol === "SASL_SSL",
          ...saslConfig && { sasl: saslConfig },
          retry: {
            initialRetryTime: RETRY_INITIAL_TIME_MS,
            maxRetryTime: MAX_RETRY_TIME_MS,
            retries: MAX_RETRIES
          }
        }
      });
    };
  }
});

// src/config/configFile.ts
async function findConfigFile(startDir = process.cwd()) {
  const fs4 = await import("fs");
  let currentDir = import_node_path3.default.resolve(startDir);
  while (true) {
    const configPath = import_node_path3.default.join(currentDir, "moose.config.toml");
    if (fs4.existsSync(configPath)) {
      return configPath;
    }
    const parentDir = import_node_path3.default.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }
  return null;
}
async function readProjectConfig() {
  const fs4 = await import("fs");
  const configPath = await findConfigFile();
  if (!configPath) {
    throw new ConfigError(
      "moose.config.toml not found in current directory or any parent directory"
    );
  }
  try {
    const configContent = fs4.readFileSync(configPath, "utf-8");
    const config = toml.parse(configContent);
    return config;
  } catch (error) {
    throw new ConfigError(`Failed to parse moose.config.toml: ${error}`);
  }
}
var import_node_path3, toml, ConfigError;
var init_configFile = __esm({
  "src/config/configFile.ts"() {
    "use strict";
    import_node_path3 = __toESM(require("path"));
    toml = __toESM(require("toml"));
    ConfigError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "ConfigError";
      }
    };
  }
});

// src/config/runtime.ts
var runtime_exports = {};
var ConfigurationRegistry;
var init_runtime = __esm({
  "src/config/runtime.ts"() {
    "use strict";
    init_configFile();
    ConfigurationRegistry = class _ConfigurationRegistry {
      static instance;
      clickhouseConfig;
      kafkaConfig;
      static getInstance() {
        if (!_ConfigurationRegistry.instance) {
          _ConfigurationRegistry.instance = new _ConfigurationRegistry();
        }
        return _ConfigurationRegistry.instance;
      }
      setClickHouseConfig(config) {
        this.clickhouseConfig = config;
      }
      setKafkaConfig(config) {
        this.kafkaConfig = config;
      }
      _env(name) {
        const value = process.env[name];
        if (value === void 0) return void 0;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : void 0;
      }
      _parseBool(value) {
        if (value === void 0) return void 0;
        switch (value.trim().toLowerCase()) {
          case "1":
          case "true":
          case "yes":
          case "on":
            return true;
          case "0":
          case "false":
          case "no":
          case "off":
            return false;
          default:
            return void 0;
        }
      }
      async getClickHouseConfig() {
        if (this.clickhouseConfig) {
          return this.clickhouseConfig;
        }
        const projectConfig = await readProjectConfig();
        const envHost = this._env("MOOSE_CLICKHOUSE_CONFIG__HOST");
        const envPort = this._env("MOOSE_CLICKHOUSE_CONFIG__HOST_PORT");
        const envUser = this._env("MOOSE_CLICKHOUSE_CONFIG__USER");
        const envPassword = this._env("MOOSE_CLICKHOUSE_CONFIG__PASSWORD");
        const envDb = this._env("MOOSE_CLICKHOUSE_CONFIG__DB_NAME");
        const envUseSSL = this._parseBool(
          this._env("MOOSE_CLICKHOUSE_CONFIG__USE_SSL")
        );
        return {
          host: envHost ?? projectConfig.clickhouse_config.host,
          port: envPort ?? projectConfig.clickhouse_config.host_port.toString(),
          username: envUser ?? projectConfig.clickhouse_config.user,
          password: envPassword ?? projectConfig.clickhouse_config.password,
          database: envDb ?? projectConfig.clickhouse_config.db_name,
          useSSL: envUseSSL !== void 0 ? envUseSSL : projectConfig.clickhouse_config.use_ssl || false
        };
      }
      async getStandaloneClickhouseConfig(overrides) {
        if (this.clickhouseConfig) {
          return { ...this.clickhouseConfig, ...overrides };
        }
        const envHost = this._env("MOOSE_CLICKHOUSE_CONFIG__HOST");
        const envPort = this._env("MOOSE_CLICKHOUSE_CONFIG__HOST_PORT");
        const envUser = this._env("MOOSE_CLICKHOUSE_CONFIG__USER");
        const envPassword = this._env("MOOSE_CLICKHOUSE_CONFIG__PASSWORD");
        const envDb = this._env("MOOSE_CLICKHOUSE_CONFIG__DB_NAME");
        const envUseSSL = this._parseBool(
          this._env("MOOSE_CLICKHOUSE_CONFIG__USE_SSL")
        );
        let projectConfig;
        try {
          projectConfig = await readProjectConfig();
        } catch (error) {
          projectConfig = null;
        }
        const defaults = {
          host: "localhost",
          port: "18123",
          username: "default",
          password: "",
          database: "local",
          useSSL: false
        };
        return {
          host: overrides?.host ?? envHost ?? projectConfig?.clickhouse_config.host ?? defaults.host,
          port: overrides?.port ?? envPort ?? projectConfig?.clickhouse_config.host_port.toString() ?? defaults.port,
          username: overrides?.username ?? envUser ?? projectConfig?.clickhouse_config.user ?? defaults.username,
          password: overrides?.password ?? envPassword ?? projectConfig?.clickhouse_config.password ?? defaults.password,
          database: overrides?.database ?? envDb ?? projectConfig?.clickhouse_config.db_name ?? defaults.database,
          useSSL: overrides?.useSSL ?? envUseSSL ?? projectConfig?.clickhouse_config.use_ssl ?? defaults.useSSL
        };
      }
      async getKafkaConfig() {
        if (this.kafkaConfig) {
          return this.kafkaConfig;
        }
        const projectConfig = await readProjectConfig();
        const envBroker = this._env("MOOSE_REDPANDA_CONFIG__BROKER") ?? this._env("MOOSE_KAFKA_CONFIG__BROKER");
        const envMsgTimeout = this._env("MOOSE_REDPANDA_CONFIG__MESSAGE_TIMEOUT_MS") ?? this._env("MOOSE_KAFKA_CONFIG__MESSAGE_TIMEOUT_MS");
        const envSaslUsername = this._env("MOOSE_REDPANDA_CONFIG__SASL_USERNAME") ?? this._env("MOOSE_KAFKA_CONFIG__SASL_USERNAME");
        const envSaslPassword = this._env("MOOSE_REDPANDA_CONFIG__SASL_PASSWORD") ?? this._env("MOOSE_KAFKA_CONFIG__SASL_PASSWORD");
        const envSaslMechanism = this._env("MOOSE_REDPANDA_CONFIG__SASL_MECHANISM") ?? this._env("MOOSE_KAFKA_CONFIG__SASL_MECHANISM");
        const envSecurityProtocol = this._env("MOOSE_REDPANDA_CONFIG__SECURITY_PROTOCOL") ?? this._env("MOOSE_KAFKA_CONFIG__SECURITY_PROTOCOL");
        const envNamespace = this._env("MOOSE_REDPANDA_CONFIG__NAMESPACE") ?? this._env("MOOSE_KAFKA_CONFIG__NAMESPACE");
        const envSchemaRegistryUrl = this._env("MOOSE_REDPANDA_CONFIG__SCHEMA_REGISTRY_URL") ?? this._env("MOOSE_KAFKA_CONFIG__SCHEMA_REGISTRY_URL");
        const fileKafka = projectConfig.kafka_config ?? projectConfig.redpanda_config;
        return {
          broker: envBroker ?? fileKafka?.broker ?? "localhost:19092",
          messageTimeoutMs: envMsgTimeout ? parseInt(envMsgTimeout, 10) : fileKafka?.message_timeout_ms ?? 1e3,
          saslUsername: envSaslUsername ?? fileKafka?.sasl_username,
          saslPassword: envSaslPassword ?? fileKafka?.sasl_password,
          saslMechanism: envSaslMechanism ?? fileKafka?.sasl_mechanism,
          securityProtocol: envSecurityProtocol ?? fileKafka?.security_protocol,
          namespace: envNamespace ?? fileKafka?.namespace,
          schemaRegistryUrl: envSchemaRegistryUrl ?? fileKafka?.schema_registry_url
        };
      }
      hasRuntimeConfig() {
        return !!this.clickhouseConfig || !!this.kafkaConfig;
      }
    };
    globalThis._mooseConfigRegistry = ConfigurationRegistry.getInstance();
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ACKs: () => ACKs,
  Api: () => Api,
  ApiHelpers: () => ApiHelpers,
  BadRequestError: () => BadRequestError,
  CSV_DELIMITERS: () => CSV_DELIMITERS,
  ClickHouseEngines: () => ClickHouseEngines,
  ConsumptionApi: () => ConsumptionApi,
  ConsumptionHelpers: () => ConsumptionHelpers,
  DEFAULT_CSV_CONFIG: () => DEFAULT_CSV_CONFIG,
  DEFAULT_JSON_CONFIG: () => DEFAULT_JSON_CONFIG,
  DataSource: () => DataSource,
  DeadLetterQueue: () => DeadLetterQueue,
  ETLPipeline: () => ETLPipeline,
  IngestApi: () => IngestApi,
  IngestPipeline: () => IngestPipeline,
  LifeCycle: () => LifeCycle,
  MAX_RETRIES: () => MAX_RETRIES,
  MAX_RETRIES_PRODUCER: () => MAX_RETRIES_PRODUCER,
  MAX_RETRY_TIME_MS: () => MAX_RETRY_TIME_MS,
  MOOSE_RUNTIME_ENV_PREFIX: () => MOOSE_RUNTIME_ENV_PREFIX,
  MaterializedView: () => MaterializedView,
  MooseCache: () => MooseCache,
  MooseClient: () => MooseClient,
  OlapTable: () => OlapTable,
  QueryClient: () => QueryClient,
  RETRY_FACTOR_PRODUCER: () => RETRY_FACTOR_PRODUCER,
  RETRY_INITIAL_TIME_MS: () => RETRY_INITIAL_TIME_MS,
  Sql: () => Sql,
  SqlResource: () => SqlResource,
  Stream: () => Stream,
  Task: () => Task,
  View: () => View,
  WebApp: () => WebApp,
  Workflow: () => Workflow,
  WorkflowClient: () => WorkflowClient,
  and: () => and,
  antiCachePath: () => antiCachePath,
  as: () => as,
  assertValid: () => assertValid,
  avg: () => avg,
  between: () => between,
  buildQuery: () => buildQuery,
  cliLog: () => cliLog,
  columnsFromTable: () => columnsFromTable,
  compilerLog: () => compilerLog,
  count: () => count,
  countDistinct: () => countDistinct,
  createClickhouseParameter: () => createClickhouseParameter,
  createModelTool: () => createModelTool,
  createProducerConfig: () => createProducerConfig,
  createQueryHandler: () => createQueryHandler,
  defineQueryModel: () => defineQueryModel,
  deriveInputTypeFromDataType: () => deriveInputTypeFromDataType,
  empty: () => empty,
  eq: () => eq,
  expressMiddleware: () => expressMiddleware,
  filter: () => filter,
  filtersFromTable: () => filtersFromTable,
  getApi: () => getApi,
  getApis: () => getApis,
  getClickhouseClient: () => getClickhouseClient,
  getFileName: () => getFileName,
  getIngestApi: () => getIngestApi,
  getIngestApis: () => getIngestApis,
  getKafkaClient: () => getKafkaClient,
  getKafkaProducer: () => getKafkaProducer,
  getLegacyMooseUtils: () => getLegacyMooseUtils,
  getMaterializedView: () => getMaterializedView,
  getMaterializedViews: () => getMaterializedViews,
  getMooseClients: () => getMooseClients,
  getMooseUtils: () => getMooseUtils,
  getMooseUtilsFromRequest: () => getMooseUtilsFromRequest,
  getSqlResource: () => getSqlResource,
  getSqlResources: () => getSqlResources,
  getStream: () => getStream,
  getStreams: () => getStreams,
  getTable: () => getTable,
  getTables: () => getTables,
  getTemporalClient: () => getTemporalClient,
  getValueFromParameter: () => getValueFromParameter,
  getView: () => getView,
  getViews: () => getViews,
  getWebApp: () => getWebApp,
  getWebApps: () => getWebApps,
  getWorkflow: () => getWorkflow,
  getWorkflows: () => getWorkflows2,
  groupBy: () => groupBy,
  gt: () => gt,
  gte: () => gte,
  having: () => having,
  ilike: () => ilike,
  inList: () => inList,
  isEmpty: () => isEmpty,
  isNotNull: () => isNotNull,
  isNull: () => isNull,
  isValidCSVDelimiter: () => isValidCSVDelimiter,
  join: () => join2,
  joinQueries: () => joinQueries,
  like: () => like,
  limit: () => limit,
  logError: () => logError,
  lt: () => lt,
  lte: () => lte,
  mapToClickHouseType: () => mapToClickHouseType,
  mapTstoJs: () => mapTstoJs,
  max: () => max,
  min: () => min,
  mooseEnvSecrets: () => mooseEnvSecrets,
  mooseRuntimeEnv: () => mooseRuntimeEnv,
  ne: () => ne,
  not: () => not,
  notIn: () => notIn,
  offset: () => offset,
  or: () => or,
  orderBy: () => orderBy,
  paginate: () => paginate,
  parseCSV: () => parseCSV,
  parseJSON: () => parseJSON,
  parseJSONWithDates: () => parseJSONWithDates,
  quoteIdentifier: () => quoteIdentifier,
  raw: () => raw,
  registerModelTools: () => registerModelTools,
  rewriteImportExtensions: () => rewriteImportExtensions,
  select: () => select,
  sql: () => sql,
  sum: () => sum,
  timeDimensions: () => timeDimensions,
  toQuery: () => toQuery,
  toQueryPreview: () => toQueryPreview,
  toStaticQuery: () => toStaticQuery,
  where: () => where
});
module.exports = __toCommonJS(index_exports);

// src/dmv2/utils/stackTrace.ts
function shouldSkipStackLine(line) {
  return line.includes("node_modules") || // Skip npm installed packages (prod)
  line.includes("node:internal") || // Skip Node.js internals (modern format)
  line.includes("internal/modules") || // Skip Node.js internals (older format)
  line.includes("ts-node") || // Skip TypeScript execution
  line.includes("/ts-moose-lib/src/") || // Skip dev/linked moose-lib src (Unix)
  line.includes("\\ts-moose-lib\\src\\") || // Skip dev/linked moose-lib src (Windows)
  line.includes("/ts-moose-lib/dist/") || // Skip dev/linked moose-lib dist (Unix)
  line.includes("\\ts-moose-lib\\dist\\");
}
function parseStackLine(line) {
  const match = line.match(/\((.*):(\d+):(\d+)\)/) || line.match(/at (.*):(\d+):(\d+)/);
  if (match && match[1]) {
    return {
      file: match[1],
      line: match[2]
    };
  }
  return void 0;
}
function getSourceFileInfo(stack) {
  if (!stack) return {};
  const lines = stack.split("\n");
  for (const line of lines) {
    if (shouldSkipStackLine(line)) continue;
    const info = parseStackLine(line);
    if (info) return info;
  }
  return {};
}
function getSourceLocationFromStack(stack) {
  if (!stack) return void 0;
  const lines = stack.split("\n");
  for (const line of lines.slice(1)) {
    if (shouldSkipStackLine(line)) {
      continue;
    }
    const v8Match = line.match(/at\s+(?:.*?\s+\()?(.+):(\d+):(\d+)\)?/);
    if (v8Match) {
      return {
        file: v8Match[1],
        line: parseInt(v8Match[2], 10),
        column: parseInt(v8Match[3], 10)
      };
    }
    const smMatch = line.match(/(?:.*@)?(.+):(\d+):(\d+)/);
    if (smMatch) {
      return {
        file: smMatch[1],
        line: parseInt(smMatch[2], 10),
        column: parseInt(smMatch[3], 10)
      };
    }
  }
  return void 0;
}
function getSourceFileFromStack(stack) {
  const location = getSourceLocationFromStack(stack);
  return location?.file;
}

// src/dmv2/typedBase.ts
var TypedBase = class {
  /** The JSON schema representation of type T. Injected by the compiler plugin. */
  schema;
  /** The name assigned to this resource instance. */
  name;
  /** A dictionary mapping column names (keys of T) to their Column definitions. */
  columns;
  /** An array containing the Column definitions for this resource. Injected by the compiler plugin. */
  columnArray;
  /** The configuration object specific to this resource type. */
  config;
  /** Typia validation functions for type T. Injected by the compiler plugin for OlapTable. */
  validators;
  /** Optional metadata for the resource, always present as an object. */
  metadata;
  /**
   * Whether this resource allows extra fields beyond the defined columns.
   * When true, extra fields in payloads are passed through to streaming functions.
   * Injected by the compiler plugin when the type has an index signature.
   */
  allowExtraFields;
  /**
   * @internal Constructor intended for internal use by subclasses and the compiler plugin.
   * It expects the schema and columns to be provided, typically injected by the compiler.
   *
   * @param name The name for the resource instance.
   * @param config The configuration object for the resource.
   * @param schema The JSON schema for the resource's data type T (injected).
   * @param columns The array of Column definitions for T (injected).
   * @param allowExtraFields Whether extra fields are allowed (injected when type has index signature).
   */
  constructor(name, config, schema, columns, validators, allowExtraFields) {
    if (schema === void 0 || columns === void 0) {
      throw new Error(
        "Supply the type param T so that the schema is inserted by the compiler plugin."
      );
    }
    this.schema = schema;
    this.columnArray = columns;
    const columnsObj = {};
    columns.forEach((column) => {
      columnsObj[column.name] = column;
    });
    this.columns = columnsObj;
    this.name = name;
    this.config = config;
    this.validators = validators;
    this.allowExtraFields = allowExtraFields ?? false;
    this.metadata = config?.metadata ? { ...config.metadata } : {};
    if (!this.metadata.source) {
      const stack = new Error().stack;
      if (stack) {
        const info = getSourceFileInfo(stack);
        this.metadata.source = { file: info.file, line: info.line };
      }
    }
  }
};

// src/dataModels/dataModelTypes.ts
function isArrayNestedType(dt) {
  return typeof dt === "object" && dt !== null && dt.elementType !== null && typeof dt.elementType === "object" && dt.elementType.hasOwnProperty("columns") && Array.isArray(dt.elementType.columns);
}
function isNestedType(dt) {
  return typeof dt === "object" && dt !== null && Array.isArray(dt.columns);
}

// src/dataModels/types.ts
var ClickHouseEngines = /* @__PURE__ */ ((ClickHouseEngines2) => {
  ClickHouseEngines2["MergeTree"] = "MergeTree";
  ClickHouseEngines2["ReplacingMergeTree"] = "ReplacingMergeTree";
  ClickHouseEngines2["SummingMergeTree"] = "SummingMergeTree";
  ClickHouseEngines2["AggregatingMergeTree"] = "AggregatingMergeTree";
  ClickHouseEngines2["CollapsingMergeTree"] = "CollapsingMergeTree";
  ClickHouseEngines2["VersionedCollapsingMergeTree"] = "VersionedCollapsingMergeTree";
  ClickHouseEngines2["GraphiteMergeTree"] = "GraphiteMergeTree";
  ClickHouseEngines2["S3Queue"] = "S3Queue";
  ClickHouseEngines2["S3"] = "S3";
  ClickHouseEngines2["Buffer"] = "Buffer";
  ClickHouseEngines2["Distributed"] = "Distributed";
  ClickHouseEngines2["IcebergS3"] = "IcebergS3";
  ClickHouseEngines2["Kafka"] = "Kafka";
  ClickHouseEngines2["Merge"] = "Merge";
  ClickHouseEngines2["ReplicatedMergeTree"] = "ReplicatedMergeTree";
  ClickHouseEngines2["ReplicatedReplacingMergeTree"] = "ReplicatedReplacingMergeTree";
  ClickHouseEngines2["ReplicatedAggregatingMergeTree"] = "ReplicatedAggregatingMergeTree";
  ClickHouseEngines2["ReplicatedSummingMergeTree"] = "ReplicatedSummingMergeTree";
  ClickHouseEngines2["ReplicatedCollapsingMergeTree"] = "ReplicatedCollapsingMergeTree";
  ClickHouseEngines2["ReplicatedVersionedCollapsingMergeTree"] = "ReplicatedVersionedCollapsingMergeTree";
  return ClickHouseEngines2;
})(ClickHouseEngines || {});

// src/dmv2/internal.ts
var import_process = __toESM(require("process"));
var path4 = __toESM(require("path"));
init_commons();

// src/compiler-config.ts
var import_fs2 = require("fs");
var import_path2 = __toESM(require("path"));
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
    let content = (0, import_fs2.readFileSync)(
      import_path2.default.join(projectRoot, "tsconfig.json"),
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
function getOutDir(projectRoot2 = process.cwd()) {
  const userOutDir = readUserOutDir(projectRoot2);
  return userOutDir || DEFAULT_OUT_DIR;
}
function getCompiledIndexPath(projectRoot2 = process.cwd()) {
  const outDir = getOutDir(projectRoot2);
  const sourceDir = getSourceDir();
  return import_path2.default.resolve(projectRoot2, outDir, sourceDir, "index.js");
}
function hasCompiledArtifacts(projectRoot2 = process.cwd()) {
  return (0, import_fs2.existsSync)(getCompiledIndexPath(projectRoot2));
}
function detectModuleSystem(projectRoot2 = process.cwd()) {
  const pkgPath = import_path2.default.join(projectRoot2, "package.json");
  if ((0, import_fs2.existsSync)(pkgPath)) {
    try {
      const pkgContent = (0, import_fs2.readFileSync)(pkgPath, "utf-8");
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
async function loadModule(modulePath, projectRoot2 = process.cwd()) {
  const moduleSystem = detectModuleSystem(projectRoot2);
  if (moduleSystem === "esm") {
    const { pathToFileURL } = await import("url");
    const fileUrl = pathToFileURL(modulePath).href;
    return await import(fileUrl);
  }
  return require(modulePath);
}

// src/dmv2/dependencyAnalysis.ts
var import_node_fs2 = __toESM(require("fs"));
var import_node_path2 = __toESM(require("path"));
var import_node_process = __toESM(require("process"));
var import_typescript = __toESM(require("typescript"));
init_commons();

// src/dmv2/utils/sourceFiles.ts
var import_node_fs = __toESM(require("fs"));
var import_node_path = __toESM(require("path"));

// src/dmv2/internal.ts
var isClientOnlyMode = () => import_process.default.env.MOOSE_CLIENT_ONLY === "true";
var MutationTrackingMap = class extends Map {
  onMutate;
  constructor(entries, onMutate) {
    super(entries);
    this.onMutate = onMutate;
  }
  setMutationListener(onMutate) {
    this.onMutate = onMutate;
  }
  set(key, value) {
    super.set(key, value);
    this.onMutate?.();
    return this;
  }
  delete(key) {
    const deleted = super.delete(key);
    if (deleted) {
      this.onMutate?.();
    }
    return deleted;
  }
  clear() {
    if (this.size === 0) {
      return;
    }
    super.clear();
    this.onMutate?.();
  }
};
var registryMutationVersion = 0;
var lineageCache;
var markRegistryMutated = () => {
  registryMutationVersion += 1;
  lineageCache = void 0;
};
function toTrackingMap(map) {
  if (map instanceof MutationTrackingMap) {
    map.setMutationListener(markRegistryMutated);
    return map;
  }
  return new MutationTrackingMap(
    map?.entries(),
    markRegistryMutated
  );
}
function createRegistryFrom(existing) {
  return {
    tables: toTrackingMap(existing?.tables),
    streams: toTrackingMap(existing?.streams),
    ingestApis: toTrackingMap(existing?.ingestApis),
    apis: toTrackingMap(existing?.apis),
    sqlResources: toTrackingMap(existing?.sqlResources),
    workflows: toTrackingMap(existing?.workflows),
    webApps: toTrackingMap(existing?.webApps),
    materializedViews: toTrackingMap(existing?.materializedViews),
    views: toTrackingMap(existing?.views)
  };
}
var moose_internal = {
  tables: new MutationTrackingMap(
    void 0,
    markRegistryMutated
  ),
  streams: new MutationTrackingMap(
    void 0,
    markRegistryMutated
  ),
  ingestApis: new MutationTrackingMap(
    void 0,
    markRegistryMutated
  ),
  apis: new MutationTrackingMap(
    void 0,
    markRegistryMutated
  ),
  sqlResources: new MutationTrackingMap(
    void 0,
    markRegistryMutated
  ),
  workflows: new MutationTrackingMap(
    void 0,
    markRegistryMutated
  ),
  webApps: new MutationTrackingMap(
    void 0,
    markRegistryMutated
  ),
  materializedViews: new MutationTrackingMap(
    void 0,
    markRegistryMutated
  ),
  views: new MutationTrackingMap(void 0, markRegistryMutated)
};
var defaultRetentionPeriod = 60 * 60 * 24 * 7;
var initializeMooseInternalRegistry = () => {
  const existing = globalThis.moose_internal;
  if (existing === void 0) {
    globalThis.moose_internal = moose_internal;
    return;
  }
  globalThis.moose_internal = createRegistryFrom(existing);
};
initializeMooseInternalRegistry();
var getMooseInternal = () => globalThis.moose_internal;
var loadIndex = async () => {
  if (!hasCompiledArtifacts()) {
    const outDir2 = getOutDir();
    const sourceDir = getSourceDir();
    throw new Error(
      `Compiled artifacts not found at ${outDir2}/${sourceDir}/index.js. Run 'npx moose-tspc' to compile your TypeScript first.`
    );
  }
  const registry = getMooseInternal();
  registry.tables.clear();
  registry.streams.clear();
  registry.ingestApis.clear();
  registry.apis.clear();
  registry.sqlResources.clear();
  registry.workflows.clear();
  registry.webApps.clear();
  registry.materializedViews.clear();
  registry.views.clear();
  const outDir = getOutDir();
  const compiledDir = path4.isAbsolute(outDir) ? outDir : path4.join(import_process.default.cwd(), outDir);
  Object.keys(require.cache).forEach((key) => {
    if (key.startsWith(compiledDir)) {
      delete require.cache[key];
    }
  });
  try {
    const indexPath = getCompiledIndexPath();
    await loadModule(indexPath);
  } catch (error) {
    let hint;
    let includeDetails = true;
    const details = error instanceof Error ? error.message : String(error);
    if (details.includes("no transform has been configured") || details.includes("NoTransformConfigurationError")) {
      hint = "\u{1F534} Typia Transformation Error\n\nThis is likely a bug in Moose. The Typia type transformer failed to process your code.\n\nPlease report this issue:\n  \u2022 Moose Slack: https://join.slack.com/t/moose-community/shared_invite/zt-2fjh5n3wz-cnOmM9Xe9DYAgQrNu8xKxg\n  \u2022 Include the stack trace below and the file being processed\n\n";
      includeDetails = false;
    } else if (details.includes("ERR_REQUIRE_ESM") || details.includes("ES Module")) {
      hint = "The file or its dependencies are ESM-only. Switch to packages that dual-support CJS & ESM, or upgrade to Node 22.12+. If you must use Node 20, you may try Node 20.19\n\n";
    }
    if (hint === void 0) {
      throw error;
    } else {
      const errorMsg = includeDetails ? `${hint}${details}` : hint;
      const cause = error instanceof Error ? error : void 0;
      throw new Error(errorMsg, { cause });
    }
  }
};
var dlqSchema = {
  version: "3.1",
  components: {
    schemas: {
      DeadLetterModel: {
        type: "object",
        properties: {
          originalRecord: {
            $ref: "#/components/schemas/Recordstringany"
          },
          errorMessage: {
            type: "string"
          },
          errorType: {
            type: "string"
          },
          failedAt: {
            type: "string",
            format: "date-time"
          },
          source: {
            oneOf: [
              {
                const: "api"
              },
              {
                const: "transform"
              },
              {
                const: "table"
              }
            ]
          }
        },
        required: [
          "originalRecord",
          "errorMessage",
          "errorType",
          "failedAt",
          "source"
        ]
      },
      Recordstringany: {
        type: "object",
        properties: {},
        required: [],
        description: "Construct a type with a set of properties K of type T",
        additionalProperties: {}
      }
    }
  },
  schemas: [
    {
      $ref: "#/components/schemas/DeadLetterModel"
    }
  ]
};
var dlqColumns = [
  {
    name: "originalRecord",
    data_type: "Json",
    primary_key: false,
    required: true,
    unique: false,
    default: null,
    annotations: [],
    ttl: null,
    codec: null,
    materialized: null,
    alias: null,
    comment: null
  },
  {
    name: "errorMessage",
    data_type: "String",
    primary_key: false,
    required: true,
    unique: false,
    default: null,
    annotations: [],
    ttl: null,
    codec: null,
    materialized: null,
    alias: null,
    comment: null
  },
  {
    name: "errorType",
    data_type: "String",
    primary_key: false,
    required: true,
    unique: false,
    default: null,
    annotations: [],
    ttl: null,
    codec: null,
    materialized: null,
    alias: null,
    comment: null
  },
  {
    name: "failedAt",
    data_type: "DateTime",
    primary_key: false,
    required: true,
    unique: false,
    default: null,
    annotations: [],
    ttl: null,
    codec: null,
    materialized: null,
    alias: null,
    comment: null
  },
  {
    name: "source",
    data_type: "String",
    primary_key: false,
    required: true,
    unique: false,
    default: null,
    annotations: [],
    ttl: null,
    codec: null,
    materialized: null,
    alias: null,
    comment: null
  }
];
var getWorkflows = async () => {
  await loadIndex();
  const registry = getMooseInternal();
  return registry.workflows;
};

// src/dmv2/sdk/olapTable.ts
var import_node_stream = require("stream");
var import_node_crypto = require("crypto");

// src/sqlHelpers.ts
var quoteIdentifier = (name) => {
  return name.startsWith("`") && name.endsWith("`") ? name : `\`${name}\``;
};
var isTable = (value) => typeof value === "object" && value !== null && "kind" in value && value.kind === "OlapTable";
var isView = (value) => typeof value === "object" && value !== null && "kind" in value && value.kind === "View";
var isColumn = (value) => typeof value === "object" && value !== null && !("kind" in value) && "name" in value && "annotations" in value;
function sqlImpl(strings, ...values) {
  return new Sql(strings, values);
}
var sql = sqlImpl;
sql.statement = function(strings, ...values) {
  return new Sql(strings, values, false);
};
sql.fragment = function(strings, ...values) {
  return new Sql(strings, values, true);
};
var instanceofSql = (value) => typeof value === "object" && "values" in value && "strings" in value;
var Sql = class _Sql {
  values;
  strings;
  isFragment;
  constructor(rawStrings, rawValues, isFragment) {
    if (rawStrings.length - 1 !== rawValues.length) {
      if (rawStrings.length === 0) {
        throw new TypeError("Expected at least 1 string");
      }
      throw new TypeError(
        `Expected ${rawStrings.length} strings to have ${rawStrings.length - 1} values`
      );
    }
    const valuesLength = rawValues.reduce(
      (len, value) => len + (instanceofSql(value) ? value.values.length : isColumn(value) || isTable(value) || isView(value) ? 0 : 1),
      0
    );
    this.values = new Array(valuesLength);
    this.strings = new Array(valuesLength + 1);
    this.isFragment = isFragment;
    this.strings[0] = rawStrings[0];
    let i = 0, pos = 0;
    while (i < rawValues.length) {
      const child = rawValues[i++];
      const rawString = rawStrings[i];
      if (instanceofSql(child)) {
        this.strings[pos] += child.strings[0];
        let childIndex = 0;
        while (childIndex < child.values.length) {
          this.values[pos++] = child.values[childIndex++];
          this.strings[pos] = child.strings[childIndex];
        }
        this.strings[pos] += rawString;
      } else if (isColumn(child)) {
        const aggregationFunction = child.annotations.find(
          ([k, _]) => k === "aggregationFunction"
        );
        if (aggregationFunction !== void 0) {
          const funcName = aggregationFunction[1].functionName;
          const parenIdx = funcName.indexOf("(");
          const mergedName = parenIdx !== -1 ? `${funcName.slice(0, parenIdx)}Merge${funcName.slice(parenIdx)}` : `${funcName}Merge`;
          this.strings[pos] += `${mergedName}(\`${child.name}\`)`;
        } else {
          this.strings[pos] += `\`${child.name}\``;
        }
        this.strings[pos] += rawString;
      } else if (isTable(child)) {
        if (child.config.database) {
          this.strings[pos] += `\`${child.config.database}\`.\`${child.name}\``;
        } else {
          this.strings[pos] += `\`${child.name}\``;
        }
        this.strings[pos] += rawString;
      } else if (isView(child)) {
        this.strings[pos] += `\`${child.name}\``;
        this.strings[pos] += rawString;
      } else {
        this.values[pos++] = child;
        this.strings[pos] = rawString;
      }
    }
  }
  /**
   * Append another Sql fragment, returning a new Sql instance.
   */
  append(other) {
    return new _Sql(
      [...this.strings, ""],
      [...this.values, other],
      this.isFragment
    );
  }
};
sql.join = function(fragments, separator) {
  if (fragments.length === 0) return new Sql([""], [], true);
  if (fragments.length === 1) {
    const frag = fragments[0];
    return new Sql(frag.strings, frag.values, true);
  }
  const sep = separator ?? ", ";
  const normalized = sep.includes(" ") ? sep : ` ${sep} `;
  const strings = ["", ...Array(fragments.length - 1).fill(normalized), ""];
  return new Sql(strings, fragments, true);
};
sql.raw = function(text) {
  return new Sql([text], [], true);
};
var toStaticQuery = (sql3) => {
  const [query, params] = toQuery(sql3);
  if (Object.keys(params).length !== 0) {
    throw new Error(
      "Dynamic SQL is not allowed in the select statement in view creation."
    );
  }
  return query;
};
var toQuery = (sql3) => {
  const parameterizedStubs = sql3.values.map(
    (v, i) => createClickhouseParameter(i, v)
  );
  const query = sql3.strings.map(
    (s, i) => s != "" ? `${s}${emptyIfUndefined(parameterizedStubs[i])}` : ""
  ).join("");
  const query_params = sql3.values.reduce(
    (acc, v, i) => ({
      ...acc,
      [`p${i}`]: getValueFromParameter(v)
    }),
    {}
  );
  return [query, query_params];
};
var toQueryPreview = (sql3) => {
  try {
    const formatValue = (v) => {
      if (Array.isArray(v)) {
        const [type, val] = v;
        if (type === "Identifier") {
          return `\`${String(val)}\``;
        }
        return `[${v.map((x) => formatValue(x)).join(", ")}]`;
      }
      if (v === null || v === void 0) return "NULL";
      if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
      if (typeof v === "number") return String(v);
      if (typeof v === "boolean") return v ? "true" : "false";
      if (v instanceof Date)
        return `'${v.toISOString().replace("T", " ").slice(0, 19)}'`;
      try {
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    };
    let out = sql3.strings[0] ?? "";
    for (let i = 0; i < sql3.values.length; i++) {
      const val = getValueFromParameter(sql3.values[i]);
      out += formatValue(val);
      out += sql3.strings[i + 1] ?? "";
    }
    return out.replace(/\s+/g, " ").trim();
  } catch (error) {
    console.log(`toQueryPreview error: ${error}`);
    return "/* query preview unavailable */";
  }
};
var getValueFromParameter = (value) => {
  if (Array.isArray(value)) {
    const [type, val] = value;
    if (type === "Identifier") return val;
  }
  return value;
};
function createClickhouseParameter(parameterIndex, value) {
  return `{p${parameterIndex}:${mapToClickHouseType(value)}}`;
}
var mapToClickHouseType = (value) => {
  if (typeof value === "number") {
    return Number.isInteger(value) ? "Int" : "Float";
  }
  if (typeof value === "boolean") return "Bool";
  if (value instanceof Date) return "DateTime";
  if (Array.isArray(value)) {
    const [type, _] = value;
    return type;
  }
  return "String";
};
function emptyIfUndefined(value) {
  return value === void 0 ? "" : value;
}

// src/dmv2/sdk/olapTable.ts
var OlapTable = class extends TypedBase {
  name;
  /** @internal */
  kind = "OlapTable";
  /** @internal Typia validators for Insertable<T> — used during insert validation */
  insertValidators;
  /** @internal Memoized ClickHouse client for reusing connections across insert calls */
  _memoizedClient;
  /** @internal Hash of the configuration used to create the memoized client */
  _configHash;
  /** @internal Cached table name to avoid repeated generation */
  _cachedTableName;
  constructor(name, config, schema, columns, validators, insertValidators) {
    const resolvedConfig = config ? "engine" in config ? config : { ...config, engine: "MergeTree" /* MergeTree */ } : { engine: "MergeTree" /* MergeTree */ };
    const hasFields = Array.isArray(resolvedConfig.orderByFields) && resolvedConfig.orderByFields.length > 0;
    const hasExpr = typeof resolvedConfig.orderByExpression === "string" && resolvedConfig.orderByExpression.length > 0;
    if (hasFields && hasExpr) {
      throw new Error(
        `OlapTable ${name}: Provide either orderByFields or orderByExpression, not both.`
      );
    }
    const hasCluster = typeof resolvedConfig.cluster === "string";
    const hasKeeperPath = typeof resolvedConfig.keeperPath === "string";
    const hasReplicaName = typeof resolvedConfig.replicaName === "string";
    super(name, resolvedConfig, schema, columns, validators);
    this.insertValidators = insertValidators;
    this.name = name;
    const tables = getMooseInternal().tables;
    const registryKey = this.config.version ? `${name}_${this.config.version}` : name;
    if (!isClientOnlyMode() && tables.has(registryKey)) {
      throw new Error(
        `OlapTable with name ${name} and version ${config?.version ?? "unversioned"} already exists`
      );
    }
    tables.set(registryKey, this);
  }
  /**
   * Generates the versioned table name following Moose's naming convention
   * Format: {tableName}_{version_with_dots_replaced_by_underscores}
   */
  generateTableName() {
    if (this._cachedTableName) {
      return this._cachedTableName;
    }
    const tableVersion = this.config.version;
    if (!tableVersion) {
      this._cachedTableName = this.name;
    } else {
      const versionSuffix = tableVersion.replace(/\./g, "_");
      this._cachedTableName = `${this.name}_${versionSuffix}`;
    }
    return this._cachedTableName;
  }
  /**
   * Creates a fast hash of the ClickHouse configuration.
   * Uses crypto.createHash for better performance than JSON.stringify.
   *
   * @private
   */
  createConfigHash(clickhouseConfig) {
    const effectiveDatabase = this.config.database ?? clickhouseConfig.database;
    const configString = `${clickhouseConfig.host}:${clickhouseConfig.port}:${clickhouseConfig.username}:${clickhouseConfig.password}:${effectiveDatabase}:${clickhouseConfig.useSSL}`;
    return (0, import_node_crypto.createHash)("sha256").update(configString).digest("hex").substring(0, 16);
  }
  /**
   * Gets or creates a memoized ClickHouse client.
   * The client is cached and reused across multiple insert calls for better performance.
   * If the configuration changes, a new client will be created.
   *
   * @private
   */
  async getMemoizedClient() {
    await Promise.resolve().then(() => (init_runtime(), runtime_exports));
    const configRegistry = globalThis._mooseConfigRegistry;
    const { getClickhouseClient: getClickhouseClient2 } = await Promise.resolve().then(() => (init_commons(), commons_exports));
    const clickhouseConfig = await configRegistry.getClickHouseConfig();
    const currentConfigHash = this.createConfigHash(clickhouseConfig);
    if (this._memoizedClient && this._configHash === currentConfigHash) {
      return { client: this._memoizedClient, config: clickhouseConfig };
    }
    if (this._memoizedClient && this._configHash !== currentConfigHash) {
      try {
        await this._memoizedClient.close();
      } catch (error) {
      }
    }
    const effectiveDatabase = this.config.database ?? clickhouseConfig.database;
    const client = getClickhouseClient2({
      username: clickhouseConfig.username,
      password: clickhouseConfig.password,
      database: effectiveDatabase,
      useSSL: clickhouseConfig.useSSL ? "true" : "false",
      host: clickhouseConfig.host,
      port: clickhouseConfig.port
    });
    this._memoizedClient = client;
    this._configHash = currentConfigHash;
    return { client, config: clickhouseConfig };
  }
  /**
   * Closes the memoized ClickHouse client if it exists.
   * This is useful for cleaning up connections when the table instance is no longer needed.
   * The client will be automatically recreated on the next insert call if needed.
   */
  async closeClient() {
    if (this._memoizedClient) {
      try {
        await this._memoizedClient.close();
      } catch (error) {
      } finally {
        this._memoizedClient = void 0;
        this._configHash = void 0;
      }
    }
  }
  /**
   * Validates a single record using typia's comprehensive type checking.
   * This provides the most accurate validation as it uses the exact TypeScript type information.
   *
   * @param record The record to validate
   * @returns Validation result with detailed error information
   */
  validateRecord(record) {
    if (this.validators?.validate) {
      try {
        const result = this.validators.validate(record);
        return {
          success: result.success,
          data: result.data,
          errors: result.errors?.map(
            (err) => typeof err === "string" ? err : JSON.stringify(err)
          )
        };
      } catch (error) {
        return {
          success: false,
          errors: [error instanceof Error ? error.message : String(error)]
        };
      }
    }
    throw new Error("No typia validator found");
  }
  /**
   * Type guard function using typia's is() function.
   * Provides compile-time type narrowing for TypeScript.
   *
   * @param record The record to check
   * @returns True if record matches type T, with type narrowing
   */
  isValidRecord(record) {
    if (this.validators?.is) {
      return this.validators.is(record);
    }
    throw new Error("No typia validator found");
  }
  /**
   * Assert that a record matches type T, throwing detailed errors if not.
   * Uses typia's assert() function for the most detailed error reporting.
   *
   * @param record The record to assert
   * @returns The validated and typed record
   * @throws Detailed validation error if record doesn't match type T
   */
  assertValidRecord(record) {
    if (this.validators?.assert) {
      return this.validators.assert(record);
    }
    throw new Error("No typia validator found");
  }
  /**
   * Validates records for insert using Insertable<T> validators when available.
   * Falls back to the full T validators if insert validators weren't generated.
   * @private
   */
  async validateInsertRecords(data) {
    const iv = this.insertValidators;
    if (!iv?.is) {
      return this.validateRecords(data);
    }
    const valid = [];
    const invalid = [];
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      try {
        if (iv.is(record)) {
          valid.push(this.mapToClickhouseRecord(record));
        } else if (iv.validate) {
          const result = iv.validate(record);
          if (result.success) {
            valid.push(this.mapToClickhouseRecord(record));
          } else {
            invalid.push({
              record,
              error: result.errors?.map((e) => String(e)).join(", ") || "Validation failed",
              index: i,
              path: "root"
            });
          }
        } else {
          invalid.push({
            record,
            error: "Validation failed",
            index: i,
            path: "root"
          });
        }
      } catch (error) {
        invalid.push({
          record,
          error: error instanceof Error ? error.message : String(error),
          index: i,
          path: "root"
        });
      }
    }
    return { valid, invalid, total: data.length };
  }
  /**
   * Validates an array of records with comprehensive error reporting.
   * Uses the most appropriate validation method available (typia or basic).
   *
   * @param data Array of records to validate
   * @returns Detailed validation results
   */
  async validateRecords(data) {
    const valid = [];
    const invalid = [];
    valid.length = 0;
    invalid.length = 0;
    const dataLength = data.length;
    for (let i = 0; i < dataLength; i++) {
      const record = data[i];
      try {
        if (this.isValidRecord(record)) {
          valid.push(this.mapToClickhouseRecord(record));
        } else {
          const result = this.validateRecord(record);
          if (result.success) {
            valid.push(this.mapToClickhouseRecord(record));
          } else {
            invalid.push({
              record,
              error: result.errors?.join(", ") || "Validation failed",
              index: i,
              path: "root"
            });
          }
        }
      } catch (error) {
        invalid.push({
          record,
          error: error instanceof Error ? error.message : String(error),
          index: i,
          path: "root"
        });
      }
    }
    return {
      valid,
      invalid,
      total: dataLength
    };
  }
  /**
   * Optimized batch retry that minimizes individual insert operations.
   * Groups records into smaller batches to reduce round trips while still isolating failures.
   *
   * @private
   */
  async retryIndividualRecords(client, tableName, records) {
    const successful = [];
    const failed = [];
    const RETRY_BATCH_SIZE = 10;
    const totalRecords = records.length;
    for (let i = 0; i < totalRecords; i += RETRY_BATCH_SIZE) {
      const batchEnd = Math.min(i + RETRY_BATCH_SIZE, totalRecords);
      const batch = records.slice(i, batchEnd);
      try {
        await client.insert({
          table: quoteIdentifier(tableName),
          values: batch,
          format: "JSONEachRow",
          clickhouse_settings: {
            date_time_input_format: "best_effort",
            // Add performance settings for retries
            max_insert_block_size: RETRY_BATCH_SIZE,
            max_block_size: RETRY_BATCH_SIZE
          }
        });
        successful.push(...batch);
      } catch (batchError) {
        for (let j = 0; j < batch.length; j++) {
          const record = batch[j];
          try {
            await client.insert({
              table: quoteIdentifier(tableName),
              values: [record],
              format: "JSONEachRow",
              clickhouse_settings: {
                date_time_input_format: "best_effort"
              }
            });
            successful.push(record);
          } catch (error) {
            failed.push({
              record,
              error: error instanceof Error ? error.message : String(error),
              index: i + j
            });
          }
        }
      }
    }
    return { successful, failed };
  }
  /**
   * Validates input parameters and strategy compatibility
   * @private
   */
  validateInsertParameters(data, options) {
    const isStream = data instanceof import_node_stream.Readable;
    const strategy = options?.strategy || "fail-fast";
    const shouldValidate = options?.validate !== false;
    if (isStream && strategy === "isolate") {
      throw new Error(
        "The 'isolate' error strategy is not supported with stream input. Use 'fail-fast' or 'discard' instead."
      );
    }
    if (isStream && shouldValidate) {
      console.warn(
        "Validation is not supported with stream input. Validation will be skipped."
      );
    }
    return { isStream, strategy, shouldValidate };
  }
  /**
   * Handles early return cases for empty data
   * @private
   */
  handleEmptyData(data, isStream) {
    if (isStream && !data) {
      return {
        successful: 0,
        failed: 0,
        total: 0
      };
    }
    if (!isStream && (!data || data.length === 0)) {
      return {
        successful: 0,
        failed: 0,
        total: 0
      };
    }
    return null;
  }
  /**
   * Performs pre-insertion validation for array data
   * @private
   */
  async performPreInsertionValidation(data, shouldValidate, strategy, options) {
    if (!shouldValidate) {
      return { validatedData: data, validationErrors: [] };
    }
    try {
      const validationResult = await this.validateInsertRecords(
        data
      );
      const validatedData = validationResult.valid;
      const validationErrors = validationResult.invalid;
      if (validationErrors.length > 0) {
        this.handleValidationErrors(validationErrors, strategy, data, options);
        switch (strategy) {
          case "discard":
            return { validatedData, validationErrors };
          case "isolate":
            return { validatedData: data, validationErrors };
          default:
            return { validatedData, validationErrors };
        }
      }
      return { validatedData, validationErrors };
    } catch (validationError) {
      if (strategy === "fail-fast") {
        throw validationError;
      }
      console.warn("Validation error:", validationError);
      return { validatedData: data, validationErrors: [] };
    }
  }
  /**
   * Handles validation errors based on the specified strategy
   * @private
   */
  handleValidationErrors(validationErrors, strategy, data, options) {
    switch (strategy) {
      case "fail-fast":
        const firstError = validationErrors[0];
        throw new Error(
          `Validation failed for record at index ${firstError.index}: ${firstError.error}`
        );
      case "discard":
        this.checkValidationThresholds(validationErrors, data.length, options);
        break;
      case "isolate":
        break;
    }
  }
  /**
   * Checks if validation errors exceed configured thresholds
   * @private
   */
  checkValidationThresholds(validationErrors, totalRecords, options) {
    const validationFailedCount = validationErrors.length;
    const validationFailedRatio = validationFailedCount / totalRecords;
    if (options?.allowErrors !== void 0 && validationFailedCount > options.allowErrors) {
      throw new Error(
        `Too many validation failures: ${validationFailedCount} > ${options.allowErrors}. Errors: ${validationErrors.map((e) => e.error).join(", ")}`
      );
    }
    if (options?.allowErrorsRatio !== void 0 && validationFailedRatio > options.allowErrorsRatio) {
      throw new Error(
        `Validation failure ratio too high: ${validationFailedRatio.toFixed(3)} > ${options.allowErrorsRatio}. Errors: ${validationErrors.map((e) => e.error).join(", ")}`
      );
    }
  }
  /**
   * Optimized insert options preparation with better memory management
   * @private
   */
  prepareInsertOptions(tableName, data, validatedData, isStream, strategy, options) {
    const insertOptions = {
      table: quoteIdentifier(tableName),
      format: "JSONEachRow",
      clickhouse_settings: {
        date_time_input_format: "best_effort",
        wait_end_of_query: 1,
        // Ensure at least once delivery for INSERT operations
        // Performance optimizations
        max_insert_block_size: isStream ? 1e5 : Math.min(validatedData.length, 1e5),
        max_block_size: 65536,
        // Use async inserts for better performance with large datasets
        async_insert: validatedData.length > 1e3 ? 1 : 0,
        wait_for_async_insert: 1
        // For at least once delivery
      }
    };
    if (isStream) {
      insertOptions.values = data;
    } else {
      insertOptions.values = validatedData;
    }
    if (strategy === "discard" && (options?.allowErrors !== void 0 || options?.allowErrorsRatio !== void 0)) {
      if (options.allowErrors !== void 0) {
        insertOptions.clickhouse_settings.input_format_allow_errors_num = options.allowErrors;
      }
      if (options.allowErrorsRatio !== void 0) {
        insertOptions.clickhouse_settings.input_format_allow_errors_ratio = options.allowErrorsRatio;
      }
    }
    return insertOptions;
  }
  /**
   * Creates success result for completed insertions
   * @private
   */
  createSuccessResult(data, validatedData, validationErrors, isStream, shouldValidate, strategy) {
    if (isStream) {
      return {
        successful: -1,
        // -1 indicates stream mode where count is unknown
        failed: 0,
        total: -1
      };
    }
    const insertedCount = validatedData.length;
    const totalProcessed = shouldValidate ? data.length : insertedCount;
    const result = {
      successful: insertedCount,
      failed: shouldValidate ? validationErrors.length : 0,
      total: totalProcessed
    };
    if (shouldValidate && validationErrors.length > 0 && strategy === "discard") {
      result.failedRecords = validationErrors.map((ve) => ({
        record: ve.record,
        error: `Validation error: ${ve.error}`,
        index: ve.index
      }));
    }
    return result;
  }
  /**
   * Handles insertion errors based on the specified strategy
   * @private
   */
  async handleInsertionError(batchError, strategy, tableName, data, validatedData, validationErrors, isStream, shouldValidate, options) {
    switch (strategy) {
      case "fail-fast":
        throw new Error(
          `Failed to insert data into table ${tableName}: ${batchError}`
        );
      case "discard":
        throw new Error(
          `Too many errors during insert into table ${tableName}. Error threshold exceeded: ${batchError}`
        );
      case "isolate":
        return await this.handleIsolateStrategy(
          batchError,
          tableName,
          data,
          validatedData,
          validationErrors,
          isStream,
          shouldValidate,
          options
        );
      default:
        throw new Error(`Unknown error strategy: ${strategy}`);
    }
  }
  /**
   * Handles the isolate strategy for insertion errors
   * @private
   */
  async handleIsolateStrategy(batchError, tableName, data, validatedData, validationErrors, isStream, shouldValidate, options) {
    if (isStream) {
      throw new Error(
        `Isolate strategy is not supported with stream input: ${batchError}`
      );
    }
    try {
      const { client } = await this.getMemoizedClient();
      const skipValidationOnRetry = options?.skipValidationOnRetry || false;
      const retryData = skipValidationOnRetry ? data : validatedData;
      const { successful, failed } = await this.retryIndividualRecords(
        client,
        tableName,
        retryData
      );
      const allFailedRecords = [
        // Validation errors (if any and not skipping validation on retry)
        ...shouldValidate && !skipValidationOnRetry ? validationErrors.map((ve) => ({
          record: ve.record,
          error: `Validation error: ${ve.error}`,
          index: ve.index
        })) : [],
        // Insertion errors
        ...failed
      ];
      this.checkInsertionThresholds(
        allFailedRecords,
        data.length,
        options
      );
      return {
        successful: successful.length,
        failed: allFailedRecords.length,
        total: data.length,
        failedRecords: allFailedRecords
      };
    } catch (isolationError) {
      throw new Error(
        `Failed to insert data into table ${tableName} during record isolation: ${isolationError}`
      );
    }
  }
  /**
   * Checks if insertion errors exceed configured thresholds
   * @private
   */
  checkInsertionThresholds(failedRecords, totalRecords, options) {
    const totalFailed = failedRecords.length;
    const failedRatio = totalFailed / totalRecords;
    if (options?.allowErrors !== void 0 && totalFailed > options.allowErrors) {
      throw new Error(
        `Too many failed records: ${totalFailed} > ${options.allowErrors}. Failed records: ${failedRecords.map((f) => f.error).join(", ")}`
      );
    }
    if (options?.allowErrorsRatio !== void 0 && failedRatio > options.allowErrorsRatio) {
      throw new Error(
        `Failed record ratio too high: ${failedRatio.toFixed(3)} > ${options.allowErrorsRatio}. Failed records: ${failedRecords.map((f) => f.error).join(", ")}`
      );
    }
  }
  /**
   * Recursively transforms a record to match ClickHouse's JSONEachRow requirements
   *
   * - For every Array(Nested(...)) field at any depth, each item is wrapped in its own array and recursively processed.
   * - For every Nested struct (not array), it recurses into the struct.
   * - This ensures compatibility with kafka_clickhouse_sync
   *
   * @param record The input record to transform (may be deeply nested)
   * @param columns The schema columns for this level (defaults to this.columnArray at the top level)
   * @returns The transformed record, ready for ClickHouse JSONEachRow insertion
   */
  mapToClickhouseRecord(record, columns = this.columnArray) {
    const result = { ...record };
    for (const col of columns) {
      const value = record[col.name];
      const dt = col.data_type;
      if (isArrayNestedType(dt)) {
        if (Array.isArray(value) && (value.length === 0 || typeof value[0] === "object")) {
          result[col.name] = value.map((item) => [
            this.mapToClickhouseRecord(item, dt.elementType.columns)
          ]);
        }
      } else if (isNestedType(dt)) {
        if (value && typeof value === "object") {
          result[col.name] = this.mapToClickhouseRecord(value, dt.columns);
        }
      }
    }
    return result;
  }
  /**
   * Inserts data directly into the ClickHouse table with enhanced error handling and validation.
   * This method establishes a direct connection to ClickHouse using the project configuration
   * and inserts the provided data into the versioned table.
   *
   * PERFORMANCE OPTIMIZATIONS:
   * - Memoized client connections with fast config hashing
   * - Single-pass validation with pre-allocated arrays
   * - Batch-optimized retry strategy (batches of 10, then individual)
   * - Optimized ClickHouse settings for large datasets
   * - Reduced memory allocations and object creation
   *
   * Uses advanced typia validation when available for comprehensive type checking,
   * with fallback to basic validation for compatibility.
   *
   * The ClickHouse client is memoized and reused across multiple insert calls for better performance.
   * If the configuration changes, a new client will be automatically created.
   *
   * @param data Array of objects conforming to the table schema, or a Node.js Readable stream
   * @param options Optional configuration for error handling, validation, and insertion behavior
   * @returns Promise resolving to detailed insertion results
   * @throws {ConfigError} When configuration cannot be read or parsed
   * @throws {ClickHouseError} When insertion fails based on the error strategy
   * @throws {ValidationError} When validation fails and strategy is 'fail-fast'
   *
   * @example
   * ```typescript
   * // Create an OlapTable instance (typia validators auto-injected)
   * const userTable = new OlapTable<User>('users');
   *
   * // Insert with comprehensive typia validation
   * const result1 = await userTable.insert([
   *   { id: 1, name: 'John', email: 'john@example.com' },
   *   { id: 2, name: 'Jane', email: 'jane@example.com' }
   * ]);
   *
   * // Insert data with stream input (validation not available for streams)
   * const dataStream = new Readable({
   *   objectMode: true,
   *   read() { // Stream implementation }
   * });
   * const result2 = await userTable.insert(dataStream, { strategy: 'fail-fast' });
   *
   * // Insert with validation disabled for performance
   * const result3 = await userTable.insert(data, { validate: false });
   *
   * // Insert with error handling strategies
   * const result4 = await userTable.insert(mixedData, {
   *   strategy: 'isolate',
   *   allowErrorsRatio: 0.1,
   *   validate: true  // Use typia validation (default)
   * });
   *
   * // Optional: Clean up connection when completely done
   * await userTable.closeClient();
   * ```
   */
  async insert(data, options) {
    const rawData = data;
    const { isStream, strategy, shouldValidate } = this.validateInsertParameters(rawData, options);
    const emptyResult = this.handleEmptyData(rawData, isStream);
    if (emptyResult) {
      return emptyResult;
    }
    let validatedData = [];
    let validationErrors = [];
    if (!isStream && shouldValidate) {
      const validationResult = await this.performPreInsertionValidation(
        rawData,
        shouldValidate,
        strategy,
        options
      );
      validatedData = validationResult.validatedData;
      validationErrors = validationResult.validationErrors;
    } else {
      validatedData = isStream ? [] : rawData;
    }
    const { client } = await this.getMemoizedClient();
    const tableName = this.generateTableName();
    try {
      const insertOptions = this.prepareInsertOptions(
        tableName,
        rawData,
        validatedData,
        isStream,
        strategy,
        options
      );
      await client.insert(insertOptions);
      return this.createSuccessResult(
        rawData,
        validatedData,
        validationErrors,
        isStream,
        shouldValidate,
        strategy
      );
    } catch (batchError) {
      return await this.handleInsertionError(
        batchError,
        strategy,
        tableName,
        rawData,
        validatedData,
        validationErrors,
        isStream,
        shouldValidate,
        options
      );
    }
  }
  // Note: Static factory methods (withS3Queue, withReplacingMergeTree, withMergeTree)
  // were removed in ENG-856. Use direct configuration instead, e.g.:
  // new OlapTable(name, { engine: ClickHouseEngines.ReplacingMergeTree, orderByFields: ["id"], ver: "updated_at" })
};

// src/dmv2/sdk/stream.ts
var import_node_crypto2 = require("crypto");
var RoutedMessage = class {
  /** The destination stream for the message */
  destination;
  /** The message value(s) to send */
  values;
  /**
   * Creates a new routed message.
   *
   * @param destination The target stream
   * @param values The message(s) to route
   */
  constructor(destination, values) {
    this.destination = destination;
    this.values = values;
  }
};
var Stream = class extends TypedBase {
  defaultDeadLetterQueue;
  /** @internal Memoized KafkaJS producer for reusing connections across sends */
  _memoizedProducer;
  /** @internal Hash of the configuration used to create the memoized Kafka producer */
  _kafkaConfigHash;
  constructor(name, config, schema, columns, validators, allowExtraFields) {
    super(name, config ?? {}, schema, columns, void 0, allowExtraFields);
    const streams = getMooseInternal().streams;
    if (streams.has(name)) {
      throw new Error(`Stream with name ${name} already exists`);
    }
    streams.set(name, this);
    this.defaultDeadLetterQueue = this.config.defaultDeadLetterQueue;
  }
  /**
   * Internal map storing transformation configurations.
   * Maps destination stream names to arrays of transformation functions and their configs.
   *
   * @internal
   */
  _transformations = /* @__PURE__ */ new Map();
  /**
   * Internal function for multi-stream transformations.
   * Allows a single transformation to route messages to multiple destinations.
   *
   * @internal
   */
  _multipleTransformations;
  /**
   * Internal array storing consumer configurations.
   *
   * @internal
   */
  _consumers = new Array();
  /**
   * Builds the full Kafka topic name including optional namespace and version suffix.
   * Version suffix is appended as _x_y_z where dots in version are replaced with underscores.
   */
  buildFullTopicName(namespace) {
    const versionSuffix = this.config.version ? `_${this.config.version.replace(/\./g, "_")}` : "";
    const base = `${this.name}${versionSuffix}`;
    return namespace !== void 0 && namespace.length > 0 ? `${namespace}.${base}` : base;
  }
  /**
   * Creates a fast hash string from relevant Kafka configuration fields.
   */
  createConfigHash(kafkaConfig) {
    const configString = [
      kafkaConfig.broker,
      kafkaConfig.messageTimeoutMs,
      kafkaConfig.saslUsername,
      kafkaConfig.saslPassword,
      kafkaConfig.saslMechanism,
      kafkaConfig.securityProtocol,
      kafkaConfig.namespace
    ].join(":");
    return (0, import_node_crypto2.createHash)("sha256").update(configString).digest("hex").substring(0, 16);
  }
  /**
   * Gets or creates a memoized KafkaJS producer using runtime configuration.
   */
  async getMemoizedProducer() {
    await Promise.resolve().then(() => (init_runtime(), runtime_exports));
    const configRegistry = globalThis._mooseConfigRegistry;
    const { getKafkaProducer: getKafkaProducer2 } = await Promise.resolve().then(() => (init_commons(), commons_exports));
    const kafkaConfig = await configRegistry.getKafkaConfig();
    const currentHash = this.createConfigHash(kafkaConfig);
    if (this._memoizedProducer && this._kafkaConfigHash === currentHash) {
      return { producer: this._memoizedProducer, kafkaConfig };
    }
    if (this._memoizedProducer && this._kafkaConfigHash !== currentHash) {
      try {
        await this._memoizedProducer.disconnect();
      } catch {
      }
      this._memoizedProducer = void 0;
    }
    const clientId = `moose-sdk-stream-${this.name}`;
    const logger = {
      logPrefix: clientId,
      log: (message) => {
        console.log(`${clientId}: ${message}`);
      },
      error: (message) => {
        console.error(`${clientId}: ${message}`);
      },
      warn: (message) => {
        console.warn(`${clientId}: ${message}`);
      }
    };
    const producer = await getKafkaProducer2(
      {
        clientId,
        broker: kafkaConfig.broker,
        securityProtocol: kafkaConfig.securityProtocol,
        saslUsername: kafkaConfig.saslUsername,
        saslPassword: kafkaConfig.saslPassword,
        saslMechanism: kafkaConfig.saslMechanism
      },
      logger
    );
    this._memoizedProducer = producer;
    this._kafkaConfigHash = currentHash;
    return { producer, kafkaConfig };
  }
  /**
   * Closes the memoized Kafka producer if it exists.
   */
  async closeProducer() {
    if (this._memoizedProducer) {
      try {
        await this._memoizedProducer.disconnect();
      } catch {
      } finally {
        this._memoizedProducer = void 0;
        this._kafkaConfigHash = void 0;
      }
    }
  }
  /**
   * Sends one or more records to this stream's Kafka topic.
   * Values are JSON-serialized as message values.
   */
  async send(values) {
    const flat = Array.isArray(values) ? values : values !== void 0 && values !== null ? [values] : [];
    if (flat.length === 0) return;
    const { producer, kafkaConfig } = await this.getMemoizedProducer();
    const topic = this.buildFullTopicName(kafkaConfig.namespace);
    const sr = this.config.schemaConfig;
    if (sr && sr.kind === "JSON") {
      const schemaRegistryUrl = kafkaConfig.schemaRegistryUrl;
      if (!schemaRegistryUrl) {
        throw new Error("Schema Registry URL not configured");
      }
      const {
        default: { SchemaRegistry }
      } = await import("@kafkajs/confluent-schema-registry");
      const registry = new SchemaRegistry({ host: schemaRegistryUrl });
      let schemaId = void 0;
      if ("id" in sr.reference) {
        schemaId = sr.reference.id;
      } else if ("subjectLatest" in sr.reference) {
        schemaId = await registry.getLatestSchemaId(sr.reference.subjectLatest);
      } else if ("subject" in sr.reference) {
        schemaId = await registry.getRegistryId(
          sr.reference.subject,
          sr.reference.version
        );
      }
      if (schemaId === void 0) {
        throw new Error("Malformed schema reference.");
      }
      const encoded = await Promise.all(
        flat.map(
          (v) => registry.encode(schemaId, v)
        )
      );
      await producer.send({
        topic,
        messages: encoded.map((value) => ({ value }))
      });
      return;
    } else if (sr !== void 0) {
      throw new Error("Currently only JSON Schema is supported.");
    }
    await producer.send({
      topic,
      messages: flat.map((v) => ({ value: JSON.stringify(v) }))
    });
  }
  /**
   * Adds a transformation step that processes messages from this stream and sends the results to a destination stream.
   * Multiple transformations to the same destination stream can be added if they have distinct `version` identifiers in their config.
   *
   * @template U The data type of the messages in the destination stream.
   * @param destination The destination stream for the transformed messages.
   * @param transformation A function that takes a message of type T and returns zero or more messages of type U (or a Promise thereof).
   *                       Return `null` or `undefined` or an empty array `[]` to filter out a message. Return an array to emit multiple messages.
   * @param config Optional configuration for this specific transformation step, like a version.
   */
  addTransform(destination, transformation, config) {
    const sourceFile = getSourceFileFromStack(new Error().stack);
    const transformConfig = {
      ...config ?? {},
      sourceFile
    };
    if (transformConfig.deadLetterQueue === void 0) {
      transformConfig.deadLetterQueue = this.defaultDeadLetterQueue;
    }
    if (this._transformations.has(destination.name)) {
      const existingTransforms = this._transformations.get(destination.name);
      const hasVersion = existingTransforms.some(
        ([_, __, cfg]) => cfg.version === transformConfig.version
      );
      if (!hasVersion) {
        existingTransforms.push([destination, transformation, transformConfig]);
      }
    } else {
      this._transformations.set(destination.name, [
        [destination, transformation, transformConfig]
      ]);
    }
  }
  /**
   * Adds a consumer function that processes messages from this stream.
   * Multiple consumers can be added if they have distinct `version` identifiers in their config.
   *
   * @param consumer A function that takes a message of type T and performs an action (e.g., side effect, logging). Should return void or Promise<void>.
   * @param config Optional configuration for this specific consumer, like a version.
   */
  addConsumer(consumer, config) {
    const sourceFile = getSourceFileFromStack(new Error().stack);
    const consumerConfig = {
      ...config ?? {},
      sourceFile
    };
    if (consumerConfig.deadLetterQueue === void 0) {
      consumerConfig.deadLetterQueue = this.defaultDeadLetterQueue;
    }
    const hasVersion = this._consumers.some(
      (existing) => existing.config.version === consumerConfig.version
    );
    if (!hasVersion) {
      this._consumers.push({ consumer, config: consumerConfig });
    }
  }
  /**
   * Helper method for `addMultiTransform` to specify the destination and values for a routed message.
   * @param values The value or values to send to this stream.
   * @returns A `RoutedMessage` object associating the values with this stream.
   *
   * @example
   * ```typescript
   * sourceStream.addMultiTransform((record) => [
   *   destinationStream1.routed(transformedRecord1),
   *   destinationStream2.routed([record2a, record2b])
   * ]);
   * ```
   */
  routed = (values) => new RoutedMessage(this, values);
  /**
   * Adds a single transformation function that can route messages to multiple destination streams.
   * This is an alternative to adding multiple individual `addTransform` calls.
   * Only one multi-transform function can be added per stream.
   *
   * @param transformation A function that takes a message of type T and returns an array of `RoutedMessage` objects,
   *                       each specifying a destination stream and the message(s) to send to it.
   */
  addMultiTransform(transformation) {
    this._multipleTransformations = transformation;
  }
};
function attachTypeGuard(dl, typeGuard) {
  dl.asTyped = () => typeGuard(dl.originalRecord);
}
var DeadLetterQueue = class extends Stream {
  constructor(name, config, typeGuard) {
    if (typeGuard === void 0) {
      throw new Error(
        "Supply the type param T so that the schema is inserted by the compiler plugin."
      );
    }
    super(name, config ?? {}, dlqSchema, dlqColumns, void 0, false);
    this.typeGuard = typeGuard;
    getMooseInternal().streams.set(name, this);
  }
  /**
   * Internal type guard function for validating and casting original records.
   *
   * @internal
   */
  typeGuard;
  /**
   * Adds a transformation step for dead letter records.
   * The transformation function receives a DeadLetter<T> with type recovery capabilities.
   *
   * @template U The output type for the transformation
   * @param destination The destination stream for transformed messages
   * @param transformation Function to transform dead letter records
   * @param config Optional transformation configuration
   */
  addTransform(destination, transformation, config) {
    const withValidate = (deadLetter) => {
      attachTypeGuard(deadLetter, this.typeGuard);
      return transformation(deadLetter);
    };
    super.addTransform(destination, withValidate, config);
  }
  /**
   * Adds a consumer for dead letter records.
   * The consumer function receives a DeadLetter<T> with type recovery capabilities.
   *
   * @param consumer Function to process dead letter records
   * @param config Optional consumer configuration
   */
  addConsumer(consumer, config) {
    const withValidate = (deadLetter) => {
      attachTypeGuard(deadLetter, this.typeGuard);
      return consumer(deadLetter);
    };
    super.addConsumer(withValidate, config);
  }
  /**
   * Adds a multi-stream transformation for dead letter records.
   * The transformation function receives a DeadLetter<T> with type recovery capabilities.
   *
   * @param transformation Function to route dead letter records to multiple destinations
   */
  addMultiTransform(transformation) {
    const withValidate = (deadLetter) => {
      attachTypeGuard(deadLetter, this.typeGuard);
      return transformation(deadLetter);
    };
    super.addMultiTransform(withValidate);
  }
};

// src/dmv2/sdk/workflow.ts
var Task = class {
  /**
   * Creates a new Task instance.
   *
   * @param name - Unique identifier for the task
   * @param config - Configuration object defining the task behavior
   *
   * @example
   * ```typescript
   * // No input, no output
   * const task1 = new Task<null, void>("task1", {
   *   run: async () => {
   *     console.log("No input/output");
   *   }
   * });
   *
   * // No input, but has output
   * const task2 = new Task<null, OutputType>("task2", {
   *   run: async () => {
   *     return someOutput;
   *   }
   * });
   *
   * // Has input, no output
   * const task3 = new Task<InputType, void>("task3", {
   *   run: async (input: InputType) => {
   *     // process input but return nothing
   *   }
   * });
   *
   * // Has both input and output
   * const task4 = new Task<InputType, OutputType>("task4", {
   *   run: async (input: InputType) => {
   *     return process(input);
   *   }
   * });
   * ```
   */
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }
};
var Workflow = class {
  /**
   * Creates a new Workflow instance and registers it with the Moose system.
   *
   * @param name - Unique identifier for the workflow
   * @param config - Configuration object defining the workflow behavior and task orchestration
   * @throws {Error} When the workflow contains null/undefined tasks or infinite loops
   */
  constructor(name, config) {
    this.name = name;
    this.config = config;
    const stack = new Error().stack;
    const location = getSourceLocationFromStack(stack);
    if (location) {
      this.sourceFile = location.file;
      this.sourceLine = location.line;
      this.sourceColumn = location.column;
    }
    const workflows = getMooseInternal().workflows;
    if (workflows.has(name)) {
      throw new Error(`Workflow with name ${name} already exists`);
    }
    this.validateTaskGraph(config.startingTask, name);
    workflows.set(name, this);
  }
  /** @internal Source file path where this workflow was declared */
  sourceFile;
  /** @internal Source line number where this workflow was declared */
  sourceLine;
  /** @internal Source column number where this workflow was declared */
  sourceColumn;
  /**
   * Validates the task graph to ensure there are no null tasks or infinite loops.
   *
   * @private
   * @param startingTask - The starting task to begin validation from
   * @param workflowName - The name of the workflow being validated (for error messages)
   * @throws {Error} When null/undefined tasks are found or infinite loops are detected
   */
  validateTaskGraph(startingTask, workflowName) {
    if (startingTask === null || startingTask === void 0) {
      throw new Error(
        `Workflow "${workflowName}" has a null or undefined starting task`
      );
    }
    const visited = /* @__PURE__ */ new Set();
    const recursionStack = /* @__PURE__ */ new Set();
    const validateTask = (task, currentPath) => {
      if (task === null || task === void 0) {
        const pathStr = currentPath.length > 0 ? currentPath.join(" -> ") + " -> " : "";
        throw new Error(
          `Workflow "${workflowName}" contains a null or undefined task in the task chain: ${pathStr}null`
        );
      }
      const taskName = task.name;
      if (recursionStack.has(taskName)) {
        const cycleStartIndex = currentPath.indexOf(taskName);
        const cyclePath = cycleStartIndex >= 0 ? currentPath.slice(cycleStartIndex).concat(taskName) : currentPath.concat(taskName);
        throw new Error(
          `Workflow "${workflowName}" contains an infinite loop in task chain: ${cyclePath.join(" -> ")}`
        );
      }
      if (visited.has(taskName)) {
        return;
      }
      visited.add(taskName);
      recursionStack.add(taskName);
      if (task.config.onComplete) {
        for (const nextTask of task.config.onComplete) {
          validateTask(nextTask, [...currentPath, taskName]);
        }
      }
      recursionStack.delete(taskName);
    };
    validateTask(startingTask, []);
  }
};

// src/dmv2/sdk/ingestApi.ts
var IngestApi = class extends TypedBase {
  constructor(name, config, schema, columns, validators, allowExtraFields) {
    super(name, config, schema, columns, void 0, allowExtraFields);
    const ingestApis = getMooseInternal().ingestApis;
    if (ingestApis.has(name)) {
      throw new Error(`Ingest API with name ${name} already exists`);
    }
    ingestApis.set(name, this);
  }
};

// src/dmv2/sdk/consumptionApi.ts
var Api = class extends TypedBase {
  /** @internal The handler function that processes requests and generates responses. */
  _handler;
  /** @internal The JSON schema definition for the response type R. */
  responseSchema;
  constructor(name, handler, config, schema, columns, responseSchema) {
    super(name, config ?? {}, schema, columns);
    this._handler = handler;
    this.responseSchema = responseSchema ?? {
      version: "3.1",
      schemas: [{ type: "array", items: { type: "object" } }],
      components: { schemas: {} }
    };
    const apis = getMooseInternal().apis;
    const key = `${name}${config?.version ? `:${config.version}` : ""}`;
    if (apis.has(key)) {
      throw new Error(
        `Consumption API with name ${name} and version ${config?.version} already exists`
      );
    }
    apis.set(key, this);
    if (config?.path) {
      if (config.version) {
        const pathEndsWithVersion = config.path.endsWith(`/${config.version}`) || config.path === config.version || config.path.endsWith(config.version) && config.path.length > config.version.length && config.path[config.path.length - config.version.length - 1] === "/";
        if (pathEndsWithVersion) {
          if (apis.has(config.path)) {
            const existing = apis.get(config.path);
            throw new Error(
              `Cannot register API "${name}" with path "${config.path}" - this path is already used by API "${existing.name}"`
            );
          }
          apis.set(config.path, this);
        } else {
          const versionedPath = `${config.path.replace(/\/$/, "")}/${config.version}`;
          if (apis.has(versionedPath)) {
            const existing = apis.get(versionedPath);
            throw new Error(
              `Cannot register API "${name}" with path "${versionedPath}" - this path is already used by API "${existing.name}"`
            );
          }
          apis.set(versionedPath, this);
          if (!apis.has(config.path)) {
            apis.set(config.path, this);
          }
        }
      } else {
        if (apis.has(config.path)) {
          const existing = apis.get(config.path);
          throw new Error(
            `Cannot register API "${name}" with custom path "${config.path}" - this path is already used by API "${existing.name}"`
          );
        }
        apis.set(config.path, this);
      }
    }
  }
  /**
   * Retrieves the handler function associated with this Consumption API.
   * @returns The handler function.
   */
  getHandler = () => {
    return this._handler;
  };
  async call(baseUrl, queryParams) {
    let path6;
    if (this.config?.path) {
      if (this.config.version) {
        const pathEndsWithVersion = this.config.path.endsWith(`/${this.config.version}`) || this.config.path === this.config.version || this.config.path.endsWith(this.config.version) && this.config.path.length > this.config.version.length && this.config.path[this.config.path.length - this.config.version.length - 1] === "/";
        if (pathEndsWithVersion) {
          path6 = this.config.path;
        } else {
          path6 = `${this.config.path.replace(/\/$/, "")}/${this.config.version}`;
        }
      } else {
        path6 = this.config.path;
      }
    } else {
      path6 = this.config?.version ? `${this.name}/${this.config.version}` : this.name;
    }
    const url = new URL(`${baseUrl.replace(/\/$/, "")}/api/${path6}`);
    const searchParams = url.searchParams;
    for (const [key, value] of Object.entries(queryParams)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item !== null && item !== void 0) {
            searchParams.append(key, String(item));
          }
        }
      } else if (value !== null && value !== void 0) {
        searchParams.append(key, String(value));
      }
    }
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  }
};
var ConsumptionApi = Api;

// src/dmv2/sdk/ingestPipeline.ts
var IngestPipeline = class extends TypedBase {
  /**
   * The OLAP table component of the pipeline, if configured.
   * Provides analytical query capabilities for the ingested data.
   * Only present when `config.table` is not `false`.
   */
  table;
  /**
   * The stream component of the pipeline, if configured.
   * Handles real-time data flow and processing between components.
   * Only present when `config.stream` is not `false`.
   */
  stream;
  /**
   * The ingest API component of the pipeline, if configured.
   * Provides HTTP endpoints for data ingestion.
   * Only present when `config.ingestApi` is not `false`.
   */
  ingestApi;
  /** The dead letter queue of the pipeline, if configured. */
  deadLetterQueue;
  constructor(name, config, schema, columns, validators, allowExtraFields) {
    super(name, config, schema, columns, validators, allowExtraFields);
    if (config.ingest !== void 0) {
      console.warn(
        "\u26A0\uFE0F  DEPRECATION WARNING: The 'ingest' parameter is deprecated and will be removed in a future version. Please use 'ingestApi' instead."
      );
      if (config.ingestApi === void 0) {
        config.ingestApi = config.ingest;
      }
    }
    if (config.table) {
      if (typeof config.table === "object" && "engine" in config.table && config.table.engine === "Merge" /* Merge */) {
        throw new Error(
          `IngestPipeline "${name}": Merge engine is read-only and cannot be used as a table destination.`
        );
      }
      const tableConfig = typeof config.table === "object" ? {
        ...config.table,
        lifeCycle: config.table.lifeCycle ?? config.lifeCycle,
        ...config.version && { version: config.version }
      } : {
        lifeCycle: config.lifeCycle,
        engine: "MergeTree" /* MergeTree */,
        ...config.version && { version: config.version }
      };
      this.table = new OlapTable(
        name,
        tableConfig,
        this.schema,
        this.columnArray,
        this.validators
      );
    }
    if (config.deadLetterQueue) {
      const streamConfig = {
        destination: void 0,
        ...typeof config.deadLetterQueue === "object" ? {
          ...config.deadLetterQueue,
          lifeCycle: config.deadLetterQueue.lifeCycle ?? config.lifeCycle
        } : { lifeCycle: config.lifeCycle },
        ...config.version && { version: config.version }
      };
      this.deadLetterQueue = new DeadLetterQueue(
        `${name}DeadLetterQueue`,
        streamConfig,
        validators.assert
      );
    }
    if (config.stream) {
      const streamConfig = {
        destination: this.table,
        defaultDeadLetterQueue: this.deadLetterQueue,
        ...typeof config.stream === "object" ? {
          ...config.stream,
          lifeCycle: config.stream.lifeCycle ?? config.lifeCycle
        } : { lifeCycle: config.lifeCycle },
        ...config.version && { version: config.version }
      };
      this.stream = new Stream(
        name,
        streamConfig,
        this.schema,
        this.columnArray,
        void 0,
        this.allowExtraFields
      );
      this.stream.pipelineParent = this;
    }
    const effectiveIngestAPI = config.ingestApi !== void 0 ? config.ingestApi : config.ingest;
    if (effectiveIngestAPI) {
      if (!this.stream) {
        throw new Error("Ingest API needs a stream to write to.");
      }
      const ingestConfig = {
        destination: this.stream,
        deadLetterQueue: this.deadLetterQueue,
        ...typeof effectiveIngestAPI === "object" ? effectiveIngestAPI : {},
        ...config.version && { version: config.version },
        ...config.path && { path: config.path }
      };
      this.ingestApi = new IngestApi(
        name,
        ingestConfig,
        this.schema,
        this.columnArray,
        void 0,
        this.allowExtraFields
      );
      this.ingestApi.pipelineParent = this;
    }
  }
};

// src/dmv2/sdk/etlPipeline.ts
var InternalBatcher = class {
  iterator;
  batchSize;
  constructor(asyncIterable, batchSize = 20) {
    this.iterator = asyncIterable[Symbol.asyncIterator]();
    this.batchSize = batchSize;
  }
  async getNextBatch() {
    const items = [];
    for (let i = 0; i < this.batchSize; i++) {
      const { value, done } = await this.iterator.next();
      if (done) {
        return { items, hasMore: false };
      }
      items.push(value);
    }
    return { items, hasMore: true };
  }
};
var ETLPipeline = class {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.setupPipeline();
  }
  batcher;
  setupPipeline() {
    this.batcher = this.createBatcher();
    const tasks = this.createAllTasks();
    tasks.extract.config.onComplete = [tasks.transform];
    tasks.transform.config.onComplete = [tasks.load];
    new Workflow(this.name, {
      startingTask: tasks.extract,
      retries: 1,
      timeout: "30m"
    });
  }
  createBatcher() {
    const iterable = typeof this.config.extract === "function" ? this.config.extract() : this.config.extract;
    return new InternalBatcher(iterable);
  }
  getDefaultTaskConfig() {
    return {
      retries: 1,
      timeout: "30m"
    };
  }
  createAllTasks() {
    const taskConfig = this.getDefaultTaskConfig();
    return {
      extract: this.createExtractTask(taskConfig),
      transform: this.createTransformTask(taskConfig),
      load: this.createLoadTask(taskConfig)
    };
  }
  createExtractTask(taskConfig) {
    return new Task(`${this.name}_extract`, {
      run: async ({}) => {
        console.log(`Running extract task for ${this.name}...`);
        const batch = await this.batcher.getNextBatch();
        console.log(`Extract task completed with ${batch.items.length} items`);
        return batch;
      },
      retries: taskConfig.retries,
      timeout: taskConfig.timeout
    });
  }
  createTransformTask(taskConfig) {
    return new Task(
      `${this.name}_transform`,
      {
        // Use new single-parameter context API for handlers
        run: async ({ input }) => {
          const batch = input;
          console.log(
            `Running transform task for ${this.name} with ${batch.items.length} items...`
          );
          const transformedItems = [];
          for (const item of batch.items) {
            const transformed = await this.config.transform(item);
            transformedItems.push(transformed);
          }
          console.log(
            `Transform task completed with ${transformedItems.length} items`
          );
          return { items: transformedItems };
        },
        retries: taskConfig.retries,
        timeout: taskConfig.timeout
      }
    );
  }
  createLoadTask(taskConfig) {
    return new Task(`${this.name}_load`, {
      run: async ({ input: transformedItems }) => {
        console.log(
          `Running load task for ${this.name} with ${transformedItems.items.length} items...`
        );
        if ("insert" in this.config.load) {
          await this.config.load.insert(transformedItems.items);
        } else {
          await this.config.load(transformedItems.items);
        }
        console.log(`Load task completed`);
      },
      retries: taskConfig.retries,
      timeout: taskConfig.timeout
    });
  }
  // Execute the entire ETL pipeline
  async run() {
    console.log(`Starting ETL Pipeline: ${this.name}`);
    let batchNumber = 1;
    do {
      console.log(`Processing batch ${batchNumber}...`);
      const batch = await this.batcher.getNextBatch();
      if (batch.items.length === 0) {
        break;
      }
      const transformedItems = [];
      for (const extractedData of batch.items) {
        const transformedData = await this.config.transform(extractedData);
        transformedItems.push(transformedData);
      }
      if ("insert" in this.config.load) {
        await this.config.load.insert(transformedItems);
      } else {
        await this.config.load(transformedItems);
      }
      console.log(
        `Completed batch ${batchNumber} with ${batch.items.length} items`
      );
      batchNumber++;
      if (!batch.hasMore) {
        break;
      }
    } while (true);
    console.log(`Completed ETL Pipeline: ${this.name}`);
  }
};

// src/dmv2/sdk/materializedView.ts
function formatTableReference(table) {
  const database = table instanceof OlapTable ? table.config.database : void 0;
  if (database) {
    return `\`${database}\`.\`${table.name}\``;
  }
  return `\`${table.name}\``;
}
var requireTargetTableName = (tableName) => {
  if (typeof tableName === "string") {
    return tableName;
  } else {
    throw new Error("Name of targetTable is not specified.");
  }
};
var MaterializedView = class {
  /** @internal */
  kind = "MaterializedView";
  /** The name of the materialized view */
  name;
  /** The target OlapTable instance where the materialized data is stored. */
  targetTable;
  /** The SELECT SQL statement */
  selectSql;
  /** Names of source tables that the SELECT reads from */
  sourceTables;
  /** Optional metadata for the materialized view */
  metadata;
  /** Optional lifecycle management policy for the materialized view */
  lifeCycle;
  constructor(options, targetSchema, targetColumns) {
    let selectStatement = options.selectStatement;
    if (typeof selectStatement !== "string") {
      selectStatement = toStaticQuery(selectStatement);
    }
    if (targetSchema === void 0 || targetColumns === void 0) {
      throw new Error(
        "Supply the type param T so that the schema is inserted by the compiler plugin."
      );
    }
    const targetTable = options.targetTable instanceof OlapTable ? options.targetTable : new OlapTable(
      requireTargetTableName(
        options.targetTable?.name ?? options.tableName
      ),
      {
        orderByFields: options.targetTable?.orderByFields ?? options.orderByFields,
        engine: options.targetTable?.engine ?? options.engine ?? "MergeTree" /* MergeTree */
      },
      targetSchema,
      targetColumns
    );
    if (targetTable.name === options.materializedViewName) {
      throw new Error(
        "Materialized view name cannot be the same as the target table name."
      );
    }
    this.name = options.materializedViewName;
    this.targetTable = targetTable;
    this.selectSql = selectStatement;
    this.sourceTables = options.selectTables.map(
      (t) => formatTableReference(t)
    );
    this.lifeCycle = options.lifeCycle;
    this.metadata = options.metadata ? { ...options.metadata } : {};
    if (!this.metadata.source) {
      const stack = new Error().stack;
      const sourceInfo = getSourceFileFromStack(stack);
      if (sourceInfo) {
        this.metadata.source = { file: sourceInfo };
      }
    }
    const materializedViews = getMooseInternal().materializedViews;
    if (!isClientOnlyMode() && materializedViews.has(this.name)) {
      throw new Error(`MaterializedView with name ${this.name} already exists`);
    }
    materializedViews.set(this.name, this);
  }
};

// src/dmv2/sdk/sqlResource.ts
var SqlResource = class {
  /** @internal */
  kind = "SqlResource";
  /** Array of SQL statements to execute for setting up the resource. */
  setup;
  /** Array of SQL statements to execute for tearing down the resource. */
  teardown;
  /** The name of the SQL resource (e.g., view name, materialized view name). */
  name;
  /** List of OlapTables or Views that this resource reads data from. */
  pullsDataFrom;
  /** List of OlapTables or Views that this resource writes data to. */
  pushesDataTo;
  /** @internal Source file path where this resource was defined */
  sourceFile;
  /** @internal Source line number where this resource was defined */
  sourceLine;
  /** @internal Source column number where this resource was defined */
  sourceColumn;
  /**
   * Creates a new SqlResource instance.
   * @param name The name of the resource.
   * @param setup An array of SQL DDL statements to create the resource.
   * @param teardown An array of SQL DDL statements to drop the resource.
   * @param options Optional configuration for specifying data dependencies.
   * @param options.pullsDataFrom Tables/Views this resource reads from.
   * @param options.pushesDataTo Tables/Views this resource writes to.
   */
  constructor(name, setup, teardown, options) {
    const sqlResources = getMooseInternal().sqlResources;
    if (!isClientOnlyMode() && sqlResources.has(name)) {
      throw new Error(`SqlResource with name ${name} already exists`);
    }
    sqlResources.set(name, this);
    this.name = name;
    this.setup = setup.map(
      (sql3) => typeof sql3 === "string" ? sql3 : toStaticQuery(sql3)
    );
    this.teardown = teardown.map(
      (sql3) => typeof sql3 === "string" ? sql3 : toStaticQuery(sql3)
    );
    this.pullsDataFrom = options?.pullsDataFrom ?? [];
    this.pushesDataTo = options?.pushesDataTo ?? [];
    const stack = new Error().stack;
    const location = getSourceLocationFromStack(stack);
    if (location) {
      this.sourceFile = location.file;
      this.sourceLine = location.line;
      this.sourceColumn = location.column;
    }
  }
};

// src/dmv2/sdk/view.ts
function formatTableReference2(table) {
  const database = table instanceof OlapTable ? table.config.database : void 0;
  if (database) {
    return `\`${database}\`.\`${table.name}\``;
  }
  return `\`${table.name}\``;
}
var View = class {
  /** @internal */
  kind = "View";
  /** The name of the view */
  name;
  /** The SELECT SQL statement that defines the view */
  selectSql;
  /** Names of source tables/views that the SELECT reads from */
  sourceTables;
  /** Optional metadata for the view */
  metadata;
  /**
   * Creates a new View instance.
   * @param name The name of the view to be created.
   * @param selectStatement The SQL SELECT statement that defines the view's logic.
   * @param baseTables An array of OlapTable or View objects that the `selectStatement` reads from. Used for dependency tracking.
   * @param metadata Optional metadata for the view (e.g., description, source file).
   */
  constructor(name, selectStatement, baseTables, metadata) {
    if (typeof selectStatement !== "string") {
      selectStatement = toStaticQuery(selectStatement);
    }
    this.name = name;
    this.selectSql = selectStatement;
    this.sourceTables = baseTables.map((t) => formatTableReference2(t));
    this.metadata = metadata ? { ...metadata } : {};
    if (!this.metadata.source) {
      const stack = new Error().stack;
      const sourceInfo = getSourceFileFromStack(stack);
      if (sourceInfo) {
        this.metadata.source = { file: sourceInfo };
      }
    }
    const views = getMooseInternal().views;
    if (!isClientOnlyMode() && views.has(this.name)) {
      throw new Error(`View with name ${this.name} already exists`);
    }
    views.set(this.name, this);
  }
};

// src/dmv2/sdk/lifeCycle.ts
var LifeCycle = /* @__PURE__ */ ((LifeCycle2) => {
  LifeCycle2["FULLY_MANAGED"] = "FULLY_MANAGED";
  LifeCycle2["DELETION_PROTECTED"] = "DELETION_PROTECTED";
  LifeCycle2["EXTERNALLY_MANAGED"] = "EXTERNALLY_MANAGED";
  return LifeCycle2;
})(LifeCycle || {});

// src/dmv2/sdk/webApp.ts
var RESERVED_MOUNT_PATHS = [
  "/admin",
  "/api",
  "/consumption",
  "/health",
  "/ingest",
  "/liveness",
  "/moose",
  // reserved for future use
  "/ready",
  "/workflows"
];
var WebApp = class {
  name;
  handler;
  config;
  /** @internal Source file path where this web app was declared */
  sourceFile;
  /** @internal Source line number where this web app was declared */
  sourceLine;
  /** @internal Source column number where this web app was declared */
  sourceColumn;
  _rawApp;
  constructor(name, appOrHandler, config) {
    this.name = name;
    this.config = config;
    const stack = new Error().stack;
    const location = getSourceLocationFromStack(stack);
    if (location) {
      this.sourceFile = location.file;
      this.sourceLine = location.line;
      this.sourceColumn = location.column;
    }
    if (!this.config.mountPath) {
      throw new Error(
        `mountPath is required. Please specify a mount path for your WebApp (e.g., "/myapi").`
      );
    }
    const mountPath = this.config.mountPath;
    if (mountPath === "/") {
      throw new Error(
        `mountPath cannot be "/" as it would allow routes to overlap with reserved paths: ${RESERVED_MOUNT_PATHS.join(", ")}`
      );
    }
    if (mountPath.endsWith("/")) {
      throw new Error(
        `mountPath cannot end with a trailing slash. Remove the '/' from: "${mountPath}"`
      );
    }
    for (const reserved of RESERVED_MOUNT_PATHS) {
      if (mountPath === reserved || mountPath.startsWith(`${reserved}/`)) {
        throw new Error(
          `mountPath cannot begin with a reserved path: ${RESERVED_MOUNT_PATHS.join(", ")}. Got: "${mountPath}"`
        );
      }
    }
    this.handler = this.toHandler(appOrHandler);
    this._rawApp = typeof appOrHandler === "function" ? void 0 : appOrHandler;
    const webApps = getMooseInternal().webApps;
    if (webApps.has(name)) {
      throw new Error(`WebApp with name ${name} already exists`);
    }
    if (this.config.mountPath) {
      for (const [existingName, existingApp] of webApps) {
        if (existingApp.config.mountPath === this.config.mountPath) {
          throw new Error(
            `WebApp with mountPath "${this.config.mountPath}" already exists (used by WebApp "${existingName}")`
          );
        }
      }
    }
    webApps.set(name, this);
  }
  toHandler(appOrHandler) {
    if (typeof appOrHandler === "function") {
      return appOrHandler;
    }
    const app = appOrHandler;
    if (typeof app.handle === "function") {
      return (req, res) => {
        app.handle(req, res, (err) => {
          if (err) {
            console.error("WebApp handler error:", err);
            if (!res.headersSent) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Internal Server Error" }));
            }
          }
        });
      };
    }
    if (typeof app.callback === "function") {
      return app.callback();
    }
    if (typeof app.routing === "function") {
      const routing = app.routing;
      const appWithReady = app;
      let readyPromise = null;
      return async (req, res) => {
        if (readyPromise === null) {
          readyPromise = typeof appWithReady.ready === "function" ? appWithReady.ready() : Promise.resolve();
        }
        await readyPromise;
        routing(req, res);
      };
    }
    throw new Error(
      `Unable to convert app to handler. The provided object must be:
      - A function (raw Node.js handler)
      - An object with .handle() method (Express, Connect)
      - An object with .callback() method (Koa)
      - An object with .routing function (Fastify)
      
Examples:
  Express: new WebApp("name", expressApp)
  Koa:     new WebApp("name", koaApp)
  Fastify: new WebApp("name", fastifyApp)
  Raw:     new WebApp("name", (req, res) => { ... })
      `
    );
  }
  getRawApp() {
    return this._rawApp;
  }
};

// src/dmv2/registry.ts
function getTables() {
  return getMooseInternal().tables;
}
function getTable(name) {
  return getMooseInternal().tables.get(name);
}
function getStreams() {
  return getMooseInternal().streams;
}
function getStream(name) {
  return getMooseInternal().streams.get(name);
}
function getIngestApis() {
  return getMooseInternal().ingestApis;
}
function getIngestApi(name) {
  return getMooseInternal().ingestApis.get(name);
}
function getApis() {
  return getMooseInternal().apis;
}
function getApi(nameOrPath) {
  const registry = getMooseInternal();
  const directMatch = registry.apis.get(nameOrPath);
  if (directMatch) {
    return directMatch;
  }
  const versionedApis = /* @__PURE__ */ new Map();
  const pathMap = /* @__PURE__ */ new Map();
  registry.apis.forEach((api, key) => {
    const baseName = api.name;
    if (!versionedApis.has(baseName)) {
      versionedApis.set(baseName, []);
    }
    versionedApis.get(baseName).push(api);
    if (api.config.path) {
      pathMap.set(api.config.path, api);
    }
  });
  const candidates = versionedApis.get(nameOrPath);
  if (candidates && candidates.length === 1) {
    return candidates[0];
  }
  return pathMap.get(nameOrPath);
}
function getSqlResources() {
  return getMooseInternal().sqlResources;
}
function getSqlResource(name) {
  return getMooseInternal().sqlResources.get(name);
}
function getWorkflows2() {
  return getMooseInternal().workflows;
}
function getWorkflow(name) {
  return getMooseInternal().workflows.get(name);
}
function getWebApps() {
  return getMooseInternal().webApps;
}
function getWebApp(name) {
  return getMooseInternal().webApps.get(name);
}
function getMaterializedViews() {
  return getMooseInternal().materializedViews;
}
function getMaterializedView(name) {
  return getMooseInternal().materializedViews.get(name);
}
function getViews() {
  return getMooseInternal().views;
}
function getView(name) {
  return getMooseInternal().views.get(name);
}

// src/index.ts
init_commons();

// src/secrets.ts
var MOOSE_RUNTIME_ENV_PREFIX = "__MOOSE_RUNTIME_ENV__:";
var mooseRuntimeEnv = {
  /**
   * Gets a value from an environment variable, with behavior depending on context.
   *
   * When IS_LOADING_INFRA_MAP=true (infrastructure loading):
   *   Returns a marker string that Moose CLI will resolve later
   *
   * When IS_LOADING_INFRA_MAP is unset (function/workflow runtime):
   *   Returns the actual value from the environment variable
   *
   * @param envVarName - Name of the environment variable to resolve
   * @returns Either a marker string or the actual environment variable value
   * @throws {Error} If the environment variable name is empty
   * @throws {Error} If the environment variable is not set (runtime mode only)
   *
   * @example
   * ```typescript
   * // Instead of this (evaluated at build time):
   * awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID
   *
   * // Use this (evaluated at runtime):
   * awsAccessKeyId: mooseRuntimeEnv.get("AWS_ACCESS_KEY_ID")
   * ```
   */
  get(envVarName) {
    if (!envVarName || envVarName.trim() === "") {
      throw new Error("Environment variable name cannot be empty");
    }
    const isLoadingInfraMap = process.env.IS_LOADING_INFRA_MAP === "true";
    if (isLoadingInfraMap) {
      return `${MOOSE_RUNTIME_ENV_PREFIX}${envVarName}`;
    } else {
      const value = process.env[envVarName];
      if (value === void 0) {
        throw new Error(
          `Environment variable '${envVarName}' is not set. This is required for runtime execution of functions/workflows.`
        );
      }
      return value;
    }
  }
};
var mooseEnvSecrets = mooseRuntimeEnv;

// src/consumption-apis/helpers.ts
var import_client2 = require("@temporalio/client");
var import_node_crypto3 = require("crypto");
var import_perf_hooks = require("perf_hooks");
var fs3 = __toESM(require("fs"));
function formatElapsedTime(ms) {
  if (ms < 1e3) {
    return `${Math.round(ms)} ms`;
  }
  const seconds = ms / 1e3;
  if (seconds < 60) {
    return `${seconds.toFixed(2)} seconds`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} minutes and ${remainingSeconds.toFixed(2)} seconds`;
}
var MooseClient = class {
  query;
  workflow;
  constructor(queryClient, temporalClient) {
    this.query = queryClient;
    this.workflow = new WorkflowClient(temporalClient);
  }
};
var QueryClient = class {
  client;
  query_id_prefix;
  constructor(client, query_id_prefix) {
    this.client = client;
    this.query_id_prefix = query_id_prefix;
  }
  async execute(sql3) {
    const [query, query_params] = toQuery(sql3);
    console.log(`[QueryClient] | Query: ${toQueryPreview(sql3)}`);
    const start = import_perf_hooks.performance.now();
    const result = await this.client.query({
      query,
      query_params,
      format: "JSONEachRow",
      query_id: this.query_id_prefix + (0, import_node_crypto3.randomUUID)(),
      // Note: wait_end_of_query deliberately NOT set here as this is used for SELECT queries
      // where response buffering would harm streaming performance and concurrency
      clickhouse_settings: {
        asterisk_include_materialized_columns: 1,
        asterisk_include_alias_columns: 1
      }
    });
    const elapsedMs = import_perf_hooks.performance.now() - start;
    console.log(
      `[QueryClient] | Query completed: ${formatElapsedTime(elapsedMs)}`
    );
    return result;
  }
  async command(sql3) {
    const [query, query_params] = toQuery(sql3);
    console.log(`[QueryClient] | Command: ${toQueryPreview(sql3)}`);
    const start = import_perf_hooks.performance.now();
    const result = await this.client.command({
      query,
      query_params,
      query_id: this.query_id_prefix + (0, import_node_crypto3.randomUUID)()
    });
    const elapsedMs = import_perf_hooks.performance.now() - start;
    console.log(
      `[QueryClient] | Command completed: ${formatElapsedTime(elapsedMs)}`
    );
    return result;
  }
};
var WorkflowClient = class {
  client;
  constructor(temporalClient) {
    this.client = temporalClient;
  }
  async execute(name, input_data) {
    try {
      if (!this.client) {
        return {
          status: 404,
          body: `Temporal client not found. Is the feature flag enabled?`
        };
      }
      const config = await this.getWorkflowConfig(name);
      const [processedInput, workflowId] = this.processInputData(
        name,
        input_data
      );
      console.log(
        `WorkflowClient - starting workflow: ${name} with config ${JSON.stringify(config)} and input_data ${JSON.stringify(processedInput)}`
      );
      const handle = await this.client.workflow.start("ScriptWorkflow", {
        args: [
          { workflow_name: name, execution_mode: "start" },
          processedInput
        ],
        taskQueue: "typescript-script-queue",
        workflowId,
        workflowIdConflictPolicy: "FAIL",
        workflowIdReusePolicy: "ALLOW_DUPLICATE",
        retry: {
          // Temporal's maximumAttempts = total attempts (initial + retries)
          maximumAttempts: config.retries + 1
        },
        workflowRunTimeout: config.timeout
      });
      return {
        status: 200,
        body: `Workflow started: ${name}. View it in the Temporal dashboard: http://localhost:8080/namespaces/default/workflows/${workflowId}/${handle.firstExecutionRunId}/history`
      };
    } catch (error) {
      return {
        status: 400,
        body: `Error starting workflow: ${error}`
      };
    }
  }
  async terminate(workflowId) {
    try {
      if (!this.client) {
        return {
          status: 404,
          body: `Temporal client not found. Is the feature flag enabled?`
        };
      }
      const handle = this.client.workflow.getHandle(workflowId);
      await handle.terminate();
      return {
        status: 200,
        body: `Workflow terminated: ${workflowId}`
      };
    } catch (error) {
      return {
        status: 400,
        body: `Error terminating workflow: ${error}`
      };
    }
  }
  async getWorkflowConfig(name) {
    const workflows = await getWorkflows();
    const workflow = workflows.get(name);
    if (workflow) {
      return {
        retries: workflow.config.retries || 3,
        timeout: workflow.config.timeout || "1h"
      };
    }
    throw new Error(`Workflow config not found for ${name}`);
  }
  processInputData(name, input_data) {
    let workflowId = name;
    if (input_data) {
      const hash = (0, import_node_crypto3.createHash)("sha256").update(JSON.stringify(input_data)).digest("hex").slice(0, 16);
      workflowId = `${name}-${hash}`;
    }
    return [input_data, workflowId];
  }
};
async function getTemporalClient(temporalUrl, namespace, clientCert, clientKey, apiKey) {
  try {
    console.info(
      `<api> Using temporal_url: ${temporalUrl} and namespace: ${namespace}`
    );
    let connectionOptions = {
      address: temporalUrl,
      connectTimeout: "3s"
    };
    if (clientCert && clientKey) {
      console.log("Using TLS for secure Temporal");
      const cert = await fs3.readFileSync(clientCert);
      const key = await fs3.readFileSync(clientKey);
      connectionOptions.tls = {
        clientCertPair: { crt: cert, key }
      };
    } else if (apiKey) {
      console.log("Using API key for secure Temporal");
      connectionOptions.address = "us-west1.gcp.api.temporal.io:7233";
      connectionOptions.apiKey = apiKey;
      connectionOptions.tls = {};
      connectionOptions.metadata = {
        "temporal-namespace": namespace
      };
    }
    console.log(`<api> Connecting to Temporal at ${connectionOptions.address}`);
    const connection = await import_client2.Connection.connect(connectionOptions);
    const client = new import_client2.Client({ connection, namespace });
    console.log("<api> Connected to Temporal server");
    return client;
  } catch (error) {
    console.warn(`Failed to connect to Temporal. Is the feature flag enabled?`);
    console.warn(error);
    return void 0;
  }
}
var ApiHelpers = {
  column: (value) => ["Identifier", value],
  table: (value) => ["Identifier", value]
};
var ConsumptionHelpers = ApiHelpers;
function joinQueries({
  values,
  separator = ",",
  prefix = "",
  suffix = ""
}) {
  if (values.length === 0) {
    throw new TypeError(
      "Expected `join([])` to be called with an array of multiple elements, but got an empty array"
    );
  }
  return new Sql(
    [prefix, ...Array(values.length - 1).fill(separator), suffix],
    values
  );
}

// src/consumption-apis/webAppHelpers.ts
function getMooseUtilsFromRequest(req) {
  console.warn(
    "[DEPRECATED] getMooseUtilsFromRequest() is deprecated. Import getMooseUtils from '@514labs/moose-lib' and call it without parameters: const { client, sql } = await getMooseUtils();"
  );
  return req.moose;
}
var getLegacyMooseUtils = getMooseUtilsFromRequest;
function expressMiddleware() {
  console.warn(
    "[DEPRECATED] expressMiddleware() is deprecated. Use getMooseUtils() directly or rely on injectMooseUtils config."
  );
  return (req, res, next) => {
    if (!req.moose && req.raw && req.raw.moose) {
      req.moose = req.raw.moose;
    }
    next();
  };
}

// src/clients/redisClient.ts
var import_redis = require("redis");
var instance = null;
var initPromise = null;
var MooseCache = class _MooseCache {
  client;
  isConnected = false;
  keyPrefix;
  disconnectTimer = null;
  idleTimeout;
  connectPromise = null;
  constructor() {
    const redisUrl = process.env.MOOSE_REDIS_CONFIG__URL || "redis://127.0.0.1:6379";
    const prefix = process.env.MOOSE_REDIS_CONFIG__KEY_PREFIX || "MS";
    this.idleTimeout = parseInt(process.env.MOOSE_REDIS_CONFIG__IDLE_TIMEOUT || "30", 10) * 1e3;
    this.keyPrefix = `${prefix}::moosecache::`;
    this.client = (0, import_redis.createClient)({
      url: redisUrl
    });
    process.on("SIGTERM", this.gracefulShutdown);
    process.on("SIGINT", this.gracefulShutdown);
    this.client.on("error", async (err) => {
      console.error("TS Redis client error:", err);
      await this.disconnect();
    });
    this.client.on("connect", () => {
      this.isConnected = true;
      console.log("TS Redis client connected");
    });
    this.client.on("end", () => {
      this.isConnected = false;
      console.log("TS Redis client disconnected");
      this.clearDisconnectTimer();
    });
  }
  clearDisconnectTimer() {
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }
  }
  resetDisconnectTimer() {
    this.clearDisconnectTimer();
    this.disconnectTimer = setTimeout(async () => {
      if (this.isConnected) {
        console.log("TS Redis client disconnecting due to inactivity");
        await this.disconnect();
      }
    }, this.idleTimeout);
  }
  async ensureConnected() {
    if (!this.isConnected) {
      await this.connect();
    }
    this.resetDisconnectTimer();
  }
  async connect() {
    if (this.isConnected) {
      return;
    }
    if (this.connectPromise) {
      return this.connectPromise;
    }
    this.connectPromise = (async () => {
      try {
        await this.client.connect();
        this.resetDisconnectTimer();
      } catch (error) {
        this.connectPromise = null;
        throw error;
      }
    })();
    return this.connectPromise;
  }
  async gracefulShutdown() {
    if (this.isConnected) {
      await this.disconnect();
    }
    process.exit(0);
  }
  getPrefixedKey(key) {
    return `${this.keyPrefix}${key}`;
  }
  /**
   * Gets the singleton instance of MooseCache. Creates a new instance if one doesn't exist.
   * The client will automatically connect to Redis and handle reconnection if needed.
   *
   * @returns Promise<MooseCache> The singleton instance of MooseCache
   * @example
   * const cache = await MooseCache.get();
   */
  static async get() {
    if (instance) {
      return instance;
    }
    if (initPromise) {
      return initPromise;
    }
    initPromise = (async () => {
      try {
        const newInstance = new _MooseCache();
        await newInstance.connect();
        instance = newInstance;
        return newInstance;
      } catch (error) {
        initPromise = null;
        throw error;
      }
    })();
    return initPromise;
  }
  /**
   * Sets a value in the cache. Objects are automatically JSON stringified.
   *
   * @param key - The key to store the value under
   * @param value - The value to store. Can be a string or any object (will be JSON stringified)
   * @param ttlSeconds - Optional time-to-live in seconds. If not provided, defaults to 1 hour (3600 seconds).
   *                    Must be a non-negative number. If 0, the key will expire immediately.
   * @example
   * // Store a string
   * await cache.set("foo", "bar");
   *
   * // Store an object with custom TTL
   * await cache.set("foo:config", { baz: 123, qux: true }, 60); // expires in 1 minute
   *
   * // This is essentially a get-set, which returns the previous value if it exists.
   * // You can create logic to only do work for the first time.
   * const value = await cache.set("testSessionId", "true");
   * if (value) {
   *   // Cache was set before, return
   * } else {
   *   // Cache was set for first time, do work
   * }
   */
  async set(key, value, ttlSeconds) {
    try {
      if (ttlSeconds !== void 0 && ttlSeconds < 0) {
        throw new Error("ttlSeconds must be a non-negative number");
      }
      await this.ensureConnected();
      const prefixedKey = this.getPrefixedKey(key);
      const stringValue = typeof value === "object" ? JSON.stringify(value) : value;
      const ttl = ttlSeconds ?? 3600;
      return await this.client.set(prefixedKey, stringValue, {
        EX: ttl,
        GET: true
      });
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error);
      throw error;
    }
  }
  /**
   * Retrieves a value from the cache. Attempts to parse the value as JSON if possible.
   *
   * @param key - The key to retrieve
   * @returns Promise<T | null> The value, parsed as type T if it was JSON, or as string if not. Returns null if key doesn't exist
   * @example
   * // Get a string
   * const value = await cache.get("foo");
   *
   * // Get and parse an object with type safety
   * interface Config { baz: number; qux: boolean; }
   * const config = await cache.get<Config>("foo:config");
   */
  async get(key) {
    try {
      await this.ensureConnected();
      const prefixedKey = this.getPrefixedKey(key);
      const value = await this.client.get(prefixedKey);
      if (value === null) return null;
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === "object" && parsed !== null) {
          return parsed;
        }
        return value;
      } catch {
        return value;
      }
    } catch (error) {
      console.error(`Error getting cache key ${key}:`, error);
      throw error;
    }
  }
  /**
   * Deletes a specific key from the cache.
   *
   * @param key - The key to delete
   * @example
   * await cache.delete("foo");
   */
  async delete(key) {
    try {
      await this.ensureConnected();
      const prefixedKey = this.getPrefixedKey(key);
      await this.client.del(prefixedKey);
    } catch (error) {
      console.error(`Error deleting cache key ${key}:`, error);
      throw error;
    }
  }
  /**
   * Deletes all keys that start with the given prefix.
   *
   * @param keyPrefix - The prefix of keys to delete
   * @example
   * // Delete all keys starting with "foo"
   * await cache.clearKeys("foo");
   */
  async clearKeys(keyPrefix) {
    try {
      await this.ensureConnected();
      const prefixedKey = this.getPrefixedKey(keyPrefix);
      const keys = await this.client.keys(`${prefixedKey}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error(
        `Error clearing cache keys with prefix ${keyPrefix}:`,
        error
      );
      throw error;
    }
  }
  /**
   * Deletes all keys in the cache
   *
   * @example
   * await cache.clear();
   */
  async clear() {
    try {
      await this.ensureConnected();
      const keys = await this.client.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
      throw error;
    }
  }
  /**
   * Manually disconnects the Redis client. The client will automatically reconnect
   * when the next operation is performed.
   *
   * @example
   * await cache.disconnect();
   */
  async disconnect() {
    this.clearDisconnectTimer();
    this.connectPromise = null;
    if (this.isConnected) {
      await this.client.quit();
    }
  }
};

// src/consumption-apis/standalone.ts
init_commons();
var standaloneUtils = null;
var initPromise2 = null;
var toClientConfig = (config) => ({
  ...config,
  useSSL: config.useSSL ? "true" : "false"
});
async function getMooseUtils(req) {
  if (req !== void 0) {
    console.warn(
      "[DEPRECATED] getMooseUtils(req) no longer requires a request parameter. Use getMooseUtils() instead."
    );
  }
  const runtimeContext = globalThis._mooseRuntimeContext;
  if (runtimeContext) {
    return {
      client: runtimeContext.client,
      sql,
      jwt: runtimeContext.jwt
    };
  }
  if (standaloneUtils) {
    return standaloneUtils;
  }
  if (initPromise2) {
    return initPromise2;
  }
  initPromise2 = (async () => {
    await Promise.resolve().then(() => (init_runtime(), runtime_exports));
    const configRegistry = globalThis._mooseConfigRegistry;
    if (!configRegistry) {
      throw new Error(
        "Moose not initialized. Ensure you're running within a Moose app or have proper configuration set up."
      );
    }
    const clickhouseConfig = await configRegistry.getStandaloneClickhouseConfig();
    const clickhouseClient = getClickhouseClient(
      toClientConfig(clickhouseConfig)
    );
    const queryClient = new QueryClient(clickhouseClient, "standalone");
    const mooseClient = new MooseClient(queryClient);
    standaloneUtils = {
      client: mooseClient,
      sql,
      jwt: void 0
    };
    return standaloneUtils;
  })();
  try {
    return await initPromise2;
  } finally {
    initPromise2 = null;
  }
}
async function getMooseClients(config) {
  console.warn(
    "[DEPRECATED] getMooseClients() is deprecated. Use getMooseUtils() instead."
  );
  if (config && Object.keys(config).length > 0) {
    await Promise.resolve().then(() => (init_runtime(), runtime_exports));
    const configRegistry = globalThis._mooseConfigRegistry;
    if (!configRegistry) {
      throw new Error(
        "Configuration registry not initialized. Ensure the Moose framework is properly set up."
      );
    }
    const clickhouseConfig = await configRegistry.getStandaloneClickhouseConfig(config);
    const clickhouseClient = getClickhouseClient(
      toClientConfig(clickhouseConfig)
    );
    const queryClient = new QueryClient(clickhouseClient, "standalone");
    const mooseClient = new MooseClient(queryClient);
    return { client: mooseClient };
  }
  const utils = await getMooseUtils();
  return { client: utils.client };
}

// src/utilities/dataParser.ts
var import_csv_parse = require("csv-parse");

// src/utilities/json.ts
function jsonDateReviver(key, value) {
  const iso8601Format = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)$/;
  if (typeof value === "string" && iso8601Format.test(value)) {
    return new Date(value);
  }
  return value;
}

// src/utilities/dataParser.ts
function parseCSV(content2, config) {
  return new Promise((resolve2, reject) => {
    const results = [];
    (0, import_csv_parse.parse)(content2, {
      delimiter: config.delimiter,
      columns: config.columns ?? true,
      skip_empty_lines: config.skipEmptyLines ?? true,
      trim: config.trim ?? true
    }).on("data", (row) => {
      results.push(row);
    }).on("end", () => {
      resolve2(results);
    }).on("error", (error) => {
      reject(error);
    });
  });
}
function parseJSON(content2, config = {}) {
  try {
    const parsed = JSON.parse(content2, config.reviver);
    if (Array.isArray(parsed)) {
      return parsed;
    } else {
      return [parsed];
    }
  } catch (error) {
    throw new Error(
      `Failed to parse JSON: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
function parseJSONWithDates(content2) {
  return parseJSON(content2, { reviver: jsonDateReviver });
}
function isValidCSVDelimiter(delimiter) {
  return delimiter.length === 1 && !/\s/.test(delimiter);
}
var CSV_DELIMITERS = {
  COMMA: ",",
  TAB: "	",
  SEMICOLON: ";",
  PIPE: "|"
};
var DEFAULT_CSV_CONFIG = {
  delimiter: CSV_DELIMITERS.COMMA,
  columns: true,
  skipEmptyLines: true,
  trim: true
};
var DEFAULT_JSON_CONFIG = {
  reviver: jsonDateReviver
};

// src/connectors/dataSource.ts
var DataSource = class {
  name;
  supportsIncremental;
  constructor(config) {
    this.name = config.name;
    this.supportsIncremental = config.supportsIncremental ?? false;
  }
};

// src/query-layer/sql-utils.ts
var raw = sql.raw;
var empty = sql``;
var join2 = sql.join;
function isEmpty(fragment) {
  return fragment.strings.every((s) => s.trim() === "") && fragment.values.length === 0;
}
function filter(col, op, value) {
  if (value === void 0 || value === null) return empty;
  switch (op) {
    case "eq":
      return eq(col, value);
    case "ne":
      return ne(col, value);
    case "gt":
      return gt(col, value);
    case "gte":
      return gte(col, value);
    case "lt":
      return lt(col, value);
    case "lte":
      return lte(col, value);
    case "like":
      return like(col, value);
    case "ilike":
      return ilike(col, value);
    case "in":
      return inList(col, value);
    case "notIn":
      return notIn(col, value);
    case "between": {
      const [low, high] = value;
      return between(col, low, high);
    }
    case "isNull":
      return value ? isNull(col) : empty;
    case "isNotNull":
      return value ? isNotNull(col) : empty;
  }
}
function eq(col, value) {
  return sql`${col} = ${value}`;
}
function ne(col, value) {
  return sql`${col} != ${value}`;
}
function gt(col, value) {
  return sql`${col} > ${value}`;
}
function gte(col, value) {
  return sql`${col} >= ${value}`;
}
function lt(col, value) {
  return sql`${col} < ${value}`;
}
function lte(col, value) {
  return sql`${col} <= ${value}`;
}
function like(col, pattern) {
  return sql`${col} LIKE ${pattern}`;
}
function ilike(col, pattern) {
  return sql`${col} ILIKE ${pattern}`;
}
function inList(col, values) {
  if (values.length === 0) return sql`1 = 0`;
  return sql`${col} IN (${join2(values.map((v) => sql`${v}`))})`;
}
function notIn(col, values) {
  if (values.length === 0) return sql`1 = 1`;
  return sql`${col} NOT IN (${join2(values.map((v) => sql`${v}`))})`;
}
function between(col, low, high) {
  return sql`${col} BETWEEN ${low} AND ${high}`;
}
function isNull(col) {
  return sql`${col} IS NULL`;
}
function isNotNull(col) {
  return sql`${col} IS NOT NULL`;
}
function and(...conditions) {
  const nonEmpty = conditions.filter((c) => !isEmpty(c));
  return join2(nonEmpty, "AND");
}
function or(...conditions) {
  const nonEmpty = conditions.filter((c) => !isEmpty(c));
  if (nonEmpty.length === 0) return empty;
  if (nonEmpty.length === 1) return nonEmpty[0];
  return sql`(${join2(nonEmpty, "OR")})`;
}
function not(condition) {
  if (isEmpty(condition)) return empty;
  return sql`NOT (${condition})`;
}
function where(...conditions) {
  const combined = and(...conditions);
  return isEmpty(combined) ? empty : sql`WHERE ${combined}`;
}
function orderBy(...cols) {
  if (cols.length === 0) return empty;
  const parts = cols.map((c) => {
    if (Array.isArray(c)) {
      const [col, dir] = c;
      return sql`${col} ${raw(dir)}`;
    }
    return sql`${c}`;
  });
  return sql`ORDER BY ${join2(parts)}`;
}
function limit(n) {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error("LIMIT must be a non-negative integer");
  }
  return sql`LIMIT ${n}`;
}
function offset(n) {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error("OFFSET must be a non-negative integer");
  }
  return sql`OFFSET ${n}`;
}
function paginate(pageSize, page = 0) {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error("pageSize must be a positive integer");
  }
  if (!Number.isInteger(page) || page < 0) {
    throw new Error("page must be a non-negative integer");
  }
  const offsetVal = page * pageSize;
  return offsetVal > 0 ? sql`LIMIT ${pageSize} OFFSET ${offsetVal}` : sql`LIMIT ${pageSize}`;
}
function groupBy(...cols) {
  if (cols.length === 0) return empty;
  return sql`GROUP BY ${join2(cols.map((c) => sql`${c}`))}`;
}
function having(...conditions) {
  const combined = and(...conditions);
  return isEmpty(combined) ? empty : sql`HAVING ${combined}`;
}
function identifier(name) {
  return raw(quoteIdentifier(name));
}
function expr(fragment) {
  const e = Object.create(fragment);
  e.as = (alias) => sql`${fragment} AS ${identifier(alias)}`;
  return e;
}
function count(col) {
  return expr(col ? sql`count(${col})` : sql`count(*)`);
}
function countDistinct(col) {
  return expr(sql`count(DISTINCT ${col})`);
}
function sum(col) {
  return expr(sql`sum(${col})`);
}
function avg(col) {
  return expr(sql`avg(${col})`);
}
function min(col) {
  return expr(sql`min(${col})`);
}
function max(col) {
  return expr(sql`max(${col})`);
}
function select(...cols) {
  if (cols.length === 0) return sql`SELECT *`;
  const parts = cols.map((c) => {
    if (Array.isArray(c)) {
      const [col, alias] = c;
      return sql`${col} AS ${identifier(alias)}`;
    }
    return sql`${c}`;
  });
  return sql`SELECT ${join2(parts)}`;
}
function as(expression, alias) {
  return sql`${expression} AS ${identifier(alias)}`;
}

// src/query-layer/helpers.ts
function toCamelCase(s) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
var TYPE_PREFIX_MAP = [
  ["datetime", "date"],
  ["date", "date"],
  ["uint", "number"],
  ["int", "number"],
  ["float", "number"],
  ["decimal", "number"],
  ["enum", "select"],
  ["boolean", "select"],
  ["bool", "select"]
];
function deriveInputTypeFromDataType(dataType) {
  if (typeof dataType === "string") {
    const lower = dataType.toLowerCase();
    const match = TYPE_PREFIX_MAP.find(([prefix]) => lower.startsWith(prefix));
    return match ? match[1] : "text";
  }
  if ("nullable" in dataType) {
    return deriveInputTypeFromDataType(dataType.nullable);
  }
  if ("name" in dataType && "values" in dataType) {
    return "select";
  }
  if ("elementType" in dataType) {
    return "text";
  }
  return "text";
}
function timeDimensions(dateColumn, options) {
  const periods = options?.periods ?? ["day", "month", "week"];
  const fnMap = {
    day: (col) => ({ expression: sql`toDate(${col})`, as: "day" }),
    month: (col) => ({ expression: sql`toStartOfMonth(${col})`, as: "month" }),
    week: (col) => ({ expression: sql`toStartOfWeek(${col})`, as: "week" })
  };
  const supported = Object.keys(fnMap);
  const result = {};
  for (const period of periods) {
    const factory = fnMap[period];
    if (!factory) {
      throw new Error(
        `Unknown time period '${period}'. Supported: ${supported.join(", ")}`
      );
    }
    result[period] = factory(dateColumn);
  }
  return result;
}
function columnsFromTable(table, options) {
  const { include, exclude, camelCase = true } = options ?? {};
  const result = {};
  for (const col of table.columnArray) {
    const colName = String(col.name);
    if (include && !include.includes(colName)) continue;
    if (exclude && exclude.includes(colName)) continue;
    const key = camelCase ? toCamelCase(colName) : colName;
    result[key] = { column: colName };
  }
  return result;
}
function filtersFromTable(table, options) {
  const { include, exclude, camelCase = true } = options ?? {};
  const result = {};
  for (const col of table.columnArray) {
    const colName = String(col.name);
    if (include && !include.includes(colName)) continue;
    if (exclude && exclude.includes(colName)) continue;
    const key = camelCase ? toCamelCase(colName) : colName;
    result[key] = {
      column: colName,
      operators: ["eq"],
      inputType: deriveInputTypeFromDataType(col.data_type)
    };
  }
  return result;
}

// src/query-layer/query-model.ts
var applyFilter = filter;
var identity = (v) => v;
function resolveTable(tableOrMv) {
  return tableOrMv instanceof MaterializedView ? tableOrMv.targetTable : tableOrMv;
}
function transformFilterValue(op, value, transform) {
  switch (op) {
    case "in":
    case "notIn":
      return value.map(transform);
    case "between": {
      const [low, high] = value;
      return [transform(low), transform(high)];
    }
    case "isNull":
    case "isNotNull":
      return value;
    default:
      return transform(value);
  }
}
function defineQueryModel(config) {
  const {
    table: tableOrMv,
    dimensions,
    metrics,
    columns: columnDefs,
    joins: joinDefs,
    filters,
    sortable,
    defaults = {}
  } = config;
  const table = resolveTable(tableOrMv);
  const { maxLimit = 1e3 } = defaults;
  const primaryTableName = table.name;
  const hasJoins = joinDefs != null && Object.keys(joinDefs).length > 0;
  const normalizedDimensions = {};
  if (dimensions) {
    for (const [name, def] of Object.entries(dimensions)) {
      const column = def.column ? hasJoins ? void 0 : table.columns[def.column] : void 0;
      const expression = def.expression ?? (def.column && hasJoins ? raw(
        `${quoteIdentifier(primaryTableName)}.${quoteIdentifier(String(def.column))}`
      ) : void 0);
      normalizedDimensions[name] = { column, expression, as: def.as };
    }
  }
  const normalizedMetrics = {};
  if (metrics) {
    for (const [name, def] of Object.entries(metrics)) {
      normalizedMetrics[name] = { agg: def.agg, as: def.as };
    }
  }
  const normalizedColumns = {};
  if (columnDefs) {
    for (const [name, def] of Object.entries(columnDefs)) {
      if (def.join && joinDefs) {
        const joinDef = joinDefs[def.join];
        if (!joinDef) {
          throw new Error(
            `Column '${name}' references unknown join '${def.join}'`
          );
        }
        const joinTableName = resolveTable(joinDef.table).name;
        normalizedColumns[name] = {
          expression: raw(
            `${quoteIdentifier(joinTableName)}.${quoteIdentifier(String(def.column))}`
          ),
          as: def.as
        };
      } else if (hasJoins) {
        normalizedColumns[name] = {
          expression: raw(
            `${quoteIdentifier(primaryTableName)}.${quoteIdentifier(String(def.column))}`
          ),
          as: def.as
        };
      } else {
        normalizedColumns[name] = {
          column: table.columns[def.column],
          as: def.as
        };
      }
    }
  }
  const resolvedFilters = {};
  const filtersWithInputType = {};
  for (const [name, def] of Object.entries(filters)) {
    if (def.metric) {
      const metricDef = normalizedMetrics[def.metric];
      if (!metricDef) {
        throw new Error(
          `Filter '${name}' references unknown metric '${def.metric}'`
        );
      }
      const alias = metricDef.as ?? def.metric;
      const inputType = def.inputType ?? "number";
      resolvedFilters[name] = {
        column: identifier(alias),
        operators: def.operators,
        transform: def.transform,
        inputType,
        isHaving: true
      };
      filtersWithInputType[name] = { ...def, inputType };
    } else if (def.column != null) {
      const columnRef = table.columns[def.column];
      if (!columnRef) {
        throw new Error(
          `Filter '${name}' references unknown column '${String(def.column)}' on table '${primaryTableName}'`
        );
      }
      const inputType = def.inputType ?? (columnRef.data_type ? deriveInputTypeFromDataType(columnRef.data_type) : void 0);
      const resolvedColumn = hasJoins ? raw(
        `${quoteIdentifier(primaryTableName)}.${quoteIdentifier(String(def.column))}`
      ) : columnRef;
      resolvedFilters[name] = {
        column: resolvedColumn,
        operators: def.operators,
        transform: def.transform,
        inputType
      };
      filtersWithInputType[name] = { ...def, inputType };
    } else {
      throw new Error(
        `Filter '${name}' must specify either 'column' or 'metric'`
      );
    }
  }
  const normalizedFields = {
    ...normalizedDimensions,
    ...normalizedMetrics,
    ...normalizedColumns
  };
  const dimensionNamesSet = new Set(Object.keys(normalizedDimensions));
  const metricNamesSet = new Set(Object.keys(normalizedMetrics));
  const columnNamesSet = new Set(Object.keys(normalizedColumns));
  const dimensionNames = Object.keys(normalizedDimensions);
  const metricNames = Object.keys(normalizedMetrics);
  const columnNames = Object.keys(normalizedColumns);
  function buildFieldExpr(field, defaultAlias) {
    const expr2 = field.agg ?? field.expression ?? (field.column ? sql`${field.column}` : empty);
    if (!expr2 || isEmpty(expr2)) return empty;
    const alias = field.as ?? defaultAlias;
    return sql`${expr2} AS ${identifier(String(alias))}`;
  }
  function buildFieldList(fieldDefs, selectFields) {
    const fieldNames = selectFields ?? Object.keys(fieldDefs);
    return fieldNames.map((name) => {
      const field = fieldDefs[name];
      if (!field) return empty;
      return buildFieldExpr(field, name);
    }).filter((s) => !isEmpty(s));
  }
  function buildSelectClause(selectFields) {
    const parts = buildFieldList(normalizedFields, selectFields);
    return sql`SELECT ${join2(parts)}`;
  }
  function buildFilterConditions(filterParams) {
    if (!filterParams) return { where: [], having: [] };
    const whereConds = [];
    const havingConds = [];
    for (const [filterName, ops] of Object.entries(filterParams)) {
      const filterDef = resolvedFilters[filterName];
      if (!filterDef) {
        throw new Error(`Unknown filter '${filterName}'`);
      }
      if (!ops) continue;
      for (const [op, value] of Object.entries(
        ops
      )) {
        if (value === void 0) continue;
        if (!filterDef.operators.includes(op)) {
          throw new Error(
            `Operator '${op}' not allowed for filter '${filterName}'`
          );
        }
        const t = filterDef.transform ?? identity;
        const transformed = transformFilterValue(
          op,
          value,
          t
        );
        const condition = applyFilter(
          filterDef.column,
          op,
          transformed
        );
        if (!isEmpty(condition)) {
          if (filterDef.isHaving) {
            havingConds.push(condition);
          } else {
            whereConds.push(condition);
          }
        }
      }
    }
    return { where: whereConds, having: havingConds };
  }
  function buildOrderByClause(spec, selectedFieldSet) {
    const orderBySpec = spec.orderBy && spec.orderBy.length > 0 ? spec.orderBy : defaults.orderBy;
    if (!orderBySpec || orderBySpec.length === 0) return empty;
    for (const [field] of orderBySpec) {
      if (!sortable.includes(field)) {
        throw new Error(`Field '${field}' is not sortable`);
      }
    }
    const parts = orderBySpec.map(([field, dir]) => {
      if (dir !== "ASC" && dir !== "DESC") {
        throw new Error(`Invalid sort direction '${dir}'`);
      }
      const fieldDef = normalizedFields[field];
      if (!fieldDef) return empty;
      if (selectedFieldSet && dimensionNamesSet.has(field) && !selectedFieldSet.has(field)) {
        return empty;
      }
      const alias = fieldDef.as ?? String(field);
      const col = fieldDef.expression ?? (fieldDef.column ? sql`${fieldDef.column}` : empty);
      const orderExpr = fieldDef.agg ? identifier(alias) : col;
      if (isEmpty(orderExpr)) return empty;
      return sql`${orderExpr} ${raw(dir)}`;
    }).filter((p) => !isEmpty(p));
    return parts.length > 0 ? sql`ORDER BY ${join2(parts)}` : empty;
  }
  function buildFromClause() {
    if (!hasJoins) {
      return sql`FROM ${table}`;
    }
    let fromClause = sql`FROM ${table}`;
    for (const [, joinDef] of Object.entries(joinDefs)) {
      const joinType = joinDef.type ?? "LEFT";
      const joinTable = resolveTable(joinDef.table);
      let onClause;
      if (joinDef.leftKey && joinDef.rightKey) {
        const joinTableName = joinTable.name;
        onClause = raw(
          `${quoteIdentifier(primaryTableName)}.${quoteIdentifier(joinDef.leftKey)} = ${quoteIdentifier(joinTableName)}.${quoteIdentifier(joinDef.rightKey)}`
        );
      } else if (joinDef.on) {
        onClause = joinDef.on;
      } else {
        throw new Error("JoinDef must specify either leftKey/rightKey or on");
      }
      fromClause = sql`${fromClause} ${raw(joinType)} JOIN ${joinTable} ON ${onClause}`;
    }
    return fromClause;
  }
  function resolveQuerySpec(request) {
    if (request.columns && request.columns.length > 0) {
      return {
        select: request.columns,
        groupBy: void 0,
        filters: request.filters,
        orderBy: request.orderBy,
        limit: request.limit,
        page: request.page,
        offset: request.offset,
        detailMode: true
      };
    }
    const select2 = [...request.dimensions ?? [], ...request.metrics ?? []];
    const groupBy2 = request.dimensions && request.dimensions.length > 0 ? request.dimensions : void 0;
    return {
      select: select2.length > 0 ? select2 : void 0,
      groupBy: groupBy2,
      filters: request.filters,
      orderBy: request.orderBy,
      limit: request.limit,
      page: request.page,
      offset: request.offset,
      detailMode: false
    };
  }
  function buildGroupByClause(spec) {
    const groupByFields = spec.groupBy ?? defaults.groupBy;
    if (!groupByFields || groupByFields.length === 0) return empty;
    const groupExprs = groupByFields.map((fieldName) => {
      if (!dimensionNamesSet.has(fieldName)) {
        throw new Error(`Field '${fieldName}' is not a valid dimension`);
      }
      const field = normalizedFields[fieldName];
      if (!field) {
        throw new Error(`Field '${fieldName}' is not a valid dimension`);
      }
      if (field.expression) return field.expression;
      if (field.column) return sql`${field.column}`;
      return raw(fieldName);
    });
    return groupBy(...groupExprs);
  }
  function toParts(request) {
    const spec = resolveQuerySpec(request);
    if (spec.offset != null && spec.page != null) {
      throw new Error(
        "Cannot specify both 'offset' and 'page' \u2014 they are mutually exclusive"
      );
    }
    const limitVal = Math.min(spec.limit ?? defaults.limit ?? 100, maxLimit);
    const offsetVal = spec.offset ?? (spec.page ?? 0) * limitVal;
    const pagination = spec.offset != null ? sql`LIMIT ${limitVal} OFFSET ${offsetVal}` : paginate(limitVal, spec.page ?? 0);
    const selectedFields = spec.select ?? (spec.detailMode ? Object.keys(normalizedFields) : [...dimensionNames, ...metricNames]);
    const selectedColumns = selectedFields.filter((f) => columnNamesSet.has(f));
    const selectedDimensions = selectedFields.filter(
      (f) => dimensionNamesSet.has(f)
    );
    const selectedMetrics = selectedFields.filter((f) => metricNamesSet.has(f));
    const columnParts = buildFieldList(
      normalizedColumns,
      selectedColumns.length > 0 ? selectedColumns : void 0
    );
    const dimensionParts = buildFieldList(
      normalizedDimensions,
      selectedDimensions.length > 0 ? selectedDimensions : void 0
    );
    const metricParts = buildFieldList(
      normalizedMetrics,
      selectedMetrics.length > 0 ? selectedMetrics : void 0
    );
    const selectedFieldSet = new Set(selectedFields);
    const selectClause = buildSelectClause(selectedFields);
    const filterResult = buildFilterConditions(spec.filters);
    const whereClause = filterResult.where.length > 0 ? where(...filterResult.where) : empty;
    const havingPart = filterResult.having.length > 0 ? having(...filterResult.having) : empty;
    const groupByPart = spec.detailMode ? empty : buildGroupByClause(spec);
    const orderByPart = buildOrderByClause(spec, selectedFieldSet);
    return {
      select: selectClause,
      dimensions: dimensionParts.length > 0 ? join2(dimensionParts) : empty,
      metrics: metricParts.length > 0 ? join2(metricParts) : empty,
      columns: columnParts.length > 0 ? join2(columnParts) : empty,
      from: buildFromClause(),
      conditions: filterResult.where,
      where: whereClause,
      groupBy: groupByPart,
      having: havingPart,
      orderBy: orderByPart,
      pagination
    };
  }
  function toSql(request) {
    const parts = toParts(request);
    return sql`
      ${parts.select}
      ${parts.from}
      ${parts.where}
      ${parts.groupBy}
      ${parts.having}
      ${parts.orderBy}
      ${parts.pagination}
    `;
  }
  const model = {
    name: config.name,
    description: config.description,
    defaults,
    filters: filtersWithInputType,
    sortable,
    dimensions,
    metrics,
    columns: columnDefs,
    columnNames,
    query: async (request, client) => {
      const result = await client.execute(toSql(request));
      return result.json();
    },
    toSql,
    toParts,
    $inferDimensions: void 0,
    $inferMetrics: void 0,
    $inferColumns: void 0,
    $inferFilters: void 0,
    $inferRequest: void 0,
    $inferResult: void 0
  };
  return model;
}

// src/query-layer/query-builder.ts
function buildQuery(model) {
  const state = {
    filters: /* @__PURE__ */ Object.create(null)
  };
  const buildRequest = () => ({
    filters: Object.keys(state.filters).length > 0 ? state.filters : void 0,
    dimensions: state.dimensions,
    metrics: state.metrics,
    columns: state.columns,
    orderBy: state.orderBy,
    limit: state.limit,
    page: state.page,
    offset: state.offset
  });
  const builder = {
    filter(filterName, op, value) {
      if (value === void 0 || value === null) return builder;
      const key = String(filterName);
      if (!Object.hasOwn(state.filters, key)) state.filters[key] = {};
      state.filters[key][op] = value;
      return builder;
    },
    dimensions(fields) {
      state.dimensions = fields;
      return builder;
    },
    metrics(fields) {
      state.metrics = fields;
      return builder;
    },
    columns(fields) {
      state.columns = fields;
      return builder;
    },
    orderBy(...orders) {
      state.orderBy = orders;
      return builder;
    },
    limit(n) {
      state.limit = n;
      return builder;
    },
    page(n) {
      state.page = n;
      state.offset = void 0;
      return builder;
    },
    offset(n) {
      state.offset = n;
      state.page = void 0;
      return builder;
    },
    build: buildRequest,
    toSql: () => model.toSql(buildRequest()),
    toParts: () => model.toParts(buildRequest()),
    assemble: (fn) => fn(model.toParts(buildRequest())),
    execute: (client) => model.query(buildRequest(), client)
  };
  return builder;
}

// src/query-layer/model-tools.ts
var import_zod = require("zod");
function camelToSnake(s) {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}
function titleFromName(name) {
  return name.replace(/^query_/, "Query ").replace(/^list_/, "List ").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function buildEnumDescription(metadata) {
  const entries = Object.entries(metadata);
  if (entries.length === 0) return void 0;
  const lines = entries.map(([name, def]) => {
    return def.description ? `- ${name}: ${def.description}` : `- ${name}`;
  });
  return lines.join("\n");
}
function zodBaseType(inputType) {
  if (inputType === "number") return import_zod.z.number();
  return import_zod.z.string();
}
var SCALAR_OPS = /* @__PURE__ */ new Set([
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "like",
  "ilike"
]);
var LIST_OPS = /* @__PURE__ */ new Set(["in", "notIn"]);
function createModelTool(model, options = {}) {
  const modelRequiredFilters = [];
  for (const [filterName, filterDef] of Object.entries(model.filters)) {
    if (filterDef.required) {
      modelRequiredFilters.push(filterName);
    }
  }
  const modelDefaults = model.defaults;
  const mergedDefaults = {
    dimensions: options.defaults?.dimensions ?? modelDefaults.dimensions,
    metrics: options.defaults?.metrics ?? modelDefaults.metrics,
    columns: options.defaults?.columns ?? modelDefaults.columns,
    limit: options.defaults?.limit ?? modelDefaults.limit
  };
  const requiredFilters = [
    .../* @__PURE__ */ new Set([...modelRequiredFilters, ...options.requiredFilters ?? []])
  ];
  const maxLimit = options.maxLimit ?? modelDefaults.maxLimit ?? 1e3;
  const defaultLimit = options.defaultLimit ?? mergedDefaults.limit ?? 100;
  const requiredSet = new Set(requiredFilters);
  const schema = {};
  const filterParamMap = {};
  const dimensionNames = Object.keys(model.dimensions ?? {});
  if (dimensionNames.length > 0) {
    const names = dimensionNames;
    const desc = buildEnumDescription(model.dimensions);
    const dimSchema = import_zod.z.array(import_zod.z.enum(names)).optional();
    schema.dimensions = desc ? dimSchema.describe(desc) : dimSchema;
  }
  const metricNames = Object.keys(model.metrics ?? {});
  if (metricNames.length > 0) {
    const names = metricNames;
    const desc = buildEnumDescription(model.metrics);
    const metSchema = import_zod.z.array(import_zod.z.enum(names)).optional();
    schema.metrics = desc ? metSchema.describe(desc) : metSchema;
  }
  if (model.columnNames.length > 0) {
    const names = model.columnNames;
    schema.columns = import_zod.z.array(import_zod.z.enum(names)).optional();
  }
  for (const [filterName, filterDef] of Object.entries(model.filters)) {
    const baseType = zodBaseType(filterDef.inputType);
    for (const op of filterDef.operators) {
      const snakeName = camelToSnake(filterName);
      const paramName = op === "eq" ? snakeName : `${snakeName}_${op}`;
      let paramType;
      if (SCALAR_OPS.has(op)) {
        paramType = baseType;
      } else if (LIST_OPS.has(op)) {
        paramType = import_zod.z.array(baseType);
      } else if (op === "between") {
        paramType = import_zod.z.array(baseType).length(2);
      } else if (op === "isNull" || op === "isNotNull") {
        paramType = import_zod.z.boolean();
      } else {
        paramType = baseType;
      }
      if (requiredSet.has(filterName) && op === "eq") {
        schema[paramName] = filterDef.description ? paramType.describe(filterDef.description) : paramType;
      } else {
        const opt = paramType.optional();
        schema[paramName] = filterDef.description ? opt.describe(filterDef.description) : opt;
      }
      filterParamMap[paramName] = { filterName, op };
    }
  }
  schema.limit = import_zod.z.number().min(1).max(maxLimit).default(defaultLimit).optional();
  function buildRequest(params) {
    const request = {};
    if (dimensionNames.length > 0) {
      request.dimensions = params.dimensions ?? mergedDefaults.dimensions;
    }
    if (metricNames.length > 0) {
      request.metrics = params.metrics ?? mergedDefaults.metrics;
    }
    if (model.columnNames.length > 0) {
      request.columns = params.columns ?? mergedDefaults.columns;
    }
    const filterObj = {};
    for (const [paramName, mapping] of Object.entries(filterParamMap)) {
      const value = params[paramName];
      if (value === void 0) continue;
      if (!filterObj[mapping.filterName]) {
        filterObj[mapping.filterName] = {};
      }
      filterObj[mapping.filterName][mapping.op] = value;
    }
    if (Object.keys(filterObj).length > 0) {
      request.filters = filterObj;
    }
    request.limit = params.limit ?? mergedDefaults.limit ?? defaultLimit;
    return request;
  }
  return { schema, buildRequest };
}
function registerModelTools(server, models, queryClient) {
  for (const model of models) {
    if (!model.name) continue;
    const toolName = model.name;
    const toolDescription = model.description ?? toolName;
    const tool = createModelTool(model);
    const defaultLimit = model.defaults?.limit ?? 100;
    server.tool(
      toolName,
      toolDescription,
      // MCP SDK's server.tool() triggers TS2589 (infinite type instantiation)
      // when given Record<string, z.ZodType>. Cast to `any` to prevent the DTS
      // generator from expanding the SDK's deeply recursive overload signatures.
      // Tracked upstream: https://github.com/modelcontextprotocol/typescript-sdk/issues/205
      tool.schema,
      // eslint-disable-line @typescript-eslint/no-explicit-any
      { title: titleFromName(toolName) },
      async (params) => {
        try {
          const request = tool.buildRequest(params);
          const limit2 = typeof params.limit === "number" ? params.limit : defaultLimit;
          const sqlObj = model.toSql(request);
          const [query, queryParams] = toQuery(sqlObj);
          const result = await queryClient.client.query({
            query,
            query_params: queryParams,
            format: "JSONEachRow",
            clickhouse_settings: {
              readonly: "2",
              max_result_rows: limit2.toString()
            }
          });
          const data = await result.json();
          const rows = Array.isArray(data) ? data : [];
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ rows, rowCount: rows.length }, null, 2)
              }
            ]
          };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          const safeMsg = msg.length > 200 ? msg.slice(0, 200) + "..." : msg;
          return {
            content: [
              {
                type: "text",
                text: `Error in ${toolName}: ${safeMsg}`
              }
            ],
            isError: true
          };
        }
      }
    );
  }
}

// src/consumption-apis/validation.ts
var BadRequestError = class extends Error {
  errors;
  constructor(typiaErrors) {
    super("Validation failed");
    this.name = "BadRequestError";
    this.errors = typiaErrors.map((e) => ({
      path: e.path,
      message: `Expected ${e.expected}`,
      expected: e.expected,
      received: typeof e.value === "undefined" ? "undefined" : String(e.value)
    }));
  }
  toJSON() {
    return { error: this.message, details: this.errors };
  }
};
function assertValid(result) {
  if (!result.success) {
    throw new BadRequestError(result.errors);
  }
  return result.data;
}
function createQueryHandler(config) {
  return {
    run: config.queryFn,
    fromObject: (input) => config.queryFn(assertValid(config.fromObject(input))),
    fromUrl: (url) => {
      const searchParams = typeof url === "string" ? new URL(url, "http://localhost").searchParams : url.searchParams;
      return config.queryFn(assertValid(config.fromUrl(searchParams)));
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ACKs,
  Api,
  ApiHelpers,
  BadRequestError,
  CSV_DELIMITERS,
  ClickHouseEngines,
  ConsumptionApi,
  ConsumptionHelpers,
  DEFAULT_CSV_CONFIG,
  DEFAULT_JSON_CONFIG,
  DataSource,
  DeadLetterQueue,
  ETLPipeline,
  IngestApi,
  IngestPipeline,
  LifeCycle,
  MAX_RETRIES,
  MAX_RETRIES_PRODUCER,
  MAX_RETRY_TIME_MS,
  MOOSE_RUNTIME_ENV_PREFIX,
  MaterializedView,
  MooseCache,
  MooseClient,
  OlapTable,
  QueryClient,
  RETRY_FACTOR_PRODUCER,
  RETRY_INITIAL_TIME_MS,
  Sql,
  SqlResource,
  Stream,
  Task,
  View,
  WebApp,
  Workflow,
  WorkflowClient,
  and,
  antiCachePath,
  as,
  assertValid,
  avg,
  between,
  buildQuery,
  cliLog,
  columnsFromTable,
  compilerLog,
  count,
  countDistinct,
  createClickhouseParameter,
  createModelTool,
  createProducerConfig,
  createQueryHandler,
  defineQueryModel,
  deriveInputTypeFromDataType,
  empty,
  eq,
  expressMiddleware,
  filter,
  filtersFromTable,
  getApi,
  getApis,
  getClickhouseClient,
  getFileName,
  getIngestApi,
  getIngestApis,
  getKafkaClient,
  getKafkaProducer,
  getLegacyMooseUtils,
  getMaterializedView,
  getMaterializedViews,
  getMooseClients,
  getMooseUtils,
  getMooseUtilsFromRequest,
  getSqlResource,
  getSqlResources,
  getStream,
  getStreams,
  getTable,
  getTables,
  getTemporalClient,
  getValueFromParameter,
  getView,
  getViews,
  getWebApp,
  getWebApps,
  getWorkflow,
  getWorkflows,
  groupBy,
  gt,
  gte,
  having,
  ilike,
  inList,
  isEmpty,
  isNotNull,
  isNull,
  isValidCSVDelimiter,
  join,
  joinQueries,
  like,
  limit,
  logError,
  lt,
  lte,
  mapToClickHouseType,
  mapTstoJs,
  max,
  min,
  mooseEnvSecrets,
  mooseRuntimeEnv,
  ne,
  not,
  notIn,
  offset,
  or,
  orderBy,
  paginate,
  parseCSV,
  parseJSON,
  parseJSONWithDates,
  quoteIdentifier,
  raw,
  registerModelTools,
  rewriteImportExtensions,
  select,
  sql,
  sum,
  timeDimensions,
  toQuery,
  toQueryPreview,
  toStaticQuery,
  where
});
//# sourceMappingURL=index.js.map