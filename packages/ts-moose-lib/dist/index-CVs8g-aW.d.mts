import { IJsonSchemaCollection, tags } from 'typia';
import { Pattern, TagBase } from 'typia/lib/tags';
import { Readable } from 'node:stream';
import { ClickHouseClient, ResultSet, CommandResult } from '@clickhouse/client';
import { Client } from '@temporalio/client';
import { JWTPayload } from 'jose';
import http from 'http';

/**
 * Quote a ClickHouse identifier with backticks if not already quoted.
 * Backticks allow special characters (e.g., hyphens) in identifiers.
 */
declare const quoteIdentifier: (name: string) => string;
type IdentifierBrandedString = string & {
    readonly __identifier_brand?: unique symbol;
};
type NonIdentifierBrandedString = string & {
    readonly __identifier_brand?: unique symbol;
};
/**
 * Values supported by SQL engine.
 */
type Value = NonIdentifierBrandedString | number | boolean | Date | [string, string];
/**
 * Supported value or SQL instance.
 */
type RawValue = Value | Sql;
/**
 * Sql template tag interface with attached helper methods.
 */
interface SqlTemplateTag {
    /**
     * @deprecated Use `sql.statement` for full SQL statements or `sql.fragment` for SQL fragments.
     */
    (strings: readonly string[], ...values: readonly (RawValue | Column | OlapTable<any> | View)[]): Sql;
    /**
     * Template literal tag for complete SQL statements (e.g. SELECT, INSERT, CREATE).
     * Produces a Sql instance with `isFragment = false`.
     */
    statement(strings: readonly string[], ...values: readonly (RawValue | Column | OlapTable<any> | View)[]): Sql;
    /**
     * Template literal tag for SQL fragments (e.g. expressions, conditions, partial clauses).
     * Produces a Sql instance with `isFragment = true`.
     */
    fragment(strings: readonly string[], ...values: readonly (RawValue | Column | OlapTable<any> | View)[]): Sql;
    /**
     * Join an array of Sql fragments with a separator.
     * @param fragments - Array of Sql fragments to join
     * @param separator - Optional separator string (defaults to ", ")
     */
    join(fragments: Sql[], separator?: string): Sql;
    /**
     * Create raw SQL from a string without parameterization.
     * WARNING: SQL injection risk if used with untrusted input.
     */
    raw(text: string): Sql;
}
declare const sql: SqlTemplateTag;
/**
 * A SQL instance can be nested within each other to build SQL strings.
 */
declare class Sql {
    readonly values: Value[];
    readonly strings: string[];
    readonly isFragment: boolean | undefined;
    constructor(rawStrings: readonly string[], rawValues: readonly (RawValue | Column | OlapTable<any> | View | Sql)[], isFragment?: boolean);
    /**
     * Append another Sql fragment, returning a new Sql instance.
     */
    append(other: Sql): Sql;
}
declare const toStaticQuery: (sql: Sql) => string;
declare const toQuery: (sql: Sql) => [string, {
    [pN: string]: any;
}];
/**
 * Build a display-only SQL string with values inlined for logging/debugging.
 * Does not alter execution behavior; use toQuery for actual execution.
 */
declare const toQueryPreview: (sql: Sql) => string;
declare const getValueFromParameter: (value: any) => any;
declare function createClickhouseParameter(parameterIndex: number, value: Value): string;
/**
 * Convert the JS type (source is JSON format by API query parameter) to the corresponding ClickHouse type for generating named placeholder of parameterized query.
 * Only support to convert number to Int or Float, boolean to Bool, string to String, other types will convert to String.
 * If exist complex type e.g: object, Array, null, undefined, Date, Record.. etc, just convert to string type by ClickHouse function in SQL.
 * ClickHouse support converting string to other types function.
 * Please see Each section of the https://clickhouse.com/docs/en/sql-reference/functions and https://clickhouse.com/docs/en/sql-reference/functions/type-conversion-functions
 * @param value
 * @returns 'Float', 'Int', 'Bool', 'String'
 */
declare const mapToClickHouseType: (value: Value) => string;

type EnumValues = {
    name: string;
    value: {
        Int: number;
    };
}[] | {
    name: string;
    value: {
        String: string;
    };
}[];
type DataEnum = {
    name: string;
    values: EnumValues;
};
type Nested = {
    name: string;
    columns: Column[];
    jwt: boolean;
};
type ArrayType = {
    elementType: DataType;
    elementNullable: boolean;
};
type NamedTupleType = {
    fields: Array<[string, DataType]>;
};
type MapType = {
    keyType: DataType;
    valueType: DataType;
};
type JsonOptions = {
    max_dynamic_paths?: number;
    max_dynamic_types?: number;
    typed_paths?: Array<[string, DataType]>;
    skip_paths?: string[];
    skip_regexps?: string[];
};
type DataType = string | DataEnum | ArrayType | Nested | NamedTupleType | MapType | JsonOptions | {
    nullable: DataType;
};
interface Column {
    name: IdentifierBrandedString;
    data_type: DataType;
    required: boolean;
    unique: false;
    primary_key: boolean;
    default: string | null;
    materialized: string | null;
    alias: string | null;
    ttl: string | null;
    codec: string | null;
    annotations: [string, any][];
    comment: string | null;
}

/**
 * Type definition for typia validation functions
 */
interface TypiaValidators<T> {
    /** Typia validator function: returns { success: boolean, data?: T, errors?: any[] } */
    validate?: (data: unknown) => {
        success: boolean;
        data?: T;
        errors?: any[];
    };
    /** Typia assert function: throws on validation failure, returns T on success */
    assert?: (data: unknown) => T;
    /** Typia is function: returns boolean indicating if data matches type T */
    is?: (data: unknown) => data is T;
}
/**
 * Base class for all typed Moose dmv2 resources (OlapTable, Stream, etc.).
 * Handles the storage and injection of schema information (JSON schema and Column array)
 * provided by the Moose compiler plugin.
 *
 * @template T The data type (interface or type alias) defining the schema of the resource.
 * @template C The specific configuration type for the resource (e.g., OlapConfig, StreamConfig).
 */
declare class TypedBase<T, C> {
    /** The JSON schema representation of type T. Injected by the compiler plugin. */
    schema: IJsonSchemaCollection.IV3_1;
    /** The name assigned to this resource instance. */
    name: string;
    /** A dictionary mapping column names (keys of T) to their Column definitions. */
    columns: {
        [columnName in keyof Required<T>]: Column;
    };
    /** An array containing the Column definitions for this resource. Injected by the compiler plugin. */
    columnArray: Column[];
    /** The configuration object specific to this resource type. */
    config: C;
    /** Typia validation functions for type T. Injected by the compiler plugin for OlapTable. */
    validators?: TypiaValidators<T>;
    /** Optional metadata for the resource, always present as an object. */
    metadata: {
        [key: string]: any;
    };
    /**
     * Whether this resource allows extra fields beyond the defined columns.
     * When true, extra fields in payloads are passed through to streaming functions.
     * Injected by the compiler plugin when the type has an index signature.
     */
    allowExtraFields: boolean;
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
    constructor(name: string, config: C, schema?: IJsonSchemaCollection.IV3_1, columns?: Column[], validators?: TypiaValidators<T>, allowExtraFields?: boolean);
}

type ClickHousePrecision<P extends number> = {
    _clickhouse_precision?: P;
};
declare const DecimalRegex: "^-?\\d+(\\.\\d+)?$";
type ClickHouseDecimal<P extends number, S extends number> = {
    _clickhouse_precision?: P;
    _clickhouse_scale?: S;
} & Pattern<typeof DecimalRegex>;
type ClickHouseFixedStringSize<N extends number> = {
    _clickhouse_fixed_string_size?: N;
};
/**
 * FixedString(N) - Fixed-length string of exactly N bytes.
 *
 * ClickHouse stores exactly N bytes, padding shorter values with null bytes.
 * Values exceeding N bytes will throw an exception.
 *
 * Use for binary data: hashes, IP addresses, UUIDs, MAC addresses.
 *
 * @example
 * interface BinaryData {
 *   md5_hash: string & FixedString<16>;    // 16-byte MD5
 *   sha256_hash: string & FixedString<32>; // 32-byte SHA256
 * }
 */
type FixedString<N extends number> = string & ClickHouseFixedStringSize<N>;
type ClickHouseByteSize<N extends number> = {
    _clickhouse_byte_size?: N;
};
type LowCardinality = {
    _LowCardinality?: true;
};
type DateTime = Date;
type DateTime64<P extends number> = Date & ClickHousePrecision<P>;
type DateTimeString = string & tags.Format<"date-time">;
/**
 * JS Date objects cannot hold microsecond precision.
 * Use string as the runtime type to avoid losing information.
 */
type DateTime64String<P extends number> = string & tags.Format<"date-time"> & ClickHousePrecision<P>;
type Float32 = number & ClickHouseFloat<"float32">;
type Float64 = number & ClickHouseFloat<"float64">;
type Int8 = number & ClickHouseInt<"int8">;
type Int16 = number & ClickHouseInt<"int16">;
type Int32 = number & ClickHouseInt<"int32">;
type Int64 = number & ClickHouseInt<"int64">;
type UInt8 = number & ClickHouseInt<"uint8">;
type UInt16 = number & ClickHouseInt<"uint16">;
type UInt32 = number & ClickHouseInt<"uint32">;
type UInt64 = number & ClickHouseInt<"uint64">;
type Decimal<P extends number, S extends number> = string & ClickHouseDecimal<P, S>;
/**
 * Attach compression codec to a column type.
 *
 * Any valid ClickHouse codec expression is allowed. ClickHouse validates the codec at runtime.
 *
 * @template T The base data type
 * @template CodecExpr The codec expression (single codec or chain)
 *
 * @example
 * interface Metrics {
 *   // Single codec
 *   log_blob: string & ClickHouseCodec<"ZSTD(3)">;
 *
 *   // Codec chain (processed left-to-right)
 *   timestamp: Date & ClickHouseCodec<"Delta, LZ4">;
 *   temperature: number & ClickHouseCodec<"Gorilla, ZSTD">;
 *
 *   // Specialized codecs
 *   counter: number & ClickHouseCodec<"DoubleDelta">;
 *
 *   // Can combine with other annotations
 *   count: UInt64 & ClickHouseCodec<"DoubleDelta, LZ4">;
 * }
 */
type ClickHouseCodec<CodecExpr extends string> = {
    _clickhouse_codec?: CodecExpr;
};
type ClickHouseFloat<Value extends "float32" | "float64"> = tags.Type<Value extends "float32" ? "float" : "double">;
type ClickHouseInt<Value extends "int8" | "int16" | "int32" | "int64" | "uint8" | "uint16" | "uint32" | "uint64"> = Value extends "int32" | "int64" | "uint32" | "uint64" ? tags.Type<Value> : TagBase<{
    target: "number";
    kind: "type";
    value: Value;
    validate: Value extends "int8" ? "-128 <= $input && $input <= 127" : Value extends "int16" ? "-32768 <= $input && $input <= 32767" : Value extends "uint8" ? "0 <= $input && $input <= 255" : Value extends "uint16" ? "0 <= $input && $input <= 65535" : never;
    exclusive: true;
    schema: {
        type: "integer";
    };
}>;
/**
 * By default, nested objects map to the `Nested` type in clickhouse.
 * Write `nestedObject: AnotherInterfaceType & ClickHouseNamedTuple`
 * to map AnotherInterfaceType to the named tuple type.
 */
