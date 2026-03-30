export { JWT, Key } from './browserCompatible.mjs';
import * as _clickhouse_client from '@clickhouse/client';
import { KafkaJS } from '@514labs/kafka-javascript';
import { aH as MooseUtils, aI as MooseClient, aA as Sql, O as OlapTable, M as MaterializedView, aJ as Column, aK as QueryClient, aL as DataType } from './index-CVs8g-aW.mjs';
export { A as Aggregated, h as Api, i as ApiConfig, aU as ApiHelpers, ar as ApiUtil, a7 as ClickHouseAlias, Z as ClickHouseByteSize, a9 as ClickHouseCodec, Y as ClickHouseDecimal, a4 as ClickHouseDefault, C as ClickHouseEngines, _ as ClickHouseFixedStringSize, $ as ClickHouseFloat, a0 as ClickHouseInt, a1 as ClickHouseJson, aO as ClickHouseLineString, a6 as ClickHouseMaterialized, aP as ClickHouseMultiLineString, aR as ClickHouseMultiPolygon, a3 as ClickHouseNamedTuple, aM as ClickHousePoint, aQ as ClickHousePolygon, X as ClickHousePrecision, aN as ClickHouseRing, a5 as ClickHouseTTL, j as ConsumptionApi, aV as ConsumptionHelpers, as as ConsumptionUtil, aa as DateTime, ab as DateTime64, ad as DateTime64String, ac as DateTimeString, e as DeadLetter, D as DeadLetterModel, f as DeadLetterQueue, ap as Decimal, n as ETLPipeline, o as ETLPipelineConfig, E as EgressConfig, ae as FixedString, af as Float32, ag as Float64, F as FrameworkApp, au as IdentifierBrandedString, I as IngestApi, g as IngestConfig, k as IngestPipeline, aq as Insertable, ai as Int16, aj as Int32, ak as Int64, ah as Int8, L as LifeCycle, a2 as LowCardinality, av as NonIdentifierBrandedString, a as OlapConfig, ax as RawValue, b as S3QueueTableSettings, S as SimpleAggregated, l as SqlResource, ay as SqlTemplateTag, c as Stream, d as StreamConfig, T as TableConstraint, m as Task, am as UInt16, an as UInt32, ao as UInt64, al as UInt8, aw as Value, V as View, p as WebApp, q as WebAppConfig, r as WebAppHandler, a8 as WithDefault, W as Workflow, aS as WorkflowClient, aF as createClickhouseParameter, z as getApi, y as getApis, x as getIngestApi, w as getIngestApis, R as getMaterializedView, U as getMaterializedViews, G as getSqlResource, B as getSqlResources, v as getStream, u as getStreams, t as getTable, s as getTables, aT as getTemporalClient, aE as getValueFromParameter, P as getView, Q as getViews, N as getWebApp, K as getWebApps, J as getWorkflow, H as getWorkflows, aW as joinQueries, aG as mapToClickHouseType, at as quoteIdentifier, az as sql, aC as toQuery, aD as toQueryPreview, aB as toStaticQuery } from './index-CVs8g-aW.mjs';
import http from 'http';
import { IsTuple } from 'typia/lib/typings/IsTuple';
import { Readable } from 'node:stream';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { IValidation } from 'typia';
import 'typia/lib/tags';
import '@temporalio/client';
import 'jose';

declare const Kafka: typeof KafkaJS.Kafka;
type Kafka = KafkaJS.Kafka;
type Producer = KafkaJS.Producer;
declare const compilerLog: (message: string) => void;
declare const antiCachePath: (path: string) => string;
declare const getFileName: (filePath: string) => string;
interface ClientConfig {
    username: string;
    password: string;
    database: string;
    useSSL: string;
    host: string;
    port: string;
}
declare const getClickhouseClient: ({ username, password, database, useSSL, host, port, }: ClientConfig) => _clickhouse_client.ClickHouseClient;
type CliLogData = {
    message_type?: "Info" | "Success" | "Warning" | "Error" | "Highlight";
    action: string;
    message: string;
};
declare const cliLog: (log: CliLogData) => void;
/**
 * Method to change .ts, .cts, and .mts to .js, .cjs, and .mjs
 * This is needed because 'import' does not support .ts, .cts, and .mts
 */
declare function mapTstoJs(filePath: string): string;
/**
 * Rewrites relative import paths in JavaScript files to include .js extensions.
 * This is required for Node.js ESM which requires explicit extensions.
 *
 * Handles:
 * - import statements: import { foo } from './bar' -> import { foo } from './bar.js'
 * - dynamic imports: import('./bar') -> import('./bar.js')
 * - re-exports: export { foo } from './bar' -> export { foo } from './bar.js'
 *
 * Does NOT modify:
 * - Package imports (no leading . or ..)
 * - Imports that already have extensions
 * - Imports from node_modules
 *
 * @param outDir - Directory containing compiled JavaScript files
 */
declare function rewriteImportExtensions(outDir: string): void;
declare const MAX_RETRIES = 150;
declare const MAX_RETRY_TIME_MS = 1000;
declare const RETRY_INITIAL_TIME_MS = 100;
declare const MAX_RETRIES_PRODUCER = 150;
declare const RETRY_FACTOR_PRODUCER = 0.2;
declare const ACKs = -1;
/**
 * Creates the base producer configuration for Kafka.
 * Used by both the SDK stream publishing and streaming function workers.
 *
 * @param maxMessageBytes - Optional max message size in bytes (synced with topic config)
 * @returns Producer configuration object for the Confluent Kafka client
 */
declare function createProducerConfig(maxMessageBytes?: number): {
    "message.max.bytes"?: number | undefined;
    kafkaJS: {
        idempotent: boolean;
        acks: number;
        retry: {
            retries: number;
            maxRetryTime: number;
        };
    };
    "linger.ms": number;
};
type KafkaClientConfig = {
    clientId: string;
    broker: string;
    securityProtocol?: string;
    saslUsername?: string;
    saslPassword?: string;
    saslMechanism?: string;
};
/**
 * Dynamically creates and connects a KafkaJS producer using the provided configuration.
 * Returns a connected producer instance.
 *
 * @param cfg - Kafka client configuration
 * @param logger - Logger instance
 * @param maxMessageBytes - Optional max message size in bytes (synced with topic config)
 */
declare function getKafkaProducer(cfg: KafkaClientConfig, logger: Logger, maxMessageBytes?: number): Promise<Producer>;
/**
 * Interface for logging functionality
 */
