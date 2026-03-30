#!/usr/bin/env node
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

// src/dmv2/utils/stackTrace.ts
var init_stackTrace = __esm({
  "src/dmv2/utils/stackTrace.ts"() {
    "use strict";
  }
});

// src/dmv2/typedBase.ts
var init_typedBase = __esm({
  "src/dmv2/typedBase.ts"() {
    "use strict";
    init_stackTrace();
  }
});

// src/dataModels/dataModelTypes.ts
var init_dataModelTypes = __esm({
  "src/dataModels/dataModelTypes.ts"() {
    "use strict";
  }
});

// src/dataModels/types.ts
var init_types = __esm({
  "src/dataModels/types.ts"() {
    "use strict";
  }
});

// src/sqlHelpers.ts
function sqlImpl(strings, ...values) {
  return new Sql(strings, values);
}
function createClickhouseParameter(parameterIndex, value) {
  return `{p${parameterIndex}:${mapToClickHouseType(value)}}`;
}
function emptyIfUndefined(value) {
  return value === void 0 ? "" : value;
}
var isTable, isView, isColumn, sql, instanceofSql, Sql, toQuery, toQueryPreview, getValueFromParameter, mapToClickHouseType;
var init_sqlHelpers = __esm({
  "src/sqlHelpers.ts"() {
    "use strict";
    isTable = (value) => typeof value === "object" && value !== null && "kind" in value && value.kind === "OlapTable";
    isView = (value) => typeof value === "object" && value !== null && "kind" in value && value.kind === "View";
    isColumn = (value) => typeof value === "object" && value !== null && !("kind" in value) && "name" in value && "annotations" in value;
    sql = sqlImpl;
    sql.statement = function(strings, ...values) {
      return new Sql(strings, values, false);
    };
    sql.fragment = function(strings, ...values) {
      return new Sql(strings, values, true);
    };
    instanceofSql = (value) => typeof value === "object" && "values" in value && "strings" in value;
    Sql = class _Sql {
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
    toQuery = (sql3) => {
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
    toQueryPreview = (sql3) => {
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
    getValueFromParameter = (value) => {
      if (Array.isArray(value)) {
        const [type, val] = value;
        if (type === "Identifier") return val;
      }
      return value;
    };
    mapToClickHouseType = (value) => {
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
  }
});

// src/dmv2/sdk/olapTable.ts
var import_node_stream, import_node_crypto;
var init_olapTable = __esm({
  "src/dmv2/sdk/olapTable.ts"() {
    "use strict";
    init_typedBase();
    init_dataModelTypes();
    init_types();
    init_internal();
    import_node_stream = require("stream");
    import_node_crypto = require("crypto");
    init_sqlHelpers();
  }
});

// src/dmv2/sdk/stream.ts
var import_node_crypto2;
var init_stream = __esm({
  "src/dmv2/sdk/stream.ts"() {
    "use strict";
    init_typedBase();
    init_internal();
    import_node_crypto2 = require("crypto");
    init_stackTrace();
  }
});

// src/dmv2/sdk/workflow.ts
var init_workflow = __esm({
  "src/dmv2/sdk/workflow.ts"() {
    "use strict";
    init_internal();
    init_stackTrace();
  }
});

// src/dmv2/sdk/ingestApi.ts
var init_ingestApi = __esm({
  "src/dmv2/sdk/ingestApi.ts"() {
    "use strict";
    init_typedBase();
    init_internal();
  }
});

// src/dmv2/sdk/consumptionApi.ts
var init_consumptionApi = __esm({
  "src/dmv2/sdk/consumptionApi.ts"() {
    "use strict";
    init_typedBase();
    init_internal();
  }
});

// src/dmv2/sdk/ingestPipeline.ts
var init_ingestPipeline = __esm({
  "src/dmv2/sdk/ingestPipeline.ts"() {
    "use strict";
    init_typedBase();
    init_stream();
    init_olapTable();
    init_ingestApi();
    init_types();
  }
});

// src/dmv2/sdk/etlPipeline.ts
var init_etlPipeline = __esm({
  "src/dmv2/sdk/etlPipeline.ts"() {
    "use strict";
    init_workflow();
  }
});

// src/dmv2/sdk/materializedView.ts
var init_materializedView = __esm({
  "src/dmv2/sdk/materializedView.ts"() {
    "use strict";
    init_types();
    init_sqlHelpers();
    init_olapTable();
    init_internal();
    init_stackTrace();
  }
});

// src/dmv2/sdk/sqlResource.ts
var init_sqlResource = __esm({
  "src/dmv2/sdk/sqlResource.ts"() {
    "use strict";
    init_internal();
    init_sqlHelpers();
    init_stackTrace();
  }
});

// src/dmv2/sdk/view.ts
var init_view = __esm({
  "src/dmv2/sdk/view.ts"() {
    "use strict";
    init_sqlHelpers();
    init_olapTable();
    init_internal();
    init_stackTrace();
  }
});

// src/dmv2/sdk/lifeCycle.ts
var init_lifeCycle = __esm({
  "src/dmv2/sdk/lifeCycle.ts"() {
    "use strict";
  }
});

// src/dmv2/sdk/webApp.ts
var init_webApp = __esm({
  "src/dmv2/sdk/webApp.ts"() {
    "use strict";
    init_internal();
    init_stackTrace();
  }
});

// src/dmv2/registry.ts
var init_registry = __esm({
  "src/dmv2/registry.ts"() {
    "use strict";
    init_internal();
  }
});

// src/dmv2/index.ts
var init_dmv2 = __esm({
  "src/dmv2/index.ts"() {
    "use strict";
    init_olapTable();
    init_types();
    init_stream();
    init_workflow();
    init_ingestApi();
    init_consumptionApi();
    init_ingestPipeline();
    init_etlPipeline();
    init_materializedView();
    init_sqlResource();
    init_view();
    init_lifeCycle();
    init_webApp();
    init_registry();
  }
});

// src/browserCompatible.ts
var init_browserCompatible = __esm({
  "src/browserCompatible.ts"() {
    "use strict";
    init_dmv2();
    init_types();
    init_sqlHelpers();
  }
});

// src/commons.ts
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
var import_client, import_kafka_javascript, Kafka, compilerLog, getClickhouseClient, cliLog, MAX_RETRIES, MAX_RETRY_TIME_MS, RETRY_INITIAL_TIME_MS, MAX_RETRIES_PRODUCER, ACKs, parseBrokerString, logError, buildSaslConfig, getKafkaClient;
var init_commons = __esm({
  "src/commons.ts"() {
    "use strict";
    import_client = require("@clickhouse/client");
    import_kafka_javascript = require("@514labs/kafka-javascript");
    ({ Kafka } = import_kafka_javascript.KafkaJS);
    compilerLog = (message) => {
      if (!isTruthy(process.env.MOOSE_DISABLE_COMPILER_LOGS)) {
        console.log(message);
      }
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
    ACKs = -1;
    parseBrokerString = (brokerString) => brokerString.split(",").map((b) => b.trim()).filter((b) => b.length > 0);
    logError = (logger2, e) => {
      logger2.error(e.message);
      const stack = e.stack;
      if (stack) {
        logger2.error(stack);
      }
    };
    buildSaslConfig = (logger2, args) => {
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
          logger2.warn(`Unsupported SASL mechanism: ${args.saslMechanism}`);
          return void 0;
      }
    };
    getKafkaClient = async (cfg, logger2) => {
      const brokers = parseBrokerString(cfg.broker || "");
      if (brokers.length === 0) {
        throw new Error(`No valid broker addresses found in: "${cfg.broker}"`);
      }
      logger2.log(`Creating Kafka client with brokers: ${brokers.join(", ")}`);
      logger2.log(`Security protocol: ${cfg.securityProtocol || "plaintext"}`);
      logger2.log(`Client ID: ${cfg.clientId}`);
      const saslConfig = buildSaslConfig(logger2, cfg);
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

// src/secrets.ts
var init_secrets = __esm({
  "src/secrets.ts"() {
    "use strict";
  }
});

// src/consumption-apis/helpers.ts
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
async function getTemporalClient(temporalUrl, namespace, clientCert, clientKey, apiKey2) {
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
      const cert = await fs.readFileSync(clientCert);
      const key = await fs.readFileSync(clientKey);
      connectionOptions.tls = {
        clientCertPair: { crt: cert, key }
      };
    } else if (apiKey2) {
      console.log("Using API key for secure Temporal");
      connectionOptions.address = "us-west1.gcp.api.temporal.io:7233";
      connectionOptions.apiKey = apiKey2;
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
var import_client2, import_node_crypto3, import_perf_hooks, fs, MooseClient, QueryClient, WorkflowClient;
var init_helpers = __esm({
  "src/consumption-apis/helpers.ts"() {
    "use strict";
    import_client2 = require("@temporalio/client");
    import_node_crypto3 = require("crypto");
    import_perf_hooks = require("perf_hooks");
    fs = __toESM(require("fs"));
    init_internal();
    init_sqlHelpers();
    MooseClient = class {
      query;
      workflow;
      constructor(queryClient, temporalClient) {
        this.query = queryClient;
        this.workflow = new WorkflowClient(temporalClient);
      }
    };
    QueryClient = class {
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
    WorkflowClient = class {
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
        const workflows = await getWorkflows2();
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
  }
});

// src/consumption-apis/webAppHelpers.ts
var init_webAppHelpers = __esm({
  "src/consumption-apis/webAppHelpers.ts"() {
    "use strict";
  }
});

// src/scripts/task.ts
var init_task = __esm({
  "src/scripts/task.ts"() {
    "use strict";
  }
});

// src/clients/redisClient.ts
var import_redis;
var init_redisClient = __esm({
  "src/clients/redisClient.ts"() {
    "use strict";
    import_redis = require("redis");
  }
});

// src/config/configFile.ts
async function findConfigFile(startDir = process.cwd()) {
  const fs5 = await import("fs");
  let currentDir = import_node_path.default.resolve(startDir);
  while (true) {
    const configPath = import_node_path.default.join(currentDir, "moose.config.toml");
    if (fs5.existsSync(configPath)) {
      return configPath;
    }
    const parentDir = import_node_path.default.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }
  return null;
}
async function readProjectConfig() {
  const fs5 = await import("fs");
  const configPath = await findConfigFile();
  if (!configPath) {
    throw new ConfigError(
      "moose.config.toml not found in current directory or any parent directory"
    );
  }
  try {
    const configContent = fs5.readFileSync(configPath, "utf-8");
    const config = toml.parse(configContent);
    return config;
  } catch (error) {
    throw new ConfigError(`Failed to parse moose.config.toml: ${error}`);
  }
}
var import_node_path, toml, ConfigError;
var init_configFile = __esm({
  "src/config/configFile.ts"() {
    "use strict";
    import_node_path = __toESM(require("path"));
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

// src/consumption-apis/standalone.ts
var standalone_exports = {};
__export(standalone_exports, {
  getMooseClients: () => getMooseClients,
  getMooseUtils: () => getMooseUtils
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
  if (initPromise) {
    return initPromise;
  }
  initPromise = (async () => {
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
    return await initPromise;
  } finally {
    initPromise = null;
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
var standaloneUtils, initPromise, toClientConfig;
var init_standalone = __esm({
  "src/consumption-apis/standalone.ts"() {
    "use strict";
    init_helpers();
    init_commons();
    init_sqlHelpers();
    standaloneUtils = null;
    initPromise = null;
    toClientConfig = (config) => ({
      ...config,
      useSSL: config.useSSL ? "true" : "false"
    });
  }
});

// src/utilities/json.ts
function isNullableType(dt) {
  return typeof dt === "object" && dt !== null && "nullable" in dt && typeof dt.nullable !== "undefined";
}
function isNestedType2(dt) {
  return typeof dt === "object" && dt !== null && "columns" in dt && Array.isArray(dt.columns);
}
function isArrayType(dt) {
  return typeof dt === "object" && dt !== null && "elementType" in dt && typeof dt.elementType !== "undefined";
}
function jsonDateReviver(key, value) {
  const iso8601Format = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)$/;
  if (typeof value === "string" && iso8601Format.test(value)) {
    return new Date(value);
  }
  return value;
}
function isDateType(dataType, annotations) {
  if (annotations.some(
    ([key, value]) => key === STRING_DATE_ANNOTATION && value === true
  )) {
    return false;
  }
  if (typeof dataType === "string") {
    return dataType === "DateTime" || dataType.startsWith("DateTime(");
  }
  if (isNullableType(dataType)) {
    return isDateType(dataType.nullable, annotations);
  }
  return false;
}
function buildFieldMutations(columns) {
  const mutations = [];
  for (const column of columns) {
    const dataType = column.data_type;
    if (isDateType(dataType, column.annotations)) {
      mutations.push([column.name, ["parseDate"]]);
      continue;
    }
    if (typeof dataType === "object" && dataType !== null) {
      let unwrappedType = dataType;
      if (isNullableType(dataType)) {
        unwrappedType = dataType.nullable;
      }
      if (isNestedType2(unwrappedType)) {
        const nestedMutations = buildFieldMutations(unwrappedType.columns);
        if (nestedMutations.length > 0) {
          mutations.push([column.name, nestedMutations]);
        }
        continue;
      }
      if (isArrayType(unwrappedType)) {
        const elementType = unwrappedType.elementType;
        if (isNestedType2(elementType)) {
          const nestedMutations = buildFieldMutations(elementType.columns);
          if (nestedMutations.length > 0) {
            mutations.push([column.name, nestedMutations]);
          }
          continue;
        }
      }
    }
  }
  return mutations;
}
function applyMutation(value, mutation) {
  if (mutation === "parseDate") {
    if (typeof value === "string") {
      try {
        const date = new Date(value);
        return !isNaN(date.getTime()) ? date : value;
      } catch {
        return value;
      }
    }
  }
  return value;
}
function applyFieldMutations(obj, mutations) {
  if (!obj || typeof obj !== "object") {
    return;
  }
  for (const [fieldName, mutation] of mutations) {
    if (!(fieldName in obj)) {
      continue;
    }
    if (Array.isArray(mutation)) {
      if (mutation.length > 0 && typeof mutation[0] === "string") {
        const operations = mutation;
        for (const operation of operations) {
          obj[fieldName] = applyMutation(obj[fieldName], operation);
        }
      } else {
        const nestedMutations = mutation;
        const fieldValue = obj[fieldName];
        if (Array.isArray(fieldValue)) {
          for (const item of fieldValue) {
            applyFieldMutations(item, nestedMutations);
          }
        } else if (fieldValue && typeof fieldValue === "object") {
          applyFieldMutations(fieldValue, nestedMutations);
        }
      }
    }
  }
}
function buildFieldMutationsFromColumns(columns) {
  if (!columns || columns.length === 0) {
    return void 0;
  }
  const mutations = buildFieldMutations(columns);
  return mutations.length > 0 ? mutations : void 0;
}
function mutateParsedJson(data, fieldMutations) {
  if (!fieldMutations || !data) {
    return;
  }
  applyFieldMutations(data, fieldMutations);
}
var STRING_DATE_ANNOTATION;
var init_json = __esm({
  "src/utilities/json.ts"() {
    "use strict";
    STRING_DATE_ANNOTATION = "stringDate";
  }
});

// src/utilities/dataParser.ts
var import_csv_parse, CSV_DELIMITERS, DEFAULT_CSV_CONFIG;
var init_dataParser = __esm({
  "src/utilities/dataParser.ts"() {
    "use strict";
    import_csv_parse = require("csv-parse");
    init_json();
    CSV_DELIMITERS = {
      COMMA: ",",
      TAB: "	",
      SEMICOLON: ";",
      PIPE: "|"
    };
    DEFAULT_CSV_CONFIG = {
      delimiter: CSV_DELIMITERS.COMMA,
      columns: true,
      skipEmptyLines: true,
      trim: true
    };
  }
});

// src/utilities/index.ts
var init_utilities = __esm({
  "src/utilities/index.ts"() {
    "use strict";
    init_dataParser();
  }
});

// src/connectors/dataSource.ts
var init_dataSource = __esm({
  "src/connectors/dataSource.ts"() {
    "use strict";
  }
});

// src/query-layer/sql-utils.ts
var raw, empty, join;
var init_sql_utils = __esm({
  "src/query-layer/sql-utils.ts"() {
    "use strict";
    init_sqlHelpers();
    raw = sql.raw;
    empty = sql``;
    join = sql.join;
  }
});

// src/query-layer/helpers.ts
var init_helpers2 = __esm({
  "src/query-layer/helpers.ts"() {
    "use strict";
    init_sqlHelpers();
  }
});

// src/query-layer/query-model.ts
var init_query_model = __esm({
  "src/query-layer/query-model.ts"() {
    "use strict";
    init_sqlHelpers();
    init_dmv2();
    init_sql_utils();
    init_helpers2();
  }
});

// src/query-layer/query-builder.ts
var init_query_builder = __esm({
  "src/query-layer/query-builder.ts"() {
    "use strict";
  }
});

// src/query-layer/model-tools.ts
var import_zod;
var init_model_tools = __esm({
  "src/query-layer/model-tools.ts"() {
    "use strict";
    import_zod = require("zod");
    init_sqlHelpers();
  }
});

// src/consumption-apis/validation.ts
var init_validation = __esm({
  "src/consumption-apis/validation.ts"() {
    "use strict";
  }
});

// src/query-layer/index.ts
var init_query_layer = __esm({
  "src/query-layer/index.ts"() {
    "use strict";
    init_query_model();
    init_helpers2();
    init_query_builder();
    init_model_tools();
    init_sql_utils();
    init_validation();
  }
});

// src/index.ts
var init_index = __esm({
  "src/index.ts"() {
    "use strict";
    init_browserCompatible();
    init_commons();
    init_secrets();
    init_helpers();
    init_webAppHelpers();
    init_task();
    init_redisClient();
    init_helpers();
    init_standalone();
    init_sqlHelpers();
    init_utilities();
    init_dataSource();
    init_types();
    init_query_layer();
  }
});

// src/compiler-config.ts
function getSourceDir() {
  return process.env.MOOSE_SOURCE_DIR || "app";
}
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
function getOutDir(projectRoot2 = process.cwd()) {
  const userOutDir = readUserOutDir(projectRoot2);
  return userOutDir || DEFAULT_OUT_DIR;
}
function getCompiledIndexPath(projectRoot2 = process.cwd()) {
  const outDir = getOutDir(projectRoot2);
  const sourceDir = getSourceDir();
  return import_path.default.resolve(projectRoot2, outDir, sourceDir, "index.js");
}
function hasCompiledArtifacts(projectRoot2 = process.cwd()) {
  return (0, import_fs.existsSync)(getCompiledIndexPath(projectRoot2));
}
function detectModuleSystem(projectRoot2 = process.cwd()) {
  const pkgPath = import_path.default.join(projectRoot2, "package.json");
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
async function loadModule(modulePath, projectRoot2 = process.cwd()) {
  const moduleSystem = detectModuleSystem(projectRoot2);
  if (moduleSystem === "esm") {
    const { pathToFileURL } = await import("url");
    const fileUrl = pathToFileURL(modulePath).href;
    return await import(fileUrl);
  }
  return require(modulePath);
}
var import_fs, import_path, MOOSE_COMPILER_PLUGINS, MOOSE_COMPILER_OPTIONS, MOOSE_MODULE_OPTIONS, DEFAULT_OUT_DIR;
var init_compiler_config = __esm({
  "src/compiler-config.ts"() {
    "use strict";
    import_fs = require("fs");
    import_path = __toESM(require("path"));
    MOOSE_COMPILER_PLUGINS = [
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
    MOOSE_COMPILER_OPTIONS = {
      experimentalDecorators: true,
      esModuleInterop: true,
      // Disable strict module syntax checking to avoid dual-package type conflicts
      // This prevents errors where the same type imported with different resolution
      // modes (CJS vs ESM) is treated as incompatible
      verbatimModuleSyntax: false
    };
    MOOSE_MODULE_OPTIONS = {
      module: "NodeNext",
      moduleResolution: "NodeNext"
    };
    DEFAULT_OUT_DIR = ".moose/compiled";
  }
});

// src/dmv2/utils/sourceFiles.ts
function isSourceFilePath(filePath) {
  const ext = import_node_path2.default.extname(filePath).toLowerCase();
  return DEFAULT_SOURCE_EXTENSIONS.has(ext);
}
function findSourceFiles(dir, onReadError) {
  const files = [];
  if (!import_node_fs.default.existsSync(dir)) {
    return files;
  }
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = import_node_fs.default.readdirSync(current, { withFileTypes: true });
    } catch (error) {
      onReadError?.(current, error);
      continue;
    }
    for (const entry of entries) {
      const fullPath = import_node_path2.default.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) {
          continue;
        }
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile() || !isSourceFilePath(fullPath)) {
        continue;
      }
      if (fullPath.endsWith(".d.ts") || fullPath.endsWith(".d.mts") || fullPath.endsWith(".d.cts")) {
        continue;
      }
      files.push(import_node_path2.default.resolve(fullPath));
    }
  }
  return files;
}
var import_node_fs, import_node_path2, DEFAULT_SOURCE_EXTENSIONS;
var init_sourceFiles = __esm({
  "src/dmv2/utils/sourceFiles.ts"() {
    "use strict";
    import_node_fs = __toESM(require("fs"));
    import_node_path2 = __toESM(require("path"));
    DEFAULT_SOURCE_EXTENSIONS = /* @__PURE__ */ new Set([
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".mts",
      ".cts"
    ]);
  }
});

// src/dmv2/utils/index.ts
var init_utils = __esm({
  "src/dmv2/utils/index.ts"() {
    "use strict";
    init_stackTrace();
    init_sourceFiles();
  }
});

// src/dmv2/dependencyAnalysis.ts
function createEmptyResult() {
  return {
    apiByKey: /* @__PURE__ */ new Map(),
    workflowByName: /* @__PURE__ */ new Map(),
    webAppByName: /* @__PURE__ */ new Map()
  };
}
function buildRegistryIndex(registry) {
  const tableIdsByName = /* @__PURE__ */ new Map();
  const topicIdsByName = /* @__PURE__ */ new Map();
  const tableIds = /* @__PURE__ */ new Set();
  const topicIds = /* @__PURE__ */ new Set();
  registry.tables.forEach((table, id) => {
    tableIds.add(id);
    const baseName = typeof table?.name === "string" ? table.name : id;
    const existing = tableIdsByName.get(baseName) ?? [];
    existing.push(id);
    tableIdsByName.set(baseName, existing);
  });
  registry.streams.forEach((stream, id) => {
    topicIds.add(id);
    const streamName = typeof stream?.name === "string" ? stream.name : id;
    const existing = topicIdsByName.get(streamName) ?? [];
    existing.push(id);
    topicIdsByName.set(streamName, existing);
  });
  return {
    tableIdsByName,
    topicIdsByName,
    tableIds,
    topicIds,
    warnedAmbiguousTableIds: /* @__PURE__ */ new Set()
  };
}
function resolveTableId(tableName, version, index) {
  if (version) {
    const candidates = /* @__PURE__ */ new Set([`${tableName}_${version}`]);
    if (version.includes(".")) {
      candidates.add(`${tableName}_${version.replace(/\./g, "_")}`);
    }
    for (const candidate of candidates) {
      if (index.tableIds.has(candidate)) {
        return candidate;
      }
      const ids2 = index.tableIdsByName.get(candidate) ?? [];
      if (ids2.length === 1) {
        return ids2[0];
      }
      if (ids2.length > 1) {
        if (ids2.includes(candidate)) {
          return candidate;
        }
        return ids2[0];
      }
    }
    return `${tableName}_${version}`;
  }
  const ids = index.tableIdsByName.get(tableName) ?? [];
  if (ids.length === 0) {
    return tableName;
  }
  if (ids.includes(tableName)) {
    return tableName;
  }
  if (ids.length > 1) {
    const warningKey = `${tableName}:${ids.join(",")}`;
    if (!index.warnedAmbiguousTableIds.has(warningKey)) {
      index.warnedAmbiguousTableIds.add(warningKey);
      compilerLog(
        `Warning: ambiguous table lineage reference '${tableName}' resolved to '${ids[0]}' from candidates [${ids.join(", ")}]. Add an explicit version to disambiguate.`
      );
    }
  }
  return ids[0];
}
function resolveTopicId(topicName, index) {
  const ids = index.topicIdsByName.get(topicName) ?? [];
  if (ids.length === 0) {
    return topicName;
  }
  if (ids.includes(topicName)) {
    return topicName;
  }
  return ids[0];
}
function normalizeSqlIdentifier(token) {
  let normalized = token.trim();
  normalized = normalized.replace(/^[`"'\[]+/, "");
  normalized = normalized.replace(/[`"'\]]+$/, "");
  return normalized;
}
function resolveResourceFromSqlIdentifier(identifier2, index) {
  const normalized = normalizeSqlIdentifier(identifier2);
  if (!normalized) {
    return void 0;
  }
  const candidates = /* @__PURE__ */ new Set([normalized]);
  if (normalized.includes(".")) {
    const parts = normalized.split(".");
    const suffix = parts[parts.length - 1];
    if (suffix && suffix !== normalized) {
      candidates.add(suffix);
    }
  }
  for (const candidate of [...candidates]) {
    const versionedMatch = candidate.match(/^(.+)_\d+_\d+$/);
    if (versionedMatch?.[1]) {
      candidates.add(versionedMatch[1]);
    }
  }
  for (const candidate of candidates) {
    if (index.tableIds.has(candidate)) {
      return { kind: "Table", id: candidate };
    }
    if (index.tableIdsByName.has(candidate)) {
      return { kind: "Table", id: resolveTableId(candidate, void 0, index) };
    }
    if (index.topicIds.has(candidate)) {
      return { kind: "Topic", id: candidate };
    }
    if (index.topicIdsByName.has(candidate)) {
      return { kind: "Topic", id: resolveTopicId(candidate, index) };
    }
  }
  return void 0;
}
function inferResourcesFromSqlText(text, index) {
  const refs = /* @__PURE__ */ new Map();
  const addRef = (ref) => {
    if (!ref) {
      return;
    }
    refs.set(`${ref.kind}:${ref.id}`, ref);
  };
  const trimmed = text.trim();
  if (trimmed && !/\s/.test(trimmed)) {
    addRef(resolveResourceFromSqlIdentifier(trimmed, index));
  }
  const relationPattern = /\b(?:from|join|into|update|table)\s+([`"'\[]?[A-Za-z_][A-Za-z0-9_.]*[`"'\]]?)/gi;
  for (const match of text.matchAll(relationPattern)) {
    addRef(resolveResourceFromSqlIdentifier(match[1], index));
  }
  return [...refs.values()];
}
function collectSqlTextFragmentsFromExpression(expression, ctx, fragments, visitedSymbols = /* @__PURE__ */ new Set()) {
  const unwrapped = unwrapExpression(expression);
  if (import_typescript.default.isStringLiteral(unwrapped) || import_typescript.default.isNoSubstitutionTemplateLiteral(unwrapped)) {
    fragments.push(unwrapped.text);
    return;
  }
  if (import_typescript.default.isTemplateExpression(unwrapped)) {
    fragments.push(unwrapped.head.text);
    for (const span of unwrapped.templateSpans) {
      fragments.push(span.literal.text);
    }
    return;
  }
  if (import_typescript.default.isTaggedTemplateExpression(unwrapped)) {
    if (isSqlTag(unwrapped.tag, ctx.checker)) {
      const resources = inferResourcesFromSqlTemplate(unwrapped.template, ctx);
      for (const resource of resources) {
        fragments.push(resource.id);
      }
    }
    return;
  }
  if (import_typescript.default.isArrayLiteralExpression(unwrapped)) {
    for (const element of unwrapped.elements) {
      if (import_typescript.default.isExpression(element)) {
        collectSqlTextFragmentsFromExpression(
          element,
          ctx,
          fragments,
          visitedSymbols
        );
      }
    }
    return;
  }
  if (import_typescript.default.isCallExpression(unwrapped)) {
    for (const arg of unwrapped.arguments) {
      collectSqlTextFragmentsFromExpression(
        arg,
        ctx,
        fragments,
        visitedSymbols
      );
    }
    return;
  }
  if (import_typescript.default.isObjectLiteralExpression(unwrapped)) {
    for (const property of unwrapped.properties) {
      if (import_typescript.default.isPropertyAssignment(property)) {
        collectSqlTextFragmentsFromExpression(
          property.initializer,
          ctx,
          fragments,
          visitedSymbols
        );
      }
    }
    return;
  }
  if (import_typescript.default.isConditionalExpression(unwrapped)) {
    collectSqlTextFragmentsFromExpression(
      unwrapped.whenTrue,
      ctx,
      fragments,
      visitedSymbols
    );
    collectSqlTextFragmentsFromExpression(
      unwrapped.whenFalse,
      ctx,
      fragments,
      visitedSymbols
    );
    return;
  }
  if (import_typescript.default.isBinaryExpression(unwrapped)) {
    collectSqlTextFragmentsFromExpression(
      unwrapped.left,
      ctx,
      fragments,
      visitedSymbols
    );
    collectSqlTextFragmentsFromExpression(
      unwrapped.right,
      ctx,
      fragments,
      visitedSymbols
    );
    return;
  }
  if (import_typescript.default.isIdentifier(unwrapped) || import_typescript.default.isPropertyAccessExpression(unwrapped)) {
    const staticValue = resolveStaticString(unwrapped, ctx);
    if (staticValue !== void 0) {
      fragments.push(staticValue);
      return;
    }
    const symbol = resolveAliasedSymbol(
      ctx.checker.getSymbolAtLocation(unwrapped),
      ctx.checker
    );
    if (!symbol || visitedSymbols.has(symbol)) {
      return;
    }
    visitedSymbols.add(symbol);
    for (const declaration of symbol.declarations ?? []) {
      const initializer = resolveSymbolInitializerExpression(declaration);
      if (!initializer) {
        continue;
      }
      collectSqlTextFragmentsFromExpression(
        initializer,
        ctx,
        fragments,
        visitedSymbols
      );
    }
  }
}
function inferResourcesFromSqlTemplate(template, ctx) {
  const refs = /* @__PURE__ */ new Map();
  const addFromText = (text) => {
    for (const ref of inferResourcesFromSqlText(text, ctx.registryIndex)) {
      refs.set(`${ref.kind}:${ref.id}`, ref);
    }
  };
  if (import_typescript.default.isNoSubstitutionTemplateLiteral(template)) {
    addFromText(template.text);
    return [...refs.values()];
  }
  addFromText(template.head.text);
  for (const span of template.templateSpans) {
    addFromText(span.literal.text);
  }
  return [...refs.values()];
}
function inferResourcesFromSqlCallArguments(argumentsList, ctx) {
  const refs = /* @__PURE__ */ new Map();
  const fragments = [];
  for (const arg of argumentsList) {
    collectSqlTextFragmentsFromExpression(arg, ctx, fragments);
  }
  for (const fragment of fragments) {
    for (const ref of inferResourcesFromSqlText(fragment, ctx.registryIndex)) {
      refs.set(`${ref.kind}:${ref.id}`, ref);
    }
  }
  return [...refs.values()];
}
function getObjectPropertyExpression(objectLiteral, propertyName) {
  for (const property of objectLiteral.properties) {
    if (import_typescript.default.isPropertyAssignment(property)) {
      const name = import_typescript.default.isIdentifier(property.name) ? property.name.text : import_typescript.default.isStringLiteral(property.name) ? property.name.text : void 0;
      if (name === propertyName) {
        return property.initializer;
      }
    }
    if (import_typescript.default.isShorthandPropertyAssignment(property) && property.name.text === propertyName) {
      return property.name;
    }
  }
  return void 0;
}
function resolveAliasedSymbol(symbol, checker) {
  if (!symbol) {
    return void 0;
  }
  if ((symbol.flags & import_typescript.default.SymbolFlags.Alias) !== 0) {
    try {
      return checker.getAliasedSymbol(symbol);
    } catch {
      return symbol;
    }
  }
  return symbol;
}
function unwrapExpression(expression) {
  let current = expression;
  while (import_typescript.default.isParenthesizedExpression(current) || import_typescript.default.isAsExpression(current) || import_typescript.default.isTypeAssertionExpression(current) || import_typescript.default.isNonNullExpression(current)) {
    current = current.expression;
  }
  return current;
}
function unwrapCallTargetExpression(expression) {
  let current = unwrapExpression(expression);
  while (import_typescript.default.isBinaryExpression(current) && current.operatorToken.kind === import_typescript.default.SyntaxKind.CommaToken) {
    current = unwrapExpression(current.right);
  }
  return current;
}
function resolveStaticString(expression, ctx, visitedSymbols = /* @__PURE__ */ new Set()) {
  if (!expression) {
    return void 0;
  }
  const unwrapped = unwrapExpression(expression);
  if (import_typescript.default.isStringLiteral(unwrapped) || import_typescript.default.isNoSubstitutionTemplateLiteral(unwrapped)) {
    return unwrapped.text;
  }
  if (import_typescript.default.isIdentifier(unwrapped) || import_typescript.default.isPropertyAccessExpression(unwrapped)) {
    const symbol = resolveAliasedSymbol(
      ctx.checker.getSymbolAtLocation(unwrapped),
      ctx.checker
    );
    if (!symbol || visitedSymbols.has(symbol)) {
      return void 0;
    }
    visitedSymbols.add(symbol);
    for (const declaration of symbol.declarations ?? []) {
      if (import_typescript.default.isVariableDeclaration(declaration) && declaration.initializer) {
        const value = resolveStaticString(
          declaration.initializer,
          ctx,
          visitedSymbols
        );
        if (value !== void 0) {
          return value;
        }
      } else if (import_typescript.default.isPropertyAssignment(declaration)) {
        const value = resolveStaticString(
          declaration.initializer,
          ctx,
          visitedSymbols
        );
        if (value !== void 0) {
          return value;
        }
      }
    }
  }
  return void 0;
}
function resolveObjectLiteralExpression(expression, ctx, visitedSymbols = /* @__PURE__ */ new Set()) {
  if (!expression) {
    return void 0;
  }
  const unwrapped = unwrapExpression(expression);
  if (import_typescript.default.isObjectLiteralExpression(unwrapped)) {
    return unwrapped;
  }
  if (import_typescript.default.isIdentifier(unwrapped) || import_typescript.default.isPropertyAccessExpression(unwrapped)) {
    const symbol = resolveAliasedSymbol(
      ctx.checker.getSymbolAtLocation(unwrapped),
      ctx.checker
    );
    if (!symbol || visitedSymbols.has(symbol)) {
      return void 0;
    }
    visitedSymbols.add(symbol);
    for (const declaration of symbol.declarations ?? []) {
      if (import_typescript.default.isVariableDeclaration(declaration) && declaration.initializer) {
        const result = resolveObjectLiteralExpression(
          declaration.initializer,
          ctx,
          visitedSymbols
        );
        if (result) {
          return result;
        }
      } else if (import_typescript.default.isPropertyAssignment(declaration)) {
        const result = resolveObjectLiteralExpression(
          declaration.initializer,
          ctx,
          visitedSymbols
        );
        if (result) {
          return result;
        }
      }
    }
  }
  return void 0;
}
function constructorNameFromNewExpression(expression, checker) {
  const symbol = resolveAliasedSymbol(
    checker.getSymbolAtLocation(expression),
    checker
  );
  if (symbol?.name) {
    return symbol.name;
  }
  if (import_typescript.default.isIdentifier(expression)) {
    return expression.text;
  }
  if (import_typescript.default.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }
  return void 0;
}
function parseOlapTableRef(newExpression, ctx) {
  const tableName = resolveStaticString(newExpression.arguments?.[0], ctx);
  if (!tableName) {
    return void 0;
  }
  const configLiteral = resolveObjectLiteralExpression(
    newExpression.arguments?.[1],
    ctx
  );
  const version = configLiteral ? resolveStaticString(
    getObjectPropertyExpression(configLiteral, "version"),
    ctx
  ) : void 0;
  return {
    kind: "Table",
    id: resolveTableId(tableName, version, ctx.registryIndex)
  };
}
function parseStreamRef(newExpression, ctx) {
  const topicName = resolveStaticString(newExpression.arguments?.[0], ctx);
  if (!topicName) {
    return void 0;
  }
  return { kind: "Topic", id: resolveTopicId(topicName, ctx.registryIndex) };
}
function parseSimpleNamedRef(newExpression, kind, ctx) {
  const name = resolveStaticString(newExpression.arguments?.[0], ctx);
  if (!name) {
    return void 0;
  }
  return { kind, id: name };
}
function parseMaterializedViewRef(newExpression, ctx) {
  const options = resolveObjectLiteralExpression(
    newExpression.arguments?.[0],
    ctx
  );
  if (!options) {
    return void 0;
  }
  const mvName = resolveStaticString(
    getObjectPropertyExpression(options, "materializedViewName"),
    ctx
  );
  if (!mvName) {
    return void 0;
  }
  let targetTableId;
  const targetTableExpression = getObjectPropertyExpression(
    options,
    "targetTable"
  );
  const targetTableObject = resolveObjectLiteralExpression(
    targetTableExpression,
    ctx
  );
  if (targetTableObject) {
    const tableName = resolveStaticString(
      getObjectPropertyExpression(targetTableObject, "name"),
      ctx
    );
    const version = resolveStaticString(
      getObjectPropertyExpression(targetTableObject, "version"),
      ctx
    );
    if (tableName) {
      targetTableId = resolveTableId(tableName, version, ctx.registryIndex);
    }
  } else if (targetTableExpression) {
    const targetRef = resolveResourceFromExpression(
      targetTableExpression,
      ctx,
      /* @__PURE__ */ new Map()
    );
    if (targetRef?.kind === "Table") {
      targetTableId = targetRef.id;
    }
  }
  if (!targetTableId) {
    const legacyTableName = resolveStaticString(
      getObjectPropertyExpression(options, "tableName"),
      ctx
    );
    if (legacyTableName) {
      targetTableId = resolveTableId(
        legacyTableName,
        void 0,
        ctx.registryIndex
      );
    }
  }
  return {
    kind: "MaterializedView",
    id: mvName,
    targetTableId
  };
}
function parseIngestPipelineRef(newExpression, ctx) {
  const pipelineName = resolveStaticString(newExpression.arguments?.[0], ctx);
  if (!pipelineName) {
    return void 0;
  }
  const config = resolveObjectLiteralExpression(
    newExpression.arguments?.[1],
    ctx
  );
  let version;
  let streamEnabled = true;
  let tableEnabled = true;
  if (config) {
    const versionExpr = getObjectPropertyExpression(config, "version");
    version = resolveStaticString(versionExpr, ctx);
    const streamExpr = getObjectPropertyExpression(config, "stream");
    if (streamExpr && streamExpr.kind === import_typescript.default.SyntaxKind.FalseKeyword) {
      streamEnabled = false;
    }
    const tableExpr = getObjectPropertyExpression(config, "table");
    if (tableExpr && tableExpr.kind === import_typescript.default.SyntaxKind.FalseKeyword) {
      tableEnabled = false;
    }
  }
  return {
    kind: "IngestPipeline",
    streamId: streamEnabled ? resolveTopicId(pipelineName, ctx.registryIndex) : void 0,
    tableId: tableEnabled ? resolveTableId(pipelineName, version, ctx.registryIndex) : void 0
  };
}
function resolveResourceFromNewExpression(newExpression, ctx) {
  const constructorName = constructorNameFromNewExpression(
    newExpression.expression,
    ctx.checker
  );
  switch (constructorName) {
    case "OlapTable":
      return parseOlapTableRef(newExpression, ctx);
    case "Stream":
      return parseStreamRef(newExpression, ctx);
    case "View":
      return parseSimpleNamedRef(newExpression, "View", ctx);
    case "SqlResource":
      return parseSimpleNamedRef(newExpression, "SqlResource", ctx);
    case "MaterializedView":
      return parseMaterializedViewRef(newExpression, ctx);
    case "IngestPipeline":
      return parseIngestPipelineRef(newExpression, ctx);
    default:
      return void 0;
  }
}
function resolveResourceFromSymbol(symbol, ctx, bindings) {
  const resolvedSymbol = resolveAliasedSymbol(symbol, ctx.checker);
  if (!resolvedSymbol) {
    return void 0;
  }
  const bound = bindings.get(resolvedSymbol);
  if (bound) {
    return bound;
  }
  const cached = ctx.symbolResourceCache.get(resolvedSymbol);
  if (cached !== void 0) {
    return cached ?? void 0;
  }
  ctx.symbolResourceCache.set(resolvedSymbol, null);
  for (const declaration of resolvedSymbol.declarations ?? []) {
    const initializer = resolveSymbolInitializerExpression(declaration);
    if (!initializer) {
      continue;
    }
    const resource = resolveResourceFromExpression(initializer, ctx, bindings);
    if (resource) {
      ctx.symbolResourceCache.set(resolvedSymbol, resource);
      return resource;
    }
  }
  ctx.symbolResourceCache.set(resolvedSymbol, null);
  return void 0;
}
function resolveSymbolInitializerExpression(declaration) {
  if (import_typescript.default.isVariableDeclaration(declaration) && declaration.initializer) {
    return declaration.initializer;
  }
  if (import_typescript.default.isPropertyAssignment(declaration)) {
    return declaration.initializer;
  }
  if ((import_typescript.default.isPropertyAccessExpression(declaration) || import_typescript.default.isElementAccessExpression(declaration) || import_typescript.default.isIdentifier(declaration)) && import_typescript.default.isBinaryExpression(declaration.parent) && declaration.parent.left === declaration && declaration.parent.operatorToken.kind === import_typescript.default.SyntaxKind.EqualsToken) {
    return declaration.parent.right;
  }
  return void 0;
}
function isColumnsProjection(expression) {
  const unwrapped = unwrapExpression(expression);
  if (import_typescript.default.isPropertyAccessExpression(unwrapped)) {
    return unwrapped.name.text === "columns";
  }
  if (import_typescript.default.isElementAccessExpression(unwrapped)) {
    return isColumnsProjection(unwrapped.expression);
  }
  return false;
}
function resolveResourceFromExpression(expression, ctx, bindings) {
  const unwrapped = unwrapExpression(expression);
  if (import_typescript.default.isNewExpression(unwrapped)) {
    return resolveResourceFromNewExpression(unwrapped, ctx);
  }
  if (import_typescript.default.isTaggedTemplateExpression(unwrapped) && isSqlTag(unwrapped.tag, ctx.checker)) {
    const inferred = inferResourcesFromSqlTemplate(unwrapped.template, ctx);
    if (inferred.length === 1) {
      return inferred[0];
    }
  }
  if (import_typescript.default.isCallExpression(unwrapped)) {
    const calleeExpression = unwrapCallTargetExpression(unwrapped.expression);
    if (isSqlTag(calleeExpression, ctx.checker)) {
      const inferred = inferResourcesFromSqlCallArguments(
        unwrapped.arguments,
        ctx
      );
      if (inferred.length === 1) {
        return inferred[0];
      }
    }
  }
  if (import_typescript.default.isIdentifier(unwrapped)) {
    return resolveResourceFromSymbol(
      ctx.checker.getSymbolAtLocation(unwrapped),
      ctx,
      bindings
    );
  }
  if (import_typescript.default.isPropertyAccessExpression(unwrapped)) {
    const base = resolveResourceFromExpression(
      unwrapped.expression,
      ctx,
      bindings
    );
    if (base?.kind === "MaterializedView" && unwrapped.name.text === "targetTable") {
      if (base.targetTableId) {
        return { kind: "Table", id: base.targetTableId };
      }
    }
    if (base?.kind === "IngestPipeline") {
      if (unwrapped.name.text === "stream" && base.streamId) {
        return { kind: "Topic", id: base.streamId };
      }
      if (unwrapped.name.text === "table" && base.tableId) {
        return { kind: "Table", id: base.tableId };
      }
    }
    if (base?.kind === "Table" && unwrapped.name.text === "columns") {
      return base;
    }
    if (base?.kind === "Table" && isColumnsProjection(unwrapped.expression)) {
      return base;
    }
    return resolveResourceFromSymbol(
      ctx.checker.getSymbolAtLocation(unwrapped),
      ctx,
      bindings
    );
  }
  if (import_typescript.default.isElementAccessExpression(unwrapped)) {
    const base = resolveResourceFromExpression(
      unwrapped.expression,
      ctx,
      bindings
    );
    if (base) {
      return base;
    }
    return resolveResourceFromSymbol(
      ctx.checker.getSymbolAtLocation(unwrapped),
      ctx,
      bindings
    );
  }
  return void 0;
}
function toSignature(ref) {
  switch (ref.kind) {
    case "Table":
      return { kind: "Table", id: ref.id };
    case "Topic":
      return { kind: "Topic", id: ref.id };
    case "View":
      return { kind: "View", id: ref.id };
    case "SqlResource":
      return { kind: "SqlResource", id: ref.id };
    case "MaterializedView":
      if (ref.targetTableId) {
        return { kind: "Table", id: ref.targetTableId };
      }
      return { kind: "MaterializedView", id: ref.id };
    case "IngestPipeline":
      return void 0;
    default:
      return void 0;
  }
}
function getFunctionLikeDeclarations(symbol, ctx) {
  const resolvedSymbol = resolveAliasedSymbol(symbol, ctx.checker);
  if (!resolvedSymbol) {
    return [];
  }
  const cached = ctx.functionCache.get(resolvedSymbol);
  if (cached) {
    return cached;
  }
  const declarations = [];
  for (const declaration of resolvedSymbol.declarations ?? []) {
    if (import_typescript.default.isFunctionDeclaration(declaration) || import_typescript.default.isMethodDeclaration(declaration) || import_typescript.default.isGetAccessorDeclaration(declaration) || import_typescript.default.isSetAccessorDeclaration(declaration)) {
      declarations.push(declaration);
      continue;
    }
    if (import_typescript.default.isVariableDeclaration(declaration) && declaration.initializer) {
      const initializer = unwrapExpression(declaration.initializer);
      if (import_typescript.default.isArrowFunction(initializer) || import_typescript.default.isFunctionExpression(initializer)) {
        declarations.push(initializer);
        continue;
      }
      if (import_typescript.default.isIdentifier(initializer) || import_typescript.default.isPropertyAccessExpression(initializer)) {
        declarations.push(
          ...getFunctionLikeDeclarations(
            ctx.checker.getSymbolAtLocation(initializer),
            ctx
          )
        );
      }
    }
    if (import_typescript.default.isPropertyAssignment(declaration)) {
      const initializer = unwrapExpression(declaration.initializer);
      if (import_typescript.default.isArrowFunction(initializer) || import_typescript.default.isFunctionExpression(initializer)) {
        declarations.push(initializer);
      }
    }
  }
  ctx.functionCache.set(resolvedSymbol, declarations);
  return declarations;
}
function isSqlTag(tag, checker) {
  const unwrapped = unwrapExpression(tag);
  if (import_typescript.default.isIdentifier(unwrapped) && unwrapped.text === "sql") {
    return true;
  }
  if (import_typescript.default.isPropertyAccessExpression(unwrapped) && unwrapped.name.text === "sql") {
    return true;
  }
  const symbol = resolveAliasedSymbol(
    checker.getSymbolAtLocation(unwrapped),
    checker
  );
  return symbol?.name === "sql";
}
function isUserCodeFunction(fn) {
  const fileName = import_node_path3.default.resolve(fn.getSourceFile().fileName).replace(/\\/g, "/");
  const cwd = import_node_path3.default.resolve(import_node_process.default.cwd()).replace(/\\/g, "/");
  return (fileName === cwd || fileName.startsWith(`${cwd}/`)) && !fileName.includes("/node_modules/");
}
function functionIdentity(fn) {
  const source = fn.getSourceFile().fileName;
  return `${source}:${fn.pos}`;
}
function bindingIdentityForFunction(fn, bindings, checker) {
  const parts = [];
  for (const parameter of fn.parameters) {
    const symbol = resolveAliasedSymbol(
      checker.getSymbolAtLocation(parameter.name),
      checker
    );
    if (!symbol) {
      continue;
    }
    const bound = bindings.get(symbol);
    if (!bound) {
      continue;
    }
    if (bound.kind === "IngestPipeline") {
      continue;
    }
    const signature = toSignature(bound);
    if (!signature) {
      continue;
    }
    parts.push(`${symbol.name}:${signature.kind}:${signature.id}`);
  }
  parts.sort();
  return parts.join("|");
}
function isApiHelperObjectExpression(expression, ctx, visitedSymbols = /* @__PURE__ */ new Set()) {
  const unwrapped = unwrapExpression(expression);
  if (import_typescript.default.isIdentifier(unwrapped)) {
    if (API_HELPER_IDENTIFIERS.has(unwrapped.text)) {
      return true;
    }
    const symbol = resolveAliasedSymbol(
      ctx.checker.getSymbolAtLocation(unwrapped),
      ctx.checker
    );
    if (!symbol || visitedSymbols.has(symbol)) {
      return false;
    }
    visitedSymbols.add(symbol);
    if (API_HELPER_IDENTIFIERS.has(symbol.name)) {
      return true;
    }
    for (const declaration of symbol.declarations ?? []) {
      if (import_typescript.default.isImportSpecifier(declaration)) {
        const importedName = declaration.propertyName?.text ?? declaration.name.text;
        if (API_HELPER_IDENTIFIERS.has(importedName)) {
          return true;
        }
      }
      if (import_typescript.default.isVariableDeclaration(declaration) && declaration.initializer) {
        if (isApiHelperObjectExpression(
          declaration.initializer,
          ctx,
          visitedSymbols
        )) {
          return true;
        }
      }
      if (import_typescript.default.isPropertyAssignment(declaration)) {
        if (isApiHelperObjectExpression(
          declaration.initializer,
          ctx,
          visitedSymbols
        )) {
          return true;
        }
      }
    }
    return false;
  }
  if (import_typescript.default.isPropertyAccessExpression(unwrapped)) {
    if (API_HELPER_IDENTIFIERS.has(unwrapped.name.text)) {
      return true;
    }
    return isApiHelperObjectExpression(
      unwrapped.expression,
      ctx,
      visitedSymbols
    );
  }
  if (import_typescript.default.isElementAccessExpression(unwrapped)) {
    return isApiHelperObjectExpression(
      unwrapped.expression,
      ctx,
      visitedSymbols
    );
  }
  return false;
}
function analyzeFunctionGraph(roots, ctx) {
  const pulls = /* @__PURE__ */ new Map();
  const pushes = /* @__PURE__ */ new Map();
  const visited = /* @__PURE__ */ new Set();
  const addPull = (signature) => {
    if (!signature) {
      return;
    }
    pulls.set(`${signature.kind}:${signature.id}`, signature);
  };
  const addPush = (signature) => {
    if (!signature) {
      return;
    }
    pushes.set(`${signature.kind}:${signature.id}`, signature);
  };
  const visitFunction = (fn, bindings) => {
    const key = `${functionIdentity(fn)}|${bindingIdentityForFunction(fn, bindings, ctx.checker)}`;
    if (visited.has(key)) {
      return;
    }
    visited.add(key);
    const visitNode = (node) => {
      if (import_typescript.default.isTaggedTemplateExpression(node) && isSqlTag(node.tag, ctx.checker)) {
        for (const inferred of inferResourcesFromSqlTemplate(
          node.template,
          ctx
        )) {
          addPull(toSignature(inferred));
        }
        const template = node.template;
        if (import_typescript.default.isTemplateExpression(template)) {
          for (const span of template.templateSpans) {
            const ref = resolveResourceFromExpression(
              span.expression,
              ctx,
              bindings
            );
            const signature = ref ? toSignature(ref) : void 0;
            addPull(signature);
          }
        }
      }
      if (import_typescript.default.isCallExpression(node)) {
        const calleeExpression = unwrapCallTargetExpression(node.expression);
        if (isSqlTag(calleeExpression, ctx.checker)) {
          for (const inferred of inferResourcesFromSqlCallArguments(
            node.arguments,
            ctx
          )) {
            addPull(toSignature(inferred));
          }
          for (const arg of node.arguments) {
            const ref = resolveResourceFromExpression(arg, ctx, bindings);
            const signature = ref ? toSignature(ref) : void 0;
            addPull(signature);
          }
        }
        if (import_typescript.default.isPropertyAccessExpression(calleeExpression)) {
          const methodName = calleeExpression.name.text;
          if (methodName === "table" && isApiHelperObjectExpression(calleeExpression.expression, ctx)) {
            const tableName = resolveStaticString(node.arguments?.[0], ctx);
            if (tableName) {
              addPull({
                kind: "Table",
                id: resolveTableId(tableName, void 0, ctx.registryIndex)
              });
            }
          }
          const ref = resolveResourceFromExpression(
            calleeExpression.expression,
            ctx,
            bindings
          );
          if (ref) {
            const signature = toSignature(ref);
            if (signature) {
              if (WRITE_METHODS.has(methodName)) {
                addPush(signature);
              } else {
                addPull(signature);
              }
            }
          }
        }
        const calleeSymbol = ctx.checker.getSymbolAtLocation(calleeExpression);
        const callees = getFunctionLikeDeclarations(calleeSymbol, ctx).filter(
          isUserCodeFunction
        );
        for (const callee of callees) {
          const nextBindings = new Map(bindings);
          for (let i = 0; i < callee.parameters.length; i++) {
            const param = callee.parameters[i];
            if (!node.arguments || i >= node.arguments.length) {
              continue;
            }
            const paramSymbol = resolveAliasedSymbol(
              ctx.checker.getSymbolAtLocation(param.name),
              ctx.checker
            );
            if (!paramSymbol) {
              continue;
            }
            const argRef = resolveResourceFromExpression(
              node.arguments[i],
              ctx,
              bindings
            );
            if (argRef) {
              nextBindings.set(paramSymbol, argRef);
            }
          }
          visitFunction(callee, nextBindings);
        }
      }
      import_typescript.default.forEachChild(node, visitNode);
    };
    if (fn.body) {
      visitNode(fn.body);
    }
  };
  for (const root of roots) {
    if (!isUserCodeFunction(root)) {
      continue;
    }
    visitFunction(root, /* @__PURE__ */ new Map());
  }
  return {
    pullsDataFrom: [...pulls.values()],
    pushesDataTo: [...pushes.values()]
  };
}
function resolveFunctionNodesFromExpression(expression, ctx) {
  if (!expression) {
    return [];
  }
  const unwrapped = unwrapExpression(expression);
  if (import_typescript.default.isArrowFunction(unwrapped) || import_typescript.default.isFunctionExpression(unwrapped)) {
    return [unwrapped];
  }
  if (import_typescript.default.isIdentifier(unwrapped) || import_typescript.default.isPropertyAccessExpression(unwrapped)) {
    return getFunctionLikeDeclarations(
      ctx.checker.getSymbolAtLocation(unwrapped),
      ctx
    );
  }
  return [];
}
function resolveTaskExpression(expression, ctx) {
  if (!expression) {
    return void 0;
  }
  const unwrapped = unwrapExpression(expression);
  const cacheKey = `${unwrapped.getSourceFile().fileName}:${unwrapped.pos}`;
  const cached = ctx.taskExpressionCache.get(cacheKey);
  if (cached !== void 0) {
    return cached ?? void 0;
  }
  ctx.taskExpressionCache.set(cacheKey, null);
  if (import_typescript.default.isNewExpression(unwrapped)) {
    const ctor = constructorNameFromNewExpression(
      unwrapped.expression,
      ctx.checker
    );
    if (ctor === "Task") {
      ctx.taskExpressionCache.set(cacheKey, unwrapped);
      return unwrapped;
    }
  }
  if (import_typescript.default.isIdentifier(unwrapped) || import_typescript.default.isPropertyAccessExpression(unwrapped)) {
    const symbol = resolveAliasedSymbol(
      ctx.checker.getSymbolAtLocation(unwrapped),
      ctx.checker
    );
    for (const declaration of symbol?.declarations ?? []) {
      if (import_typescript.default.isVariableDeclaration(declaration) && declaration.initializer) {
        const resolved = resolveTaskExpression(declaration.initializer, ctx);
        if (resolved) {
          ctx.taskExpressionCache.set(cacheKey, resolved);
          return resolved;
        }
      }
    }
  }
  return void 0;
}
function resolveArrayLiteralExpression(expression, ctx, visitedSymbols = /* @__PURE__ */ new Set()) {
  if (!expression) {
    return void 0;
  }
  const unwrapped = unwrapExpression(expression);
  if (import_typescript.default.isArrayLiteralExpression(unwrapped)) {
    return unwrapped;
  }
  if (import_typescript.default.isIdentifier(unwrapped) || import_typescript.default.isPropertyAccessExpression(unwrapped)) {
    const symbol = resolveAliasedSymbol(
      ctx.checker.getSymbolAtLocation(unwrapped),
      ctx.checker
    );
    if (!symbol || visitedSymbols.has(symbol)) {
      return void 0;
    }
    visitedSymbols.add(symbol);
    for (const declaration of symbol.declarations ?? []) {
      const initializer = resolveSymbolInitializerExpression(declaration);
      if (!initializer) {
        continue;
      }
      const resolved = resolveArrayLiteralExpression(
        initializer,
        ctx,
        visitedSymbols
      );
      if (resolved) {
        return resolved;
      }
    }
  }
  return void 0;
}
function collectTaskFunctionsFromOnCompleteElement(element, ctx, visitedTasks) {
  if (import_typescript.default.isSpreadElement(element)) {
    const spreadArray = resolveArrayLiteralExpression(element.expression, ctx);
    if (spreadArray) {
      return spreadArray.elements.flatMap(
        (nestedElement) => collectTaskFunctionsFromOnCompleteElement(
          nestedElement,
          ctx,
          visitedTasks
        )
      );
    }
    return collectTaskFunctions(element.expression, ctx, visitedTasks);
  }
  return collectTaskFunctions(element, ctx, visitedTasks);
}
function collectTaskFunctions(taskExpression, ctx, visitedTasks) {
  const task = resolveTaskExpression(taskExpression, ctx);
  if (!task) {
    return [];
  }
  const taskKey = `${task.getSourceFile().fileName}:${task.pos}`;
  if (visitedTasks.has(taskKey)) {
    return [];
  }
  visitedTasks.add(taskKey);
  const configExpression = task.arguments?.[1];
  const configObject = resolveObjectLiteralExpression(configExpression, ctx);
  if (!configObject) {
    return [];
  }
  const functions = [];
  functions.push(
    ...resolveFunctionNodesFromExpression(
      getObjectPropertyExpression(configObject, "run"),
      ctx
    )
  );
  functions.push(
    ...resolveFunctionNodesFromExpression(
      getObjectPropertyExpression(configObject, "onCancel"),
      ctx
    )
  );
  const onComplete = getObjectPropertyExpression(configObject, "onComplete");
  if (onComplete) {
    const arrayLiteral = unwrapExpression(onComplete);
    if (import_typescript.default.isArrayLiteralExpression(arrayLiteral)) {
      for (const element of arrayLiteral.elements) {
        functions.push(
          ...collectTaskFunctionsFromOnCompleteElement(
            element,
            ctx,
            visitedTasks
          )
        );
      }
    }
  }
  return functions;
}
function collectAnalysisFiles(registry) {
  const files = /* @__PURE__ */ new Set();
  let requiresFallbackScan = false;
  const uniqueApis = /* @__PURE__ */ new Set();
  for (const api of registry.apis.values()) {
    uniqueApis.add(api);
  }
  for (const api of uniqueApis) {
    const sourceFile = api?.metadata?.source?.file;
    if (typeof sourceFile === "string" && import_node_fs2.default.existsSync(sourceFile) && isSourceFilePath(sourceFile)) {
      files.add(import_node_path3.default.resolve(sourceFile));
    } else {
      requiresFallbackScan = true;
    }
  }
  registry.workflows.forEach((workflow) => {
    const sourceFile = workflow?.sourceFile;
    if (typeof sourceFile === "string" && import_node_fs2.default.existsSync(sourceFile) && isSourceFilePath(sourceFile)) {
      files.add(import_node_path3.default.resolve(sourceFile));
    } else {
      requiresFallbackScan = true;
    }
  });
  registry.webApps.forEach((webApp) => {
    const sourceFile = webApp?.sourceFile;
    if (typeof sourceFile === "string" && import_node_fs2.default.existsSync(sourceFile) && isSourceFilePath(sourceFile)) {
      files.add(import_node_path3.default.resolve(sourceFile));
    } else {
      requiresFallbackScan = true;
    }
  });
  if (files.size === 0 || requiresFallbackScan) {
    const appDir = import_node_path3.default.resolve(import_node_process.default.cwd(), getSourceDir());
    for (const file of findSourceFiles(appDir, (directory, error) => {
      compilerLog(`Warning: Could not read directory ${directory}: ${error}`);
    })) {
      files.add(file);
    }
  }
  return [...files];
}
function loadCompilerOptions(rootNames) {
  const fallback = {
    allowJs: true,
    target: import_typescript.default.ScriptTarget.ES2020,
    module: import_typescript.default.ModuleKind.NodeNext,
    moduleResolution: import_typescript.default.ModuleResolutionKind.NodeNext,
    jsx: import_typescript.default.JsxEmit.Preserve,
    skipLibCheck: true
  };
  const configPath = import_typescript.default.findConfigFile(
    import_node_process.default.cwd(),
    import_typescript.default.sys.fileExists,
    "tsconfig.json"
  );
  if (!configPath) {
    return { rootNames, options: fallback };
  }
  const configFile = import_typescript.default.readConfigFile(configPath, import_typescript.default.sys.readFile);
  if (configFile.error) {
    return { rootNames, options: fallback };
  }
  const parsed = import_typescript.default.parseJsonConfigFileContent(
    configFile.config,
    import_typescript.default.sys,
    import_node_path3.default.dirname(configPath)
  );
  const normalizedRoots = [
    ...new Set(rootNames.map((file) => import_node_path3.default.resolve(file)))
  ];
  return {
    rootNames: normalizedRoots,
    options: { ...fallback, ...parsed.options }
  };
}
function createNameResolutionContext(checker) {
  return {
    checker,
    registryIndex: {
      tableIdsByName: /* @__PURE__ */ new Map(),
      topicIdsByName: /* @__PURE__ */ new Map(),
      tableIds: /* @__PURE__ */ new Set(),
      topicIds: /* @__PURE__ */ new Set(),
      warnedAmbiguousTableIds: /* @__PURE__ */ new Set()
    },
    symbolResourceCache: /* @__PURE__ */ new Map(),
    taskExpressionCache: /* @__PURE__ */ new Map(),
    functionCache: /* @__PURE__ */ new Map()
  };
}
function collectLineageRootEntries(program2, checker) {
  const apiEntries = /* @__PURE__ */ new Map();
  const workflowEntries = /* @__PURE__ */ new Map();
  const webAppEntries = /* @__PURE__ */ new Map();
  const tempCtx = createNameResolutionContext(checker);
  const setIfNew = (entries, key, expression) => {
    if (!key || entries.has(key)) {
      return;
    }
    entries.set(key, expression);
  };
  const visit = (node) => {
    if (import_typescript.default.isNewExpression(node) && node.arguments && node.arguments.length >= 2) {
      const ctor = constructorNameFromNewExpression(node.expression, checker);
      if (ctor === "Api" || ctor === "ConsumptionApi") {
        const name = resolveStaticString(node.arguments[0], tempCtx);
        const config = resolveObjectLiteralExpression(
          node.arguments[2],
          tempCtx
        );
        const version = config ? resolveStaticString(
          getObjectPropertyExpression(config, "version"),
          tempCtx
        ) : void 0;
        const key = apiKey(name, version);
        setIfNew(apiEntries, key, node.arguments[1]);
      } else if (ctor === "Workflow") {
        const key = resolveStaticString(node.arguments[0], tempCtx);
        setIfNew(workflowEntries, key, node.arguments[1]);
      } else if (ctor === "WebApp") {
        const key = resolveStaticString(node.arguments[0], tempCtx);
        setIfNew(webAppEntries, key, node.arguments[1]);
      }
    }
    import_typescript.default.forEachChild(node, visit);
  };
  for (const sourceFile of program2.getSourceFiles()) {
    if (sourceFile.fileName.includes("/node_modules/")) {
      continue;
    }
    visit(sourceFile);
  }
  return { apiEntries, workflowEntries, webAppEntries };
}
function apiKey(name, version) {
  if (!name) {
    return void 0;
  }
  return version ? `${name}:${version}` : name;
}
function resolveWebAppRootFunctions(expression, ctx) {
  const roots = resolveFunctionNodesFromExpression(expression, ctx);
  const objectLiteral = resolveObjectLiteralExpression(expression, ctx);
  if (!objectLiteral) {
    return roots;
  }
  const deduped = /* @__PURE__ */ new Map();
  for (const root of roots) {
    deduped.set(functionIdentity(root), root);
  }
  for (const propertyName of ["handle", "callback", "routing"]) {
    const propertyExpression = getObjectPropertyExpression(
      objectLiteral,
      propertyName
    );
    const propertyFunctions = resolveFunctionNodesFromExpression(
      propertyExpression,
      ctx
    );
    for (const fn of propertyFunctions) {
      deduped.set(functionIdentity(fn), fn);
    }
  }
  return [...deduped.values()];
}
function analyzeRegistryLineage(registry) {
  if (registry.apis.size === 0 && registry.workflows.size === 0 && registry.webApps.size === 0) {
    return createEmptyResult();
  }
  try {
    const files = collectAnalysisFiles(registry);
    if (files.length === 0) {
      return createEmptyResult();
    }
    const { rootNames, options } = loadCompilerOptions(files);
    const program2 = import_typescript.default.createProgram({
      rootNames,
      options
    });
    const checker = program2.getTypeChecker();
    const ctx = {
      checker,
      registryIndex: buildRegistryIndex(registry),
      symbolResourceCache: /* @__PURE__ */ new Map(),
      taskExpressionCache: /* @__PURE__ */ new Map(),
      functionCache: /* @__PURE__ */ new Map()
    };
    const { apiEntries, workflowEntries, webAppEntries } = collectLineageRootEntries(program2, checker);
    const apiByKey = /* @__PURE__ */ new Map();
    const seenApiKeys = /* @__PURE__ */ new Set();
    registry.apis.forEach((api) => {
      const key = apiKey(api?.name, api?.config?.version);
      if (!key || seenApiKeys.has(key)) {
        return;
      }
      seenApiKeys.add(key);
      const handlerExpression = apiEntries.get(key);
      if (!handlerExpression) {
        apiByKey.set(key, { pullsDataFrom: [], pushesDataTo: [] });
        return;
      }
      const roots = resolveFunctionNodesFromExpression(handlerExpression, ctx);
      apiByKey.set(key, analyzeFunctionGraph(roots, ctx));
    });
    const workflowByName = /* @__PURE__ */ new Map();
    registry.workflows.forEach((workflow, workflowName) => {
      const configExpression = workflowEntries.get(workflowName);
      if (!configExpression) {
        workflowByName.set(workflowName, {
          pullsDataFrom: [],
          pushesDataTo: []
        });
        return;
      }
      const configObject = resolveObjectLiteralExpression(
        configExpression,
        ctx
      );
      const startingTaskExpression = configObject ? getObjectPropertyExpression(configObject, "startingTask") : void 0;
      const roots = collectTaskFunctions(
        startingTaskExpression,
        ctx,
        /* @__PURE__ */ new Set()
      );
      workflowByName.set(workflowName, analyzeFunctionGraph(roots, ctx));
    });
    const webAppByName = /* @__PURE__ */ new Map();
    registry.webApps.forEach((webApp, webAppName) => {
      const handlerExpression = webAppEntries.get(webAppName);
      if (!handlerExpression) {
        webAppByName.set(webAppName, { pullsDataFrom: [], pushesDataTo: [] });
        return;
      }
      const roots = resolveWebAppRootFunctions(handlerExpression, ctx);
      webAppByName.set(webAppName, analyzeFunctionGraph(roots, ctx));
    });
    return { apiByKey, workflowByName, webAppByName };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    compilerLog(
      `Warning: lineage analysis failed; returning empty lineage results. ${message}`
    );
    return createEmptyResult();
  }
}
var import_node_fs2, import_node_path3, import_node_process, import_typescript, WRITE_METHODS, API_HELPER_IDENTIFIERS;
var init_dependencyAnalysis = __esm({
  "src/dmv2/dependencyAnalysis.ts"() {
    "use strict";
    import_node_fs2 = __toESM(require("fs"));
    import_node_path3 = __toESM(require("path"));
    import_node_process = __toESM(require("process"));
    import_typescript = __toESM(require("typescript"));
    init_compiler_config();
    init_commons();
    init_utils();
    WRITE_METHODS = /* @__PURE__ */ new Set(["insert", "send", "publish", "emit", "write"]);
    API_HELPER_IDENTIFIERS = /* @__PURE__ */ new Set(["ApiHelpers", "ConsumptionHelpers"]);
  }
});

// src/dmv2/internal.ts
function pathStem(filePath) {
  const ext = path5.extname(filePath);
  return ext ? filePath.slice(0, -ext.length) : filePath;
}
function findUnloadedFiles() {
  const cwd = import_process.default.cwd();
  const sourceDir = getSourceDir();
  const appDir = path5.resolve(cwd, sourceDir);
  const compiledAppDir = path5.resolve(cwd, getOutDir(), sourceDir);
  const allSourceFiles = findSourceFiles(appDir, (directory, error) => {
    compilerLog(`Warning: Could not read directory ${directory}: ${error}`);
  });
  const loadedStems = new Set(
    Object.keys(require.cache).filter((key) => key.startsWith(compiledAppDir)).map((key) => pathStem(path5.relative(compiledAppDir, key)))
  );
  const unloadedFiles = allSourceFiles.filter((file) => {
    const stem = pathStem(path5.relative(appDir, file));
    return !loadedStems.has(stem);
  }).map((file) => path5.relative(cwd, file));
  return unloadedFiles;
}
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
function getCachedLineage(registry) {
  if (lineageCache && lineageCache.registry === registry && lineageCache.version === registryMutationVersion) {
    return lineageCache.result;
  }
  const result = analyzeRegistryLineage(registry);
  lineageCache = {
    registry,
    version: registryMutationVersion,
    result
  };
  return result;
}
function isS3QueueConfig(config) {
  return "engine" in config && config.engine === "S3Queue" /* S3Queue */;
}
function hasReplicatedEngine(config) {
  if (!("engine" in config)) {
    return false;
  }
  const engine = config.engine;
  return engine === "ReplicatedMergeTree" /* ReplicatedMergeTree */ || engine === "ReplicatedReplacingMergeTree" /* ReplicatedReplacingMergeTree */ || engine === "ReplicatedAggregatingMergeTree" /* ReplicatedAggregatingMergeTree */ || engine === "ReplicatedSummingMergeTree" /* ReplicatedSummingMergeTree */ || engine === "ReplicatedCollapsingMergeTree" /* ReplicatedCollapsingMergeTree */ || engine === "ReplicatedVersionedCollapsingMergeTree" /* ReplicatedVersionedCollapsingMergeTree */;
}
function extractEngineValue(config) {
  if (!("engine" in config)) {
    return "MergeTree" /* MergeTree */;
  }
  return config.engine;
}
function convertBasicEngineConfig(engine, config) {
  switch (engine) {
    case "MergeTree" /* MergeTree */:
      return { engine: "MergeTree" };
    case "AggregatingMergeTree" /* AggregatingMergeTree */:
      return { engine: "AggregatingMergeTree" };
    case "ReplacingMergeTree" /* ReplacingMergeTree */: {
      const replacingConfig = config;
      return {
        engine: "ReplacingMergeTree",
        ver: replacingConfig.ver,
        isDeleted: replacingConfig.isDeleted
      };
    }
    case "SummingMergeTree" /* SummingMergeTree */: {
      const summingConfig = config;
      return {
        engine: "SummingMergeTree",
        columns: summingConfig.columns
      };
    }
    case "CollapsingMergeTree" /* CollapsingMergeTree */: {
      const collapsingConfig = config;
      return {
        engine: "CollapsingMergeTree",
        sign: collapsingConfig.sign
      };
    }
    case "VersionedCollapsingMergeTree" /* VersionedCollapsingMergeTree */: {
      const versionedConfig = config;
      return {
        engine: "VersionedCollapsingMergeTree",
        sign: versionedConfig.sign,
        ver: versionedConfig.ver
      };
    }
    default:
      return void 0;
  }
}
function convertReplicatedEngineConfig(engine, config) {
  if (!hasReplicatedEngine(config)) {
    return void 0;
  }
  switch (engine) {
    case "ReplicatedMergeTree" /* ReplicatedMergeTree */: {
      const replicatedConfig = config;
      return {
        engine: "ReplicatedMergeTree",
        keeperPath: replicatedConfig.keeperPath,
        replicaName: replicatedConfig.replicaName
      };
    }
    case "ReplicatedReplacingMergeTree" /* ReplicatedReplacingMergeTree */: {
      const replicatedConfig = config;
      return {
        engine: "ReplicatedReplacingMergeTree",
        keeperPath: replicatedConfig.keeperPath,
        replicaName: replicatedConfig.replicaName,
        ver: replicatedConfig.ver,
        isDeleted: replicatedConfig.isDeleted
      };
    }
    case "ReplicatedAggregatingMergeTree" /* ReplicatedAggregatingMergeTree */: {
      const replicatedConfig = config;
      return {
        engine: "ReplicatedAggregatingMergeTree",
        keeperPath: replicatedConfig.keeperPath,
        replicaName: replicatedConfig.replicaName
      };
    }
    case "ReplicatedSummingMergeTree" /* ReplicatedSummingMergeTree */: {
      const replicatedConfig = config;
      return {
        engine: "ReplicatedSummingMergeTree",
        keeperPath: replicatedConfig.keeperPath,
        replicaName: replicatedConfig.replicaName,
        columns: replicatedConfig.columns
      };
    }
    case "ReplicatedCollapsingMergeTree" /* ReplicatedCollapsingMergeTree */: {
      const replicatedConfig = config;
      return {
        engine: "ReplicatedCollapsingMergeTree",
        keeperPath: replicatedConfig.keeperPath,
        replicaName: replicatedConfig.replicaName,
        sign: replicatedConfig.sign
      };
    }
    case "ReplicatedVersionedCollapsingMergeTree" /* ReplicatedVersionedCollapsingMergeTree */: {
      const replicatedConfig = config;
      return {
        engine: "ReplicatedVersionedCollapsingMergeTree",
        keeperPath: replicatedConfig.keeperPath,
        replicaName: replicatedConfig.replicaName,
        sign: replicatedConfig.sign,
        ver: replicatedConfig.ver
      };
    }
    default:
      return void 0;
  }
}
function convertS3QueueEngineConfig(config) {
  if (!isS3QueueConfig(config)) {
    return void 0;
  }
  return {
    engine: "S3Queue",
    s3Path: config.s3Path,
    format: config.format,
    awsAccessKeyId: config.awsAccessKeyId,
    awsSecretAccessKey: config.awsSecretAccessKey,
    compression: config.compression,
    headers: config.headers
  };
}
function convertS3EngineConfig(config) {
  if (!("engine" in config) || config.engine !== "S3" /* S3 */) {
    return void 0;
  }
  return {
    engine: "S3",
    path: config.path,
    format: config.format,
    awsAccessKeyId: config.awsAccessKeyId,
    awsSecretAccessKey: config.awsSecretAccessKey,
    compression: config.compression,
    partitionStrategy: config.partitionStrategy,
    partitionColumnsInDataFile: config.partitionColumnsInDataFile
  };
}
function convertBufferEngineConfig(config) {
  if (!("engine" in config) || config.engine !== "Buffer" /* Buffer */) {
    return void 0;
  }
  return {
    engine: "Buffer",
    targetDatabase: config.targetDatabase,
    targetTable: config.targetTable,
    numLayers: config.numLayers,
    minTime: config.minTime,
    maxTime: config.maxTime,
    minRows: config.minRows,
    maxRows: config.maxRows,
    minBytes: config.minBytes,
    maxBytes: config.maxBytes,
    flushTime: config.flushTime,
    flushRows: config.flushRows,
    flushBytes: config.flushBytes
  };
}
function convertDistributedEngineConfig(config) {
  if (!("engine" in config) || config.engine !== "Distributed" /* Distributed */) {
    return void 0;
  }
  return {
    engine: "Distributed",
    cluster: config.cluster,
    targetDatabase: config.targetDatabase,
    targetTable: config.targetTable,
    shardingKey: config.shardingKey,
    policyName: config.policyName
  };
}
function convertIcebergS3EngineConfig(config) {
  if (!("engine" in config) || config.engine !== "IcebergS3" /* IcebergS3 */) {
    return void 0;
  }
  return {
    engine: "IcebergS3",
    path: config.path,
    format: config.format,
    awsAccessKeyId: config.awsAccessKeyId,
    awsSecretAccessKey: config.awsSecretAccessKey,
    compression: config.compression
  };
}
function convertKafkaEngineConfig(config) {
  if (!("engine" in config) || config.engine !== "Kafka" /* Kafka */) {
    return void 0;
  }
  return {
    engine: "Kafka",
    brokerList: config.brokerList,
    topicList: config.topicList,
    groupName: config.groupName,
    format: config.format
  };
}
function convertMergeEngineConfig(config) {
  if (!("engine" in config) || config.engine !== "Merge" /* Merge */) {
    return void 0;
  }
  return {
    engine: "Merge",
    sourceDatabase: config.sourceDatabase,
    tablesRegexp: config.tablesRegexp
  };
}
function convertTableConfigToEngineConfig(config) {
  const engine = extractEngineValue(config);
  const basicConfig = convertBasicEngineConfig(engine, config);
  if (basicConfig) {
    return basicConfig;
  }
  const replicatedConfig = convertReplicatedEngineConfig(engine, config);
  if (replicatedConfig) {
    return replicatedConfig;
  }
  if (engine === "S3Queue" /* S3Queue */) {
    return convertS3QueueEngineConfig(config);
  }
  if (engine === "S3" /* S3 */) {
    return convertS3EngineConfig(config);
  }
  if (engine === "Buffer" /* Buffer */) {
    return convertBufferEngineConfig(config);
  }
  if (engine === "Distributed" /* Distributed */) {
    return convertDistributedEngineConfig(config);
  }
  if (engine === "IcebergS3" /* IcebergS3 */) {
    return convertIcebergS3EngineConfig(config);
  }
  if (engine === "Kafka" /* Kafka */) {
    return convertKafkaEngineConfig(config);
  }
  if (engine === "Merge" /* Merge */) {
    return convertMergeEngineConfig(config);
  }
  return void 0;
}
function findTaskInTree(task, targetName) {
  if (task.name === targetName) {
    return task;
  }
  if (task.config.onComplete?.length) {
    for (const childTask of task.config.onComplete) {
      const found = findTaskInTree(childTask, targetName);
      if (found) {
        return found;
      }
    }
  }
  return void 0;
}
var import_process, path5, MutationTrackingMap, registryMutationVersion, lineageCache, markRegistryMutated, moose_internal, defaultRetentionPeriod, toInfraMap, initializeMooseInternalRegistry, getMooseInternal, dumpMooseInternal, loadIndex, getStreamingFunctions, getApis2, getWorkflows2, getTaskForWorkflow, getWebApps2;
var init_internal = __esm({
  "src/dmv2/internal.ts"() {
    "use strict";
    import_process = __toESM(require("process"));
    path5 = __toESM(require("path"));
    init_index();
    init_commons();
    init_compiler_config();
    init_dependencyAnalysis();
    init_utils();
    MutationTrackingMap = class extends Map {
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
    registryMutationVersion = 0;
    markRegistryMutated = () => {
      registryMutationVersion += 1;
      lineageCache = void 0;
    };
    moose_internal = {
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
    defaultRetentionPeriod = 60 * 60 * 24 * 7;
    toInfraMap = (registry) => {
      const tables = {};
      const topics = {};
      const ingestApis = {};
      const apis = {};
      const sqlResources = {};
      const workflows = {};
      const webApps = {};
      const materializedViews = {};
      const views = {};
      const lineage = getCachedLineage(registry);
      registry.tables.forEach((table) => {
        const id = table.config.version ? `${table.name}_${table.config.version}` : table.name;
        let metadata = table.metadata;
        if (!metadata && table.config && table.pipelineParent) {
          metadata = table.pipelineParent.metadata;
        }
        const engineConfig = convertTableConfigToEngineConfig(table.config);
        let tableSettings = void 0;
        if (table.config.settings) {
          tableSettings = Object.entries(table.config.settings).reduce(
            (acc, [key, value]) => {
              if (value !== void 0) {
                acc[key] = String(value);
              }
              return acc;
            },
            {}
          );
        }
        if (engineConfig?.engine === "S3Queue") {
          if (!tableSettings) {
            tableSettings = {};
          }
          if (!tableSettings.mode) {
            tableSettings.mode = "unordered";
          }
        }
        const hasOrderByFields = "orderByFields" in table.config && Array.isArray(table.config.orderByFields) && table.config.orderByFields.length > 0;
        const hasOrderByExpression = "orderByExpression" in table.config && typeof table.config.orderByExpression === "string" && table.config.orderByExpression.length > 0;
        if (hasOrderByFields && hasOrderByExpression) {
          throw new Error(
            `Table ${table.name}: Provide either orderByFields or orderByExpression, not both.`
          );
        }
        const orderBy2 = hasOrderByExpression && "orderByExpression" in table.config ? table.config.orderByExpression ?? "" : "orderByFields" in table.config ? table.config.orderByFields ?? [] : [];
        tables[id] = {
          name: table.name,
          columns: table.columnArray,
          orderBy: orderBy2,
          partitionBy: "partitionBy" in table.config ? table.config.partitionBy : void 0,
          sampleByExpression: "sampleByExpression" in table.config ? table.config.sampleByExpression : void 0,
          primaryKeyExpression: "primaryKeyExpression" in table.config ? table.config.primaryKeyExpression : void 0,
          engineConfig,
          version: table.config.version,
          metadata,
          lifeCycle: table.config.lifeCycle,
          // Map 'settings' to 'tableSettings' for internal use
          tableSettings: tableSettings && Object.keys(tableSettings).length > 0 ? tableSettings : void 0,
          indexes: table.config.indexes?.map((i) => ({
            ...i,
            granularity: i.granularity === void 0 ? 1 : i.granularity,
            arguments: i.arguments === void 0 ? [] : i.arguments
          })) || [],
          projections: "projections" in table.config && table.config.projections || [],
          constraints: "constraints" in table.config && table.config.constraints ? table.config.constraints.map(
            (c) => ({
              name: c.name,
              expression: c.expression,
              constraint_type: c.type
            })
          ) : [],
          ttl: table.config.ttl,
          database: table.config.database,
          cluster: table.config.cluster,
          seedFilter: "seedFilter" in table.config ? table.config.seedFilter : void 0
        };
      });
      registry.streams.forEach((stream) => {
        let metadata = stream.metadata;
        if (!metadata && stream.config && stream.pipelineParent) {
          metadata = stream.pipelineParent.metadata;
        }
        const transformationTargets = [];
        const consumers = [];
        stream._transformations.forEach((transforms, destinationName) => {
          transforms.forEach(([destination, _, config]) => {
            transformationTargets.push({
              kind: "stream",
              name: destinationName,
              version: config.version,
              metadata: config.metadata,
              sourceFile: config.sourceFile,
              deadLetterQueue: config.deadLetterQueue?.name
            });
          });
        });
        stream._consumers.forEach((consumer) => {
          consumers.push({
            version: consumer.config.version,
            sourceFile: consumer.config.sourceFile,
            deadLetterQueue: consumer.config.deadLetterQueue?.name
          });
        });
        topics[stream.name] = {
          name: stream.name,
          columns: stream.columnArray,
          targetTable: stream.config.destination?.name,
          targetTableVersion: stream.config.destination?.config.version,
          retentionPeriod: stream.config.retentionPeriod ?? defaultRetentionPeriod,
          partitionCount: stream.config.parallelism ?? 1,
          version: stream.config.version,
          transformationTargets,
          hasMultiTransform: stream._multipleTransformations === void 0,
          consumers,
          metadata,
          lifeCycle: stream.config.lifeCycle,
          schemaConfig: stream.config.schemaConfig
        };
      });
      registry.ingestApis.forEach((api) => {
        let metadata = api.metadata;
        if (!metadata && api.config && api.pipelineParent) {
          metadata = api.pipelineParent.metadata;
        }
        ingestApis[api.name] = {
          name: api.name,
          columns: api.columnArray,
          version: api.config.version,
          path: api.config.path,
          writeTo: {
            kind: "stream",
            name: api.config.destination.name
          },
          deadLetterQueue: api.config.deadLetterQueue?.name,
          metadata,
          schema: api.schema,
          allowExtraFields: api.allowExtraFields
        };
      });
      registry.apis.forEach((api, key) => {
        const rustKey = api.config.version ? `${api.name}:${api.config.version}` : api.name;
        const apiLineage = lineage.apiByKey.get(rustKey);
        apis[rustKey] = {
          name: api.name,
          queryParams: api.columnArray,
          responseSchema: api.responseSchema,
          version: api.config.version,
          path: api.config.path,
          metadata: api.metadata,
          pullsDataFrom: apiLineage?.pullsDataFrom ?? [],
          pushesDataTo: apiLineage?.pushesDataTo ?? []
        };
      });
      registry.sqlResources.forEach((sqlResource) => {
        sqlResources[sqlResource.name] = {
          name: sqlResource.name,
          setup: sqlResource.setup,
          teardown: sqlResource.teardown,
          sourceFile: sqlResource.sourceFile,
          sourceLine: sqlResource.sourceLine,
          sourceColumn: sqlResource.sourceColumn,
          pullsDataFrom: sqlResource.pullsDataFrom.map((r) => {
            if (r.kind === "OlapTable") {
              const table = r;
              const id = table.config.version ? `${table.name}_${table.config.version}` : table.name;
              return {
                id,
                kind: "Table"
              };
            } else if (r.kind === "SqlResource") {
              const resource = r;
              return {
                id: resource.name,
                kind: "SqlResource"
              };
            } else if (r.kind === "View") {
              const view = r;
              return {
                id: view.name,
                kind: "View"
              };
            } else if (r.kind === "MaterializedView") {
              const mv = r;
              return {
                id: mv.name,
                kind: "MaterializedView"
              };
            } else {
              throw new Error(`Unknown sql resource dependency type: ${r}`);
            }
          }),
          pushesDataTo: sqlResource.pushesDataTo.map((r) => {
            if (r.kind === "OlapTable") {
              const table = r;
              const id = table.config.version ? `${table.name}_${table.config.version}` : table.name;
              return {
                id,
                kind: "Table"
              };
            } else if (r.kind === "SqlResource") {
              const resource = r;
              return {
                id: resource.name,
                kind: "SqlResource"
              };
            } else if (r.kind === "View") {
              const view = r;
              return {
                id: view.name,
                kind: "View"
              };
            } else if (r.kind === "MaterializedView") {
              const mv = r;
              return {
                id: mv.name,
                kind: "MaterializedView"
              };
            } else {
              throw new Error(`Unknown sql resource dependency type: ${r}`);
            }
          })
        };
      });
      registry.workflows.forEach((workflow) => {
        const workflowLineage = lineage.workflowByName.get(workflow.name);
        workflows[workflow.name] = {
          name: workflow.name,
          retries: workflow.config.retries,
          timeout: workflow.config.timeout,
          schedule: workflow.config.schedule,
          pullsDataFrom: workflowLineage?.pullsDataFrom ?? [],
          pushesDataTo: workflowLineage?.pushesDataTo ?? []
        };
      });
      registry.webApps.forEach((webApp) => {
        const webAppLineage = lineage.webAppByName.get(webApp.name);
        webApps[webApp.name] = {
          name: webApp.name,
          mountPath: webApp.config.mountPath || "/",
          metadata: webApp.config.metadata,
          pullsDataFrom: webAppLineage?.pullsDataFrom ?? [],
          pushesDataTo: webAppLineage?.pushesDataTo ?? []
        };
      });
      registry.materializedViews.forEach((mv) => {
        materializedViews[mv.name] = {
          name: mv.name,
          selectSql: mv.selectSql,
          sourceTables: mv.sourceTables,
          targetTable: mv.targetTable.name,
          targetDatabase: mv.targetTable.config.database,
          metadata: mv.metadata,
          lifeCycle: mv.lifeCycle
        };
      });
      registry.views.forEach((view) => {
        views[view.name] = {
          name: view.name,
          selectSql: view.selectSql,
          sourceTables: view.sourceTables,
          metadata: view.metadata
        };
      });
      return {
        topics,
        tables,
        ingestApis,
        apis,
        sqlResources,
        workflows,
        webApps,
        materializedViews,
        views,
        unloadedFiles: []
        // Will be populated by dumpMooseInternal
      };
    };
    initializeMooseInternalRegistry = () => {
      const existing = globalThis.moose_internal;
      if (existing === void 0) {
        globalThis.moose_internal = moose_internal;
        return;
      }
      globalThis.moose_internal = createRegistryFrom(existing);
    };
    initializeMooseInternalRegistry();
    getMooseInternal = () => globalThis.moose_internal;
    dumpMooseInternal = async () => {
      await loadIndex();
      const infraMap = toInfraMap(getMooseInternal());
      const unloadedFiles = findUnloadedFiles();
      infraMap.unloadedFiles = unloadedFiles;
      console.log(
        "___MOOSE_STUFF___start",
        JSON.stringify(infraMap),
        "end___MOOSE_STUFF___"
      );
    };
    loadIndex = async () => {
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
      const compiledDir = path5.isAbsolute(outDir) ? outDir : path5.join(import_process.default.cwd(), outDir);
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
    getStreamingFunctions = async () => {
      await loadIndex();
      const registry = getMooseInternal();
      const transformFunctions = /* @__PURE__ */ new Map();
      registry.streams.forEach((stream) => {
        stream._transformations.forEach((transforms, destinationName) => {
          transforms.forEach(([_, transform, config]) => {
            const transformFunctionKey = `${stream.name}_${destinationName}${config.version ? `_${config.version}` : ""}`;
            compilerLog(`getStreamingFunctions: ${transformFunctionKey}`);
            transformFunctions.set(transformFunctionKey, [
              transform,
              config,
              stream.columnArray
            ]);
          });
        });
        stream._consumers.forEach((consumer) => {
          const consumerFunctionKey = `${stream.name}_<no-target>${consumer.config.version ? `_${consumer.config.version}` : ""}`;
          transformFunctions.set(consumerFunctionKey, [
            consumer.consumer,
            consumer.config,
            stream.columnArray
          ]);
        });
      });
      return transformFunctions;
    };
    getApis2 = async () => {
      await loadIndex();
      const apiFunctions = /* @__PURE__ */ new Map();
      const registry = getMooseInternal();
      const versionCountByName = /* @__PURE__ */ new Map();
      const nameToSoleVersionHandler = /* @__PURE__ */ new Map();
      registry.apis.forEach((api, key) => {
        const handler = api.getHandler();
        apiFunctions.set(key, handler);
        if (!api.config.version) {
          if (!apiFunctions.has(api.name)) {
            apiFunctions.set(api.name, handler);
          }
          nameToSoleVersionHandler.delete(api.name);
          versionCountByName.delete(api.name);
        } else if (!apiFunctions.has(api.name)) {
          const count2 = (versionCountByName.get(api.name) ?? 0) + 1;
          versionCountByName.set(api.name, count2);
          if (count2 === 1) {
            nameToSoleVersionHandler.set(api.name, handler);
          } else {
            nameToSoleVersionHandler.delete(api.name);
          }
        }
      });
      nameToSoleVersionHandler.forEach((handler, name) => {
        if (!apiFunctions.has(name)) {
          apiFunctions.set(name, handler);
        }
      });
      return apiFunctions;
    };
    getWorkflows2 = async () => {
      await loadIndex();
      const registry = getMooseInternal();
      return registry.workflows;
    };
    getTaskForWorkflow = async (workflowName, taskName) => {
      const workflows = await getWorkflows2();
      const workflow = workflows.get(workflowName);
      if (!workflow) {
        throw new Error(`Workflow ${workflowName} not found`);
      }
      const task = findTaskInTree(
        workflow.config.startingTask,
        taskName
      );
      if (!task) {
        throw new Error(`Task ${taskName} not found in workflow ${workflowName}`);
      }
      return task;
    };
    getWebApps2 = async () => {
      await loadIndex();
      return getMooseInternal().webApps;
    };
  }
});

// src/moose-runner.ts
var import_fs2 = require("fs");
var import_path2 = require("path");
init_internal();

// src/consumption-apis/runner.ts
var import_http = __toESM(require("http"));
var path6 = __toESM(require("path"));
init_commons();
init_helpers();
var jose = __toESM(require("jose"));

// src/cluster-utils.ts
var import_node_cluster = __toESM(require("cluster"));
var import_node_os = require("os");
var import_node_process2 = require("process");
var DEFAULT_MAX_CPU_USAGE_RATIO = 0.7;
var RESTART_TIME_MS = 1e4;
var SIGTERM = "SIGTERM";
var SIGINT = "SIGINT";
var SHUTDOWN_WORKERS_INTERVAL = 500;
var Cluster = class {
  // Tracks if shutdown is currently in progress
  shutdownInProgress = false;
  // Tracks if workers exited cleanly during shutdown
  hasCleanWorkerExit = true;
  // String identifying if this is primary or worker process
  processStr = `${import_node_cluster.default.isPrimary ? "primary" : "worker"} process ${process.pid}`;
  // Functions for starting and stopping workers
  workerStart;
  workerStop;
  // Result from starting worker, needed for cleanup
  startOutput;
  maxCpuUsageRatio;
  usedCpuCount;
  /**
   * Creates a new cluster manager instance.
   *
   * @param options - Configuration options for the cluster
   * @param options.workerStart - Async function to execute when starting a worker
   * @param options.workerStop - Async function to execute when stopping a worker
   * @param options.maxCpuUsageRatio - Maximum ratio of CPU cores to utilize (0-1)
   * @param options.maxWorkerCount - Maximum number of workers to spawn
   * @throws {Error} If maxCpuUsageRatio is not between 0 and 1
   */
  constructor(options) {
    this.workerStart = options.workerStart;
    this.workerStop = options.workerStop;
    if (options.maxCpuUsageRatio && (options.maxCpuUsageRatio > 1 || options.maxCpuUsageRatio < 0)) {
      throw new Error("maxCpuUsageRatio must be between 0 and 1");
    }
    this.maxCpuUsageRatio = options.maxCpuUsageRatio || DEFAULT_MAX_CPU_USAGE_RATIO;
    this.usedCpuCount = this.computeCPUUsageCount(
      this.maxCpuUsageRatio,
      options.maxWorkerCount
    );
  }
  /**
   * Calculates the number of CPU cores to utilize based on available parallelism and constraints.
   *
   * @param cpuUsageRatio - Ratio of CPU cores to use (0-1)
   * @param maxWorkerCount - Optional maximum number of workers
   * @returns The number of CPU cores to utilize
   */
  computeCPUUsageCount(cpuUsageRatio, maxWorkerCount) {
    const cpuCount = (0, import_node_os.availableParallelism)();
    const maxWorkers = maxWorkerCount || cpuCount;
    return Math.min(
      maxWorkers,
      Math.max(1, Math.floor(cpuCount * cpuUsageRatio))
    );
  }
  /**
   * Initializes the cluster by spawning worker processes and setting up signal handlers.
   * For the primary process, spawns workers and monitors parent process.
   * For worker processes, executes the worker startup function.
   *
   * @throws {Error} If worker is undefined in worker process
   */
  async start() {
    process.on(SIGTERM, this.gracefulClusterShutdown(SIGTERM));
    process.on(SIGINT, this.gracefulClusterShutdown(SIGINT));
    if (import_node_cluster.default.isPrimary) {
      const parentPid = process.ppid;
      setInterval(() => {
        try {
          process.kill(parentPid, 0);
        } catch (e) {
          console.log("Parent process has exited.");
          this.gracefulClusterShutdown(SIGTERM)();
        }
      }, 1e3);
      await this.bootWorkers(this.usedCpuCount);
    } else {
      if (!import_node_cluster.default.worker) {
        throw new Error(
          "Worker is not defined, it should be defined in worker process"
        );
      }
      this.startOutput = await this.workerStart(
        import_node_cluster.default.worker,
        this.usedCpuCount
      );
    }
  }
  /**
   * Spawns worker processes and configures their lifecycle event handlers.
   * Handles worker online, exit and disconnect events.
   * Automatically restarts failed workers during normal operation.
   *
   * @param numWorkers - Number of worker processes to spawn
   */
  bootWorkers = async (numWorkers) => {
    console.info(`Setting ${numWorkers} workers...`);
    for (let i = 0; i < numWorkers; i++) {
      import_node_cluster.default.fork();
    }
    import_node_cluster.default.on("online", (worker) => {
      console.info(`worker process ${worker.process.pid} is online`);
    });
    import_node_cluster.default.on("exit", (worker, code, signal) => {
      console.info(
        `worker ${worker.process.pid} exited with code ${code} and signal ${signal}`
      );
      if (!this.shutdownInProgress) {
        setTimeout(() => import_node_cluster.default.fork(), RESTART_TIME_MS);
      }
      if (this.shutdownInProgress && code != 0) {
        this.hasCleanWorkerExit = false;
      }
    });
    import_node_cluster.default.on("disconnect", (worker) => {
      console.info(`worker process ${worker.process.pid} has disconnected`);
    });
  };
  /**
   * Creates a handler function for graceful shutdown on receipt of a signal.
   * Ensures only one shutdown can occur at a time.
   * Handles shutdown differently for primary and worker processes.
   *
   * @param signal - The signal triggering the shutdown (e.g. SIGTERM)
   * @returns An async function that performs the shutdown
   */
  gracefulClusterShutdown = (signal) => async () => {
    if (this.shutdownInProgress) {
      return;
    }
    this.shutdownInProgress = true;
    this.hasCleanWorkerExit = true;
    console.info(
      `Got ${signal} on ${this.processStr}. Graceful shutdown start at ${(/* @__PURE__ */ new Date()).toISOString()}`
    );
    try {
      if (import_node_cluster.default.isPrimary) {
        await this.shutdownWorkers(signal);
        console.info(`${this.processStr} - worker shutdown successful`);
        (0, import_node_process2.exit)(0);
      } else {
        if (this.startOutput) {
          await this.workerStop(this.startOutput);
        } else {
          console.info(
            `${this.processStr} - shutdown before worker fully started`
          );
        }
        console.info(`${this.processStr} shutdown successful`);
        this.hasCleanWorkerExit ? (0, import_node_process2.exit)(0) : (0, import_node_process2.exit)(1);
      }
    } catch (e) {
      console.error(`${this.processStr} - shutdown failed`, e);
      (0, import_node_process2.exit)(1);
    }
  };
  /**
   * Gracefully terminates all worker processes.
   * Monitors workers until they all exit or timeout occurs.
   * Only relevant for the primary process.
   *
   * @param signal - The signal to send to worker processes
   * @returns A promise that resolves when all workers have terminated
   */
  shutdownWorkers = (signal) => {
    return new Promise((resolve3, reject) => {
      if (!import_node_cluster.default.isPrimary) {
        return resolve3();
      }
      if (!import_node_cluster.default.workers) {
        return resolve3();
      }
      const workerIds = Object.keys(import_node_cluster.default.workers);
      if (workerIds.length == 0) {
        return resolve3();
      }
      let workersAlive = 0;
      let funcRun = 0;
      const cleanWorkers = () => {
        ++funcRun;
        workersAlive = 0;
        Object.values(import_node_cluster.default.workers || {}).filter((worker) => !!worker).forEach((worker) => {
          if (worker && !worker.isDead()) {
            ++workersAlive;
            if (funcRun == 1) {
              worker.kill(signal);
            }
          }
        });
        console.info(workersAlive + " workers alive");
        if (workersAlive == 0) {
          clearInterval(interval);
          return resolve3();
        }
      };
      const interval = setInterval(cleanWorkers, SHUTDOWN_WORKERS_INTERVAL);
    });
  };
};

// src/consumption-apis/runner.ts
init_sqlHelpers();
init_internal();
init_compiler_config();

// src/utils/structured-logging.ts
var util = __toESM(require("util"));
var import_async_hooks = require("async_hooks");
function setupStructuredConsole(getContextField, contextFieldName) {
  const contextStorage = new import_async_hooks.AsyncLocalStorage();
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };
  console.log = createStructuredConsoleWrapper(
    contextStorage,
    getContextField,
    contextFieldName,
    originalConsole.log,
    "info"
  );
  console.info = createStructuredConsoleWrapper(
    contextStorage,
    getContextField,
    contextFieldName,
    originalConsole.info,
    "info"
  );
  console.warn = createStructuredConsoleWrapper(
    contextStorage,
    getContextField,
    contextFieldName,
    originalConsole.warn,
    "warn"
  );
  console.error = createStructuredConsoleWrapper(
    contextStorage,
    getContextField,
    contextFieldName,
    originalConsole.error,
    "error"
  );
  console.debug = createStructuredConsoleWrapper(
    contextStorage,
    getContextField,
    contextFieldName,
    originalConsole.debug,
    "debug"
  );
  return contextStorage;
}
function emitStructuredLog(contextStorage, getContextField, contextFieldName, level, message) {
  const context = contextStorage.getStore();
  if (!context) {
    return false;
  }
  let ctxValue;
  try {
    ctxValue = getContextField(context);
  } catch {
    ctxValue = "unknown";
  }
  try {
    process.stderr.write(
      JSON.stringify({
        __moose_structured_log__: true,
        level,
        message,
        [contextFieldName]: ctxValue,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }) + "\n"
    );
    return true;
  } catch {
    return false;
  }
}
function safeStringify(arg) {
  if (typeof arg === "object" && arg !== null) {
    if (arg instanceof Error) {
      return util.inspect(arg, { depth: 2, breakLength: Infinity });
    }
    try {
      return JSON.stringify(arg);
    } catch (e) {
      return util.inspect(arg, { depth: 2, breakLength: Infinity });
    }
  }
  if (typeof arg === "string") {
    return arg;
  }
  return util.inspect(arg);
}
function createStructuredConsoleWrapper(contextStorage, getContextField, contextFieldName, originalMethod, level) {
  return (...args) => {
    const context = contextStorage.getStore();
    if (!context) {
      originalMethod(...args);
      return;
    }
    let ctxValue;
    try {
      ctxValue = getContextField(context);
    } catch {
      ctxValue = "unknown";
    }
    try {
      const message = args.map((arg) => safeStringify(arg)).join(" ");
      process.stderr.write(
        JSON.stringify({
          __moose_structured_log__: true,
          level,
          message,
          [contextFieldName]: ctxValue,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }) + "\n"
      );
    } catch {
      originalMethod(...args);
    }
  };
}

// src/consumption-apis/runner.ts
var toClientConfig2 = (config) => ({
  ...config,
  useSSL: config.useSSL ? "true" : "false"
});
var createPath = (apisDir, path8) => {
  return `${apisDir}${path8}.js`;
};
var httpLogger = (req, res, startMs, apiName) => {
  const logFn = () => console.log(
    `${req.method} ${req.url} ${res.statusCode} ${Date.now() - startMs}ms`
  );
  if (apiName) {
    apiContextStorage.run({ apiName }, logFn);
  } else {
    logFn();
  }
};
var modulesCache = /* @__PURE__ */ new Map();
var apiContextStorage = setupStructuredConsole(
  (ctx) => ctx.apiName,
  "api_name"
);
var apiHandler = async (publicKey, clickhouseClient, temporalClient, enforceAuth, jwtConfig) => {
  const sourceDir = getSourceDir();
  const outDir = getOutDir();
  const outRoot = path6.isAbsolute(outDir) ? outDir : path6.join(process.cwd(), outDir);
  const actualApisDir = path6.join(outRoot, sourceDir, "apis");
  const apis = await getApis2();
  return async (req, res) => {
    const start = Date.now();
    let matchedApiName;
    try {
      const url = new URL(req.url || "", "http://localhost");
      const fileName = url.pathname;
      let jwtPayload;
      if (publicKey && jwtConfig) {
        const jwt = req.headers.authorization?.split(" ")[1];
        if (jwt) {
          try {
            const { payload } = await jose.jwtVerify(jwt, publicKey, {
              issuer: jwtConfig.issuer,
              audience: jwtConfig.audience
            });
            jwtPayload = payload;
          } catch (error) {
            console.log("JWT verification failed");
            if (enforceAuth) {
              res.writeHead(401, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Unauthorized" }));
              httpLogger(req, res, start);
              return;
            }
          }
        } else if (enforceAuth) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unauthorized" }));
          httpLogger(req, res, start);
          return;
        }
      } else if (enforceAuth) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        httpLogger(req, res, start);
        return;
      }
      const pathName = createPath(actualApisDir, fileName);
      const paramsObject = Array.from(url.searchParams.entries()).reduce(
        (obj, [key, value]) => {
          const existingValue = obj[key];
          if (existingValue) {
            if (Array.isArray(existingValue)) {
              existingValue.push(value);
            } else {
              obj[key] = [existingValue, value];
            }
          } else {
            obj[key] = value;
          }
          return obj;
        },
        {}
      );
      const versionParam = url.searchParams.get("version");
      const cacheKey = versionParam ? `${pathName}:${versionParam}` : pathName;
      let userFuncModule;
      const cachedEntry = modulesCache.get(cacheKey);
      if (cachedEntry !== void 0) {
        userFuncModule = cachedEntry.module;
        matchedApiName = cachedEntry.apiName;
      } else {
        let lookupName = fileName.replace(/^\/+|\/+$/g, "");
        let version = null;
        userFuncModule = apis.get(lookupName);
        if (userFuncModule) {
          matchedApiName = lookupName;
        }
        if (!userFuncModule) {
          version = url.searchParams.get("version");
          if (!version && lookupName.includes("/")) {
            const pathParts = lookupName.split("/");
            if (pathParts.length >= 2) {
              lookupName = pathParts[0];
              version = pathParts.slice(1).join("/");
            }
          }
          if (!userFuncModule && version) {
            const versionedKey = `${lookupName}:${version}`;
            userFuncModule = apis.get(versionedKey);
            if (userFuncModule) {
              matchedApiName = lookupName;
            }
          }
          if (!userFuncModule) {
            userFuncModule = apis.get(lookupName);
            if (userFuncModule) {
              matchedApiName = lookupName;
            }
          }
        }
        if (!userFuncModule || matchedApiName === void 0) {
          const availableApis = Array.from(apis.keys()).map(
            (key) => key.replace(":", "/")
          );
          const errorMessage = version ? `API ${lookupName} with version ${version} not found. Available APIs: ${availableApis.join(", ")}` : `API ${lookupName} not found. Available APIs: ${availableApis.join(", ")}`;
          throw new Error(errorMessage);
        }
        modulesCache.set(cacheKey, {
          module: userFuncModule,
          apiName: matchedApiName
        });
        apiContextStorage.run({ apiName: matchedApiName }, () => {
          console.log(`[API] | Executing API: ${matchedApiName}`);
        });
      }
      const queryClient = new QueryClient(clickhouseClient, fileName);
      const apiName = matchedApiName;
      const result = await apiContextStorage.run({ apiName }, async () => {
        return await userFuncModule(paramsObject, {
          client: new MooseClient(queryClient, temporalClient),
          sql,
          jwt: jwtPayload
        });
      });
      let body;
      let status;
      if (Object.getPrototypeOf(result).constructor.name === "ResultSet") {
        body = JSON.stringify(await result.json());
      } else {
        if ("body" in result && "status" in result) {
          body = JSON.stringify(result.body);
          status = result.status;
        } else {
          body = JSON.stringify(result);
        }
      }
      if (status) {
        res.writeHead(status, { "Content-Type": "application/json" });
        httpLogger(req, res, start, apiName);
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        httpLogger(req, res, start, apiName);
      }
      res.end(body);
    } catch (error) {
      const logError2 = () => console.log("error in path ", req.url, error);
      if (matchedApiName) {
        apiContextStorage.run({ apiName: matchedApiName }, logError2);
      } else {
        logError2();
      }
      if (Object.getPrototypeOf(error).constructor.name === "TypeGuardError") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
        httpLogger(req, res, start, matchedApiName);
      } else if (error?.name === "BadRequestError") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify(error.toJSON?.() ?? { error: error.message }));
        httpLogger(req, res, start, matchedApiName);
      } else if (error instanceof Error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
        httpLogger(req, res, start, matchedApiName);
      } else {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end();
        httpLogger(req, res, start, matchedApiName);
      }
    }
  };
};
var createMainRouter = async (publicKey, clickhouseClient, temporalClient, enforceAuth, jwtConfig) => {
  const apiRequestHandler = await apiHandler(
    publicKey,
    clickhouseClient,
    temporalClient,
    enforceAuth,
    jwtConfig
  );
  const webApps = await getWebApps2();
  const sortedWebApps = Array.from(webApps.values()).sort((a, b) => {
    const pathA = a.config.mountPath || "/";
    const pathB = b.config.mountPath || "/";
    return pathB.length - pathA.length;
  });
  return async (req, res) => {
    const start = Date.now();
    const url = new URL(req.url || "", "http://localhost");
    const pathname = url.pathname;
    if (pathname === "/_moose_internal/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "healthy",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        })
      );
      return;
    }
    let jwtPayload;
    if (publicKey && jwtConfig) {
      const jwt = req.headers.authorization?.split(" ")[1];
      if (jwt) {
        try {
          const { payload } = await jose.jwtVerify(jwt, publicKey, {
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience
          });
          jwtPayload = payload;
        } catch (error) {
          console.log("JWT verification failed for WebApp route");
        }
      }
    }
    for (const webApp of sortedWebApps) {
      const mountPath = webApp.config.mountPath || "/";
      const normalizedMount = mountPath.endsWith("/") && mountPath !== "/" ? mountPath.slice(0, -1) : mountPath;
      const matches = pathname === normalizedMount || pathname.startsWith(normalizedMount + "/");
      if (matches) {
        if (webApp.config.injectMooseUtils !== false) {
          const { getMooseUtils: getMooseUtils2 } = await Promise.resolve().then(() => (init_standalone(), standalone_exports));
          req.moose = await getMooseUtils2();
        }
        let proxiedUrl = req.url;
        if (normalizedMount !== "/") {
          const pathWithoutMount = pathname.substring(normalizedMount.length) || "/";
          proxiedUrl = pathWithoutMount + url.search;
        }
        try {
          const modifiedReq = Object.assign(
            Object.create(Object.getPrototypeOf(req)),
            req,
            {
              url: proxiedUrl
            }
          );
          await webApp.handler(modifiedReq, res);
          return;
        } catch (error) {
          console.error(`Error in WebApp ${webApp.name}:`, error);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal Server Error" }));
          }
          return;
        }
      }
    }
    let apiPath = pathname;
    if (pathname.startsWith("/api/")) {
      apiPath = pathname.substring(4);
    } else if (pathname.startsWith("/consumption/")) {
      apiPath = pathname.substring(13);
    }
    if (apiPath !== pathname) {
      const modifiedReq = Object.assign(
        Object.create(Object.getPrototypeOf(req)),
        req,
        {
          url: apiPath + url.search
        }
      );
      await apiRequestHandler(modifiedReq, res);
      return;
    }
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
    httpLogger(req, res, start);
  };
};
var runApis = async (config) => {
  const apisCluster = new Cluster({
    maxWorkerCount: (config.workerCount ?? 0) > 0 ? config.workerCount : void 0,
    workerStart: async () => {
      let temporalClient;
      if (config.temporalConfig) {
        temporalClient = await getTemporalClient(
          config.temporalConfig.url,
          config.temporalConfig.namespace,
          config.temporalConfig.clientCert,
          config.temporalConfig.clientKey,
          config.temporalConfig.apiKey
        );
      }
      const clickhouseClient = getClickhouseClient(
        toClientConfig2(config.clickhouseConfig)
      );
      let publicKey;
      if (config.jwtConfig?.secret) {
        console.log("Importing JWT public key...");
        publicKey = await jose.importSPKI(config.jwtConfig.secret, "RS256");
      }
      const runtimeQueryClient = new QueryClient(clickhouseClient, "runtime");
      globalThis._mooseRuntimeContext = {
        client: new MooseClient(runtimeQueryClient, temporalClient)
      };
      const server = import_http.default.createServer(
        await createMainRouter(
          publicKey,
          clickhouseClient,
          temporalClient,
          config.enforceAuth,
          config.jwtConfig
        )
      );
      const port = config.proxyPort !== void 0 ? config.proxyPort : 4001;
      server.listen(port, "localhost", () => {
        console.log(`Server running on port ${port}`);
      });
      return server;
    },
    workerStop: async (server) => {
      return new Promise((resolve3) => {
        server.close(() => resolve3());
      });
    }
  });
  apisCluster.start();
};

// src/streaming-functions/runner.ts
var import_node_stream2 = require("stream");
var import_kafka_javascript2 = require("@514labs/kafka-javascript");
var import_node_buffer = require("buffer");
var process4 = __toESM(require("process"));
var http2 = __toESM(require("http"));
init_commons();
init_internal();
init_json();
var { Kafka: Kafka2 } = import_kafka_javascript2.KafkaJS;
var HOSTNAME = process4.env.HOSTNAME;
var AUTO_COMMIT_INTERVAL_MS = 5e3;
var PARTITIONS_CONSUMED_CONCURRENTLY = 3;
var MAX_RETRIES_CONSUMER = 150;
var SESSION_TIMEOUT_CONSUMER = 3e4;
var HEARTBEAT_INTERVAL_CONSUMER = 3e3;
var DEFAULT_MAX_STREAMING_CONCURRENCY = 100;
var CONSUMER_MAX_BATCH_SIZE = 1e3;
var functionContextStorage = setupStructuredConsole(
  (ctx) => ctx.functionName,
  "function_name"
);
var MAX_STREAMING_CONCURRENCY = process4.env.MAX_STREAMING_CONCURRENCY ? parseInt(process4.env.MAX_STREAMING_CONCURRENCY, 10) : DEFAULT_MAX_STREAMING_CONCURRENCY;
var metricsLog = (log) => {
  const req = http2.request({
    port: parseInt(process4.env.MOOSE_MANAGEMENT_PORT ?? "5001", 10),
    method: "POST",
    path: "/metrics-logs"
  });
  req.on("error", (err) => {
    console.log(
      `Error ${err.name} sending metrics to management port.`,
      err.message
    );
  });
  req.write(JSON.stringify({ ...log }));
  req.end();
};
var startProducer = async (logger2, producer) => {
  try {
    logger2.log("Connecting producer...");
    await producer.connect();
    logger2.log("Producer is running...");
  } catch (error) {
    logger2.error("Failed to connect producer:");
    if (error instanceof Error) {
      logError(logger2, error);
    }
    throw error;
  }
};
var stopProducer = async (logger2, producer) => {
  await producer.disconnect();
  logger2.log("Producer is shutting down...");
};
var stopConsumer = async (logger2, consumer, sourceTopic) => {
  try {
    logger2.log("Pausing consumer...");
    const partitionNumbers = Array.from(
      { length: sourceTopic.partitions },
      (_, i) => i
    );
    await consumer.pause([
      {
        topic: sourceTopic.name,
        partitions: partitionNumbers
      }
    ]);
    logger2.log("Disconnecting consumer...");
    await consumer.disconnect();
    logger2.log("Consumer is shutting down...");
  } catch (error) {
    logger2.error(`Error during consumer shutdown: ${error}`);
    try {
      await consumer.disconnect();
      logger2.log("Consumer disconnected after error");
    } catch (disconnectError) {
      logger2.error(`Failed to disconnect consumer: ${disconnectError}`);
    }
  }
};
var handleMessage = async (logger2, streamingFunctionWithConfigList, message, producer, fieldMutations, logPayloads, dlqTopicName) => {
  if (message.value === void 0 || message.value === null) {
    logger2.log(`Received message with no value, skipping...`);
    return void 0;
  }
  try {
    let payloadBuffer = message.value;
    if (payloadBuffer && payloadBuffer.length >= 5 && payloadBuffer[0] === 0) {
      payloadBuffer = payloadBuffer.subarray(5);
    }
    const parsedData = JSON.parse(payloadBuffer.toString());
    mutateParsedJson(parsedData, fieldMutations);
    if (logPayloads) {
      logger2.log(`[PAYLOAD:STREAM_IN] ${JSON.stringify(parsedData)}`);
    }
    const transformedData = await Promise.all(
      streamingFunctionWithConfigList.map(async ([fn, config]) => {
        try {
          return await fn(parsedData);
        } catch (e) {
          if (dlqTopicName) {
            const deadLetterRecord = {
              originalRecord: {
                ...parsedData,
                __sourcePartition: message.partition,
                __sourceOffset: message.offset,
                __sourceTimestamp: message.timestamp
              },
              errorMessage: e instanceof Error ? e.message : String(e),
              errorType: e instanceof Error ? e.constructor.name : "Unknown",
              failedAt: /* @__PURE__ */ new Date(),
              source: "transform"
            };
            cliLog({
              action: "DeadLetter",
              message: `Sending message to DLQ ${dlqTopicName}: ${e instanceof Error ? e.message : String(e)}`,
              message_type: "Error"
            });
            try {
              await producer.send({
                topic: dlqTopicName,
                messages: [{ value: JSON.stringify(deadLetterRecord) }]
              });
            } catch (dlqError) {
              logger2.error(`Failed to send to dead letter queue: ${dlqError}`);
            }
          } else {
            cliLog({
              action: "Function",
              message: `Error processing message (no DLQ configured): ${e instanceof Error ? e.message : String(e)}`,
              message_type: "Error"
            });
          }
          throw e;
        }
      })
    );
    const processedMessages = transformedData.map((userFunctionOutput) => {
      if (userFunctionOutput) {
        if (Array.isArray(userFunctionOutput)) {
          return userFunctionOutput.flat().filter((item) => item !== void 0 && item !== null).map((item) => ({
            value: JSON.stringify(item),
            originalValue: parsedData,
            originalMessage: message,
            dlqTopicName
          }));
        } else {
          return [
            {
              value: JSON.stringify(userFunctionOutput),
              originalValue: parsedData,
              originalMessage: message,
              dlqTopicName
            }
          ];
        }
      }
    }).flat().filter((item) => item !== void 0 && item !== null);
    if (logPayloads) {
      if (processedMessages.length > 0) {
        const outgoingJsonStrings = processedMessages.map((msg) => msg.value);
        logger2.log(`[PAYLOAD:STREAM_OUT] [${outgoingJsonStrings.join(",")}]`);
      } else {
        logger2.log(`[PAYLOAD:STREAM_OUT] (no output from streaming function)`);
      }
    }
    return processedMessages;
  } catch (e) {
    logger2.error(`Failed to transform data`);
    if (e instanceof Error) {
      logError(logger2, e);
    }
  }
  return void 0;
};
var handleDLQForFailedMessages = async (logger2, producer, messages, error) => {
  let messagesHandledByDLQ = 0;
  let messagesWithoutDLQ = 0;
  let dlqErrors = 0;
  for (const msg of messages) {
    if (msg.dlqTopicName && msg.originalValue) {
      const deadLetterRecord = {
        originalRecord: {
          ...msg.originalValue,
          __sourcePartition: msg.originalMessage.partition,
          __sourceOffset: msg.originalMessage.offset,
          __sourceTimestamp: msg.originalMessage.timestamp
        },
        errorMessage: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : "Unknown",
        failedAt: /* @__PURE__ */ new Date(),
        source: "transform"
      };
      cliLog({
        action: "DeadLetter",
        message: `Sending failed message to DLQ ${msg.dlqTopicName}: ${error instanceof Error ? error.message : String(error)}`,
        message_type: "Error"
      });
      try {
        await producer.send({
          topic: msg.dlqTopicName,
          messages: [{ value: JSON.stringify(deadLetterRecord) }]
        });
        logger2.log(`Sent failed message to DLQ ${msg.dlqTopicName}`);
        messagesHandledByDLQ++;
      } catch (dlqError) {
        logger2.error(`Failed to send to DLQ: ${dlqError}`);
        dlqErrors++;
      }
    } else if (!msg.dlqTopicName) {
      messagesWithoutDLQ++;
      logger2.warn(`Cannot send to DLQ: no DLQ configured for message`);
    } else {
      messagesWithoutDLQ++;
      logger2.warn(`Cannot send to DLQ: original message value not available`);
    }
  }
  const allMessagesHandled = messagesHandledByDLQ === messages.length && messagesWithoutDLQ === 0 && dlqErrors === 0;
  if (allMessagesHandled) {
    logger2.log(
      `All ${messagesHandledByDLQ} failed message(s) sent to DLQ, suppressing original error`
    );
  } else if (messagesHandledByDLQ > 0) {
    logger2.warn(
      `Partial DLQ success: ${messagesHandledByDLQ}/${messages.length} message(s) sent to DLQ`
    );
    if (messagesWithoutDLQ > 0) {
      logger2.error(
        `Cannot handle batch failure: ${messagesWithoutDLQ} message(s) have no DLQ configured or missing original value`
      );
    }
    if (dlqErrors > 0) {
      logger2.error(`${dlqErrors} message(s) failed to send to DLQ`);
    }
  }
  return allMessagesHandled;
};
var sendMessages = async (logger2, metrics, targetTopic, producer, messages) => {
  if (messages.length === 0) return;
  try {
    await producer.send({
      topic: targetTopic.name,
      messages
    });
    for (const msg of messages) {
      metrics.bytes += import_node_buffer.Buffer.byteLength(msg.value, "utf8");
    }
    metrics.count_out += messages.length;
    logger2.log(`Sent ${messages.length} messages to ${targetTopic.name}`);
  } catch (e) {
    logger2.error(`Failed to send transformed data`);
    if (e instanceof Error) {
      logError(logger2, e);
    }
    const allHandledByDLQ = await handleDLQForFailedMessages(
      logger2,
      producer,
      messages,
      e
    );
    if (!allHandledByDLQ) {
      throw e;
    }
  }
};
var sendMessageMetrics = (logger2, metrics) => {
  if (metrics.count_in > 0 || metrics.count_out > 0 || metrics.bytes > 0) {
    metricsLog({
      count_in: metrics.count_in,
      count_out: metrics.count_out,
      function_name: logger2.logPrefix,
      bytes: metrics.bytes,
      timestamp: /* @__PURE__ */ new Date()
    });
  }
  metrics.count_in = 0;
  metrics.bytes = 0;
  metrics.count_out = 0;
  setTimeout(() => sendMessageMetrics(logger2, metrics), 1e3);
};
async function loadStreamingFunction(sourceTopic, targetTopic) {
  const transformFunctions = await getStreamingFunctions();
  const transformFunctionKey = `${topicNameToStreamName(sourceTopic)}_${targetTopic ? topicNameToStreamName(targetTopic) : "<no-target>"}`;
  const matchingEntries = Array.from(transformFunctions.entries()).filter(
    ([key]) => key.startsWith(transformFunctionKey)
  );
  if (matchingEntries.length === 0) {
    const message = `No functions found for ${transformFunctionKey}`;
    cliLog({
      action: "Function",
      message: `${message}`,
      message_type: "Error"
    });
    throw new Error(message);
  }
  const functions = matchingEntries.map(([_, [fn, config]]) => [
    fn,
    config
  ]);
  const [_key, firstEntry] = matchingEntries[0];
  const sourceColumns = firstEntry[2];
  const fieldMutations = buildFieldMutationsFromColumns(sourceColumns);
  return { functions, fieldMutations };
}
var startConsumer = async (args, logger2, metrics, _parallelism, consumer, producer, streamingFuncId) => {
  validateTopicConfig(args.sourceTopic);
  if (args.targetTopic) {
    validateTopicConfig(args.targetTopic);
  }
  try {
    logger2.log("Connecting consumer...");
    await consumer.connect();
    logger2.log("Consumer connected successfully");
  } catch (error) {
    logger2.error("Failed to connect consumer:");
    if (error instanceof Error) {
      logError(logger2, error);
    }
    throw error;
  }
  logger2.log(
    `Starting consumer group '${streamingFuncId}' with source topic: ${args.sourceTopic.name} and target topic: ${args.targetTopic?.name || "none"}`
  );
  const result = await loadStreamingFunction(
    args.sourceTopic,
    args.targetTopic
  );
  const streamingFunctions = result.functions;
  const fieldMutations = result.fieldMutations;
  await consumer.subscribe({
    topics: [args.sourceTopic.name]
    // Use full topic name for Kafka operations
  });
  await consumer.run({
    eachBatchAutoResolve: true,
    // Enable parallel processing of partitions
    partitionsConsumedConcurrently: PARTITIONS_CONSUMED_CONCURRENTLY,
    // To be adjusted
    eachBatch: async ({ batch, heartbeat, isRunning, isStale }) => {
      if (!isRunning() || isStale()) {
        return;
      }
      const functionName = logger2.logPrefix;
      await functionContextStorage.run({ functionName }, async () => {
        metrics.count_in += batch.messages.length;
        cliLog({
          action: "Received",
          message: `${logger2.logPrefix.replace("__", " -> ")} ${batch.messages.length} message(s)`
        });
        logger2.log(`Received ${batch.messages.length} message(s)`);
        let index = 0;
        const readableStream = import_node_stream2.Readable.from(batch.messages);
        const processedMessages = await readableStream.map(
          async (message) => {
            index++;
            if (batch.messages.length > DEFAULT_MAX_STREAMING_CONCURRENCY && index % DEFAULT_MAX_STREAMING_CONCURRENCY || index - 1 === batch.messages.length) {
              await heartbeat();
            }
            return handleMessage(
              logger2,
              streamingFunctions,
              message,
              producer,
              fieldMutations,
              args.logPayloads,
              args.dlqTopic?.name
            );
          },
          {
            concurrency: MAX_STREAMING_CONCURRENCY
          }
        ).toArray();
        const filteredMessages = processedMessages.flat().filter((msg) => msg !== void 0 && msg.value !== void 0);
        if (args.targetTopic === void 0 || processedMessages.length === 0) {
          return;
        }
        await heartbeat();
        if (filteredMessages.length > 0) {
          await sendMessages(
            logger2,
            metrics,
            args.targetTopic,
            producer,
            filteredMessages
          );
        }
      });
    }
  });
  logger2.log("Consumer is running...");
};
var buildLogger = (args, workerId) => {
  const sourceBaseName = topicNameToStreamName(args.sourceTopic);
  const targetBaseName = args.targetTopic ? topicNameToStreamName(args.targetTopic) : void 0;
  const functionName = targetBaseName ? `${sourceBaseName}__${targetBaseName}` : sourceBaseName;
  const logPrefix = `${functionName} (worker ${workerId})`;
  return {
    // logPrefix is used for structured logging (function_name field)
    // Must match source_primitive.name format for log correlation
    logPrefix: functionName,
    log: (message) => {
      console.log(`${logPrefix}: ${message}`);
    },
    error: (message) => {
      console.error(`${logPrefix}: ${message}`);
    },
    warn: (message) => {
      console.warn(`${logPrefix}: ${message}`);
    }
  };
};
function formatVersionSuffix(version) {
  return `_${version.replace(/\./g, "_")}`;
}
function topicNameToStreamName(config) {
  let name = config.name;
  if (config.version) {
    const versionSuffix = formatVersionSuffix(config.version);
    if (name.endsWith(versionSuffix)) {
      name = name.slice(0, -versionSuffix.length);
    } else {
      throw new Error(
        `Version suffix ${versionSuffix} not found in topic name ${name}`
      );
    }
  }
  if (config.namespace && config.namespace !== "") {
    const prefix = `${config.namespace}.`;
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length);
    } else {
      throw new Error(
        `Namespace prefix ${prefix} not found in topic name ${name}`
      );
    }
  }
  return name;
}
function validateTopicConfig(config) {
  if (config.namespace && !config.name.startsWith(`${config.namespace}.`)) {
    throw new Error(
      `Topic name ${config.name} must start with namespace ${config.namespace}`
    );
  }
  if (config.version) {
    const versionSuffix = formatVersionSuffix(config.version);
    if (!config.name.endsWith(versionSuffix)) {
      throw new Error(
        `Topic name ${config.name} must end with version ${config.version}`
      );
    }
  }
}
var runStreamingFunctions = async (args) => {
  validateTopicConfig(args.sourceTopic);
  if (args.targetTopic) {
    validateTopicConfig(args.targetTopic);
  }
  const streamingFuncId = `flow-${args.sourceTopic.name}-${args.targetTopic?.name || ""}`;
  const cluster2 = new Cluster({
    maxCpuUsageRatio: 0.5,
    maxWorkerCount: args.maxSubscriberCount,
    workerStart: async (worker, parallelism) => {
      const logger2 = buildLogger(args, worker.id);
      const functionName = logger2.logPrefix;
      return await functionContextStorage.run({ functionName }, async () => {
        const metrics = {
          count_in: 0,
          count_out: 0,
          bytes: 0
        };
        setTimeout(() => sendMessageMetrics(logger2, metrics), 1e3);
        const clientIdPrefix = HOSTNAME ? `${HOSTNAME}-` : "";
        const processId = `${clientIdPrefix}${streamingFuncId}-ts-${worker.id}`;
        const kafka = await getKafkaClient(
          {
            clientId: processId,
            broker: args.broker,
            securityProtocol: args.securityProtocol,
            saslUsername: args.saslUsername,
            saslPassword: args.saslPassword,
            saslMechanism: args.saslMechanism
          },
          logger2
        );
        const consumer = kafka.consumer({
          kafkaJS: {
            groupId: streamingFuncId,
            sessionTimeout: SESSION_TIMEOUT_CONSUMER,
            heartbeatInterval: HEARTBEAT_INTERVAL_CONSUMER,
            retry: {
              retries: MAX_RETRIES_CONSUMER
            },
            autoCommit: true,
            autoCommitInterval: AUTO_COMMIT_INTERVAL_MS,
            fromBeginning: true
          },
          "js.consumer.max.batch.size": CONSUMER_MAX_BATCH_SIZE
        });
        const maxMessageBytes = args.targetTopic?.max_message_bytes || 1024 * 1024;
        const producer = kafka.producer(
          createProducerConfig(maxMessageBytes)
        );
        try {
          logger2.log("Starting producer...");
          await startProducer(logger2, producer);
          try {
            logger2.log("Starting consumer...");
            await startConsumer(
              args,
              logger2,
              metrics,
              parallelism,
              consumer,
              producer,
              streamingFuncId
            );
          } catch (e) {
            logger2.error("Failed to start kafka consumer: ");
            if (e instanceof Error) {
              logError(logger2, e);
            }
            throw e;
          }
        } catch (e) {
          logger2.error("Failed to start kafka producer: ");
          if (e instanceof Error) {
            logError(logger2, e);
          }
          throw e;
        }
        return [logger2, producer, consumer];
      });
    },
    workerStop: async ([logger2, producer, consumer]) => {
      const functionName = logger2.logPrefix;
      await functionContextStorage.run({ functionName }, async () => {
        logger2.log(`Received SIGTERM, shutting down gracefully...`);
        logger2.log("Stopping consumer first...");
        await stopConsumer(logger2, consumer, args.sourceTopic);
        logger2.log("Waiting for in-flight messages to complete...");
        await new Promise((resolve3) => setTimeout(resolve3, 2e3));
        logger2.log("Stopping producer...");
        await stopProducer(logger2, producer);
        logger2.log("Graceful shutdown completed");
      });
    }
  });
  cluster2.start();
};

// src/moduleExportSerializer.ts
init_compiler_config();
async function runExportSerializer(targetModel) {
  const sourceDir = getSourceDir();
  const outDir = getOutDir();
  let modulePath = targetModel;
  const sourcePattern = `/${sourceDir}/`;
  if (modulePath.includes(sourcePattern)) {
    modulePath = modulePath.replace(sourcePattern, `/${outDir}/${sourceDir}/`);
  }
  modulePath = modulePath.replace(/\.ts$/, ".js");
  const exports_list = await loadModule(modulePath);
  console.log(JSON.stringify(exports_list));
}

// src/scripts/runner.ts
var import_worker2 = require("@temporalio/worker");
var path7 = __toESM(require("path"));
var fs4 = __toESM(require("fs"));
init_internal();

// src/scripts/activity.ts
var import_activity = require("@temporalio/activity");
var import_workflow3 = require("@temporalio/workflow");
init_internal();
init_json();

// src/scripts/task-context.ts
var taskContextStorage = setupStructuredConsole(
  (ctx) => ctx.taskName,
  "task_name"
);
var TASK_CONTEXT_FIELD_NAME = "task_name";
var getTaskContextField = (ctx) => ctx.taskName;

// src/scripts/activity.ts
var activities = {
  async hasWorkflow(name) {
    try {
      const workflows = await getWorkflows2();
      const hasWorkflow = workflows.has(name);
      import_activity.log.info(`Found workflow:: ${hasWorkflow}`);
      return hasWorkflow;
    } catch (error) {
      import_activity.log.error(`Failed to check if workflow ${name} exists: ${error}`);
      return false;
    }
  },
  async getWorkflowByName(name) {
    try {
      import_activity.log.info(`Getting workflow ${name}`);
      const workflows = await getWorkflows2();
      if (workflows.has(name)) {
        import_activity.log.info(`Workflow ${name} found`);
        return workflows.get(name);
      } else {
        const errorData = {
          error: "Workflow not found",
          details: `Workflow ${name} not found`,
          stack: void 0
        };
        const errorMsg = JSON.stringify(errorData);
        import_activity.log.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorData = {
        error: "Failed to get workflow",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : void 0
      };
      const errorMsg = JSON.stringify(errorData);
      import_activity.log.error(errorMsg);
      throw new Error(errorMsg);
    }
  },
  async getTaskForWorkflow(workflowName, taskName) {
    try {
      import_activity.log.info(`Getting task ${taskName} from workflow ${workflowName}`);
      const task = await getTaskForWorkflow(workflowName, taskName);
      import_activity.log.info(`Task ${taskName} found in workflow ${workflowName}`);
      return task;
    } catch (error) {
      const errorData = {
        error: "Failed to get task",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : void 0
      };
      const errorMsg = JSON.stringify(errorData);
      import_activity.log.error(errorMsg);
      throw new Error(errorMsg);
    }
  },
  async executeTask(workflow, task, inputData) {
    const context = import_activity.Context.current();
    const taskState = {};
    const taskIdentifier = workflow.name;
    return await taskContextStorage.run(
      { taskName: taskIdentifier },
      async () => {
        let heartbeatInterval = null;
        const startPeriodicHeartbeat = () => {
          heartbeatInterval = setInterval(() => {
            context.heartbeat(`Task ${task.name} in progress`);
          }, 5e3);
        };
        const stopPeriodicHeartbeat = () => {
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
        };
        try {
          import_activity.log.info(
            `Task ${task.name} received input: ${JSON.stringify(inputData)}`
          );
          context.heartbeat(`Starting task: ${task.name}`);
          const fullTask = await getTaskForWorkflow(workflow.name, task.name);
          const revivedInputData = inputData ? JSON.parse(JSON.stringify(inputData), jsonDateReviver) : inputData;
          try {
            startPeriodicHeartbeat();
            const result = await Promise.race([
              fullTask.config.run({
                state: taskState,
                input: revivedInputData
              }),
              context.cancelled
            ]);
            return result;
          } catch (error) {
            if ((0, import_workflow3.isCancellation)(error)) {
              import_activity.log.info(
                `Task ${task.name} cancelled, calling onCancel handler if it exists`
              );
              if (fullTask.config.onCancel) {
                await fullTask.config.onCancel({
                  state: taskState,
                  input: revivedInputData
                });
              }
              return [];
            } else {
              throw error;
            }
          } finally {
            stopPeriodicHeartbeat();
          }
        } catch (error) {
          const errorData = {
            error: "Task execution failed",
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : void 0
          };
          const errorMsg = JSON.stringify(errorData);
          import_activity.log.error(errorMsg);
          throw new Error(errorMsg);
        }
      }
    );
  }
};
function createActivityForScript(scriptName) {
  return {
    [scriptName]: activities.executeTask
  };
}

// src/scripts/logger.ts
var import_worker = require("@temporalio/worker");
var LoggerSingleton = class _LoggerSingleton {
  static instance = null;
  constructor() {
  }
  static initializeLogger() {
    if (!_LoggerSingleton.instance) {
      _LoggerSingleton.instance = new import_worker.DefaultLogger(
        "DEBUG",
        ({ level, message }) => {
          const structuredLevel = level.toLowerCase();
          const emitted = emitStructuredLog(
            taskContextStorage,
            getTaskContextField,
            TASK_CONTEXT_FIELD_NAME,
            structuredLevel,
            message
          );
          if (!emitted) {
            console.log(`${level} | ${message}`);
          }
        }
      );
      import_worker.Runtime.install({
        logger: _LoggerSingleton.instance,
        telemetryOptions: {
          logging: {
            filter: (0, import_worker.makeTelemetryFilterString)({ core: "INFO", other: "INFO" }),
            forward: {}
          }
        }
      });
    }
    return _LoggerSingleton.instance;
  }
  static getInstance() {
    return _LoggerSingleton.instance;
  }
};
var initializeLogger = LoggerSingleton.initializeLogger;

// src/scripts/runner.ts
var ALREADY_REGISTERED = /* @__PURE__ */ new Set();
function collectActivities(logger2, workflows) {
  logger2.info(`Collecting tasks from workflows`);
  const scriptNames = [];
  for (const [name, workflow] of workflows.entries()) {
    logger2.info(
      `Registering workflow: ${name} with starting task: ${workflow.config.startingTask.name}`
    );
    scriptNames.push(`${name}/${workflow.config.startingTask.name}`);
  }
  return scriptNames;
}
async function createTemporalConnection(logger2, temporalConfig) {
  logger2.info(
    `Using temporal_url: ${temporalConfig.url} and namespace: ${temporalConfig.namespace}`
  );
  let connectionOptions = {
    address: temporalConfig.url
  };
  if (temporalConfig.clientCert && temporalConfig.clientKey) {
    logger2.info("Using TLS for secure Temporal");
    const cert = await fs4.readFileSync(temporalConfig.clientCert);
    const key = await fs4.readFileSync(temporalConfig.clientKey);
    connectionOptions.tls = {
      clientCertPair: {
        crt: cert,
        key
      }
    };
  } else if (temporalConfig.apiKey) {
    logger2.info(`Using API key for secure Temporal`);
    connectionOptions.address = "us-west1.gcp.api.temporal.io:7233";
    connectionOptions.apiKey = temporalConfig.apiKey;
    connectionOptions.tls = {};
    connectionOptions.metadata = {
      "temporal-namespace": temporalConfig.namespace
    };
  }
  logger2.info(`Connecting to Temporal at ${connectionOptions.address}`);
  const maxRetries = 5;
  const baseDelay = 1e3;
  let attempt = 0;
  while (true) {
    try {
      const connection = await import_worker2.NativeConnection.connect(connectionOptions);
      logger2.info("Connected to Temporal server");
      return connection;
    } catch (err) {
      attempt++;
      logger2.error(`Connection attempt ${attempt} failed: ${err}`);
      if (attempt >= maxRetries) {
        logger2.error(`Failed to connect after ${attempt} attempts`);
        throw err;
      }
      const backoff = baseDelay * Math.pow(2, attempt - 1);
      logger2.warn(`Retrying connection in ${backoff}ms...`);
      await new Promise((resolve3) => setTimeout(resolve3, backoff));
    }
  }
}
async function registerWorkflows(logger2, config) {
  logger2.info(`Registering workflows`);
  if (!config.temporalConfig) {
    logger2.info(`Temporal config not provided, skipping workflow registration`);
    return null;
  }
  const allScriptPaths = [];
  const dynamicActivities = [];
  try {
    const workflows = await getWorkflows2();
    if (workflows.size > 0) {
      logger2.info(`Found ${workflows.size} workflows`);
      allScriptPaths.push(...collectActivities(logger2, workflows));
      if (allScriptPaths.length === 0) {
        logger2.info(`No tasks found in workflows`);
        return null;
      }
      logger2.info(`Found ${allScriptPaths.length} tasks in workflows`);
      for (const activityName of allScriptPaths) {
        if (!ALREADY_REGISTERED.has(activityName)) {
          const activity = await createActivityForScript(activityName);
          dynamicActivities.push(activity);
          ALREADY_REGISTERED.add(activityName);
          logger2.info(`Registered task ${activityName}`);
        }
      }
      if (dynamicActivities.length === 0) {
        logger2.info(`No dynamic activities found in workflows`);
        return null;
      }
      logger2.info(
        `Found ${dynamicActivities.length} dynamic activities in workflows`
      );
    }
    if (allScriptPaths.length === 0) {
      logger2.info(`No workflows found`);
      return null;
    }
    logger2.info(`Found ${allScriptPaths.length} workflows`);
    if (dynamicActivities.length === 0) {
      logger2.info(`No tasks found`);
      return null;
    }
    logger2.info(`Found ${dynamicActivities.length} task(s)`);
    const connection = await createTemporalConnection(
      logger2,
      config.temporalConfig
    );
    const silentLogger = {
      info: () => {
      },
      // Suppress info logs (webpack output)
      debug: () => {
      },
      // Suppress debug logs
      warn: () => {
      },
      // Suppress warnings if desired
      log: () => {
      },
      // Suppress general logs
      trace: () => {
      },
      // Suppress trace logs
      error: (message, meta) => {
        logger2.error(message, meta);
      }
    };
    const workflowBundle = await (0, import_worker2.bundleWorkflowCode)({
      workflowsPath: path7.resolve(__dirname, "scripts/workflow.js"),
      logger: silentLogger
    });
    const worker = await import_worker2.Worker.create({
      connection,
      namespace: config.temporalConfig.namespace,
      taskQueue: "typescript-script-queue",
      workflowBundle,
      activities: {
        ...activities,
        ...Object.fromEntries(
          dynamicActivities.map((activity) => [
            Object.keys(activity)[0],
            Object.values(activity)[0]
          ])
        )
      }
    });
    return worker;
  } catch (error) {
    logger2.error(`Error registering workflows: ${error}`);
    throw error;
  }
}
async function runScripts(config) {
  const logger2 = initializeLogger();
  process.on("uncaughtException", (error) => {
    console.error(`[PROCESS] Uncaught Exception: ${error}`);
    process.exit(1);
  });
  const worker = await registerWorkflows(logger2, config);
  if (!worker) {
    logger2.warn(
      `No workflows found. To disable workflow infrastructure, set workflows=false in moose.config.toml`
    );
    process.exit(0);
  }
  let isShuttingDown = false;
  async function handleSignal(signal) {
    console.log(`[SHUTDOWN] Received ${signal}`);
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;
    try {
      if (!worker) {
        process.exit(0);
      }
      await Promise.race([
        worker.shutdown(),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Shutdown timeout")), 3e3)
        )
      ]);
      process.exit(0);
    } catch (error) {
      console.log(`[SHUTDOWN] Error: ${error}`);
      process.exit(1);
    }
  }
  ["SIGTERM", "SIGINT", "SIGHUP", "SIGQUIT"].forEach((signal) => {
    process.on(signal, () => {
      handleSignal(signal).catch((error) => {
        console.log(`[SHUTDOWN] Error: ${error}`);
        process.exit(1);
      });
    });
  });
  logger2.info("Starting TypeScript worker...");
  try {
    await worker.run();
  } catch (error) {
    console.log(`[SHUTDOWN] Error: ${error}`);
    process.exit(1);
  }
  return worker;
}

// src/moose-runner.ts
var import_commander = require("commander");
var packageJson = JSON.parse(
  (0, import_fs2.readFileSync)((0, import_path2.join)(__dirname, "..", "package.json"), "utf-8")
);
var program = new import_commander.Command();
program.name("moose-runner").description("Moose runner for various operations").version(packageJson.version);
program.command("print-version").description("Print the installed moose-lib version").action(() => {
  process.stdout.write(packageJson.version);
});
program.command("dmv2-serializer").description("Load DMv2 index").action(async () => {
  await dumpMooseInternal();
});
program.command("export-serializer").description("Run export serializer").argument("<target-model>", "Target model to serialize").action(async (targetModel) => {
  await runExportSerializer(targetModel);
});
program.command("consumption-apis").description("Run consumption APIs").argument("<clickhouse-db>", "Clickhouse database name").argument("<clickhouse-host>", "Clickhouse host").argument("<clickhouse-port>", "Clickhouse port").argument("<clickhouse-username>", "Clickhouse username").argument("<clickhouse-password>", "Clickhouse password").option("--clickhouse-use-ssl", "Use SSL for Clickhouse connection", false).option("--jwt-secret <secret>", "JWT public key for verification").option("--jwt-issuer <issuer>", "Expected JWT issuer").option("--jwt-audience <audience>", "Expected JWT audience").option(
  "--enforce-auth",
  "Enforce authentication on all consumption APIs",
  false
).option("--temporal-url <url>", "Temporal server URL").option("--temporal-namespace <namespace>", "Temporal namespace").option("--client-cert <path>", "Path to client certificate").option("--client-key <path>", "Path to client key").option("--api-key <key>", "API key for authentication").option("--proxy-port <port>", "Port to run the proxy server on", parseInt).option(
  "--worker-count <count>",
  "Number of worker processes for the consumption API cluster",
  parseInt
).action(
  (clickhouseDb, clickhouseHost, clickhousePort, clickhouseUsername, clickhousePassword, options) => {
    runApis({
      clickhouseConfig: {
        database: clickhouseDb,
        host: clickhouseHost,
        port: clickhousePort,
        username: clickhouseUsername,
        password: clickhousePassword,
        useSSL: options.clickhouseUseSsl
      },
      jwtConfig: {
        secret: options.jwtSecret,
        issuer: options.jwtIssuer,
        audience: options.jwtAudience
      },
      temporalConfig: options.temporalUrl ? {
        url: options.temporalUrl,
        namespace: options.temporalNamespace,
        clientCert: options.clientCert,
        clientKey: options.clientKey,
        apiKey: options.apiKey
      } : void 0,
      enforceAuth: options.enforceAuth,
      proxyPort: options.proxyPort,
      workerCount: options.workerCount
    });
  }
);
program.command("streaming-functions").description("Run streaming functions").argument("<source-topic>", "Source topic configuration as JSON").argument("<function-file-path>", "Path to the function file").argument(
  "<broker>",
  "Kafka broker address(es) - comma-separated for multiple brokers (e.g., 'broker1:9092, broker2:9092'). Whitespace around commas is automatically trimmed."
).argument("<max-subscriber-count>", "Maximum number of subscribers").option("--target-topic <target-topic>", "Target topic configuration as JSON").option(
  "--dlq-topic <dlq-topic>",
  "Dead letter queue topic configuration as JSON"
).option("--sasl-username <username>", "SASL username").option("--sasl-password <password>", "SASL password").option("--sasl-mechanism <mechanism>", "SASL mechanism").option("--security-protocol <protocol>", "Security protocol").option("--log-payloads", "Log payloads for debugging", false).action(
  (sourceTopic, functionFilePath, broker, maxSubscriberCount, options) => {
    const config = {
      sourceTopic: JSON.parse(sourceTopic),
      targetTopic: options.targetTopic ? JSON.parse(options.targetTopic) : void 0,
      dlqTopic: options.dlqTopic ? JSON.parse(options.dlqTopic) : void 0,
      functionFilePath,
      broker,
      maxSubscriberCount: parseInt(maxSubscriberCount),
      logPayloads: options.logPayloads,
      saslUsername: options.saslUsername,
      saslPassword: options.saslPassword,
      saslMechanism: options.saslMechanism,
      securityProtocol: options.securityProtocol
    };
    runStreamingFunctions(config);
  }
);
program.command("scripts").description("Run scripts").option("--temporal-url <url>", "Temporal server URL").option("--temporal-namespace <namespace>", "Temporal namespace").option("--client-cert <path>", "Path to client certificate").option("--client-key <path>", "Path to client key").option("--api-key <key>", "API key for authentication").action((options) => {
  runScripts({
    temporalConfig: options.temporalUrl ? {
      url: options.temporalUrl,
      namespace: options.temporalNamespace,
      clientCert: options.clientCert,
      clientKey: options.clientKey,
      apiKey: options.apiKey
    } : void 0
  });
});
program.parse();
//# sourceMappingURL=moose-runner.js.map