type ClickHouseNamedTuple = {
    _clickhouse_mapped_type?: "namedTuple";
};
type ClickHouseJson<maxDynamicPaths extends number | undefined = undefined, maxDynamicTypes extends number | undefined = undefined, skipPaths extends string[] = [], skipRegexes extends string[] = []> = {
    _clickhouse_mapped_type?: "JSON";
    _clickhouse_json_settings?: {
        maxDynamicPaths?: maxDynamicPaths;
        maxDynamicTypes?: maxDynamicTypes;
        skipPaths?: skipPaths;
        skipRegexes?: skipRegexes;
    };
};
type ClickHousePoint = [number, number] & {
    _clickhouse_mapped_type?: "Point";
};
type ClickHouseRing = ClickHousePoint[] & {
    _clickhouse_mapped_type?: "Ring";
};
type ClickHouseLineString = ClickHousePoint[] & {
    _clickhouse_mapped_type?: "LineString";
};
type ClickHouseMultiLineString = ClickHouseLineString[] & {
    _clickhouse_mapped_type?: "MultiLineString";
};
type ClickHousePolygon = ClickHouseRing[] & {
    _clickhouse_mapped_type?: "Polygon";
};
type ClickHouseMultiPolygon = ClickHousePolygon[] & {
    _clickhouse_mapped_type?: "MultiPolygon";
};
/**
 * typia may have trouble handling this type.
 * In which case, use {@link WithDefault} as a workaround
 *
 * @example
 * { field: number & ClickHouseDefault<"0"> }
 */
type ClickHouseDefault<SqlExpression extends string> = {
    _clickhouse_default?: SqlExpression;
};
/**
 * @example
 * {
 *   ...
 *   timestamp: Date;
 *   debugMessage: string & ClickHouseTTL<"timestamp + INTERVAL 1 WEEK">;
 * }
 */
type ClickHouseTTL<SqlExpression extends string> = {
    _clickhouse_ttl?: SqlExpression;
};
/**
 * ClickHouse MATERIALIZED column annotation.
 * The column value is computed at INSERT time and physically stored.
 * Cannot be explicitly inserted by users.
 *
 * @example
 * interface Events {
 *   eventTime: DateTime;
 *   // Extract date component - computed and stored at insert time
 *   eventDate: Date & ClickHouseMaterialized<"toDate(event_time)">;
 *
 *   userId: string;
 *   // Precompute hash for fast lookups
 *   userHash: UInt64 & ClickHouseMaterialized<"cityHash64(userId)">;
 * }
 *
 * @remarks
 * - MATERIALIZED and DEFAULT are mutually exclusive
 * - Can be combined with ClickHouseCodec for compression
 * - Changing the expression modifies the column in-place (existing values preserved)
 */
type ClickHouseMaterialized<SqlExpression extends string> = {
    _clickhouse_materialized?: SqlExpression;
};
/**
 * ClickHouse ALIAS column annotation.
 * The column value is computed on-the-fly at SELECT time and NOT physically stored.
 * Cannot be explicitly inserted by users.
 *
 * @example
 * interface Events {
 *   eventTime: DateTime;
 *   // Computed at query time, not stored on disk
 *   eventDate: Date & ClickHouseAlias<"toDate(event_time)">;
 *
 *   firstName: string;
 *   lastName: string;
 *   // Virtual computed column
 *   fullName: string & ClickHouseAlias<"concat(first_name, ' ', last_name)">;
 * }
 *
 * @remarks
 * - ALIAS, MATERIALIZED, and DEFAULT are mutually exclusive
 * - ALIAS columns are NOT stored on disk (saves storage, costs CPU at query time)
 * - Cannot be used in ORDER BY, PRIMARY KEY, or PARTITION BY
 * - Can be combined with ClickHouseCodec (though rarely useful since not stored)
 */
type ClickHouseAlias<SqlExpression extends string> = {
    _clickhouse_alias?: SqlExpression;
};
/**
 * See also {@link ClickHouseDefault}
 *
 * @example{ updated_at: WithDefault<Date, "now()"> }
 */
type WithDefault<T, _SqlExpression extends string> = T;
type IsComputed<T> = "_clickhouse_alias" extends keyof T ? true : "_clickhouse_materialized" extends keyof T ? true : false;
type HasDefault<T> = "_clickhouse_default" extends keyof T ? true : false;
/** Keys whose columns are ALIAS or MATERIALIZED — excluded from inserts entirely. */
type ComputedKeys<T> = {
    [K in keyof T]: IsComputed<T[K]> extends true ? K : never;
}[keyof T];
/** Keys whose columns carry a ClickHouseDefault expression — optional during inserts. */
type DefaultKeys<T> = {
    [K in keyof T]: HasDefault<T[K]> extends true ? K : never;
}[keyof T];
/**
 * Derive the insert-safe shape of a model:
 * - ALIAS / MATERIALIZED columns are **omitted** (ClickHouse computes them).
 * - DEFAULT columns become **optional** (ClickHouse fills them when absent).
 * - All other columns remain **required**.
 *
 * @example
 * interface Events {
 *   id: Key<string>;
 *   timestamp: Date;
 *   eventDate: Date & ClickHouseAlias<"toDate(timestamp)">;
 *   createdAt: Date & ClickHouseDefault<"now()">;
 * }
 *
 * // Insertable<Events> ≡ { id: string; timestamp: Date; createdAt?: Date }
 * const table = new OlapTable<Events>("events");
 * await table.insert([{ id: "1", timestamp: new Date() }]);
 */
type Insertable<T> = {
    [K in Exclude<keyof T, ComputedKeys<T> | DefaultKeys<T>>]: T[K];
} & {
    [K in Exclude<DefaultKeys<T>, ComputedKeys<T>>]?: T[K];
};
/**
 * ClickHouse table engine types supported by Moose.
 */
declare enum ClickHouseEngines {
    MergeTree = "MergeTree",
    ReplacingMergeTree = "ReplacingMergeTree",
    SummingMergeTree = "SummingMergeTree",
    AggregatingMergeTree = "AggregatingMergeTree",
    CollapsingMergeTree = "CollapsingMergeTree",
    VersionedCollapsingMergeTree = "VersionedCollapsingMergeTree",
    GraphiteMergeTree = "GraphiteMergeTree",
    S3Queue = "S3Queue",
    S3 = "S3",
    Buffer = "Buffer",
    Distributed = "Distributed",
    IcebergS3 = "IcebergS3",
    Kafka = "Kafka",
    Merge = "Merge",
    ReplicatedMergeTree = "ReplicatedMergeTree",
    ReplicatedReplacingMergeTree = "ReplicatedReplacingMergeTree",
    ReplicatedAggregatingMergeTree = "ReplicatedAggregatingMergeTree",
    ReplicatedSummingMergeTree = "ReplicatedSummingMergeTree",
    ReplicatedCollapsingMergeTree = "ReplicatedCollapsingMergeTree",
    ReplicatedVersionedCollapsingMergeTree = "ReplicatedVersionedCollapsingMergeTree"
}

/**
 * Defines how Moose manages the lifecycle of database resources when your code changes.
 *
 * This enum controls the behavior when there are differences between your code definitions
 * and the actual database schema or structure.
 */
declare enum LifeCycle {
    /**
     * Full automatic management (default behavior).
     * Moose will automatically modify database resources to match your code definitions,
     * including potentially destructive operations like dropping columns or tables.
     */
    FULLY_MANAGED = "FULLY_MANAGED",
    /**
     * Deletion-protected automatic management.
     * Moose will modify resources to match your code but will avoid destructive actions
     * such as dropping columns, or tables. Only additive changes are applied.
     */
    DELETION_PROTECTED = "DELETION_PROTECTED",
    /**
     * External management - no automatic changes.
     * Moose will not modify the database resources. You are responsible for managing
     * the schema and ensuring it matches your code definitions manually.
     */
    EXTERNALLY_MANAGED = "EXTERNALLY_MANAGED"
}

interface TableIndex {
    name: string;
    expression: string;
    type: string;
    arguments?: string[];
    granularity?: number;
}
interface TableProjection {
    name: string;
    body: string;
}
/**
 * Defines a constraint on a ClickHouse table.
 * Constraints can enforce data integrity rules or provide hints to the query optimizer.
 *
 * @example
 * ```typescript
 * constraints: [
 *   {
 *     name: "age_positive",
 *     expression: "age > 0",
 *     type: "CHECK"
 *   },
 *   {
 *     name: "valid_status",
 *     expression: "status IN ('active', 'inactive')",
 *     type: "ASSUME"
 *   }
 * ]
 * ```
 */
interface TableConstraint {
    /** The unique identifier or name of the constraint */
    name: string;
    /** The SQL or logical expression that defines the constraint condition */
    expression: string;
    /** The type of the constraint */
    type: "CHECK" | "ASSUME";
}
/**
 * Represents a failed record during insertion with error details
 */
interface FailedRecord<T> {
    /** The original record that failed to insert */
    record: T;
    /** The error message describing why the insertion failed */
    error: string;
    /** Optional: The index of this record in the original batch */
    index?: number;
}
/**
 * Result of an insert operation with detailed success/failure information
 */
interface InsertResult<T> {
    /** Number of records successfully inserted */
    successful: number;
    /** Number of records that failed to insert */
    failed: number;
    /** Total number of records processed */
    total: number;
    /** Detailed information about failed records (if record isolation was used) */
    failedRecords?: FailedRecord<T>[];
}
/**
 * Error handling strategy for insert operations
 */
type ErrorStrategy = "fail-fast" | "discard" | "isolate";
/**
 * Options for insert operations
 */
interface InsertOptions {
    /** Maximum number of bad records to tolerate before failing */
    allowErrors?: number;
    /** Maximum ratio of bad records to tolerate (0.0 to 1.0) before failing */
    allowErrorsRatio?: number;
    /** Error handling strategy */
    strategy?: ErrorStrategy;
    /** Whether to enable dead letter queue for failed records (future feature) */
    deadLetterQueue?: boolean;
    /** Whether to validate data against schema before insertion (default: true) */
    validate?: boolean;
    /** Whether to skip validation for individual records during 'isolate' strategy retries (default: false) */
    skipValidationOnRetry?: boolean;
}
/**
 * Validation result for a record with detailed error information
 */
interface ValidationError {
    /** The original record that failed validation */
    record: any;
    /** Detailed validation error message */
    error: string;
    /** Optional: The index of this record in the original batch */
    index?: number;
    /** The path to the field that failed validation */
    path?: string;
}
/**
 * Result of data validation with success/failure breakdown
 */
interface ValidationResult<T> {
    /** Records that passed validation */
    valid: T[];
    /** Records that failed validation with detailed error information */
    invalid: ValidationError[];
    /** Total number of records processed */
    total: number;
}
/**
 * S3Queue-specific table settings that can be modified with ALTER TABLE MODIFY SETTING
 * Note: Since ClickHouse 24.7, settings no longer require the 's3queue_' prefix
 */