interface Logger {
    logPrefix: string;
    log: (message: string) => void;
    error: (message: string) => void;
    warn: (message: string) => void;
}
declare const logError: (logger: Logger, e: Error) => void;
/**
 * Dynamically creates a KafkaJS client configured with provided settings.
 * Use this to construct producers/consumers with custom options.
 */
declare const getKafkaClient: (cfg: KafkaClientConfig, logger: Logger) => Promise<Kafka>;

/**
 * @module secrets
 * Utilities for runtime environment variable resolution.
 *
 * This module provides functionality to mark values that should be resolved
 * from environment variables at runtime by the Moose CLI, rather than being
 * embedded at build time.
 *
 * @example
 * ```typescript
 * import { S3QueueEngine, mooseRuntimeEnv } from 'moose-lib';
 *
 * const table = OlapTable<MyData>(
 *   "MyTable",
 *   OlapConfig({
 *     engine: S3QueueEngine({
 *       s3_path: "s3://bucket/data/*.json",
 *       format: "JSONEachRow",
 *       awsAccessKeyId: mooseRuntimeEnv.get("AWS_ACCESS_KEY_ID"),
 *       awsSecretAccessKey: mooseRuntimeEnv.get("AWS_SECRET_ACCESS_KEY")
 *     })
 *   })
 * );
 * ```
 */
/**
 * Prefix used to mark values for runtime environment variable resolution.
 * @internal
 */
declare const MOOSE_RUNTIME_ENV_PREFIX = "__MOOSE_RUNTIME_ENV__:";
/**
 * Utilities for marking values to be resolved from environment variables at runtime.
 *
 * When you use `mooseRuntimeEnv.get()`, the behavior depends on the context:
 * - During infrastructure map loading: Returns a marker string for later resolution
 * - During function/workflow execution: Returns the actual environment variable value
 *
 * This is useful for:
 * - Credentials that should never be embedded in Docker images
 * - Configuration that can be rotated without rebuilding
 * - Different values for different environments (dev, staging, prod)
 * - Any runtime configuration in infrastructure elements (Tables, Topics, etc.)
 */
declare const mooseRuntimeEnv: {
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
    get(envVarName: string): string;
};
/** @deprecated Use mooseRuntimeEnv instead */
declare const mooseEnvSecrets: {
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
    get(envVarName: string): string;
};

/**
 * @deprecated Use `getMooseUtils()` from '@514labs/moose-lib' instead.
 *
 * This synchronous function extracts MooseUtils from a request object that was
 * injected by Moose runtime middleware. It returns undefined if not running
 * in a Moose-managed context.
 *
 * Migration: Replace with the async version:
 * ```typescript
 * // Old (sync, deprecated):
 * import { getMooseUtilsFromRequest } from '@514labs/moose-lib';
 * const moose = getMooseUtilsFromRequest(req);
 *
 * // New (async, recommended):
 * import { getMooseUtils } from '@514labs/moose-lib';
 * const moose = await getMooseUtils();
 * ```
 *
 * @param req - The HTTP request object containing injected moose utilities
 * @returns MooseUtils if available on the request, undefined otherwise
 */
declare function getMooseUtilsFromRequest(req: http.IncomingMessage | any): MooseUtils | undefined;
/**
 * @deprecated Use `getMooseUtils()` from '@514labs/moose-lib' instead.
 *
 * This is a legacy alias for getMooseUtilsFromRequest. The main getMooseUtils
 * export from '@514labs/moose-lib' is now async and does not require a request parameter.
 *
 * BREAKING CHANGE WARNING: The new getMooseUtils() returns Promise<MooseUtils>,
 * not MooseUtils | undefined. You must await the result:
 * ```typescript
 * const moose = await getMooseUtils(); // New async API
 * ```
 */
declare const getLegacyMooseUtils: typeof getMooseUtilsFromRequest;
/**
 * @deprecated No longer needed. Use getMooseUtils() directly instead.
 * Moose now handles utility injection automatically when injectMooseUtils is true.
 */
declare function expressMiddleware(): (req: any, res: any, next: any) => void;
/**
 * @deprecated Use MooseUtils from helpers.ts instead.
 */
interface ExpressRequestWithMoose {
    moose?: MooseUtils;
}

interface TaskFunction {
    (input?: any): Promise<{
        task: string;
        data: any;
    }>;
}
interface TaskConfig {
    retries: number;
}
interface TaskDefinition {
    task: TaskFunction;
    config?: TaskConfig;
}

type SupportedTypes = string | object;
declare class MooseCache {
    private client;
    private isConnected;
    private readonly keyPrefix;
    private disconnectTimer;
    private readonly idleTimeout;
    private connectPromise;
    private constructor();
    private clearDisconnectTimer;
    private resetDisconnectTimer;
    private ensureConnected;
    private connect;
    private gracefulShutdown;
    private getPrefixedKey;
    /**
     * Gets the singleton instance of MooseCache. Creates a new instance if one doesn't exist.
     * The client will automatically connect to Redis and handle reconnection if needed.
     *
     * @returns Promise<MooseCache> The singleton instance of MooseCache
     * @example
     * const cache = await MooseCache.get();
     */
    static get(): Promise<MooseCache>;
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
    set(key: string, value: string | object, ttlSeconds?: number): Promise<string | null>;
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
    get<T extends SupportedTypes = string>(key: string): Promise<T | null>;
    /**
     * Deletes a specific key from the cache.
     *
     * @param key - The key to delete
     * @example
     * await cache.delete("foo");
     */
    delete(key: string): Promise<void>;
    /**
     * Deletes all keys that start with the given prefix.
     *
     * @param keyPrefix - The prefix of keys to delete
     * @example
     * // Delete all keys starting with "foo"
     * await cache.clearKeys("foo");
     */
    clearKeys(keyPrefix: string): Promise<void>;
    /**
     * Deletes all keys in the cache
     *
     * @example
     * await cache.clear();
     */
    clear(): Promise<void>;
    /**
     * Manually disconnects the Redis client. The client will automatically reconnect
     * when the next operation is performed.
     *
     * @example
     * await cache.disconnect();
     */
    disconnect(): Promise<void>;
}

interface RuntimeClickHouseConfig {
    host: string;
    port: string;
    username: string;
    password: string;
    database: string;
    useSSL: boolean;
}

