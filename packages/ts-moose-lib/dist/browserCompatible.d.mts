export { A as Aggregated, h as Api, i as ApiConfig, ar as ApiUtil, a7 as ClickHouseAlias, Z as ClickHouseByteSize, a9 as ClickHouseCodec, Y as ClickHouseDecimal, a4 as ClickHouseDefault, C as ClickHouseEngines, _ as ClickHouseFixedStringSize, $ as ClickHouseFloat, a0 as ClickHouseInt, a1 as ClickHouseJson, a6 as ClickHouseMaterialized, a3 as ClickHouseNamedTuple, X as ClickHousePrecision, a5 as ClickHouseTTL, j as ConsumptionApi, as as ConsumptionUtil, aa as DateTime, ab as DateTime64, ad as DateTime64String, ac as DateTimeString, e as DeadLetter, D as DeadLetterModel, f as DeadLetterQueue, ap as Decimal, n as ETLPipeline, o as ETLPipelineConfig, E as EgressConfig, ae as FixedString, af as Float32, ag as Float64, F as FrameworkApp, au as IdentifierBrandedString, I as IngestApi, g as IngestConfig, k as IngestPipeline, aq as Insertable, ai as Int16, aj as Int32, ak as Int64, ah as Int8, L as LifeCycle, a2 as LowCardinality, M as MaterializedView, av as NonIdentifierBrandedString, a as OlapConfig, O as OlapTable, ax as RawValue, b as S3QueueTableSettings, S as SimpleAggregated, aA as Sql, l as SqlResource, ay as SqlTemplateTag, c as Stream, d as StreamConfig, T as TableConstraint, m as Task, am as UInt16, an as UInt32, ao as UInt64, al as UInt8, aw as Value, V as View, p as WebApp, q as WebAppConfig, r as WebAppHandler, a8 as WithDefault, W as Workflow, aF as createClickhouseParameter, z as getApi, y as getApis, x as getIngestApi, w as getIngestApis, R as getMaterializedView, U as getMaterializedViews, G as getSqlResource, B as getSqlResources, v as getStream, u as getStreams, t as getTable, s as getTables, aE as getValueFromParameter, P as getView, Q as getViews, N as getWebApp, K as getWebApps, J as getWorkflow, H as getWorkflows, aG as mapToClickHouseType, at as quoteIdentifier, az as sql, aC as toQuery, aD as toQueryPreview, aB as toStaticQuery } from './index-CVs8g-aW.mjs';
import 'typia';
import 'typia/lib/tags';
import 'node:stream';
import '@clickhouse/client';
import '@temporalio/client';
import 'jose';
import 'http';

type Key<T extends string | number | Date> = T;
type JWT<T extends object> = T;

export type { JWT, Key };