interface S3QueueTableSettings {
    /** Processing mode: "ordered" for sequential or "unordered" for parallel processing */
    mode?: "ordered" | "unordered";
    /** What to do with files after processing: 'keep' or 'delete' */
    after_processing?: "keep" | "delete";
    /** ZooKeeper/Keeper path for coordination between replicas */
    keeper_path?: string;
    /** Number of retry attempts for failed files */
    loading_retries?: string;
    /** Number of threads for parallel processing */
    processing_threads_num?: string;
    /** Enable parallel inserts */
    parallel_inserts?: string;
    /** Enable logging to system.s3queue_log table */
    enable_logging_to_queue_log?: string;
    /** Last processed file path (for ordered mode) */
    last_processed_path?: string;
    /** Maximum number of tracked files in ZooKeeper */
    tracked_files_limit?: string;
    /** TTL for tracked files in seconds */
    tracked_file_ttl_sec?: string;
    /** Minimum polling timeout in milliseconds */
    polling_min_timeout_ms?: string;
    /** Maximum polling timeout in milliseconds */
    polling_max_timeout_ms?: string;
    /** Polling backoff in milliseconds */
    polling_backoff_ms?: string;
    /** Minimum cleanup interval in milliseconds */
    cleanup_interval_min_ms?: string;
    /** Maximum cleanup interval in milliseconds */
    cleanup_interval_max_ms?: string;
    /** Number of buckets for sharding (0 = disabled) */
    buckets?: string;
    /** Batch size for listing objects */
    list_objects_batch_size?: string;
    /** Enable hash ring filtering for distributed processing */
    enable_hash_ring_filtering?: string;
    /** Maximum files to process before committing */
    max_processed_files_before_commit?: string;
    /** Maximum rows to process before committing */
    max_processed_rows_before_commit?: string;
    /** Maximum bytes to process before committing */
    max_processed_bytes_before_commit?: string;
    /** Maximum processing time in seconds before committing */
    max_processing_time_sec_before_commit?: string;
    /** Use persistent processing nodes (available from 25.8) */
    use_persistent_processing_nodes?: string;
    /** TTL for persistent processing nodes in seconds */
    persistent_processing_nodes_ttl_seconds?: string;
    /** Additional settings */
    [key: string]: string | undefined;
}
/**
 * Base configuration shared by all table engines
 * @template T The data type of the records stored in the table.
 */
type BaseOlapConfig<T> = ({
    /**
     * Specifies the fields to use for ordering data within the ClickHouse table.
     * This is crucial for optimizing query performance.
     */
    orderByFields: (keyof T & string)[];
    orderByExpression?: undefined;
} | {
    orderByFields?: undefined;
    /**
     * An arbitrary ClickHouse SQL expression for the order by clause.
     *
     * `orderByExpression: "(id, name)"` is equivalent to `orderByFields: ["id", "name"]`
     * `orderByExpression: "tuple()"` means no sorting
     */
    orderByExpression: string;
} | {
    orderByFields?: undefined;
    orderByExpression?: undefined;
}) & {
    partitionBy?: string;
    /**
     * SAMPLE BY expression for approximate query processing.
     *
     * Examples:
     * ```typescript
     * // Single unsigned integer field
     * sampleByExpression: "userId"
     *
     * // Hash function on any field type
     * sampleByExpression: "cityHash64(id)"
     *
     * // Multiple fields with hash
     * sampleByExpression: "cityHash64(userId, timestamp)"
     * ```
     *
     * Requirements:
     * - Expression must evaluate to an unsigned integer (UInt8/16/32/64)
     * - Expression must be present in the ORDER BY clause
     * - If using hash functions, the same expression must appear in orderByExpression
     */
    sampleByExpression?: string;
    /**
     * Optional PRIMARY KEY expression.
     * When specified, this overrides the primary key inferred from Key<T> column annotations.
     *
     * This allows for:
     * - Complex primary keys using functions (e.g., "cityHash64(id)")
     * - Different column ordering in primary key vs schema definition
     * - Primary keys that differ from ORDER BY
     *
     * Example: primaryKeyExpression: "(userId, cityHash64(eventId))"
     *
     * Note: When this is set, any Key<T> annotations on columns are ignored for PRIMARY KEY generation.
     */
    primaryKeyExpression?: string;
    version?: string;
    lifeCycle?: LifeCycle;
    settings?: {
        [key: string]: string;
    };
    /**
     * Optional TTL configuration for the table.
     * e.g., "TTL timestamp + INTERVAL 90 DAY DELETE"
     *
     * Use the {@link ClickHouseTTL} type to configure column level TTL
     */
    ttl?: string;
    /** Optional secondary/data-skipping indexes */
    indexes?: TableIndex[];
    /** Optional projections for alternative data ordering within parts */
    projections?: TableProjection[];
    /**
     * Optional database name for multi-database support.
     * When not specified, uses the global ClickHouse config database.
     */
    database?: string;
    /**
     * Optional cluster name for ON CLUSTER support.
     * Use this to enable replicated tables across ClickHouse clusters.
     * The cluster must be defined in config.toml (dev environment only).
     * Example: cluster: "prod_cluster"
     */
    cluster?: string;
    /**
     * Optional seed filter applied when `moose seed clickhouse` populates a
     * local/testing database from a remote source.
     *
     * Example:
     * ```typescript
     * seedFilter: { limit: 100, where: "user_id = 10" }
     * ```
     */
    seedFilter?: {
        /** Maximum number of rows to seed for this table. */
        limit?: number;
        /** ClickHouse SQL WHERE expression to filter seeded rows. */
        where?: string;
    };
};
/**
 * Configuration for MergeTree engine
 * @template T The data type of the records stored in the table.
 */
type MergeTreeConfig<T> = BaseOlapConfig<T> & {
    engine: ClickHouseEngines.MergeTree;
    constraints?: TableConstraint[];
};
/**
 * Configuration for ReplacingMergeTree engine (deduplication)
 * @template T The data type of the records stored in the table.
 */
type ReplacingMergeTreeConfig<T> = BaseOlapConfig<T> & {
    engine: ClickHouseEngines.ReplacingMergeTree;
    ver?: keyof T & string;
    isDeleted?: keyof T & string;
    constraints?: TableConstraint[];
};
/**
 * Configuration for AggregatingMergeTree engine
 * @template T The data type of the records stored in the table.
 */
type AggregatingMergeTreeConfig<T> = BaseOlapConfig<T> & {
    engine: ClickHouseEngines.AggregatingMergeTree;
    constraints?: TableConstraint[];
};
/**
 * Configuration for SummingMergeTree engine
 * @template T The data type of the records stored in the table.
 */
type SummingMergeTreeConfig<T> = BaseOlapConfig<T> & {
    engine: ClickHouseEngines.SummingMergeTree;
    columns?: string[];
    constraints?: TableConstraint[];
};
/**
 * Configuration for CollapsingMergeTree engine
 * @template T The data type of the records stored in the table.
 */
type CollapsingMergeTreeConfig<T> = BaseOlapConfig<T> & {
    engine: ClickHouseEngines.CollapsingMergeTree;
    sign: keyof T & string;
    constraints?: TableConstraint[];
};
/**
 * Configuration for VersionedCollapsingMergeTree engine
 * @template T The data type of the records stored in the table.
 */
type VersionedCollapsingMergeTreeConfig<T> = BaseOlapConfig<T> & {
    engine: ClickHouseEngines.VersionedCollapsingMergeTree;
    sign: keyof T & string;
    ver: keyof T & string;
    constraints?: TableConstraint[];
};
interface ReplicatedEngineProperties {
    keeperPath?: string;
    replicaName?: string;
}
/**
 * Configuration for ReplicatedMergeTree engine
 * @template T The data type of the records stored in the table.
 *
 * Note: keeperPath and replicaName are optional. Omit them for ClickHouse Cloud,
 * which manages replication automatically. For self-hosted with ClickHouse Keeper,
 * provide both parameters or neither (to use server defaults).
 */
type ReplicatedMergeTreeConfig<T> = Omit<MergeTreeConfig<T>, "engine"> & ReplicatedEngineProperties & {
    engine: ClickHouseEngines.ReplicatedMergeTree;
};
/**
 * Configuration for ReplicatedReplacingMergeTree engine
 * @template T The data type of the records stored in the table.
 *
 * Note: keeperPath and replicaName are optional. Omit them for ClickHouse Cloud,
 * which manages replication automatically. For self-hosted with ClickHouse Keeper,
 * provide both parameters or neither (to use server defaults).
 */
type ReplicatedReplacingMergeTreeConfig<T> = Omit<ReplacingMergeTreeConfig<T>, "engine"> & ReplicatedEngineProperties & {
    engine: ClickHouseEngines.ReplicatedReplacingMergeTree;
};
/**
 * Configuration for ReplicatedAggregatingMergeTree engine
 * @template T The data type of the records stored in the table.
 *
 * Note: keeperPath and replicaName are optional. Omit them for ClickHouse Cloud,
 * which manages replication automatically. For self-hosted with ClickHouse Keeper,
 * provide both parameters or neither (to use server defaults).
 */
type ReplicatedAggregatingMergeTreeConfig<T> = Omit<AggregatingMergeTreeConfig<T>, "engine"> & ReplicatedEngineProperties & {
    engine: ClickHouseEngines.ReplicatedAggregatingMergeTree;
};
/**
 * Configuration for ReplicatedSummingMergeTree engine
 * @template T The data type of the records stored in the table.
 *
 * Note: keeperPath and replicaName are optional. Omit them for ClickHouse Cloud,
 * which manages replication automatically. For self-hosted with ClickHouse Keeper,
 * provide both parameters or neither (to use server defaults).
 */
type ReplicatedSummingMergeTreeConfig<T> = Omit<SummingMergeTreeConfig<T>, "engine"> & ReplicatedEngineProperties & {
    engine: ClickHouseEngines.ReplicatedSummingMergeTree;
};
/**
 * Configuration for ReplicatedCollapsingMergeTree engine
 * @template T The data type of the records stored in the table.
 *
 * Note: keeperPath and replicaName are optional. Omit them for ClickHouse Cloud,
 * which manages replication automatically. For self-hosted with ClickHouse Keeper,
 * provide both parameters or neither (to use server defaults).
 */
type ReplicatedCollapsingMergeTreeConfig<T> = Omit<CollapsingMergeTreeConfig<T>, "engine"> & ReplicatedEngineProperties & {
    engine: ClickHouseEngines.ReplicatedCollapsingMergeTree;
};
/**
 * Configuration for ReplicatedVersionedCollapsingMergeTree engine
 * @template T The data type of the records stored in the table.
 *
 * Note: keeperPath and replicaName are optional. Omit them for ClickHouse Cloud,
 * which manages replication automatically. For self-hosted with ClickHouse Keeper,
 * provide both parameters or neither (to use server defaults).
 */
type ReplicatedVersionedCollapsingMergeTreeConfig<T> = Omit<VersionedCollapsingMergeTreeConfig<T>, "engine"> & ReplicatedEngineProperties & {
    engine: ClickHouseEngines.ReplicatedVersionedCollapsingMergeTree;
};
/**
 * Configuration for S3Queue engine - only non-alterable constructor parameters.
 * S3Queue-specific settings like 'mode', 'keeper_path', etc. should be specified
 * in the settings field, not here.
 * @template T The data type of the records stored in the table.
 */
type S3QueueConfig<T> = Omit<BaseOlapConfig<T>, "settings" | "orderByFields" | "partitionBy" | "sampleByExpression" | "projections"> & {
    engine: ClickHouseEngines.S3Queue;
    /** S3 bucket path with wildcards (e.g., 's3://bucket/data/*.json') */
    s3Path: string;
    /** Data format (e.g., 'JSONEachRow', 'CSV', 'Parquet') */
    format: string;
    /** AWS access key ID (optional, omit for NOSIGN/public buckets) */
    awsAccessKeyId?: string;
    /** AWS secret access key */
    awsSecretAccessKey?: string;
    /** Compression type (e.g., 'gzip', 'zstd') */
    compression?: string;
    /** Custom HTTP headers */
    headers?: {
        [key: string]: string;
    };
    /**
     * S3Queue-specific table settings that can be modified with ALTER TABLE MODIFY SETTING.
     * These settings control the behavior of the S3Queue engine.
     */
    settings?: S3QueueTableSettings;
};
/**
 * Configuration for S3 engine
 * Note: S3 engine supports ORDER BY clause, unlike S3Queue, Buffer, and Distributed engines
 * @template T The data type of the records stored in the table.
 */