/**
 * Get Moose utilities for database access and SQL queries.
 * Works in both Moose runtime and standalone contexts.
 *
 * **IMPORTANT**: This function is async and returns a Promise. You must await the result:
 * ```typescript
 * const moose = await getMooseUtils(); // Correct
 * const moose = getMooseUtils(); // WRONG - returns Promise, not MooseUtils!
 * ```
 *
 * **Breaking Change from v1.x**: This function signature changed from sync to async.
 * If you were using the old sync API that extracted utils from a request object,
 * use `getMooseUtilsFromRequest(req)` for backward compatibility (deprecated).
 *
 * @param req - DEPRECATED: Request parameter is no longer needed and will be ignored.
 *              If you need to extract moose from a request, use getMooseUtilsFromRequest().
 * @returns Promise resolving to MooseUtils with client and sql utilities.
 *
 * @example
 * ```typescript
 * const { client, sql } = await getMooseUtils();
 * const result = await client.query.execute(sql`SELECT * FROM table`);
 * ```
 */
declare function getMooseUtils(req?: any): Promise<MooseUtils>;
/**
 * @deprecated Use getMooseUtils() instead.
 * Creates a Moose client for database access.
 */
declare function getMooseClients(config?: Partial<RuntimeClickHouseConfig>): Promise<{
    client: MooseClient;
}>;

/**
 * Configuration for CSV parsing options
 */
interface CSVParsingConfig {
    /** CSV delimiter character */
    delimiter: string;
    /** Whether to treat first row as headers */
    columns?: boolean;
    /** Whether to skip empty lines */
    skipEmptyLines?: boolean;
    /** Whether to trim whitespace from values */
    trim?: boolean;
}
/**
 * Configuration for JSON parsing options
 */
interface JSONParsingConfig {
    /** Custom reviver function for JSON.parse */
    reviver?: (key: string, value: any) => any;
}
/**
 * Parses CSV content into an array of objects
 *
 * @param content - The CSV content as a string
 * @param config - CSV parsing configuration
 * @returns Promise resolving to an array of parsed objects
 */
declare function parseCSV<T = Record<string, any>>(content: string, config: CSVParsingConfig): Promise<T[]>;
/**
 * Parses JSON content into an array of objects
 *
 * @param content - The JSON content as a string
 * @param config - JSON parsing configuration
 * @returns Array of parsed objects
 */
declare function parseJSON<T = any>(content: string, config?: JSONParsingConfig): T[];
/**
 * Parses JSON content with automatic date revival
 *
 * @param content - The JSON content as a string
 * @returns Array of parsed objects with Date objects for ISO 8601 strings
 */
declare function parseJSONWithDates<T = any>(content: string): T[];
/**
 * Type guard to check if a value is a valid CSV delimiter
 */
declare function isValidCSVDelimiter(delimiter: string): boolean;
/**
 * Common CSV delimiters
 */
declare const CSV_DELIMITERS: {
    readonly COMMA: ",";
    readonly TAB: "\t";
    readonly SEMICOLON: ";";
    readonly PIPE: "|";
};
/**
 * Default CSV parsing configuration
 */
declare const DEFAULT_CSV_CONFIG: CSVParsingConfig;
/**
 * Default JSON parsing configuration with date revival
 */
declare const DEFAULT_JSON_CONFIG: JSONParsingConfig;

type HasFunctionField<T> = T extends object ? {
    [K in keyof T]: T[K] extends Function ? true : false;
}[keyof T] extends false | undefined ? false : true : false;
type OptionalToUndefinedable<T> = {
    [K in {} & keyof T]: T[K];
};
type StripInterfaceFields<T> = {
    [K in keyof T]: StripDateIntersection<T[K]>;
};
/**
 * `Date & ...` is considered "nonsensible intersection" by typia,
 * causing JSON schema to fail.
 * This helper type recursively cleans up the intersection type tagging.
 */
type StripDateIntersection<T> = T extends Date ? Date extends T ? Date : T : T extends ReadonlyArray<unknown> ? IsTuple<T> extends true ? StripDateFromTuple<T> : T extends ReadonlyArray<infer U> ? ReadonlyArray<U> extends T ? ReadonlyArray<StripDateIntersection<U>> : Array<StripDateIntersection<U>> : T extends Array<infer U> ? Array<StripDateIntersection<U>> : T : true extends HasFunctionField<T> ? T : T extends object ? StripInterfaceFields<OptionalToUndefinedable<T>> : T;
type StripDateFromTuple<T extends readonly any[]> = T extends ([
    infer T1,
    infer T2,
    infer T3,
    infer T4,
    infer T5,
    infer T6,
    infer T7,
    infer T8,
    infer T9,
    infer T10
]) ? [
    StripDateIntersection<T1>,
    StripDateIntersection<T2>,
    StripDateIntersection<T3>,
    StripDateIntersection<T4>,
    StripDateIntersection<T5>,
    StripDateIntersection<T6>,
    StripDateIntersection<T7>,
    StripDateIntersection<T8>,
    StripDateIntersection<T9>,
    StripDateIntersection<T10>
] : T extends ([
    infer T1,
    infer T2,
    infer T3,
    infer T4,
    infer T5,
    infer T6,
    infer T7,
    infer T8,
    infer T9
]) ? [
    StripDateIntersection<T1>,
    StripDateIntersection<T2>,
    StripDateIntersection<T3>,
    StripDateIntersection<T4>,
    StripDateIntersection<T5>,
    StripDateIntersection<T6>,
    StripDateIntersection<T7>,
    StripDateIntersection<T8>,
    StripDateIntersection<T9>
] : T extends ([
    infer T1,
    infer T2,
    infer T3,
    infer T4,
    infer T5,
    infer T6,
    infer T7,
    infer T8
]) ? [
    StripDateIntersection<T1>,
    StripDateIntersection<T2>,
    StripDateIntersection<T3>,
    StripDateIntersection<T4>,
    StripDateIntersection<T5>,
    StripDateIntersection<T6>,
    StripDateIntersection<T7>,
    StripDateIntersection<T8>
] : T extends ([
    infer T1,
    infer T2,
    infer T3,
    infer T4,
    infer T5,
    infer T6,
    infer T7
]) ? [
    StripDateIntersection<T1>,
    StripDateIntersection<T2>,
    StripDateIntersection<T3>,
    StripDateIntersection<T4>,
    StripDateIntersection<T5>,
    StripDateIntersection<T6>,
    StripDateIntersection<T7>
] : T extends [infer T1, infer T2, infer T3, infer T4, infer T5, infer T6] ? [
    StripDateIntersection<T1>,
    StripDateIntersection<T2>,
    StripDateIntersection<T3>,
    StripDateIntersection<T4>,
    StripDateIntersection<T5>,
    StripDateIntersection<T6>
] : T extends [infer T1, infer T2, infer T3, infer T4, infer T5] ? [
    StripDateIntersection<T1>,
    StripDateIntersection<T2>,
    StripDateIntersection<T3>,
    StripDateIntersection<T4>,
    StripDateIntersection<T5>
] : T extends [infer T1, infer T2, infer T3, infer T4] ? [
    StripDateIntersection<T1>,
    StripDateIntersection<T2>,
    StripDateIntersection<T3>,
    StripDateIntersection<T4>
] : T extends [infer T1, infer T2, infer T3] ? [
    StripDateIntersection<T1>,
    StripDateIntersection<T2>,
    StripDateIntersection<T3>
] : T extends [infer T1, infer T2] ? [
    StripDateIntersection<T1>,
    StripDateIntersection<T2>
] : T extends [infer T1] ? [StripDateIntersection<T1>] : [];