type S3Config<T> = Omit<BaseOlapConfig<T>, "sampleByExpression" | "projections"> & {
    engine: ClickHouseEngines.S3;
    /** S3 path (e.g., 's3://bucket/path/file.json') */
    path: string;
    /** Data format (e.g., 'JSONEachRow', 'CSV', 'Parquet') */
    format: string;
    /** AWS access key ID (optional, omit for NOSIGN/public buckets) */
    awsAccessKeyId?: string;
    /** AWS secret access key */
    awsSecretAccessKey?: string;
    /** Compression type (e.g., 'gzip', 'zstd', 'auto') */
    compression?: string;
    /** Partition strategy (optional) */
    partitionStrategy?: string;
    /** Partition columns in data file (optional) */
    partitionColumnsInDataFile?: string;
};
/**
 * Configuration for Buffer engine
 * @template T The data type of the records stored in the table.
 */
type BufferConfig<T> = Omit<BaseOlapConfig<T>, "orderByFields" | "orderByExpression" | "partitionBy" | "sampleByExpression" | "projections"> & {
    engine: ClickHouseEngines.Buffer;
    /** Target database name for the destination table */
    targetDatabase: string;
    /** Target table name where data will be flushed */
    targetTable: string;
    /** Number of buffer layers (typically 16) */
    numLayers: number;
    /** Minimum time in seconds before flushing */
    minTime: number;
    /** Maximum time in seconds before flushing */
    maxTime: number;
    /** Minimum number of rows before flushing */
    minRows: number;
    /** Maximum number of rows before flushing */
    maxRows: number;
    /** Minimum bytes before flushing */
    minBytes: number;
    /** Maximum bytes before flushing */
    maxBytes: number;
    /** Optional: Flush time in seconds */
    flushTime?: number;
    /** Optional: Flush number of rows */
    flushRows?: number;
    /** Optional: Flush number of bytes */
    flushBytes?: number;
};
/**
 * Configuration for Distributed engine
 * @template T The data type of the records stored in the table.
 */
type DistributedConfig<T> = Omit<BaseOlapConfig<T>, "orderByFields" | "orderByExpression" | "partitionBy" | "sampleByExpression" | "projections"> & {
    engine: ClickHouseEngines.Distributed;
    /** Cluster name from the ClickHouse configuration */
    cluster: string;
    /** Database name on the cluster */
    targetDatabase: string;
    /** Table name on the cluster */
    targetTable: string;
    /** Optional: Sharding key expression for data distribution */
    shardingKey?: string;
    /** Optional: Policy name for data distribution */
    policyName?: string;
    /** Optional table-level constraints (passed through for type compatibility, but
     *  constraints are only meaningful on the underlying _local MergeTree tables) */
    constraints?: TableConstraint[];
};
/** Kafka table settings. See: https://clickhouse.com/docs/engines/table-engines/integrations/kafka */
interface KafkaTableSettings {
    kafka_security_protocol?: "PLAINTEXT" | "SSL" | "SASL_PLAINTEXT" | "SASL_SSL";
    kafka_sasl_mechanism?: "GSSAPI" | "PLAIN" | "SCRAM-SHA-256" | "SCRAM-SHA-512" | "OAUTHBEARER";
    kafka_sasl_username?: string;
    kafka_sasl_password?: string;
    kafka_schema?: string;
    kafka_num_consumers?: string;
    kafka_max_block_size?: string;
    kafka_skip_broken_messages?: string;
    kafka_commit_every_batch?: string;
    kafka_client_id?: string;
    kafka_poll_timeout_ms?: string;
    kafka_poll_max_batch_size?: string;
    kafka_flush_interval_ms?: string;
    kafka_consumer_reschedule_ms?: string;
    kafka_thread_per_consumer?: string;
    kafka_handle_error_mode?: "default" | "stream";
    kafka_commit_on_select?: string;
    kafka_max_rows_per_message?: string;
    kafka_compression_codec?: string;
    kafka_compression_level?: string;
}
/** Kafka engine for streaming data from Kafka topics. Additional settings go in `settings`. */
type KafkaConfig<T> = Omit<BaseOlapConfig<T>, "orderByFields" | "orderByExpression" | "partitionBy" | "sampleByExpression" | "projections"> & {
    engine: ClickHouseEngines.Kafka;
    brokerList: string;
    topicList: string;
    groupName: string;
    format: string;
    settings?: KafkaTableSettings;
};
/**
 * Configuration for IcebergS3 engine - read-only Iceberg table access
 *
 * Provides direct querying of Apache Iceberg tables stored on S3.
 * Data is not copied; queries stream directly from Parquet/ORC files.
 *
 * @template T The data type of the records stored in the table.
 *
 * @example
 * ```typescript
 * const lakeEvents = new OlapTable<Event>("lake_events", {
 *   engine: ClickHouseEngines.IcebergS3,
 *   path: "s3://datalake/events/",
 *   format: "Parquet",
 *   awsAccessKeyId: mooseRuntimeEnv.get("AWS_ACCESS_KEY_ID"),
 *   awsSecretAccessKey: mooseRuntimeEnv.get("AWS_SECRET_ACCESS_KEY")
 * });
 * ```
 *
 * @remarks
 * - IcebergS3 engine is read-only
 * - Does not support ORDER BY, PARTITION BY, or SAMPLE BY clauses
 * - Queries always see the latest Iceberg snapshot (with metadata cache)
 */
type IcebergS3Config<T> = Omit<BaseOlapConfig<T>, "orderByFields" | "orderByExpression" | "partitionBy" | "sampleByExpression" | "projections"> & {
    engine: ClickHouseEngines.IcebergS3;
    /** S3 path to Iceberg table root (e.g., 's3://bucket/warehouse/events/') */
    path: string;
    /** Data format - 'Parquet' or 'ORC' */
    format: "Parquet" | "ORC";
    /** AWS access key ID (optional, omit for NOSIGN/public buckets) */
    awsAccessKeyId?: string;
    /** AWS secret access key (optional) */
    awsSecretAccessKey?: string;
    /** Compression type (optional: 'gzip', 'zstd', 'auto') */
    compression?: string;
};
/**
 * Configuration for Merge engine - read-only view over multiple tables matching a regex pattern.
 *
 * @template T The data type of the records in the source tables.
 *
 * @example
 * ```typescript
 * const allEvents = new OlapTable<Event>("all_events", {
 *   engine: ClickHouseEngines.Merge,
 *   sourceDatabase: "currentDatabase()",
 *   tablesRegexp: "^events_\\d+$",
 * });
 * ```
 *
 * @remarks
 * - Merge engine is read-only; INSERT operations are not supported
 * - Cannot be used as a destination in IngestPipeline
 * - Does not support ORDER BY, PARTITION BY, or SAMPLE BY clauses
 */
type MergeConfig<T> = Omit<BaseOlapConfig<T>, "orderByFields" | "orderByExpression" | "partitionBy" | "sampleByExpression" | "projections"> & {
    engine: ClickHouseEngines.Merge;
    /** Database to scan for source tables (literal name, currentDatabase(), or REGEXP(...)) */
    sourceDatabase: string;
    /** Regex pattern to match table names in the source database */
    tablesRegexp: string;
};
/**
 * Legacy configuration (backward compatibility) - defaults to MergeTree engine
 * @template T The data type of the records stored in the table.
 */
type LegacyOlapConfig<T> = BaseOlapConfig<T>;
type EngineConfig<T> = MergeTreeConfig<T> | ReplacingMergeTreeConfig<T> | AggregatingMergeTreeConfig<T> | SummingMergeTreeConfig<T> | CollapsingMergeTreeConfig<T> | VersionedCollapsingMergeTreeConfig<T> | ReplicatedMergeTreeConfig<T> | ReplicatedReplacingMergeTreeConfig<T> | ReplicatedAggregatingMergeTreeConfig<T> | ReplicatedSummingMergeTreeConfig<T> | ReplicatedCollapsingMergeTreeConfig<T> | ReplicatedVersionedCollapsingMergeTreeConfig<T> | S3QueueConfig<T> | S3Config<T> | BufferConfig<T> | DistributedConfig<T> | IcebergS3Config<T> | KafkaConfig<T> | MergeConfig<T>;
/**
 * Union of all engine-specific configurations (new API)
 * @template T The data type of the records stored in the table.
 */
type OlapConfig<T> = EngineConfig<T> | LegacyOlapConfig<T>;
/**
 * Represents an OLAP (Online Analytical Processing) table, typically corresponding to a ClickHouse table.
 * Provides a typed interface for interacting with the table.
 *
 * @template T The data type of the records stored in the table. The structure of T defines the table schema.
 */
declare class OlapTable<T> extends TypedBase<T, OlapConfig<T>> {
    name: IdentifierBrandedString;
    /** @internal */
    readonly kind = "OlapTable";
    /** @internal Typia validators for Insertable<T> — used during insert validation */
    private insertValidators?;
    /** @internal Memoized ClickHouse client for reusing connections across insert calls */
    private _memoizedClient?;
    /** @internal Hash of the configuration used to create the memoized client */
    private _configHash?;
    /** @internal Cached table name to avoid repeated generation */
    private _cachedTableName?;
    /**
     * Creates a new OlapTable instance.
     * @param name The name of the table. This name is used for the underlying ClickHouse table.
     * @param config Optional configuration for the OLAP table.
     */
    constructor(name: string, config?: OlapConfig<T>);
    /** @internal **/
    constructor(name: string, config: OlapConfig<T>, schema: IJsonSchemaCollection.IV3_1, columns: Column[], validators?: TypiaValidators<T>, insertValidators?: TypiaValidators<Insertable<T>>);
    /**
     * Generates the versioned table name following Moose's naming convention
     * Format: {tableName}_{version_with_dots_replaced_by_underscores}
     */
    private generateTableName;
    /**
     * Creates a fast hash of the ClickHouse configuration.
     * Uses crypto.createHash for better performance than JSON.stringify.
     *
     * @private
     */
    private createConfigHash;
    /**
     * Gets or creates a memoized ClickHouse client.
     * The client is cached and reused across multiple insert calls for better performance.
     * If the configuration changes, a new client will be created.
     *
     * @private
     */
    private getMemoizedClient;
    /**
     * Closes the memoized ClickHouse client if it exists.
     * This is useful for cleaning up connections when the table instance is no longer needed.
     * The client will be automatically recreated on the next insert call if needed.
     */
    closeClient(): Promise<void>;
    /**
     * Validates a single record using typia's comprehensive type checking.
     * This provides the most accurate validation as it uses the exact TypeScript type information.
     *
     * @param record The record to validate
     * @returns Validation result with detailed error information
     */
    validateRecord(record: unknown): {
        success: boolean;
        data?: T;
        errors?: string[];
    };
    /**
     * Type guard function using typia's is() function.
     * Provides compile-time type narrowing for TypeScript.
     *
     * @param record The record to check
     * @returns True if record matches type T, with type narrowing
     */
    isValidRecord(record: unknown): record is T;
    /**
     * Assert that a record matches type T, throwing detailed errors if not.
     * Uses typia's assert() function for the most detailed error reporting.
     *
     * @param record The record to assert
     * @returns The validated and typed record
     * @throws Detailed validation error if record doesn't match type T
     */
    assertValidRecord(record: unknown): T;
    /**
     * Validates records for insert using Insertable<T> validators when available.
     * Falls back to the full T validators if insert validators weren't generated.
     * @private
     */
    private validateInsertRecords;
    /**
     * Validates an array of records with comprehensive error reporting.
     * Uses the most appropriate validation method available (typia or basic).
     *
     * @param data Array of records to validate
     * @returns Detailed validation results
     */
    validateRecords(data: unknown[]): Promise<ValidationResult<T>>;
    /**
     * Optimized batch retry that minimizes individual insert operations.
     * Groups records into smaller batches to reduce round trips while still isolating failures.
     *
     * @private
     */
    private retryIndividualRecords;
    /**
     * Validates input parameters and strategy compatibility
     * @private
     */
    private validateInsertParameters;
    /**
     * Handles early return cases for empty data
     * @private
     */
    private handleEmptyData;
    /**
     * Performs pre-insertion validation for array data
     * @private
     */
    private performPreInsertionValidation;
    /**
     * Handles validation errors based on the specified strategy
     * @private
     */
    private handleValidationErrors;
    /**
     * Checks if validation errors exceed configured thresholds
     * @private
     */
    private checkValidationThresholds;
    /**
     * Optimized insert options preparation with better memory management
     * @private
     */
    private prepareInsertOptions;
    /**
     * Creates success result for completed insertions
     * @private
     */
    private createSuccessResult;
    /**
     * Handles insertion errors based on the specified strategy
     * @private
     */
    private handleInsertionError;
    /**
     * Handles the isolate strategy for insertion errors
     * @private
     */
    private handleIsolateStrategy;
    /**
     * Checks if insertion errors exceed configured thresholds
     * @private
     */
    private checkInsertionThresholds;
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
    private mapToClickhouseRecord;
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
    insert(data: Insertable<T>[] | Readable, options?: InsertOptions): Promise<InsertResult<T>>;
}