/**
 * Configuration for a data source
 */
interface DataSourceConfig {
    name: string;
    supportsIncremental?: boolean;
}
/**
 * DataSource is an abstract class that defines the interface for all data sources.
 * It is used to extract data from a source and test the connection to the source.
 */
declare abstract class DataSource<T = any, ItemType = any> {
    protected name: string;
    protected supportsIncremental: boolean;
    constructor(config: DataSourceConfig);
    /**
     * Extract data from the source
     * Returns either ItemType (for single requests) or Readable (for paginated requests)
     */
    abstract extract(): Promise<ItemType | Readable>;
    /**
     * Test connection to the source
     */
    abstract testConnection(): Promise<{
        success: boolean;
        message?: string;
    }>;
}
/**
 * Result returned from extraction
 * For single requests: data is of type T
 * For paginated requests: data is a Readable stream yielding items of type T
 */
interface ExtractionResult<T = any> {
    data: T | Readable;
    metadata: Record<string, any>;
}

/**
 * Query Layer Types
 *
 * Consolidated type definitions for the query layer.
 *
 * @module query-layer/types
 */

/** Valid SQL values that can be parameterized */
type SqlValue = string | number | boolean | Date;
/**
 * Column reference — a Column object from OlapTable.columns.* or a raw Sql expression.
 *
 * @example
 * const col = Events.columns.amount;   // Column
 * const expr = sql`CASE WHEN ... END`; // Sql
 */
type ColRef = Column | Sql;
/**
 * Supported filter operators for building WHERE conditions.
 *
 * Each operator has specific value type requirements:
 * - Scalar operators (eq, ne, gt, gte, lt, lte, like, ilike): single value
 * - List operators (in, notIn): array of values
 * - Range operators (between): tuple [low, high]
 * - Null operators (isNull, isNotNull): boolean flag
 */
type FilterOperator = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "notIn" | "between" | "isNull" | "isNotNull";
/** Sort direction for ORDER BY clauses */
type SortDir = "ASC" | "DESC";
/**
 * Dimension definition — a column or expression used for grouping.
 *
 * @template TModel - The table's model type
 * @template TKey - The column key (must be a key of TModel)
 *
 * @example
 * dimensions: {
 *   status: { column: "status" },
 *   day: { expression: sql`toDate(timestamp)`, as: "day" },
 * }
 */
interface DimensionDef<TModel = any, TKey extends keyof TModel = keyof TModel> {
    column?: TKey;
    expression?: Sql;
    as?: string;
    description?: string;
}
/**
 * Metric definition — an aggregate or computed value.
 *
 * @example
 * metrics: {
 *   totalAmount: { agg: sql`sum(amount)` },
 *   totalEvents: { agg: sql`count(*)` },
 *   revenue: { agg: sql`sum(amount)`, as: "total_revenue" },
 * }
 */
interface MetricDef {
    agg: Sql;
    as?: string;
    description?: string;
}
/**
 * Column definition for detail (non-aggregated) queries.
 *
 * @template TModel - The table's model type
 * @template TKey - The column key (must be a key of TModel)
 *
 * @example
 * columns: {
 *   visitId: { column: "id" },
 *   firstName: { join: "user", column: "first_name" },
 * }
 */
interface ColumnDef<TModel = any, TKey extends keyof TModel = keyof TModel> {
    column: TKey | string;
    join?: string;
    as?: string;
}
/**
 * Join definition for lookup JOINs.
 *
 * @example
 * joins: {
 *   user: {
 *     table: UsersTable,
 *     leftKey: "user_id",
 *     rightKey: "id",
 *     type: "LEFT",
 *   },
 * }
 */
interface JoinDef {
    table: OlapTable<any> | MaterializedView<any>;
    on?: Sql;
    leftKey?: string;
    rightKey?: string;
    type?: "LEFT" | "INNER";
}
/** Input type hint for filter UI rendering */
type FilterInputTypeHint = "text" | "number" | "date" | "select" | "multiselect";
/**
 * Filter definition for use in defineQueryModel configuration.
 *
 * @template TModel - The table's model type
 * @template TKey - The column key (must be a key of TModel)
 *
 * @example
 * filters: {
 *   status: { column: "status", operators: ["eq", "in"] as const },
 *   amount: { column: "amount", operators: ["gte", "lte"] as const },
 * }
 */
interface ModelFilterDef<TModel, TKey extends keyof TModel = keyof TModel> {
    column?: TKey;
    /** Metric name — filters referencing a metric are auto-routed to HAVING */
    metric?: string;
    operators: readonly FilterOperator[];
    transform?: (value: TModel[TKey]) => SqlValue;
    inputType?: FilterInputTypeHint;
    /** When true, this filter's `eq` param is required in MCP tool schemas */
    required?: true;
    description?: string;
}
/** Extract string keys from a record type */
type Names<T> = Extract<keyof T, string>;
/**
 * Infer the value type for a given operator and base value type.
 *
 * Maps filter operators to their required value types:
 * - Scalar operators: single value
 * - List operators (in, notIn): array of values
 * - Range operators (between): tuple [low, high]
 * - Null operators (isNull, isNotNull): boolean flag
 */
type OperatorValueType<Op extends FilterOperator, TValue = SqlValue> = Op extends "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" ? TValue : Op extends "in" | "notIn" ? TValue[] : Op extends "between" ? [TValue, TValue] : Op extends "isNull" | "isNotNull" ? boolean : never;
/** Base constraint for filter definitions */
type FilterDefBase = {
    operators: readonly FilterOperator[];
};
/** Filter parameters structure derived from filter definitions */
type FilterParams<TFilters extends Record<string, FilterDefBase>, TTable = any> = {
    [K in keyof TFilters]?: {
        [Op in TFilters[K]["operators"][number]]?: OperatorValueType<Op, TFilters[K] extends {
            column: infer TKey extends keyof TTable;
        } ? TTable[TKey] : SqlValue>;
    };
};
/**
 * User-facing query request specification.
 *
 * Users specify dimensions and metrics — semantic concepts, not SQL concepts.
 * The query model handles the translation to actual SQL.
 *
 * @example
 * const request: QueryRequest = {
 *   dimensions: ["status", "day"],
 *   metrics: ["totalEvents", "totalAmount"],
 *   filters: { status: { eq: "active" } },
 *   orderBy: [["totalAmount", "DESC"]],
 *   limit: 10,
 * };
 */
type QueryRequest<TMetrics extends string = string, TDimensions extends string = string, TFilters extends Record<string, FilterDefBase> = Record<string, FilterDefBase>, TSortable extends string = string, TColumns extends string = string, TTable = any> = {
    filters?: FilterParams<TFilters, TTable>;
    dimensions?: TDimensions[];
    metrics?: TMetrics[];
    /** Columns for detail mode (no aggregation). Mutually exclusive with dimensions/metrics. */
    columns?: TColumns[];
    orderBy?: Array<[TSortable, SortDir]>;
    limit?: number;
    /** Page number (0-indexed). Mutually exclusive with offset. */
    page?: number;
    /** Row offset. Mutually exclusive with page. */
    offset?: number;
};
/** Individual SQL clauses for custom query assembly */
interface QueryParts {
    select: Sql;
    dimensions: Sql;
    metrics: Sql;
    columns: Sql;
    from: Sql;
    conditions: Sql[];
    where: Sql;
    groupBy: Sql;
    having: Sql;
    orderBy: Sql;
    /** Composed LIMIT + OFFSET clause */
    pagination: Sql;
}

/**
 * Query Model — Core query building interface and implementation.
 *
 * @module query-layer/query-model
 */

/**
 * Configuration for defining a query model.
 *
 * @template TTable - The table's model type (row type)
 * @template TMetrics - Record of metric definitions
 * @template TDimensions - Record of dimension definitions
 * @template TFilters - Record of filter definitions
 * @template TSortable - Union type of sortable field names
 */
interface QueryModelConfig<TTable, TMetrics extends Record<string, MetricDef>, TDimensions extends Record<string, DimensionDef<TTable, keyof TTable>>, TFilters extends Record<string, ModelFilterDef<TTable, keyof TTable>>, TSortable extends string, TColumns extends Record<string, ColumnDef<TTable>> = Record<string, never>, TJoins extends Record<string, JoinDef> = Record<string, never>> {
    /** Tool name used by registerModelTools (e.g. "query_visits") */
    name?: string;
    /** Tool description used by registerModelTools */
    description?: string;
    /** The OlapTable or MaterializedView to query. If a MaterializedView is passed, its targetTable is used. */
    table: OlapTable<TTable> | MaterializedView<TTable>;
    /**
     * Dimension fields — columns used for grouping, filtering, and display.
     *
     * @example
     * dimensions: {
     *   status: { column: "status" },
     *   day: { expression: sql`toDate(timestamp)`, as: "day" },
     * }
     */
    dimensions?: TDimensions;
    /**
     * Metric fields — aggregate values computed over dimensions.
     *
     * @example
     * metrics: {
     *   totalAmount: { agg: sum(Events.columns.amount), as: "total_amount" },
     *   totalEvents: { agg: count(), as: "total_events" },
     * }
     */
    metrics?: TMetrics;
    /**
     * Column fields for detail (non-aggregated) queries.
     *
     * @example
     * columns: {
     *   visitId: { column: "id" },
     *   firstName: { join: "user", column: "first_name" },
     * }
     */
    columns?: TColumns;
    /**
     * Lookup JOIN definitions.
     *
     * @example
     * joins: {
     *   user: {
     *     table: UsersTable,
     *     leftKey: "user_id",
     *     rightKey: "id",
     *     type: "LEFT",
     *   },
     * }
     */
    joins?: TJoins;
    /**
     * Filterable fields with allowed operators.
     *
     * @example
     * filters: {
     *   status: { column: "status", operators: ["eq", "in"] as const },
     *   amount: { column: "amount", operators: ["gte", "lte"] as const },
     * }
     */
    filters: TFilters;
    /**
     * Which fields can be sorted.
     *
     * @example
     * sortable: ["timestamp", "amount", "status"] as const
     */
    sortable: readonly TSortable[];
    /** Default query behavior */
    defaults?: {
        orderBy?: Array<[TSortable, SortDir]>;
        groupBy?: string[];
        limit?: number;
        maxLimit?: number;
        dimensions?: string[];
        metrics?: string[];
        columns?: string[];
    };
}
/**
 * Query model interface providing type-safe query building and execution.
 */
interface QueryModel<TTable, TMetrics extends Record<string, MetricDef>, TDimensions extends Record<string, DimensionDef>, TFilters extends Record<string, FilterDefBase>, TSortable extends string, TResult, TColumns extends Record<string, ColumnDef> = Record<string, never>> {
    readonly name?: string;
    readonly description?: string;
    readonly defaults: {
        orderBy?: Array<[TSortable, SortDir]>;
        groupBy?: string[];
        limit?: number;
        maxLimit?: number;
        dimensions?: string[];
        metrics?: string[];
        columns?: string[];
    };
    readonly filters: TFilters;
    readonly sortable: readonly TSortable[];
    readonly dimensions?: TDimensions;
    readonly metrics?: TMetrics;
    readonly columns?: TColumns;
    readonly columnNames: readonly string[];
    /** Type inference helpers (similar to Drizzle's $inferSelect pattern). */
    readonly $inferDimensions: Names<TDimensions>;
    readonly $inferMetrics: Names<TMetrics>;
    readonly $inferColumns: Names<TColumns>;
    readonly $inferFilters: FilterParams<TFilters, TTable>;
    readonly $inferRequest: QueryRequest<Names<TMetrics>, Names<TDimensions>, TFilters, TSortable, Names<TColumns>, TTable>;
    readonly $inferResult: TResult;
    /** Execute query with Moose QueryClient. */
    query(request: QueryRequest<Names<TMetrics>, Names<TDimensions>, TFilters, TSortable, Names<TColumns>, TTable>, client: QueryClient): Promise<TResult[]>;
    /** Build complete SQL query from request. */
    toSql(request: QueryRequest<Names<TMetrics>, Names<TDimensions>, TFilters, TSortable, Names<TColumns>, TTable>): Sql;
    /** Get individual SQL parts for custom assembly. */
    toParts(request: QueryRequest<Names<TMetrics>, Names<TDimensions>, TFilters, TSortable, Names<TColumns>, TTable>): QueryParts;
}
/**
 * Define a query model with controlled field selection, filtering, and sorting.
 *
 * @example
 * const model = defineQueryModel({
 *   table: Events,
 *   dimensions: {
 *     status: { column: "status" },
 *     day: { expression: sql`toDate(timestamp)`, as: "day" },
 *   },
 *   metrics: {
 *     totalEvents: { agg: count(), as: "total_events" },
 *     totalAmount: { agg: sum(Events.columns.amount), as: "total_amount" },
 *   },
 *   filters: {
 *     status: { column: "status", operators: ["eq", "in"] as const },
 *   },
 *   sortable: ["amount", "timestamp"] as const,
 * });
 */