/**
 * @fileoverview Stream SDK for data streaming operations in Moose.
 *
 * This module provides the core streaming functionality including:
 * - Stream creation and configuration
 * - Message transformations between streams
 * - Consumer registration for message processing
 * - Dead letter queue handling for error recovery
 *
 * @module Stream
 */

/**
 * Represents zero, one, or many values of type T.
 * Used for flexible return types in transformations where a single input
 * can produce no output, one output, or multiple outputs.
 *
 * @template T The type of the value(s)
 * @example
 * ```typescript
 * // Can return a single value
 * const single: ZeroOrMany<string> = "hello";
 *
 * // Can return an array
 * const multiple: ZeroOrMany<string> = ["hello", "world"];
 *
 * // Can return null/undefined to filter out
 * const filtered: ZeroOrMany<string> = null;
 * ```
 */
type ZeroOrMany<T> = T | T[] | undefined | null;
/**
 * Function type for transforming records from one type to another.
 * Supports both synchronous and asynchronous transformations.
 *
 * @template T The input record type
 * @template U The output record type
 * @param record The input record to transform
 * @returns The transformed record(s), or null/undefined to filter out
 *
 * @example
 * ```typescript
 * const transform: SyncOrAsyncTransform<InputType, OutputType> = (record) => {
 *   return { ...record, processed: true };
 * };
 * ```
 */
type SyncOrAsyncTransform<T, U> = (record: T) => ZeroOrMany<U> | Promise<ZeroOrMany<U>>;
/**
 * Function type for consuming records without producing output.
 * Used for side effects like logging, external API calls, or database writes.
 *
 * @template T The record type to consume
 * @param record The record to process
 * @returns Promise<void> or void
 *
 * @example
 * ```typescript
 * const consumer: Consumer<UserEvent> = async (event) => {
 *   await sendToAnalytics(event);
 * };
 * ```
 */
type Consumer<T> = (record: T) => Promise<void> | void;
/**
 * Configuration options for stream transformations.
 *
 * @template T The type of records being transformed
 */
interface TransformConfig<T> {
    /**
     * Optional version identifier for this transformation.
     * Multiple transformations to the same destination can coexist with different versions.
     */
    version?: string;
    /**
     * Optional metadata for documentation and tracking purposes.
     */
    metadata?: {
        description?: string;
    };
    /**
     * Optional dead letter queue for handling transformation failures.
     * Failed records will be sent to this queue for manual inspection or reprocessing.
     * Uses {@link Stream.defaultDeadLetterQueue} by default
     * unless a DeadLetterQueue is provided, or it is explicitly disabled with a null value
     */
    deadLetterQueue?: DeadLetterQueue<T> | null;
    /**
     * @internal Source file path where this transform was declared.
     * Automatically captured from stack trace.
     */
    sourceFile?: string;
}
/**
 * Configuration options for stream consumers.
 *
 * @template T The type of records being consumed
 */
interface ConsumerConfig<T> {
    /**
     * Optional version identifier for this consumer.
     * Multiple consumers can coexist with different versions.
     */
    version?: string;
    /**
     * Optional dead letter queue for handling consumer failures.
     * Failed records will be sent to this queue for manual inspection or reprocessing.
     * Uses {@link Stream.defaultDeadLetterQueue} by default
     * unless a DeadLetterQueue is provided, or it is explicitly disabled with a null value
     */
    deadLetterQueue?: DeadLetterQueue<T> | null;
    /**
     * @internal Source file path where this consumer was declared.
     * Automatically captured from stack trace.
     */
    sourceFile?: string;
}
type SchemaRegistryEncoding = "JSON" | "AVRO" | "PROTOBUF";
type SchemaRegistryReference = {
    id: number;
} | {
    subjectLatest: string;
} | {
    subject: string;
    version: number;
};
interface KafkaSchemaConfig {
    kind: SchemaRegistryEncoding;
    reference: SchemaRegistryReference;
}
/**
 * Represents a message routed to a specific destination stream.
 * Used internally by the multi-transform functionality to specify
 * where transformed messages should be sent.
 *
 * @internal
 */
declare class RoutedMessage {
    /** The destination stream for the message */
    destination: Stream<any>;
    /** The message value(s) to send */
    values: ZeroOrMany<any>;
    /**
     * Creates a new routed message.
     *
     * @param destination The target stream
     * @param values The message(s) to route
     */
    constructor(destination: Stream<any>, values: ZeroOrMany<any>);
}
/**
 * Configuration options for a data stream (e.g., a Redpanda topic).
 * @template T The data type of the messages in the stream.
 */
interface StreamConfig<T> {
    /**
     * Specifies the number of partitions for the stream. Affects parallelism and throughput.
     */
    parallelism?: number;
    /**
     * Specifies the data retention period for the stream in seconds. Messages older than this may be deleted.
     */
    retentionPeriod?: number;
    /**
     * An optional destination OLAP table where messages from this stream should be automatically ingested.
     */
    destination?: OlapTable<T>;
    /**
     * An optional version string for this configuration. Can be used for tracking changes or managing deployments.
     */
    version?: string;
    metadata?: {
        description?: string;
    };
    lifeCycle?: LifeCycle;
    defaultDeadLetterQueue?: DeadLetterQueue<T>;
    /** Optional Schema Registry configuration for this stream */
    schemaConfig?: KafkaSchemaConfig;
}
/**
 * Represents a data stream, typically corresponding to a Redpanda topic.
 * Provides a typed interface for producing to and consuming from the stream, and defining transformations.
 *
 * @template T The data type of the messages flowing through the stream. The structure of T defines the message schema.
 */
declare class Stream<T> extends TypedBase<T, StreamConfig<T>> {
    defaultDeadLetterQueue?: DeadLetterQueue<T>;
    /** @internal Memoized KafkaJS producer for reusing connections across sends */
    private _memoizedProducer?;
    /** @internal Hash of the configuration used to create the memoized Kafka producer */
    private _kafkaConfigHash?;
    /**
     * Creates a new Stream instance.
     * @param name The name of the stream. This name is used for the underlying Redpanda topic.
     * @param config Optional configuration for the stream.
     */
    constructor(name: string, config?: StreamConfig<T>);
    /**
     * @internal
     * Note: `validators` parameter is a positional placeholder (always undefined for Stream).
     * It exists because TypedBase has validators as the 5th param, and we need to pass
     * allowExtraFields as the 6th param. Stream doesn't use validators.
     */
    constructor(name: string, config: StreamConfig<T>, schema: IJsonSchemaCollection.IV3_1, columns: Column[], validators: undefined, allowExtraFields: boolean);
    /**
     * Internal map storing transformation configurations.
     * Maps destination stream names to arrays of transformation functions and their configs.
     *
     * @internal
     */
    _transformations: Map<string, [Stream<any>, SyncOrAsyncTransform<T, any>, TransformConfig<T>][]>;
    /**
     * Internal function for multi-stream transformations.
     * Allows a single transformation to route messages to multiple destinations.
     *
     * @internal
     */
    _multipleTransformations?: (record: T) => [RoutedMessage];
    /**
     * Internal array storing consumer configurations.
     *
     * @internal
     */
    _consumers: {
        consumer: Consumer<T>;
        config: ConsumerConfig<T>;
    }[];
    /**
     * Builds the full Kafka topic name including optional namespace and version suffix.
     * Version suffix is appended as _x_y_z where dots in version are replaced with underscores.
     */
    private buildFullTopicName;
    /**
     * Creates a fast hash string from relevant Kafka configuration fields.
     */
    private createConfigHash;
    /**
     * Gets or creates a memoized KafkaJS producer using runtime configuration.
     */
    private getMemoizedProducer;
    /**
     * Closes the memoized Kafka producer if it exists.
     */
    closeProducer(): Promise<void>;
    /**
     * Sends one or more records to this stream's Kafka topic.
     * Values are JSON-serialized as message values.
     */
    send(values: ZeroOrMany<T>): Promise<void>;
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
    addTransform<U>(destination: Stream<U>, transformation: SyncOrAsyncTransform<T, U>, config?: TransformConfig<T>): void;
    /**
     * Adds a consumer function that processes messages from this stream.
     * Multiple consumers can be added if they have distinct `version` identifiers in their config.
     *
     * @param consumer A function that takes a message of type T and performs an action (e.g., side effect, logging). Should return void or Promise<void>.
     * @param config Optional configuration for this specific consumer, like a version.
     */
    addConsumer(consumer: Consumer<T>, config?: ConsumerConfig<T>): void;
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
    routed: (values: ZeroOrMany<T>) => RoutedMessage;
    /**
     * Adds a single transformation function that can route messages to multiple destination streams.
     * This is an alternative to adding multiple individual `addTransform` calls.
     * Only one multi-transform function can be added per stream.
     *
     * @param transformation A function that takes a message of type T and returns an array of `RoutedMessage` objects,
     *                       each specifying a destination stream and the message(s) to send to it.
     */
    addMultiTransform(transformation: (record: T) => [RoutedMessage]): void;
}
/**
 * Base model for dead letter queue entries.
 * Contains the original failed record along with error information.
 */
interface DeadLetterModel {
    /** The original record that failed processing */
    originalRecord: Record<string, any>;
    /** Human-readable error message describing the failure */
    errorMessage: string;
    /** Classification of the error type (e.g., "ValidationError", "TransformError") */
    errorType: string;
    /** Timestamp when the failure occurred */
    failedAt: Date;
    /** The source component where the failure occurred */
    source: "api" | "transform" | "table";
}
/**
 * Enhanced dead letter model with type recovery functionality.
 * Extends the base model with the ability to recover the original typed record.
 *
 * @template T The original record type before failure
 */
interface DeadLetter<T> extends DeadLetterModel {
    /**
     * Recovers the original record as its typed form.
     * Useful for reprocessing failed records with proper type safety.
     *
     * @returns The original record cast to type T
     */
    asTyped: () => T;
}
/**
 * Specialized stream for handling failed records (dead letters).
 * Provides type-safe access to failed records for reprocessing or analysis.
 *
 * @template T The original record type that failed processing
 *
 * @example
 * ```typescript
 * const dlq = new DeadLetterQueue<UserEvent>("user-events-dlq");
 *
 * dlq.addConsumer(async (deadLetter) => {
 *   const originalEvent = deadLetter.asTyped();
 *   console.log(`Failed event: ${deadLetter.errorMessage}`);
 *   // Potentially reprocess or alert
 * });
 * ```
 */