declare function defineQueryModel<TTable, TMetrics extends Record<string, MetricDef>, TDimensions extends Record<string, DimensionDef<TTable, keyof TTable>>, TFilters extends Record<string, ModelFilterDef<TTable, keyof TTable>>, TSortable extends string, TColumns extends Record<string, ColumnDef<TTable>> = Record<string, never>, TJoins extends Record<string, JoinDef> = Record<string, never>, TResult = TTable>(config: QueryModelConfig<TTable, TMetrics, TDimensions, TFilters, TSortable, TColumns, TJoins>): QueryModel<TTable, TMetrics, TDimensions, TFilters, TSortable, TResult, TColumns>;

/**
 * Composable helpers that leverage moose-lib table metadata to reduce
 * boilerplate in QueryModel definitions.
 *
 * @module query-layer/helpers
 */

/**
 * Derive FilterInputTypeHint from a ClickHouse column data_type.
 */
declare function deriveInputTypeFromDataType(dataType: DataType): FilterInputTypeHint;
type DefaultTimePeriods = {
    day: DimensionDef;
    month: DimensionDef;
    week: DimensionDef;
};
/**
 * Generate day/month/week dimension definitions from a date column reference.
 *
 * @param dateColumn - A Column reference from `Table.columns.some_date`
 * @returns `{ day, month, week }` dimension definitions
 *
 * @example
 * dimensions: {
 *   status: { column: "status" },
 *   ...timeDimensions(VisitsTable.columns.start_date),
 * }
 */
declare function timeDimensions(dateColumn: Column): DefaultTimePeriods;
declare function timeDimensions(dateColumn: Column, options: {
    periods: string[];
}): Record<string, DimensionDef>;
interface TableFieldOptions {
    /** Only include these column names (snake_case as in the table) */
    include?: string[];
    /** Exclude these column names */
    exclude?: string[];
    /** Convert snake_case keys to camelCase (default: true) */
    camelCase?: boolean;
}
/**
 * Generate ColumnDef records from a table's columnArray metadata.
 *
 * @example
 * columns: {
 *   ...columnsFromTable(VisitsTable, { include: ["id", "name", "status"] }),
 *   firstName: { join: "user", column: "first_name" },
 * }
 */
declare function columnsFromTable<T>(table: OlapTable<T>, options?: TableFieldOptions): Record<string, ColumnDef<T>>;
/**
 * Generate ModelFilterDef records from a table's columnArray metadata.
 *
 * **Conservative defaults**: all filters get `["eq"]` operators only.
 * Consumers widen operators explicitly via spread overrides.
 *
 * @example
 * filters: {
 *   ...filtersFromTable(VisitsTable, { include: ["studio_id", "start_date", "status"] }),
 *   status: { column: "status", operators: ["eq", "ne", "in"] as const },
 * }
 */
declare function filtersFromTable<T>(table: OlapTable<T>, options?: TableFieldOptions): Record<string, ModelFilterDef<T, keyof T>>;

/**
 * Fluent Query Builder API
 *
 * Provides a chainable API for building QueryRequest objects.
 *
 * @module query-layer/query-builder
 */

/**
 * Fluent builder for constructing query requests.
 *
 * @example
 * const results = await buildQuery(model)
 *   .dimensions(["status"])
 *   .metrics(["totalEvents", "totalAmount"])
 *   .filter("status", "eq", "active")
 *   .orderBy(["totalAmount", "DESC"])
 *   .limit(10)
 *   .execute(client.query);
 */
interface QueryBuilder<TMetrics extends string, TDimensions extends string, TFilters extends Record<string, FilterDefBase>, TSortable extends string, TResult, TTable = any, TColumns extends string = string> {
    /** Add a filter condition. Automatically skips if value is undefined or null. */
    filter<K extends keyof TFilters, Op extends TFilters[K]["operators"][number]>(filterName: K, op: Op, value: OperatorValueType<Op, SqlValue> | undefined): this;
    /** Set dimensions to include in query (aggregate mode) */
    dimensions(fields: TDimensions[]): this;
    /** Set metrics to include in query (aggregate mode) */
    metrics(fields: TMetrics[]): this;
    /** Set columns for detail mode (no aggregation, no GROUP BY) */
    columns(fields: TColumns[]): this;
    /** Set multi-column sort */
    orderBy(...orders: Array<[TSortable, SortDir]>): this;
    /** Set maximum number of rows to return */
    limit(n: number): this;
    /** Set page number (0-indexed) for pagination */
    page(n: number): this;
    /** Set row offset for pagination */
    offset(n: number): this;
    /** Build the QueryRequest object */
    build(): QueryRequest<TMetrics, TDimensions, TFilters, TSortable, TColumns, TTable>;
    /** Build the SQL query */
    toSql(): Sql;
    /** Get query parts for custom assembly */
    toParts(): QueryParts;
    /** Build SQL with custom assembly function */
    assemble(fn: (parts: QueryParts) => Sql): Sql;
    /** Execute the query with Moose QueryClient. */
    execute(client: QueryClient): Promise<TResult[]>;
}
/**
 * Create a fluent query builder for a model.
 *
 * @param model - QueryModel instance to build queries for
 * @returns QueryBuilder instance with chainable methods
 *
 * @example
 * const results = await buildQuery(model)
 *   .dimensions(["status"])
 *   .metrics(["totalEvents", "totalAmount"])
 *   .filter("status", "eq", "active")
 *   .orderBy(["totalAmount", "DESC"])
 *   .limit(10)
 *   .execute(client.query);
 */
declare function buildQuery<TTable, TMetrics extends Record<string, MetricDef>, TDimensions extends Record<string, DimensionDef>, TFilters extends Record<string, FilterDefBase>, TSortable extends string, TResult, TColumns extends Record<string, ColumnDef> = Record<string, never>>(model: QueryModel<TTable, TMetrics, TDimensions, TFilters, TSortable, TResult, TColumns>): QueryBuilder<Names<TMetrics>, Names<TDimensions>, TFilters, TSortable, TResult, TTable, Names<TColumns>>;