declare class DeadLetterQueue<T> extends Stream<DeadLetterModel> {
    /**
     * Creates a new DeadLetterQueue instance.
     * @param name The name of the dead letter queue stream
     * @param config Optional configuration for the stream. The metadata property is always present and includes stackTrace.
     */
    constructor(name: string, config?: StreamConfig<DeadLetterModel>);
    /** @internal **/
    constructor(name: string, config: StreamConfig<DeadLetterModel>, validate: (originalRecord: any) => T);
    /**
     * Internal type guard function for validating and casting original records.
     *
     * @internal
     */
    private typeGuard;
    /**
     * Adds a transformation step for dead letter records.
     * The transformation function receives a DeadLetter<T> with type recovery capabilities.
     *
     * @template U The output type for the transformation
     * @param destination The destination stream for transformed messages
     * @param transformation Function to transform dead letter records
     * @param config Optional transformation configuration
     */
    addTransform<U>(destination: Stream<U>, transformation: SyncOrAsyncTransform<DeadLetter<T>, U>, config?: TransformConfig<DeadLetterModel>): void;
    /**
     * Adds a consumer for dead letter records.
     * The consumer function receives a DeadLetter<T> with type recovery capabilities.
     *
     * @param consumer Function to process dead letter records
     * @param config Optional consumer configuration
     */
    addConsumer(consumer: Consumer<DeadLetter<T>>, config?: ConsumerConfig<DeadLetterModel>): void;
    /**
     * Adds a multi-stream transformation for dead letter records.
     * The transformation function receives a DeadLetter<T> with type recovery capabilities.
     *
     * @param transformation Function to route dead letter records to multiple destinations
     */
    addMultiTransform(transformation: (record: DeadLetter<T>) => [RoutedMessage]): void;
}

/**
 * Context passed to task handlers. Single param to future-proof API changes.
 *
 * - state: shared mutable state for the task and its lifecycle hooks
 * - input: optional typed input for the task (undefined when task has no input)
 */
/**
 * Task handler context. If the task declares an input type (T != null),
 * `input` is required and strongly typed. For no-input tasks (T = null),
 * `input` is omitted/optional.
 */
type TaskContext<TInput> = TInput extends null ? {
    state: any;
    input?: null;
} : {
    state: any;
    input: TInput;
};
/**
 * Configuration options for defining a task within a workflow.
 *
 * @template T - The input type for the task
 * @template R - The return type for the task
 */
interface TaskConfig<T, R> {
    /** The main function that executes the task logic */
    run: (context: TaskContext<T>) => Promise<R>;
    /**
     * Optional array of tasks to execute after this task completes successfully.
     * Supports all combinations of input types (real type or null) and output types (real type or void).
     * When this task returns void, onComplete tasks expect null as input.
     * When this task returns a real type, onComplete tasks expect that type as input.
     */
    onComplete?: (Task<R extends void ? null : R, any> | Task<R extends void ? null : R, void>)[];
    /**
     * Optional function that is called when the task is cancelled.
     */
    /** Optional function that is called when the task is cancelled. */
    onCancel?: (context: TaskContext<T>) => Promise<void>;
    /** Optional timeout duration for the task execution (e.g., "30s", "5m") */
    timeout?: string;
    /** Optional number of retry attempts if the task fails */
    retries?: number;
}
/**
 * Represents a single task within a workflow system.
 *
 * A Task encapsulates the execution logic, completion handlers, and configuration
 * for a unit of work that can be chained with other tasks in a workflow.
 *
 * @template T - The input type that this task expects
 * @template R - The return type that this task produces
 */
declare class Task<T, R> {
    readonly name: string;
    readonly config: TaskConfig<T, R>;
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
    constructor(name: string, config: TaskConfig<T, R>);
}
/**
 * Configuration options for defining a workflow.
 *
 * A workflow orchestrates the execution of multiple tasks in a defined sequence
 * or pattern, with support for scheduling, retries, and timeouts.
 */
interface WorkflowConfig {
    /**
     * The initial task that begins the workflow execution.
     * Supports all combinations of input types (real type or null) and output types (real type or void):
     * - Task<null, OutputType>: No input, returns a type
     * - Task<null, void>: No input, returns nothing
     * - Task<InputType, OutputType>: Has input, returns a type
     * - Task<InputType, void>: Has input, returns nothing
     */
    startingTask: Task<null, any> | Task<null, void> | Task<any, any> | Task<any, void>;
    /** Optional number of retry attempts if the entire workflow fails */
    retries?: number;
    /** Optional timeout duration for the entire workflow execution (e.g., "10m", "1h") */
    timeout?: string;
    /** Optional cron-style schedule string for automated workflow execution */
    schedule?: string;
}
/**
 * Represents a complete workflow composed of interconnected tasks.
 *
 * A Workflow manages the execution flow of multiple tasks, handling scheduling,
 * error recovery, and task orchestration. Once created, workflows are automatically
 * registered with the internal Moose system.
 *
 * @example
 * ```typescript
 * const dataProcessingWorkflow = new Workflow("dataProcessing", {
 *   startingTask: extractDataTask,
 *   schedule: "0 2 * * *", // Run daily at 2 AM
 *   timeout: "1h",
 *   retries: 2
 * });
 * ```
 */
declare class Workflow {
    readonly name: string;
    readonly config: WorkflowConfig;
    /** @internal Source file path where this workflow was declared */
    sourceFile?: string;
    /** @internal Source line number where this workflow was declared */
    sourceLine?: number;
    /** @internal Source column number where this workflow was declared */
    sourceColumn?: number;
    /**
     * Creates a new Workflow instance and registers it with the Moose system.
     *
     * @param name - Unique identifier for the workflow
     * @param config - Configuration object defining the workflow behavior and task orchestration
     * @throws {Error} When the workflow contains null/undefined tasks or infinite loops
     */
    constructor(name: string, config: WorkflowConfig);
    /**
     * Validates the task graph to ensure there are no null tasks or infinite loops.
     *
     * @private
     * @param startingTask - The starting task to begin validation from
     * @param workflowName - The name of the workflow being validated (for error messages)
     * @throws {Error} When null/undefined tasks are found or infinite loops are detected
     */
    private validateTaskGraph;
}

/**
 * @template T The data type of the messages expected by the destination stream.
 */
interface IngestConfig<T> {
    /**
     * The destination stream where the ingested data should be sent.
     */
    destination: Stream<T>;
    deadLetterQueue?: DeadLetterQueue<T>;
    /**
     * An optional version string for this configuration.
     */
    version?: string;
    /**
     * An optional custom path for the ingestion endpoint.
     */
    path?: string;
    metadata?: {
        description?: string;
    };
}
/**
 * Represents an Ingest API endpoint, used for sending data into a Moose system, typically writing to a Stream.
 * Provides a typed interface for the expected data format.
 *
 * @template T The data type of the records that this API endpoint accepts. The structure of T defines the expected request body schema.
 */
declare class IngestApi<T> extends TypedBase<T, IngestConfig<T>> {
    /**
     * Creates a new IngestApi instance.
     * @param name The name of the ingest API endpoint.
     * @param config Optional configuration for the ingest API.
     */
    constructor(name: string, config?: IngestConfig<T>);
    /**
     * @internal
     * Note: `validators` parameter is a positional placeholder (always undefined for IngestApi).
     * It exists because TypedBase has validators as the 5th param, and we need to pass
     * allowExtraFields as the 6th param. IngestApi doesn't use validators.
     */
    constructor(name: string, config: IngestConfig<T>, schema: IJsonSchemaCollection.IV3_1, columns: Column[], validators: undefined, allowExtraFields: boolean);
}

/**
 * Utilities provided by getMooseUtils() for database access and SQL queries.
 * Works in both Moose runtime and standalone contexts.
 */
interface MooseUtils {
    client: MooseClient;
    sql: typeof sql;
    jwt?: JWTPayload;
}
/**
 * @deprecated Use MooseUtils instead. ApiUtil is now a type alias to MooseUtils
 * and will be removed in a future version.
 *
 * Migration: Replace `ApiUtil` with `MooseUtils` in your type annotations.
 */
type ApiUtil = MooseUtils;
/** @deprecated Use MooseUtils instead. */
type ConsumptionUtil = MooseUtils;
declare class MooseClient {
    query: QueryClient;
    workflow: WorkflowClient;
    constructor(queryClient: QueryClient, temporalClient?: Client);
}
declare class QueryClient {
    client: ClickHouseClient;
    query_id_prefix: string;
    constructor(client: ClickHouseClient, query_id_prefix: string);
    execute<T = any>(sql: Sql): Promise<ResultSet<"JSONEachRow"> & {
        __query_result_t?: T[];
    }>;
    command(sql: Sql): Promise<CommandResult>;
}
declare class WorkflowClient {
    client: Client | undefined;
    constructor(temporalClient?: Client);
    execute(name: string, input_data: any): Promise<{
        status: number;
        body: string;
    }>;
    terminate(workflowId: string): Promise<{
        status: number;
        body: string;
    }>;
    private getWorkflowConfig;
    private processInputData;
}
/**
 * This looks similar to the client in runner.ts which is a worker.
 * Temporal SDK uses similar looking connection options & client,
 * but there are different libraries for a worker & client like this one
 * that triggers workflows.
 */
declare function getTemporalClient(temporalUrl: string, namespace: string, clientCert: string, clientKey: string, apiKey: string): Promise<Client | undefined>;
declare const ApiHelpers: {
    column: (value: string) => [string, string];
    table: (value: string) => [string, string];
};
/** @deprecated Use ApiHelpers instead. */
declare const ConsumptionHelpers: {
    column: (value: string) => [string, string];
    table: (value: string) => [string, string];
};
declare function joinQueries({ values, separator, prefix, suffix, }: {
    values: readonly RawValue[];
    separator?: string;
    prefix?: string;
    suffix?: string;
}): Sql;

/**
 * Defines the signature for a handler function used by a Consumption API.
 * @template T The expected type of the request parameters or query parameters.
 * @template R The expected type of the response data.
 * @param params An object containing the validated request parameters, matching the structure of T.
 * @param utils Utility functions provided to the handler, e.g., for database access (`runSql`).
 * @returns A Promise resolving to the response data of type R.
 */
type ApiHandler<T, R> = (params: T, utils: ApiUtil) => Promise<R>;
/**
 * @template T The data type of the request parameters.
 */
interface ApiConfig<T> {
    /**
     * An optional version string for this configuration.
     */
    version?: string;
    /**
     * An optional custom path for the API endpoint.
     * If not specified, defaults to the API name.
     */
    path?: string;
    metadata?: {
        description?: string;
    };
}
/**
 * Represents a Consumption API endpoint (API), used for querying data from a Moose system.
 * Exposes data, often from an OlapTable or derived through a custom handler function.
 *
 * @template T The data type defining the expected structure of the API's query parameters.
 * @template R The data type defining the expected structure of the API's response body. Defaults to `any`.
 */
declare class Api<T, R = any> extends TypedBase<T, ApiConfig<T>> {
    /** @internal The handler function that processes requests and generates responses. */
    _handler: ApiHandler<T, R>;
    /** @internal The JSON schema definition for the response type R. */
    responseSchema: IJsonSchemaCollection.IV3_1;
    /**
     * Creates a new Api instance.
     * @param name The name of the consumption API endpoint.
     * @param handler The function to execute when the endpoint is called. It receives validated query parameters and utility functions.
     * @param config Optional configuration for the consumption API.
     */
    constructor(name: string, handler: ApiHandler<T, R>, config?: {});
    /** @internal **/
    constructor(name: string, handler: ApiHandler<T, R>, config: ApiConfig<T>, schema: IJsonSchemaCollection.IV3_1, columns: Column[], responseSchema: IJsonSchemaCollection.IV3_1);
    /**
     * Retrieves the handler function associated with this Consumption API.
     * @returns The handler function.
     */
    getHandler: () => ApiHandler<T, R>;
    call(baseUrl: string, queryParams: T): Promise<R>;
}
/** @deprecated Use ApiConfig<T> directly instead. */
type EgressConfig<T> = ApiConfig<T>;
/** @deprecated Use Api directly instead. */
declare const ConsumptionApi: typeof Api;