/**
 * MCP Schema Generation from QueryModel
 *
 * Auto-generates Zod schemas and request builders for MCP tools
 * directly from QueryModel metadata (filters, dimensions, metrics, columns).
 *
 * @module query-layer/model-tools
 */

/** Filter definition shape expected by MCP utilities. */
interface QueryModelFilter {
    operators: readonly string[];
    inputType?: FilterInputTypeHint;
    required?: true;
    description?: string;
}
/**
 * Minimal model interface consumed by createModelTool / registerModelTools.
 *
 * Any QueryModel from defineQueryModel() satisfies this structurally —
 * no explicit `implements` needed. This avoids propagating generic
 * type parameters into the MCP layer.
 */
interface QueryModelBase {
    readonly name?: string;
    readonly description?: string;
    readonly defaults: {
        orderBy?: Array<[string, SortDir]>;
        groupBy?: string[];
        limit?: number;
        maxLimit?: number;
        dimensions?: string[];
        metrics?: string[];
        columns?: string[];
    };
    readonly filters: Record<string, QueryModelFilter>;
    readonly sortable: readonly string[];
    readonly dimensions?: Record<string, {
        description?: string;
    }>;
    readonly metrics?: Record<string, {
        description?: string;
    }>;
    readonly columnNames: readonly string[];
    toSql(request: Record<string, unknown>): Sql;
}
interface ModelToolOptions {
    /** Filter names whose `eq` param is required (not optional). Merged with model-level `required` flags. */
    requiredFilters?: string[];
    /** Maximum limit for the tool. Falls back to model.defaults.maxLimit, then 1000. */
    maxLimit?: number;
    /** Default limit for the tool. Falls back to model.defaults.limit, then 100. */
    defaultLimit?: number;
    /** Default values applied when params are absent. Merged with model.defaults. */
    defaults?: {
        dimensions?: string[];
        metrics?: string[];
        columns?: string[];
        limit?: number;
    };
}
interface ModelToolResult {
    /** Zod shape object to pass to server.tool() */
    schema: Record<string, z.ZodType>;
    /** Convert flat MCP params into a nested QueryRequest */
    buildRequest: (params: Record<string, unknown>) => Record<string, unknown>;
}
/**
 * Generate a Zod schema and request builder from a QueryModel.
 *
 * Required filters, maxLimit, and default selections are first read from the
 * model itself (via `required: true` on filter defs and `model.defaults`).
 * The optional `options` param can override or extend any of these.
 *
 * @param model - A QueryModel instance (from defineQueryModel)
 * @param options - Optional overrides for required filters, limits, defaults
 * @returns `{ schema, buildRequest }` ready for `server.tool()`
 */
declare function createModelTool(model: QueryModelBase, options?: ModelToolOptions): ModelToolResult;
/**
 * Register MCP tools for all models that have a `name` defined.
 *
 * Each model with a `name` property becomes an MCP tool. The library handles
 * everything: schema generation from model metadata, request building from
 * flat MCP params, SQL generation via `model.toSql()`, parameterized
 * execution with readonly enforcement, and MCP response formatting.
 *
 * Models without a `name` are silently skipped.
 *
 * @param server - McpServer instance
 * @param models - Array of QueryModel instances (from `defineQueryModel`)
 * @param queryClient - The QueryClient from `mooseUtils.client.query`.
 *   Queries are executed in readonly mode with parameterized SQL.
 *
 * @example
 * import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
 * import { getMooseUtils, MooseUtils } from "@514labs/moose-lib";
 * import { registerModelTools } from "@514labs/moose-lib";
 * import { visitsModel, usersModel } from "./models";
 *
 * const serverFactory = (mooseUtils: MooseUtils) => {
 *   const server = new McpServer({ name: "my-tools", version: "1.0.0" });
 *
 *   // One line registers all named models as MCP tools
 *   registerModelTools(server, [visitsModel, usersModel], mooseUtils.client.query);
 *
 *   return server;
 * };
 */
declare function registerModelTools(server: McpServer, models: QueryModelBase[], queryClient: QueryClient): void;

/**
 * SQL Utilities
 *
 * Low-level SQL building utilities for constructing type-safe queries.
 * These are the building blocks used by QueryModel and can also be used
 * directly for custom query construction.
 *
 * @module query-layer/sql-utils
 */

/**
 * Create raw SQL (literal string, no parameterization).
 * Delegates to sql.raw from sqlHelpers.
 *
 * Only for developer-defined constants (column names, expressions, sort
 * directions) that originate from model config — never for HTTP/user input.
 */
declare const raw: (text: string) => Sql;
/** Empty SQL fragment — useful as a no-op. */
declare const empty: Sql;
/**
 * Join SQL fragments with a separator.
 * Delegates to sql.join from sqlHelpers.
 */
declare const join: (fragments: Sql[], separator?: string) => Sql;
/** Check if a Sql fragment is empty */
declare function isEmpty(fragment: Sql): boolean;
/**
 * Create a filter condition. Automatically skips if value is undefined/null.
 * This is the recommended way to build conditional WHERE clauses.
 *
 * @example
 * where(
 *   filter(Events.columns.amount, "gte", params.minAmount),
 *   filter(Events.columns.amount, "lte", params.maxAmount),
 *   filter(Events.columns.status, "eq", params.status),
 * )
 */
declare function filter(col: ColRef, op: "between", value: [SqlValue, SqlValue] | undefined): Sql;
declare function filter(col: ColRef, op: "in" | "notIn", value: SqlValue[] | undefined): Sql;
declare function filter(col: ColRef, op: "isNull" | "isNotNull", value: boolean | undefined): Sql;
declare function filter(col: ColRef, op: "like" | "ilike", value: string | undefined): Sql;
declare function filter(col: ColRef, op: Exclude<FilterOperator, "between" | "in" | "notIn" | "isNull" | "isNotNull" | "like" | "ilike">, value: SqlValue | undefined): Sql;
/** Equal: column = value */
declare function eq(col: ColRef, value: SqlValue): Sql;
/** Not equal: column != value */
declare function ne(col: ColRef, value: SqlValue): Sql;
/** Greater than: column > value */
declare function gt(col: ColRef, value: SqlValue): Sql;
/** Greater than or equal: column >= value */
declare function gte(col: ColRef, value: SqlValue): Sql;
/** Less than: column < value */
declare function lt(col: ColRef, value: SqlValue): Sql;
/** Less than or equal: column <= value */
declare function lte(col: ColRef, value: SqlValue): Sql;
/** LIKE pattern match (case-sensitive) */
declare function like(col: ColRef, pattern: string): Sql;
/** ILIKE pattern match (case-insensitive, ClickHouse) */
declare function ilike(col: ColRef, pattern: string): Sql;
/** IN list: column IN (a, b, c) */
declare function inList(col: ColRef, values: SqlValue[]): Sql;
/** NOT IN list */
declare function notIn(col: ColRef, values: SqlValue[]): Sql;
/** BETWEEN: column BETWEEN low AND high */
declare function between(col: ColRef, low: SqlValue, high: SqlValue): Sql;
/** IS NULL */
declare function isNull(col: ColRef): Sql;
/** IS NOT NULL */
declare function isNotNull(col: ColRef): Sql;
/** Combine conditions with AND, filtering out empty fragments */
declare function and(...conditions: Sql[]): Sql;
/** Combine conditions with OR, filtering out empty fragments */
declare function or(...conditions: Sql[]): Sql;
/** Negate a condition: NOT (condition) */
declare function not(condition: Sql): Sql;
/** Build WHERE clause — returns empty if no conditions */
declare function where(...conditions: Sql[]): Sql;
/** Build ORDER BY clause */
declare function orderBy(...cols: Array<ColRef | [ColRef, "ASC" | "DESC"]>): Sql;
/** Build LIMIT clause */
declare function limit(n: number): Sql;
/** Build OFFSET clause */
declare function offset(n: number): Sql;
/** Build LIMIT + OFFSET for pagination */
declare function paginate(pageSize: number, page?: number): Sql;
/** Build GROUP BY clause */
declare function groupBy(...cols: ColRef[]): Sql;
/** Build HAVING clause */
declare function having(...conditions: Sql[]): Sql;
/** SQL expression with fluent `.as()` method */
interface Expr extends Sql {
    as(alias: string): Sql;
}
/** COUNT(*) or COUNT(column) */
declare function count(col?: ColRef): Expr;
/** COUNT(DISTINCT column) */
declare function countDistinct(col: ColRef): Expr;
/** SUM(column) */
declare function sum(col: ColRef): Expr;
/** AVG(column) */
declare function avg(col: ColRef): Expr;
/** MIN(column) */
declare function min(col: ColRef): Expr;
/** MAX(column) */
declare function max(col: ColRef): Expr;
/** Build SELECT clause with columns */
declare function select(...cols: Array<ColRef | [ColRef, string]>): Sql;
/** Alias a column or expression */
declare function as(expression: Sql, alias: string): Sql;

/**
 * Validation Utilities
 *
 * Request validation and error handling for API endpoints.
 *
 * @module query-layer/validation
 */

/** Frontend-friendly validation error structure */
interface ValidationError {
    path: string;
    message: string;
    expected: string;
    received: string;
}
/** Error thrown when validation fails */
declare class BadRequestError extends Error {
    readonly errors: ValidationError[];
    constructor(typiaErrors: IValidation.IError[]);
    toJSON(): {
        error: string;
        details: ValidationError[];
    };
}
/** Assert validation result, throw BadRequestError if invalid */
declare function assertValid<T>(result: IValidation<T>): T;
/**
 * Query handler with three entry points for queries.
 * Use this when writing raw SQL without a query model.
 */
interface QueryHandler<P, R> {
    run: (params: P) => Promise<R>;
    fromObject: (input: unknown) => Promise<R>;
    fromUrl: (url: string | URL) => Promise<R>;
}
/**
 * Create a simple query handler with validation.
 *
 * @example
 * const handler = createQueryHandler({
 *   fromUrl: typia.http.createValidateQuery<MyParams>(),
 *   fromObject: typia.createValidate<MyParams>(),
 *   queryFn: async (params) => {
 *     const query = sql`SELECT * FROM ${Table} ${where(...)}`;
 *     return executeQuery(query);
 *   },
 * });
 */
declare function createQueryHandler<P, R>(config: {
    fromUrl: (input: string | URLSearchParams) => IValidation<P>;
    fromObject: (input: unknown) => IValidation<P>;
    queryFn: (params: P) => Promise<R>;
}): QueryHandler<P, R>;

type DataModelConfig<T> = Partial<{
    ingestion: true;
    storage: {
        enabled?: boolean;
        order_by_fields?: (keyof T)[];
        deduplicate?: boolean;
        name?: string;
    };
    parallelism?: number;
}>;

export { ACKs, BadRequestError, type CSVParsingConfig, CSV_DELIMITERS, type CliLogData, type ColRef, Column, type ColumnDef, DEFAULT_CSV_CONFIG, DEFAULT_JSON_CONFIG, type DataModelConfig, DataSource, type DataSourceConfig, type DimensionDef, type Expr, type ExpressRequestWithMoose, type ExtractionResult, type FilterDefBase, type FilterInputTypeHint, type FilterOperator, type FilterParams, type JSONParsingConfig, type JoinDef, type KafkaClientConfig, type Logger, MAX_RETRIES, MAX_RETRIES_PRODUCER, MAX_RETRY_TIME_MS, MOOSE_RUNTIME_ENV_PREFIX, MaterializedView, type MetricDef, type ModelFilterDef, type ModelToolOptions, type ModelToolResult, MooseCache, MooseClient, MooseUtils, type Names, OlapTable, type OperatorValueType, type Producer, type QueryBuilder, QueryClient, type QueryHandler, type QueryModel, type QueryModelBase, type QueryModelConfig, type QueryModelFilter, type QueryParts, type QueryRequest, RETRY_FACTOR_PRODUCER, RETRY_INITIAL_TIME_MS, type SortDir, Sql, type SqlValue, type StripDateIntersection, type TaskConfig, type TaskDefinition, type TaskFunction, type ValidationError, and, antiCachePath, as, assertValid, avg, between, buildQuery, cliLog, columnsFromTable, compilerLog, count, countDistinct, createModelTool, createProducerConfig, createQueryHandler, defineQueryModel, deriveInputTypeFromDataType, empty, eq, expressMiddleware, filter, filtersFromTable, getClickhouseClient, getFileName, getKafkaClient, getKafkaProducer, getLegacyMooseUtils, getMooseClients, getMooseUtils, getMooseUtilsFromRequest, groupBy, gt, gte, having, ilike, inList, isEmpty, isNotNull, isNull, isValidCSVDelimiter, join, like, limit, logError, lt, lte, mapTstoJs, max, min, mooseEnvSecrets, mooseRuntimeEnv, ne, not, notIn, offset, or, orderBy, paginate, parseCSV, parseJSON, parseJSONWithDates, raw, registerModelTools, rewriteImportExtensions, select, sum, timeDimensions, where };