/**
 * Configuration options for a complete ingestion pipeline, potentially including an Ingest API, a Stream, and an OLAP Table.
 *
 * @template T The data type of the records being ingested.
 *
 * @example
 * ```typescript
 * // Simple pipeline with all components enabled
 * const pipelineConfig: IngestPipelineConfig<UserData> = {
 *   table: true,
 *   stream: true,
 *   ingestApi: true
 * };
 *
 * // Advanced pipeline with custom configurations
 * const advancedConfig: IngestPipelineConfig<UserData> = {
 *   table: { orderByFields: ['timestamp', 'userId'], engine: ClickHouseEngines.ReplacingMergeTree },
 *   stream: { parallelism: 4, retentionPeriod: 86400 },
 *   ingestApi: true,
 *   version: '1.2.0',
 *   metadata: { description: 'User data ingestion pipeline' }
 * };
 * ```
 */
type IngestPipelineConfig<T> = {
    /**
     * Configuration for the OLAP table component of the pipeline.
     *
     * - If `true`, a table with default settings is created.
     * - If an `OlapConfig` object is provided, it specifies the table's configuration.
     * - If `false`, no OLAP table is created.
     *
     * @default false
     */
    table: boolean | OlapConfig<T>;
    /**
     * Configuration for the stream component of the pipeline.
     *
     * - If `true`, a stream with default settings is created.
     * - Pass a config object to specify the stream's configuration.
     * - The stream's destination will automatically be set to the pipeline's table if one exists.
     * - If `false`, no stream is created.
     *
     * @default false
     */
    stream: boolean | Omit<StreamConfig<T>, "destination">;
    /**
     * Configuration for the ingest API component of the pipeline.
     *
     * - If `true`, an ingest API with default settings is created.
     * - If a partial `IngestConfig` object (excluding `destination`) is provided, it specifies the API's configuration.
     * - The API's destination will automatically be set to the pipeline's stream if one exists.
     * - If `false`, no ingest API is created.
     *
     * **Note:** Requires a stream to be configured when enabled.
     *
     * @default false
     */
    ingestApi: boolean | Omit<IngestConfig<T>, "destination">;
    /**
     * @deprecated Use `ingestApi` instead. This parameter will be removed in a future version.
     */
    ingest?: boolean | Omit<IngestConfig<T>, "destination">;
    /**
     * Configuration for the dead letter queue of the pipeline.
     * If `true`, a dead letter queue with default settings is created.
     * If a partial `StreamConfig` object (excluding `destination`) is provided, it specifies the dead letter queue's configuration.
     * The API's destination will automatically be set to the pipeline's stream if one exists.
     * If `false` or `undefined`, no dead letter queue is created.
     */
    deadLetterQueue?: boolean | StreamConfig<DeadLetterModel>;
    /**
     * An optional version string applying to all components (table, stream, ingest) created by this pipeline configuration.
     * This version will be used for schema versioning and component identification.
     *
     * @example "v1.0.0", "2023-12", "prod"
     */
    version?: string;
    /**
     * An optional custom path for the ingestion API endpoint.
     * This will be used as the HTTP path for the ingest API if one is created.
     *
     * @example "pipelines/analytics", "data/events"
     */
    path?: string;
    /**
     * Optional metadata for the pipeline.
     */
    metadata?: {
        /** Human-readable description of the pipeline's purpose */
        description?: string;
    };
    /** Determines how changes in code will propagate to the resources. */
    lifeCycle?: LifeCycle;
};
/**
 * Represents a complete ingestion pipeline, potentially combining an Ingest API, a Stream, and an OLAP Table
 * under a single name and configuration. Simplifies the setup of common ingestion patterns.
 *
 * This class provides a high-level abstraction for creating data ingestion workflows that can include:
 * - An HTTP API endpoint for receiving data
 * - A streaming component for real-time data processing
 * - An OLAP table for analytical queries
 *
 * @template T The data type of the records flowing through the pipeline. This type defines the schema for the
 *             Ingest API input, the Stream messages, and the OLAP Table rows.
 *
 * @example
 * ```typescript
 * // Create a complete pipeline with all components
 * const userDataPipeline = new IngestPipeline('userData', {
 *   table: true,
 *   stream: true,
 *   ingestApi: true,
 *   version: '1.0.0',
 *   metadata: { description: 'Pipeline for user registration data' }
 * });
 *
 * // Create a pipeline with only table and stream
 * const analyticsStream = new IngestPipeline('analytics', {
 *   table: { orderByFields: ['timestamp'], engine: ClickHouseEngines.ReplacingMergeTree },
 *   stream: { parallelism: 8, retentionPeriod: 604800 },
 *   ingestApi: false
 * });
 * ```
 */
declare class IngestPipeline<T> extends TypedBase<T, IngestPipelineConfig<T>> {
    /**
     * The OLAP table component of the pipeline, if configured.
     * Provides analytical query capabilities for the ingested data.
     * Only present when `config.table` is not `false`.
     */
    table?: OlapTable<T>;
    /**
     * The stream component of the pipeline, if configured.
     * Handles real-time data flow and processing between components.
     * Only present when `config.stream` is not `false`.
     */
    stream?: Stream<T>;
    /**
     * The ingest API component of the pipeline, if configured.
     * Provides HTTP endpoints for data ingestion.
     * Only present when `config.ingestApi` is not `false`.
     */
    ingestApi?: IngestApi<T>;
    /** The dead letter queue of the pipeline, if configured. */
    deadLetterQueue?: DeadLetterQueue<T>;
    /**
     * Creates a new IngestPipeline instance.
     * Based on the configuration, it automatically creates and links the IngestApi, Stream, and OlapTable components.
     *
     * @param name The base name for the pipeline components (e.g., "userData" could create "userData" table, "userData" stream, "userData" ingest API).
     * @param config Optional configuration for the ingestion pipeline.
     *
     * @throws {Error} When ingest API is enabled but no stream is configured, since the API requires a stream destination.
     *
     * @example
     * ```typescript
     * const pipeline = new IngestPipeline('events', {
     *   table: { orderByFields: ['timestamp'], engine: ClickHouseEngines.ReplacingMergeTree },
     *   stream: { parallelism: 2 },
     *   ingestApi: true
     * });
     * ```
     */
    constructor(name: string, config: IngestPipelineConfig<T>);
    /**
     * Internal constructor used by the framework for advanced initialization.
     *
     * @internal
     * @param name The base name for the pipeline components.
     * @param config Configuration specifying which components to create and their settings.
     * @param schema JSON schema collection for type validation.
     * @param columns Column definitions for the data model.
     * @param validators Typia validation functions.
     * @param allowExtraFields Whether extra fields are allowed (injected when type has index signature).
     */
    constructor(name: string, config: IngestPipelineConfig<T>, schema: IJsonSchemaCollection.IV3_1, columns: Column[], validators: TypiaValidators<T>, allowExtraFields: boolean);
}

interface ETLPipelineConfig<T, U> {
    extract: AsyncIterable<T> | (() => AsyncIterable<T>);
    transform: (sourceData: T) => Promise<U>;
    load: ((data: U[]) => Promise<void>) | OlapTable<U>;
}
declare class ETLPipeline<T, U> {
    readonly name: string;
    readonly config: ETLPipelineConfig<T, U>;
    private batcher;
    constructor(name: string, config: ETLPipelineConfig<T, U>);
    private setupPipeline;
    private createBatcher;
    private getDefaultTaskConfig;
    private createAllTasks;
    private createExtractTask;
    private createTransformTask;
    private createLoadTask;
    run(): Promise<void>;
}

/**
 * Represents a database View, defined by a SQL SELECT statement based on one or more base tables or other views.
 * Emits structured data for the Moose infrastructure system.
 */
declare class View {
    /** @internal */
    readonly kind = "View";
    /** The name of the view */
    name: string;
    /** The SELECT SQL statement that defines the view */
    selectSql: string;
    /** Names of source tables/views that the SELECT reads from */
    sourceTables: string[];
    /** Optional metadata for the view */
    metadata: {
        [key: string]: any;
    };
    /**
     * Creates a new View instance.
     * @param name The name of the view to be created.
     * @param selectStatement The SQL SELECT statement that defines the view's logic.
     * @param baseTables An array of OlapTable or View objects that the `selectStatement` reads from. Used for dependency tracking.
     * @param metadata Optional metadata for the view (e.g., description, source file).
     */
    constructor(name: string, selectStatement: string | Sql, baseTables: (OlapTable<any> | View)[], metadata?: {
        [key: string]: any;
    });
}

/**
 * Configuration options for creating a Materialized View.
 * @template T The data type of the records stored in the target table of the materialized view.
 */
interface MaterializedViewConfig<T> {
    /** The SQL SELECT statement or `Sql` object defining the data to be materialized. Dynamic SQL (with parameters) is not allowed here. */
    selectStatement: string | Sql;
    /** An array of OlapTable or View objects that the `selectStatement` reads from. */
    selectTables: (OlapTable<any> | View)[];
    /** @deprecated See {@link targetTable}
     *  The name for the underlying target OlapTable that stores the materialized data. */
    tableName?: string;
    /** The name for the ClickHouse MATERIALIZED VIEW object itself. */
    materializedViewName: string;
    /** @deprecated See {@link targetTable}
     *  Optional ClickHouse engine for the target table (e.g., ReplacingMergeTree). Defaults to MergeTree. */
    engine?: ClickHouseEngines;
    targetTable?: OlapTable<T> /**  Target table if the OlapTable object is already constructed. */ | {
        /** The name for the underlying target OlapTable that stores the materialized data. */
        name: string;
        /** Optional ClickHouse engine for the target table (e.g., ReplacingMergeTree). Defaults to MergeTree. */
        engine?: ClickHouseEngines;
        /** Optional ordering fields for the target table. Crucial if using ReplacingMergeTree. */
        orderByFields?: (keyof T & string)[];
    };
    /** @deprecated See {@link targetTable}
     *  Optional ordering fields for the target table. Crucial if using ReplacingMergeTree. */
    orderByFields?: (keyof T & string)[];
    /** Optional metadata for the materialized view (e.g., description, source file). */
    metadata?: {
        [key: string]: any;
    };
    /** Optional lifecycle management policy for the materialized view.
     * Controls whether Moose can drop or modify the MV automatically.
     * Defaults to FULLY_MANAGED if not specified. */
    lifeCycle?: LifeCycle;
}
/**
 * Represents a Materialized View in ClickHouse.
 * This encapsulates both the target OlapTable that stores the data and the MATERIALIZED VIEW definition
 * that populates the table based on inserts into the source tables.
 *
 * @template TargetTable The data type of the records stored in the underlying target OlapTable. The structure of T defines the target table schema.
 */
declare class MaterializedView<TargetTable> {
    /** @internal */
    readonly kind = "MaterializedView";
    /** The name of the materialized view */
    name: string;
    /** The target OlapTable instance where the materialized data is stored. */
    targetTable: OlapTable<TargetTable>;
    /** The SELECT SQL statement */
    selectSql: string;
    /** Names of source tables that the SELECT reads from */
    sourceTables: string[];
    /** Optional metadata for the materialized view */
    metadata: {
        [key: string]: any;
    };
    /** Optional lifecycle management policy for the materialized view */
    lifeCycle?: LifeCycle;
    /**
     * Creates a new MaterializedView instance.
     * Requires the `TargetTable` type parameter to be explicitly provided or inferred,
     * as it's needed to define the schema of the underlying target table.
     *
     * @param options Configuration options for the materialized view.
     */
    constructor(options: MaterializedViewConfig<TargetTable>);
    /** @internal **/
    constructor(options: MaterializedViewConfig<TargetTable>, targetSchema: IJsonSchemaCollection.IV3_1, targetColumns: Column[]);
}

type SqlObject = OlapTable<any> | SqlResource | View | MaterializedView<any>;
/**
 * Represents a generic SQL resource that requires setup and teardown commands.
 * Base class for constructs like Views and Materialized Views. Tracks dependencies.
 */
declare class SqlResource {
    /** @internal */
    readonly kind = "SqlResource";
    /** Array of SQL statements to execute for setting up the resource. */
    setup: readonly string[];
    /** Array of SQL statements to execute for tearing down the resource. */
    teardown: readonly string[];
    /** The name of the SQL resource (e.g., view name, materialized view name). */
    name: string;
    /** List of OlapTables or Views that this resource reads data from. */
    pullsDataFrom: SqlObject[];
    /** List of OlapTables or Views that this resource writes data to. */
    pushesDataTo: SqlObject[];
    /** @internal Source file path where this resource was defined */
    sourceFile?: string;
    /** @internal Source line number where this resource was defined */
    sourceLine?: number;
    /** @internal Source column number where this resource was defined */
    sourceColumn?: number;
    /**
     * Creates a new SqlResource instance.
     * @param name The name of the resource.
     * @param setup An array of SQL DDL statements to create the resource.
     * @param teardown An array of SQL DDL statements to drop the resource.
     * @param options Optional configuration for specifying data dependencies.
     * @param options.pullsDataFrom Tables/Views this resource reads from.
     * @param options.pushesDataTo Tables/Views this resource writes to.
     */
    constructor(name: string, setup: readonly (string | Sql)[], teardown: readonly (string | Sql)[], options?: {
        pullsDataFrom?: SqlObject[];
        pushesDataTo?: SqlObject[];
    });
}

type WebAppHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void | Promise<void>;
interface FrameworkApp {
    handle?: (req: http.IncomingMessage, res: http.ServerResponse, next?: (err?: any) => void) => void;
    callback?: () => WebAppHandler;
    routing?: (req: http.IncomingMessage, res: http.ServerResponse) => void;
    ready?: () => PromiseLike<unknown>;
}
interface WebAppConfig {
    mountPath: string;
    metadata?: {
        description?: string;
    };
    injectMooseUtils?: boolean;
}
declare class WebApp {
    name: string;
    handler: WebAppHandler;
    config: WebAppConfig;
    /** @internal Source file path where this web app was declared */
    sourceFile?: string;
    /** @internal Source line number where this web app was declared */
    sourceLine?: number;
    /** @internal Source column number where this web app was declared */
    sourceColumn?: number;
    private _rawApp?;
    constructor(name: string, appOrHandler: FrameworkApp | WebAppHandler, config: WebAppConfig);
    private toHandler;
    getRawApp(): FrameworkApp | undefined;
}

/**
 * @module registry
 * Public registry functions for accessing Moose Data Model v2 (dmv2) resources.
 *
 * This module provides functions to retrieve registered resources like tables, streams,
 * APIs, and more. These functions are part of the public API and can be used by
 * user applications to inspect and interact with registered Moose resources.
 */

/**
 * Get all registered OLAP tables.
 * @returns A Map of table name to OlapTable instance
 */
declare function getTables(): Map<string, OlapTable<any>>;
/**
 * Get a registered OLAP table by name.
 * @param name - The name of the table
 * @returns The OlapTable instance or undefined if not found
 */
declare function getTable(name: string): OlapTable<any> | undefined;
/**
 * Get all registered streams.
 * @returns A Map of stream name to Stream instance
 */
declare function getStreams(): Map<string, Stream<any>>;
/**
 * Get a registered stream by name.
 * @param name - The name of the stream
 * @returns The Stream instance or undefined if not found
 */
declare function getStream(name: string): Stream<any> | undefined;
/**
 * Get all registered ingestion APIs.
 * @returns A Map of API name to IngestApi instance
 */
declare function getIngestApis(): Map<string, IngestApi<any>>;
/**
 * Get a registered ingestion API by name.
 * @param name - The name of the ingestion API
 * @returns The IngestApi instance or undefined if not found
 */
declare function getIngestApi(name: string): IngestApi<any> | undefined;
/**
 * Get all registered APIs (consumption/egress APIs).
 * @returns A Map of API key to Api instance
 */
declare function getApis(): Map<string, Api<any>>;
/**
 * Get a registered API by name, version, or path.
 *
 * Supports multiple lookup strategies:
 * 1. Direct lookup by full key (name:version or name for unversioned)
 * 2. Lookup by name with automatic version aliasing when only one versioned API exists
 * 3. Lookup by custom path (if configured)
 *
 * @param nameOrPath - The name, name:version, or custom path of the API
 * @returns The Api instance or undefined if not found
 */
declare function getApi(nameOrPath: string): Api<any> | undefined;
/**
 * Get all registered SQL resources.
 * @returns A Map of resource name to SqlResource instance
 */
declare function getSqlResources(): Map<string, SqlResource>;
/**
 * Get a registered SQL resource by name.
 * @param name - The name of the SQL resource
 * @returns The SqlResource instance or undefined if not found
 */
declare function getSqlResource(name: string): SqlResource | undefined;
/**
 * Get all registered workflows.
 * @returns A Map of workflow name to Workflow instance
 */
declare function getWorkflows(): Map<string, Workflow>;
/**
 * Get a registered workflow by name.
 * @param name - The name of the workflow
 * @returns The Workflow instance or undefined if not found
 */
declare function getWorkflow(name: string): Workflow | undefined;
/**
 * Get all registered web apps.
 * @returns A Map of web app name to WebApp instance
 */
declare function getWebApps(): Map<string, WebApp>;
/**
 * Get a registered web app by name.
 * @param name - The name of the web app
 * @returns The WebApp instance or undefined if not found
 */
declare function getWebApp(name: string): WebApp | undefined;
/**
 * Get all registered materialized views.
 * @returns A Map of MV name to MaterializedView instance
 */
declare function getMaterializedViews(): Map<string, MaterializedView<any>>;
/**
 * Get a registered materialized view by name.
 * @param name - The name of the materialized view
 * @returns The MaterializedView instance or undefined if not found
 */
declare function getMaterializedView(name: string): MaterializedView<any> | undefined;
/**
 * Get all registered views.
 * @returns A Map of view name to View instance
 */
declare function getViews(): Map<string, View>;
/**
 * Get a registered view by name.
 * @param name - The name of the view
 * @returns The View instance or undefined if not found
 */
declare function getView(name: string): View | undefined;

/**
 * @module dmv2
 * This module defines the core Moose v2 data model constructs, including OlapTable, Stream, IngestApi, Api,
 * IngestPipeline, View, and MaterializedView. These classes provide a typed interface for defining and managing
 * data infrastructure components like ClickHouse tables, Redpanda streams, and data processing pipelines.
 */
/**
 * A helper type used potentially for indicating aggregated fields in query results or schemas.
 * Captures the aggregation function name and argument types.
 * (Usage context might be specific to query builders or ORM features).
 *
 * @template AggregationFunction The name of the aggregation function (e.g., 'sum', 'avg', 'count').
 * @template ArgTypes An array type representing the types of the arguments passed to the aggregation function.
 */
type Aggregated<AggregationFunction extends string, ArgTypes extends any[] = []> = {
    _aggregationFunction?: AggregationFunction;
    _argTypes?: ArgTypes;
};
/**
 * A helper type for SimpleAggregateFunction in ClickHouse.
 * SimpleAggregateFunction stores the aggregated value directly instead of intermediate states,
 * offering better performance for functions like sum, max, min, any, anyLast, etc.
 *
 * @template AggregationFunction The name of the simple aggregation function (e.g., 'sum', 'max', 'anyLast').
 * @template ArgType The type of the argument (and result) of the aggregation function.
 *
 * @example
 * ```typescript
 * interface Stats {
 *   rowCount: number & SimpleAggregated<'sum', number>;
 *   maxValue: number & SimpleAggregated<'max', number>;
 *   lastStatus: string & SimpleAggregated<'anyLast', string>;
 * }
 * ```
 */
type SimpleAggregated<AggregationFunction extends string, ArgType = any> = {
    _simpleAggregationFunction?: AggregationFunction;
    _argType?: ArgType;
};

export { type ClickHouseFloat as $, type Aggregated as A, getSqlResources as B, ClickHouseEngines as C, type DeadLetterModel as D, type EgressConfig as E, type FrameworkApp as F, getSqlResource as G, getWorkflows as H, IngestApi as I, getWorkflow as J, getWebApps as K, LifeCycle as L, MaterializedView as M, getWebApp as N, OlapTable as O, getView as P, getViews as Q, getMaterializedView as R, type SimpleAggregated as S, type TableConstraint as T, getMaterializedViews as U, View as V, Workflow as W, type ClickHousePrecision as X, type ClickHouseDecimal as Y, type ClickHouseByteSize as Z, type ClickHouseFixedStringSize as _, type OlapConfig as a, type IngestPipelineConfig as a$, type ClickHouseInt as a0, type ClickHouseJson as a1, type LowCardinality as a2, type ClickHouseNamedTuple as a3, type ClickHouseDefault as a4, type ClickHouseTTL as a5, type ClickHouseMaterialized as a6, type ClickHouseAlias as a7, type WithDefault as a8, type ClickHouseCodec as a9, Sql as aA, toStaticQuery as aB, toQuery as aC, toQueryPreview as aD, getValueFromParameter as aE, createClickhouseParameter as aF, mapToClickHouseType as aG, type MooseUtils as aH, MooseClient as aI, type Column as aJ, QueryClient as aK, type DataType as aL, type ClickHousePoint as aM, type ClickHouseRing as aN, type ClickHouseLineString as aO, type ClickHouseMultiLineString as aP, type ClickHousePolygon as aQ, type ClickHouseMultiPolygon as aR, WorkflowClient as aS, getTemporalClient as aT, ApiHelpers as aU, ConsumptionHelpers as aV, joinQueries as aW, type ConsumerConfig as aX, type TransformConfig as aY, type TaskContext as aZ, type TaskConfig as a_, type DateTime as aa, type DateTime64 as ab, type DateTimeString as ac, type DateTime64String as ad, type FixedString as ae, type Float32 as af, type Float64 as ag, type Int8 as ah, type Int16 as ai, type Int32 as aj, type Int64 as ak, type UInt8 as al, type UInt16 as am, type UInt32 as an, type UInt64 as ao, type Decimal as ap, type Insertable as aq, type ApiUtil as ar, type ConsumptionUtil as as, quoteIdentifier as at, type IdentifierBrandedString as au, type NonIdentifierBrandedString as av, type Value as aw, type RawValue as ax, type SqlTemplateTag as ay, sql as az, type S3QueueTableSettings as b, type MaterializedViewConfig as b0, Stream as c, type StreamConfig as d, type DeadLetter as e, DeadLetterQueue as f, type IngestConfig as g, Api as h, type ApiConfig as i, ConsumptionApi as j, IngestPipeline as k, SqlResource as l, Task as m, ETLPipeline as n, type ETLPipelineConfig as o, WebApp as p, type WebAppConfig as q, type WebAppHandler as r, getTables as s, getTable as t, getStreams as u, getStream as v, getIngestApis as w, getIngestApi as x, getApis as y, getApi as z };
