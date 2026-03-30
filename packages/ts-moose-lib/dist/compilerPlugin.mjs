// src/compilerPlugin.ts
import ts7, { factory as factory3 } from "typescript";

// src/compilerPluginHelper.ts
import ts from "typescript";
import path from "path";
import process2 from "process";
import fs from "fs";
var isMooseFile = (sourceFile) => {
  const location = path.resolve(sourceFile.fileName);
  return location.includes("@514labs/moose-lib") || // workaround for e2e test
  location.includes("packages/ts-moose-lib/dist") || // support local development with symlinked packages
  location.includes("packages/ts-moose-lib/src") || // support vendored ts-moose-lib in CI
  location.includes("vendor/ts-moose-lib");
};
var createTransformer = (transform2) => (program, _configOrHost, _extrasOrConfig, maybeProgramExtras) => {
  if (maybeProgramExtras !== void 0) {
    throw new Error(
      `[moose] Your tsconfig.json has "transformProgram": true for the moose plugin, but this version requires "transformProgram": false (or remove it entirely).

Update your tsconfig.json plugins section:
  "plugins": [
    { "transform": "./node_modules/@514labs/moose-lib/dist/compilerPlugin.js" },
    { "transform": "typia/lib/transform" }
  ]

Also remove "isolatedModules": true if present (incompatible with type-dependent transformations).`
    );
  }
  const transformFunction = transform2(program.getTypeChecker(), program);
  return (context) => {
    return (sourceFile) => {
      const cwd = process2.cwd();
      if (sourceFile.isDeclarationFile || sourceFile.fileName.includes("/node_modules/")) {
        return sourceFile;
      }
      if (sourceFile.fileName.startsWith("/") && !sourceFile.fileName.startsWith(cwd)) {
        return sourceFile;
      }
      const result = transformFunction(context)(sourceFile);
      try {
        const printer = ts.createPrinter();
        const newFile = printer.printFile(result);
        const fileName = sourceFile.fileName.split("/").pop() || sourceFile.fileName;
        const dir = `${process2.cwd()}/.moose/api-compile-step/`;
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(`${dir}/${fileName}`, newFile);
      } catch (_e) {
      }
      return result;
    };
  };
};
var avoidTypiaNameClash = "____moose____typia";

// src/dmv2/dataModelMetadata.ts
import ts5, { factory } from "typescript";

// src/dataModels/typeConvert.ts
import ts3, {
  displayPartsToString,
  isIdentifier,
  isTypeReferenceNode,
  SymbolFlags,
  TypeFlags
} from "typescript";

// src/dataModels/enumConvert.ts
import ts2 from "typescript";

// src/dataModels/dataModelTypes.ts
var UnknownType = class extends Error {
  t;
  fieldName;
  typeName;
  constructor(t, fieldName, typeName) {
    super();
    this.t = t;
    this.fieldName = fieldName;
    this.typeName = typeName;
  }
};
var NullType = class extends Error {
  fieldName;
  typeName;
  constructor(fieldName, typeName) {
    super();
    this.fieldName = fieldName;
    this.typeName = typeName;
  }
};
var UnsupportedEnum = class extends Error {
  enumName;
  constructor(enumName) {
    super();
    this.enumName = enumName;
  }
};
var UnsupportedFeature = class extends Error {
  featureName;
  constructor(featureName) {
    super();
    this.featureName = featureName;
  }
};
var IndexType = class extends Error {
  typeName;
  indexSignatures;
  constructor(typeName, indexSignatures) {
    const explanation = "Index signatures (e.g. [key: string]: value) are not supported in data models.";
    const suggestion = "Consider splitting this into separate types or using a single Record<K, V> type.";
    const signatures = `Found index signatures: ${indexSignatures.join(", ")}`;
    super(
      `${explanation}

Type: ${typeName}

${signatures}

Suggestion: ${suggestion}`
    );
    this.typeName = typeName;
    this.indexSignatures = indexSignatures;
  }
};

// src/dataModels/enumConvert.ts
var isEnum = (t) => !!(t.getFlags() & ts2.TypeFlags.EnumLiteral);
var enumConvert = (enumType) => {
  const name = enumType.symbol.name;
  const values = enumType.isUnion() ? (
    // an enum is the union of the values
    enumType.types
  ) : [enumType];
  const allStrings = values.every((v) => v.isStringLiteral());
  const allIntegers = values.every(
    (v) => v.isNumberLiteral() && Number.isInteger(v.value)
  );
  if (!allIntegers && !allStrings) {
    throw new UnsupportedEnum(name);
  }
  const enumMember = allStrings ? values.map((v) => ({
    name: v.symbol.name,
    value: { String: v.value }
  })) : values.map((v) => ({
    name: v.symbol.name,
    value: { Int: v.value }
  }));
  return { name, values: enumMember };
};

// src/dataModels/types.ts
var DecimalRegex = "^-?\\d+(\\.\\d+)?$";

// src/utilities/json.ts
var STRING_DATE_ANNOTATION = "stringDate";

// src/dataModels/typeConvert.ts
var dateType = (checker) => checker.getTypeOfSymbol(
  checker.resolveName("Date", void 0, SymbolFlags.Type, false)
).getConstructSignatures()[0].getReturnType();
var throwUnknownType = (t, fieldName, typeName) => {
  throw new UnknownType(t, fieldName, typeName);
};
var throwNullType = (fieldName, typeName) => {
  throw new NullType(fieldName, typeName);
};
var throwIndexTypeError = (t, checker) => {
  const interfaceName = t.symbol?.name || "unknown type";
  const indexInfos = checker.getIndexInfosOfType(t);
  const signatures = indexInfos.map((info) => {
    const keyType = checker.typeToString(info.keyType);
    const valueType = checker.typeToString(info.type);
    return `[${keyType}]: ${valueType}`;
  });
  throw new IndexType(interfaceName, signatures);
};
var getPropertyDeep = (t, name) => {
  const direct = t.getProperty(name);
  if (direct !== void 0) return direct;
  if (t.isIntersection()) {
    for (const sub of t.types) {
      const found = getPropertyDeep(sub, name);
      if (found) return found;
    }
  }
  return void 0;
};
var toArrayType = ([elementNullable, _, elementType]) => {
  return {
    elementNullable,
    elementType
  };
};
var isNumberType = (t, checker) => {
  return checker.isTypeAssignableTo(t, checker.getNumberType());
};
var handleAggregated = (t, checker, fieldName, typeName) => {
  const functionSymbol = t.getProperty("_aggregationFunction");
  const argsTypesSymbol = t.getProperty("_argTypes");
  if (functionSymbol === void 0 || argsTypesSymbol === void 0) {
    return void 0;
  }
  const functionStringLiteral = checker.getNonNullableType(
    checker.getTypeOfSymbol(functionSymbol)
  );
  const types = checker.getNonNullableType(
    checker.getTypeOfSymbol(argsTypesSymbol)
  );
  if (functionStringLiteral.isStringLiteral() && checker.isTupleType(types)) {
    const argumentTypes = (types.typeArguments || []).map(
      (argT) => {
        return tsTypeToDataType(argT, checker, fieldName, typeName, false)[2];
      }
    );
    return { functionName: functionStringLiteral.value, argumentTypes };
  } else {
    console.log(
      "[CompilerPlugin] Unexpected type inside Aggregated",
      functionStringLiteral
    );
    return void 0;
  }
};
var getTaggedType = (t, checker, propertyName) => {
  const nonNull = t.getNonNullableType();
  const ttlSymbol = nonNull.getProperty(propertyName);
  if (ttlSymbol === void 0) return null;
  return checker.getNonNullableType(checker.getTypeOfSymbol(ttlSymbol));
};
var getJsonMappedType = (t, checker) => {
  const mappingSymbol = getPropertyDeep(t, "_clickhouse_mapped_type");
  if (mappingSymbol === void 0) return null;
  const mappedType = checker.getNonNullableType(
    checker.getTypeOfSymbol(mappingSymbol)
  );
  if (!mappedType.isStringLiteral() || mappedType.value !== "JSON") {
    return null;
  }
  let maxDynamicPaths = void 0;
  let maxDynamicTypes = void 0;
  let skipPaths = [];
  let skipRegexes = [];
  const settingsSymbol = getPropertyDeep(t, "_clickhouse_json_settings");
  if (settingsSymbol !== void 0) {
    const settingsType = checker.getNonNullableType(
      checker.getTypeOfSymbol(settingsSymbol)
    );
    const maxPathsSymbol = getPropertyDeep(settingsType, "maxDynamicPaths");
    if (maxPathsSymbol !== void 0) {
      const maxPathsType = checker.getNonNullableType(
        checker.getTypeOfSymbol(maxPathsSymbol)
      );
      if (maxPathsType.isNumberLiteral()) {
        maxDynamicPaths = maxPathsType.value;
      }
    }
    const maxTypesSymbol = getPropertyDeep(settingsType, "maxDynamicTypes");
    if (maxTypesSymbol !== void 0) {
      const maxTypesType = checker.getNonNullableType(
        checker.getTypeOfSymbol(maxTypesSymbol)
      );
      if (maxTypesType.isNumberLiteral()) {
        maxDynamicTypes = maxTypesType.value;
      }
    }
    const skipPathsSymbol = getPropertyDeep(settingsType, "skipPaths");
    if (skipPathsSymbol !== void 0) {
      const skipPathsType = checker.getNonNullableType(
        checker.getTypeOfSymbol(skipPathsSymbol)
      );
      if (checker.isTupleType(skipPathsType)) {
        const tuple = skipPathsType;
        skipPaths = (tuple.typeArguments || []).filter((t2) => t2.isStringLiteral()).map((t2) => t2.value);
      }
    }
    const skipRegexesSymbol = getPropertyDeep(settingsType, "skipRegexes");
    if (skipRegexesSymbol !== void 0) {
      const skipRegexesType = checker.getNonNullableType(
        checker.getTypeOfSymbol(skipRegexesSymbol)
      );
      if (checker.isTupleType(skipRegexesType)) {
        const tuple = skipRegexesType;
        skipRegexes = (tuple.typeArguments || []).filter((t2) => t2.isStringLiteral()).map((t2) => t2.value);
      }
    }
  }
  let base = t.getNonNullableType();
  if (base.isIntersection()) {
    const candidates = base.types.filter((sub) => {
      const m = getPropertyDeep(sub, "_clickhouse_mapped_type");
      if (!m) return true;
      const mt = checker.getNonNullableType(checker.getTypeOfSymbol(m));
      return !(mt.isStringLiteral() && mt.value === "JSON");
    });
    if (candidates.length > 0) base = candidates[0];
  }
  let typedPaths = [];
  try {
    const cols = toColumns(base, checker);
    typedPaths = cols.map((c) => [c.name, c.data_type]);
  } catch (_) {
    typedPaths = [];
  }
  const hasAnyOption = typeof maxDynamicPaths === "number" || typeof maxDynamicTypes === "number" || typedPaths.length > 0 || skipPaths.length > 0 || skipRegexes.length > 0;
  if (!hasAnyOption) return "Json";
  const result = {
    typed_paths: typedPaths,
    skip_paths: skipPaths,
    skip_regexps: skipRegexes
  };
  if (typeof maxDynamicPaths === "number") {
    result.max_dynamic_paths = maxDynamicPaths;
  }
  if (typeof maxDynamicTypes === "number") {
    result.max_dynamic_types = maxDynamicTypes;
  }
  return result;
};
var handleSimpleAggregated = (t, checker, fieldName, typeName) => {
  const functionSymbol = t.getProperty("_simpleAggregationFunction");
  const argTypeSymbol = t.getProperty("_argType");
  if (functionSymbol === void 0 || argTypeSymbol === void 0) {
    return void 0;
  }
  const functionStringLiteral = checker.getNonNullableType(
    checker.getTypeOfSymbol(functionSymbol)
  );
  const argType = checker.getNonNullableType(
    checker.getTypeOfSymbol(argTypeSymbol)
  );
  if (functionStringLiteral.isStringLiteral()) {
    const argumentType = tsTypeToDataType(
      argType,
      checker,
      fieldName,
      typeName,
      false
    )[2];
    return { functionName: functionStringLiteral.value, argumentType };
  } else {
    console.log(
      "[CompilerPlugin] Unexpected type inside SimpleAggregated",
      functionStringLiteral
    );
    return void 0;
  }
};
var handleDefault = (t, checker) => {
  const defaultType = getTaggedType(t, checker, "_clickhouse_default");
  if (defaultType === null) {
    return null;
  }
  if (!defaultType.isStringLiteral()) {
    throw new UnsupportedFeature(
      'ClickHouseDefault must use a string literal, e.g. ClickHouseDefault<"now()">'
    );
  }
  return defaultType.value;
};
var handleMaterialized = (t, checker) => {
  const materializedType = getTaggedType(
    t,
    checker,
    "_clickhouse_materialized"
  );
  if (materializedType === null) {
    return null;
  }
  if (!materializedType.isStringLiteral()) {
    throw new UnsupportedFeature(
      'ClickHouseMaterialized must use a string literal, e.g. ClickHouseMaterialized<"toDate(timestamp)">'
    );
  }
  return materializedType.value;
};
var handleAlias = (t, checker) => {
  const aliasType = getTaggedType(t, checker, "_clickhouse_alias");
  if (aliasType === null) {
    return null;
  }
  if (!aliasType.isStringLiteral()) {
    throw new UnsupportedFeature(
      'ClickHouseAlias must use a string literal, e.g. ClickHouseAlias<"toDate(timestamp)">'
    );
  }
  return aliasType.value;
};
var handleTtl = (t, checker) => {
  const ttlType = getTaggedType(t, checker, "_clickhouse_ttl");
  if (ttlType === null) {
    return null;
  }
  if (!ttlType.isStringLiteral()) {
    throw new UnsupportedFeature(
      'ClickHouseTTL must use a string literal, e.g. ClickHouseTTL<"timestamp + INTERVAL 1 WEEK">'
    );
  }
  return ttlType.value;
};
var handleNumberType = (t, checker, fieldName) => {
  const decimalPrecisionSymbol = getPropertyDeep(t, "_clickhouse_precision");
  const decimalScaleSymbol = getPropertyDeep(t, "_clickhouse_scale");
  if (decimalPrecisionSymbol !== void 0 && decimalScaleSymbol !== void 0) {
    const precisionType = checker.getNonNullableType(
      checker.getTypeOfSymbol(decimalPrecisionSymbol)
    );
    const scaleType = checker.getNonNullableType(
      checker.getTypeOfSymbol(decimalScaleSymbol)
    );
    if (precisionType.isNumberLiteral() && scaleType.isNumberLiteral()) {
      return `Decimal(${precisionType.value}, ${scaleType.value})`;
    }
  }
  const tagSymbol = t.getProperty("typia.tag");
  if (tagSymbol === void 0) {
    return "Float64";
  } else {
    const typiaProps = checker.getNonNullableType(
      checker.getTypeOfSymbol(tagSymbol)
    );
    const props = typiaProps.isIntersection() ? typiaProps.types : [typiaProps];
    for (const prop of props) {
      const valueSymbol = prop.getProperty("value");
      if (valueSymbol === void 0) {
        console.log(
          `[CompilerPlugin] Props.value is undefined for ${fieldName}`
        );
      } else {
        const valueTypeLiteral = checker.getTypeOfSymbol(valueSymbol);
        const numberTypeMappings = {
          float: "Float32",
          double: "Float64",
          int8: "Int8",
          int16: "Int16",
          int32: "Int32",
          int64: "Int64",
          uint8: "UInt8",
          uint16: "UInt16",
          uint32: "UInt32",
          uint64: "UInt64"
        };
        const match = Object.entries(numberTypeMappings).find(
          ([k, _]) => isStringLiteral(valueTypeLiteral, checker, k)
        );
        if (match) {
          return match[1];
        } else {
          const typeString = valueTypeLiteral.isStringLiteral() ? valueTypeLiteral.value : "unknown";
          console.log(
            `[CompilerPlugin] Other number types are not supported: ${typeString} in field ${fieldName}`
          );
        }
      }
    }
    return "Float64";
  }
};
var isStringLiteral = (t, checker, lit) => checker.isTypeAssignableTo(t, checker.getStringLiteralType(lit));
var handleStringType = (t, checker, fieldName, annotations) => {
  const fixedStringSizeSymbol = getPropertyDeep(
    t,
    "_clickhouse_fixed_string_size"
  );
  if (fixedStringSizeSymbol !== void 0) {
    const sizeType = checker.getNonNullableType(
      checker.getTypeOfSymbol(fixedStringSizeSymbol)
    );
    if (sizeType.isNumberLiteral()) {
      return `FixedString(${sizeType.value})`;
    }
  }
  const tagSymbol = t.getProperty("typia.tag");
  if (tagSymbol === void 0) {
    if (t.isUnion() && t.types.every((v) => v.isStringLiteral())) {
      annotations.push(["LowCardinality", true]);
    }
    return "String";
  } else {
    const typiaProps = checker.getNonNullableType(
      checker.getTypeOfSymbol(tagSymbol)
    );
    const props = typiaProps.isIntersection() ? typiaProps.types : [typiaProps];
    for (const prop of props) {
      const valueSymbol = prop.getProperty("value");
      if (valueSymbol === void 0) {
        console.log(
          `[CompilerPlugin] Props.value is undefined for ${fieldName}`
        );
      } else {
        const valueTypeLiteral = checker.getTypeOfSymbol(valueSymbol);
        if (isStringLiteral(valueTypeLiteral, checker, "uuid")) {
          return "UUID";
        } else if (isStringLiteral(valueTypeLiteral, checker, "date-time")) {
          let precision = 9;
          const precisionSymbol = t.getProperty("_clickhouse_precision");
          if (precisionSymbol !== void 0) {
            const precisionType = checker.getNonNullableType(
              checker.getTypeOfSymbol(precisionSymbol)
            );
            if (precisionType.isNumberLiteral()) {
              precision = precisionType.value;
            }
          }
          annotations.push([STRING_DATE_ANNOTATION, true]);
          return `DateTime(${precision})`;
        } else if (isStringLiteral(valueTypeLiteral, checker, "date")) {
          let size = 4;
          const sizeSymbol = t.getProperty("_clickhouse_byte_size");
          if (sizeSymbol !== void 0) {
            const sizeType = checker.getNonNullableType(
              checker.getTypeOfSymbol(sizeSymbol)
            );
            if (sizeType.isNumberLiteral()) {
              size = sizeType.value;
            }
          }
          if (size === 4) {
            return "Date";
          } else if (size === 2) {
            return "Date16";
          } else {
            throw new UnsupportedFeature(`Date with size ${size}`);
          }
        } else if (isStringLiteral(valueTypeLiteral, checker, "ipv4")) {
          return "IPv4";
        } else if (isStringLiteral(valueTypeLiteral, checker, "ipv6")) {
          return "IPv6";
        } else if (isStringLiteral(valueTypeLiteral, checker, DecimalRegex)) {
          let precision = 10;
          let scale = 0;
          const precisionSymbol = t.getProperty("_clickhouse_precision");
          if (precisionSymbol !== void 0) {
            const precisionType = checker.getNonNullableType(
              checker.getTypeOfSymbol(precisionSymbol)
            );
            if (precisionType.isNumberLiteral()) {
              precision = precisionType.value;
            }
          }
          const scaleSymbol = t.getProperty("_clickhouse_scale");
          if (scaleSymbol !== void 0) {
            const scaleType = checker.getNonNullableType(
              checker.getTypeOfSymbol(scaleSymbol)
            );
            if (scaleType.isNumberLiteral()) {
              scale = scaleType.value;
            }
          }
          return `Decimal(${precision}, ${scale})`;
        } else {
          const typeString = valueTypeLiteral.isStringLiteral() ? valueTypeLiteral.value : "unknown";
          console.log(
            `[CompilerPlugin] Unknown format: ${typeString} in field ${fieldName}`
          );
        }
      }
    }
    return "String";
  }
};
var isStringAnyRecord = (t, checker) => {
  const indexInfos = checker.getIndexInfosOfType(t);
  if (indexInfos && indexInfos.length === 1) {
    const indexInfo = indexInfos[0];
    return indexInfo.keyType == checker.getStringType() && indexInfo.type == checker.getAnyType();
  }
  return false;
};
var isRecordType = (t, checker) => {
  if (checker.isArrayType(t)) {
    return false;
  }
  const indexInfos = checker.getIndexInfosOfType(t);
  return indexInfos && indexInfos.length === 1;
};
var isUnderscoreMetaObject = (t, checker) => {
  const props = checker.getPropertiesOfType(t);
  if (props.length === 0) return false;
  return props.every(
    (p) => typeof p.name === "string" && p.name.startsWith("_")
  );
};
var handleRecordType = (t, checker, fieldName, typeName, isJwt) => {
  const indexInfos = checker.getIndexInfosOfType(t);
  if (indexInfos && indexInfos.length !== 1) {
    throwIndexTypeError(t, checker);
  }
  const indexInfo = indexInfos[0];
  const [, , keyType] = tsTypeToDataType(
    indexInfo.keyType,
    checker,
    `${fieldName}_key`,
    typeName,
    isJwt
  );
  const [, , valueType] = tsTypeToDataType(
    indexInfo.type,
    checker,
    `${fieldName}_value`,
    typeName,
    isJwt
  );
  return {
    keyType,
    valueType
  };
};
var isNamedTuple = (t, checker) => {
  const mappingSymbol = t.getProperty("_clickhouse_mapped_type");
  if (mappingSymbol === void 0) {
    return false;
  }
  return isStringLiteral(
    checker.getNonNullableType(checker.getTypeOfSymbol(mappingSymbol)),
    checker,
    "namedTuple"
  );
};
var getGeometryMappedType = (t, checker) => {
  const mappingSymbol = getPropertyDeep(t, "_clickhouse_mapped_type");
  if (mappingSymbol === void 0) return null;
  const mapped = checker.getNonNullableType(
    checker.getTypeOfSymbol(mappingSymbol)
  );
  const isPointTuple = (candidate) => {
    if (candidate.isIntersection()) {
      return candidate.types.some(isPointTuple);
    }
    if (!checker.isTupleType(candidate)) return false;
    const tuple = candidate;
    const args = tuple.typeArguments || [];
    if (args.length !== 2) return false;
    return isNumberType(args[0], checker) && isNumberType(args[1], checker);
  };
  const isArrayOf = (arrType, elementPredicate) => {
    if (arrType.isIntersection()) {
      return arrType.types.some((t2) => isArrayOf(t2, elementPredicate));
    }
    if (!checker.isArrayType(arrType)) return false;
    const elementType = arrType.getNumberIndexType();
    if (!elementType) return false;
    return elementPredicate(elementType);
  };
  const expectAndValidate = (shapeName, validator) => {
    if (!validator()) {
      throw new UnsupportedFeature(
        `Type annotated as ${shapeName} must be assignable to the expected geometry shape`
      );
    }
    return shapeName;
  };
  if (mapped.isStringLiteral()) {
    const v = mapped.value;
    switch (v) {
      case "Point":
        return expectAndValidate("Point", () => isPointTuple(t));
      case "Ring":
      case "LineString":
        return expectAndValidate(
          v,
          () => isArrayOf(t, (el) => isPointTuple(el))
        );
      case "MultiLineString":
      case "Polygon":
        return expectAndValidate(
          v,
          () => isArrayOf(t, (el) => isArrayOf(el, (inner) => isPointTuple(inner)))
        );
      case "MultiPolygon":
        return expectAndValidate(
          v,
          () => isArrayOf(
            t,
            (el) => isArrayOf(el, (inner) => isArrayOf(inner, isPointTuple))
          )
        );
    }
  }
  return null;
};
var checkColumnHasNoDefault = (c) => {
  if (c.default !== null) {
    throw new UnsupportedFeature(
      "Default in inner field. Put ClickHouseDefault in top level field."
    );
  }
};
var handleNested = (t, checker, fieldName, jwt) => {
  const columns = toColumns(t, checker);
  columns.forEach(checkColumnHasNoDefault);
  return {
    name: getNestedName(t, fieldName),
    columns,
    jwt
  };
};
var handleNamedTuple = (t, checker) => {
  return {
    fields: toColumns(t, checker).flatMap((c) => {
      if (c.name === "_clickhouse_mapped_type") return [];
      checkColumnHasNoDefault(c);
      const t2 = c.required ? c.data_type : { nullable: c.data_type };
      return [[c.name, t2]];
    })
  };
};
var tsTypeToDataType = (t, checker, fieldName, typeName, isJwt, typeNode) => {
  const nonNull = t.getNonNullableType();
  const nullable = nonNull != t;
  const aggregationFunction = handleAggregated(t, checker, fieldName, typeName);
  const simpleAggregationFunction = handleSimpleAggregated(
    t,
    checker,
    fieldName,
    typeName
  );
  let withoutTags = nonNull;
  if (nonNull.isIntersection()) {
    const nonTagTypes = nonNull.types.filter(
      (candidate) => !isUnderscoreMetaObject(candidate, checker)
    );
    if (nonTagTypes.length == 1) {
      withoutTags = nonTagTypes[0];
    }
  }
  let datePrecisionFromNode = void 0;
  if (typeNode && isTypeReferenceNode(typeNode)) {
    const tn = typeNode.typeName;
    const name = isIdentifier(tn) ? tn.text : tn.right.text;
    if (name === "DateTime64") {
      const arg = typeNode.typeArguments?.[0];
      if (arg && ts3.isLiteralTypeNode(arg) && ts3.isNumericLiteral(arg.literal)) {
        datePrecisionFromNode = Number(arg.literal.text);
      }
    } else if (name === "DateTime") {
      datePrecisionFromNode = void 0;
    }
  }
  const annotations = [];
  const typeSymbolName = nonNull.symbol?.name || t.symbol?.name;
  const isDateLike = typeSymbolName === "DateTime" || typeSymbolName === "DateTime64" || checker.isTypeAssignableTo(nonNull, dateType(checker));
  let dataType;
  if (isEnum(nonNull)) {
    dataType = enumConvert(nonNull);
  } else {
    const jsonCandidate = getJsonMappedType(nonNull, checker);
    if (jsonCandidate !== null) {
      dataType = jsonCandidate;
    } else if (isStringAnyRecord(nonNull, checker)) {
      dataType = "Json";
    } else if (isDateLike) {
      if (datePrecisionFromNode !== void 0) {
        dataType = `DateTime(${datePrecisionFromNode})`;
      } else {
        const precisionSymbol = getPropertyDeep(nonNull, "_clickhouse_precision") || getPropertyDeep(t, "_clickhouse_precision");
        if (precisionSymbol !== void 0) {
          const precisionType = checker.getNonNullableType(
            checker.getTypeOfSymbol(precisionSymbol)
          );
          if (precisionType.isNumberLiteral()) {
            dataType = `DateTime(${precisionType.value})`;
          } else {
            dataType = "DateTime";
          }
        } else {
          dataType = "DateTime";
        }
      }
    } else if (checker.isTypeAssignableTo(nonNull, checker.getStringType())) {
      dataType = handleStringType(nonNull, checker, fieldName, annotations);
    } else if (isNumberType(nonNull, checker)) {
      dataType = handleNumberType(nonNull, checker, fieldName);
    } else if (checker.isTypeAssignableTo(nonNull, checker.getBooleanType())) {
      dataType = "Boolean";
    } else if (getGeometryMappedType(nonNull, checker) !== null) {
      dataType = getGeometryMappedType(nonNull, checker);
    } else if (checker.isArrayType(withoutTags)) {
      dataType = toArrayType(
        tsTypeToDataType(
          nonNull.getNumberIndexType(),
          checker,
          fieldName,
          typeName,
          isJwt,
          void 0
        )
      );
    } else if (isNamedTuple(nonNull, checker)) {
      dataType = handleNamedTuple(nonNull, checker);
    } else if (isRecordType(nonNull, checker)) {
      dataType = handleRecordType(nonNull, checker, fieldName, typeName, isJwt);
    } else if (withoutTags.isClassOrInterface() || (withoutTags.flags & TypeFlags.Object) !== 0) {
      dataType = handleNested(withoutTags, checker, fieldName, isJwt);
    } else if (nonNull == checker.getNeverType()) {
      dataType = throwNullType(fieldName, typeName);
    } else {
      dataType = throwUnknownType(t, fieldName, typeName);
    }
  }
  if (aggregationFunction !== void 0) {
    annotations.push(["aggregationFunction", aggregationFunction]);
  }
  if (simpleAggregationFunction !== void 0) {
    annotations.push(["simpleAggregationFunction", simpleAggregationFunction]);
  }
  const lowCardinalitySymbol = nonNull.getProperty("_LowCardinality");
  if (lowCardinalitySymbol !== void 0) {
    const lowCardinalityType = checker.getNonNullableType(
      checker.getTypeOfSymbol(lowCardinalitySymbol)
    );
    if (lowCardinalityType == checker.getTrueType()) {
      annotations.push(["LowCardinality", true]);
    }
  }
  return [nullable, annotations, dataType];
};
var getNestedName = (t, fieldName) => {
  const name = t.symbol.name;
  return name === "__type" ? fieldName : name;
};
var hasWrapping = (typeNode, wrapperName) => {
  if (typeNode !== void 0 && isTypeReferenceNode(typeNode)) {
    const typeName = typeNode.typeName;
    const name = isIdentifier(typeName) ? typeName.text : typeName.right.text;
    return name === wrapperName && typeNode.typeArguments?.length === 1;
  } else {
    return false;
  }
};
var hasKeyWrapping = (typeNode) => {
  return hasWrapping(typeNode, "Key");
};
var hasJwtWrapping = (typeNode) => {
  return hasWrapping(typeNode, "JWT");
};
var handleDefaultWrapping = (typeNode) => {
  if (typeNode !== void 0 && isTypeReferenceNode(typeNode)) {
    const typeName = typeNode.typeName;
    const name = isIdentifier(typeName) ? typeName.text : typeName.right.text;
    if (name === "WithDefault" && typeNode.typeArguments?.length === 2) {
      const defaultValueType = typeNode.typeArguments[1];
      if (ts3.isLiteralTypeNode(defaultValueType) && ts3.isStringLiteral(defaultValueType.literal)) {
        return defaultValueType.literal.text;
      }
    }
  }
  return void 0;
};
var handleCodec = (t, checker) => {
  const codecType = getTaggedType(t, checker, "_clickhouse_codec");
  if (codecType === null) {
    return null;
  }
  if (!codecType.isStringLiteral()) {
    throw new UnsupportedFeature(
      'ClickHouseCodec must use a string literal, e.g. ClickHouseCodec<"ZSTD(3)">'
    );
  }
  return codecType.value;
};
var toColumns = (t, checker, options) => {
  if (!options?.allowIndexSignatures && checker.getIndexInfosOfType(t).length !== 0) {
    console.log("[CompilerPlugin]", checker.getIndexInfosOfType(t));
    throwIndexTypeError(t, checker);
  }
  return checker.getPropertiesOfType(t).map((prop) => {
    let declarations = prop.getDeclarations();
    const node = declarations && declarations.length > 0 ? declarations[0] : void 0;
    const type = node !== void 0 ? checker.getTypeOfSymbolAtLocation(prop, node) : checker.getTypeOfSymbol(prop);
    const isKey = hasKeyWrapping(node?.type);
    const isJwt = hasJwtWrapping(node?.type);
    const defaultExpression = handleDefaultWrapping(node?.type);
    const [nullable, annotations, dataType] = tsTypeToDataType(
      type,
      checker,
      prop.name,
      t.symbol?.name || "inline_type",
      isJwt,
      node?.type
    );
    const defaultValue = defaultExpression ?? handleDefault(type, checker);
    const materializedValue = handleMaterialized(type, checker);
    const aliasValue = handleAlias(type, checker);
    const setCount = [defaultValue, materializedValue, aliasValue].filter(
      (v) => v != null
    ).length;
    if (setCount > 1) {
      throw new UnsupportedFeature(
        `Column '${prop.name}' can only have one of ClickHouseDefault, ClickHouseMaterialized, or ClickHouseAlias.`
      );
    }
    if (aliasValue != null && isKey) {
      throw new UnsupportedFeature(
        `Column '${prop.name}' cannot be a primary key when using ClickHouseAlias.`
      );
    }
    const docComment = prop.getDocumentationComment(checker);
    const comment = docComment.length > 0 ? displayPartsToString(docComment) : null;
    return {
      name: prop.name,
      data_type: dataType,
      primary_key: isKey,
      required: !nullable,
      unique: false,
      default: defaultValue,
      materialized: materializedValue,
      alias: aliasValue,
      ttl: handleTtl(type, checker),
      codec: handleCodec(type, checker),
      annotations,
      comment
    };
  });
};

// src/typiaDirectIntegration.ts
import ts4 from "typescript";
import { ImportProgrammer } from "typia/lib/programmers/ImportProgrammer";
import { ValidateProgrammer } from "typia/lib/programmers/ValidateProgrammer";
import { IsProgrammer } from "typia/lib/programmers/IsProgrammer";
import { AssertProgrammer } from "typia/lib/programmers/AssertProgrammer";
import { JsonSchemasProgrammer } from "typia/lib/programmers/json/JsonSchemasProgrammer";
import { HttpAssertQueryProgrammer } from "typia/lib/programmers/http/HttpAssertQueryProgrammer";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { LiteralFactory } from "typia/lib/factories/LiteralFactory";
var createSyntheticModulo = () => {
  const identifier = ts4.factory.createIdentifier("typia");
  identifier.getText = () => "typia";
  return identifier;
};
var createTypiaContext = (program, transformer, sourceFile) => {
  const importer = new ImportProgrammer({
    internalPrefix: avoidTypiaNameClash
  });
  return {
    program,
    checker: program.getTypeChecker(),
    transformer,
    importer,
    modulo: createSyntheticModulo(),
    sourceFile
  };
};
var toTypiaContext = (ctx) => ({
  program: ctx.program,
  compilerOptions: ctx.program.getCompilerOptions(),
  checker: ctx.checker,
  printer: ts4.createPrinter(),
  options: {},
  transformer: ctx.transformer,
  importer: ctx.importer,
  extras: {
    // Not used by the programmers we call directly (CheckerProgrammer,
    // HttpAssertQueryProgrammer, JsonSchemasProgrammer) - only used by
    // FileTransformer which we bypass
    addDiagnostic: () => 0
  }
});
var generateValidateFunction = (ctx, type, typeName) => {
  const typiaCtx = toTypiaContext(ctx);
  return ValidateProgrammer.write({
    context: typiaCtx,
    modulo: ctx.modulo,
    type,
    name: typeName,
    config: { equals: false }
  });
};
var generateIsFunction = (ctx, type, typeName) => {
  const typiaCtx = toTypiaContext(ctx);
  return IsProgrammer.write({
    context: typiaCtx,
    modulo: ctx.modulo,
    type,
    name: typeName,
    config: { equals: false }
  });
};
var generateAssertFunction = (ctx, type, typeName) => {
  const typiaCtx = toTypiaContext(ctx);
  return AssertProgrammer.write({
    context: typiaCtx,
    modulo: ctx.modulo,
    type,
    name: typeName,
    config: { equals: false, guard: false }
  });
};
var getPropertyName = (prop) => prop.key.constants?.[0]?.values?.[0]?.value;
var patchMetadataForInsert = (metadata, computedColumns, defaultColumns) => {
  for (const obj of metadata.objects) {
    const keep = [];
    for (const prop of obj.type.properties) {
      const name = getPropertyName(prop);
      if (name !== void 0 && computedColumns.has(name)) continue;
      if (name !== void 0 && defaultColumns.has(name)) {
        prop.value.optional = true;
        prop.value.required = false;
      }
      keep.push(prop);
    }
    obj.type.properties.length = 0;
    obj.type.properties.push(...keep);
  }
};
var withInsertableMetadata = (columns, fn) => {
  const original = MetadataFactory.analyze;
  MetadataFactory.analyze = (props) => {
    const result = original(props);
    if (result.success) {
      patchMetadataForInsert(result.data, columns.computed, columns.defaults);
    }
    return result;
  };
  try {
    return fn();
  } finally {
    MetadataFactory.analyze = original;
  }
};
var generateInsertValidateFunction = (ctx, type, columns, typeName) => withInsertableMetadata(
  columns,
  () => generateValidateFunction(ctx, type, typeName)
);
var generateInsertIsFunction = (ctx, type, columns, typeName) => withInsertableMetadata(
  columns,
  () => generateIsFunction(ctx, type, typeName)
);
var generateInsertAssertFunction = (ctx, type, columns, typeName) => withInsertableMetadata(
  columns,
  () => generateAssertFunction(ctx, type, typeName)
);
var generateHttpAssertQueryFunction = (ctx, type, typeName) => {
  const typiaCtx = toTypiaContext(ctx);
  return HttpAssertQueryProgrammer.write({
    context: typiaCtx,
    modulo: ctx.modulo,
    type,
    name: typeName
  });
};
var DATE_SCHEMA = {
  type: "string",
  format: "date-time"
};
var isClickHouseInternalProperty = (name) => name.startsWith("_clickhouse_") || name === "_LowCardinality";
var cleanJsonSchema = (schema) => {
  if (schema.$ref === "#/components/schemas/Date") {
    const { $ref, ...rest } = schema;
    return { ...DATE_SCHEMA, ...rest };
  }
  if (schema.type === "object") {
    const result = { ...schema };
    if (schema.properties) {
      const cleanedProperties = {};
      const cleanedRequired = [];
      for (const [key, value] of Object.entries(schema.properties)) {
        if (!isClickHouseInternalProperty(key)) {
          cleanedProperties[key] = cleanJsonSchema(value);
          if (schema.required?.includes(key)) {
            cleanedRequired.push(key);
          }
        }
      }
      result.properties = cleanedProperties;
      result.required = cleanedRequired.length > 0 ? cleanedRequired : void 0;
    }
    if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
      result.additionalProperties = cleanJsonSchema(
        schema.additionalProperties
      );
    }
    return result;
  }
  if (schema.type === "array") {
    const result = { ...schema };
    if (schema.items) {
      result.items = cleanJsonSchema(schema.items);
    }
    if (schema.prefixItems && Array.isArray(schema.prefixItems)) {
      result.prefixItems = schema.prefixItems.map(cleanJsonSchema);
    }
    if (schema.additionalItems && typeof schema.additionalItems === "object") {
      result.additionalItems = cleanJsonSchema(schema.additionalItems);
    }
    return result;
  }
  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    return {
      ...schema,
      oneOf: schema.oneOf.map(cleanJsonSchema)
    };
  }
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    return {
      ...schema,
      anyOf: schema.anyOf.map(cleanJsonSchema)
    };
  }
  if (schema.allOf && Array.isArray(schema.allOf)) {
    return {
      ...schema,
      allOf: schema.allOf.map(cleanJsonSchema)
    };
  }
  return schema;
};
var cleanJsonSchemaCollection = (collection) => {
  const cleanedComponentsSchemas = {};
  if (collection.components.schemas) {
    for (const [name, schema] of Object.entries(
      collection.components.schemas
    )) {
      if (name === "Date") {
        cleanedComponentsSchemas[name] = DATE_SCHEMA;
      } else {
        cleanedComponentsSchemas[name] = cleanJsonSchema(schema);
      }
    }
  }
  const cleanedSchemas = collection.schemas.map(
    (s) => cleanJsonSchema(s)
  );
  return {
    ...collection,
    components: {
      ...collection.components,
      schemas: cleanedComponentsSchemas
    },
    schemas: cleanedSchemas
  };
};
var generateJsonSchemas = (ctx, type) => {
  const metadataResult = MetadataFactory.analyze({
    checker: ctx.checker,
    transformer: ctx.transformer,
    options: {
      absorb: true,
      constant: true,
      escape: false
      // Match CheckerProgrammer - this is key!
    },
    collection: new MetadataCollection({
      replace: MetadataCollection.replace
    }),
    type
  });
  if (!metadataResult.success) {
    const errors = metadataResult.errors.map((e) => `${e.name}: ${e.messages.join(", ")}`).join("; ");
    throw new Error(`Typia metadata analysis failed: ${errors}`);
  }
  const rawCollection = JsonSchemasProgrammer.write({
    version: "3.1",
    metadatas: [metadataResult.data]
  });
  const collection = cleanJsonSchemaCollection(rawCollection);
  return ts4.factory.createAsExpression(
    LiteralFactory.write(collection),
    ts4.factory.createKeywordTypeNode(ts4.SyntaxKind.AnyKeyword)
  );
};

// src/dmv2/dataModelMetadata.ts
var typesToArgsLength = /* @__PURE__ */ new Map([
  ["OlapTable", 2],
  ["Stream", 2],
  ["DeadLetterQueue", 2],
  ["IngestPipeline", 2],
  ["IngestApi", 2],
  ["Api", 2],
  ["MaterializedView", 1],
  ["Task", 2]
]);
var isNewMooseResourceWithTypeParam = (node, checker) => {
  if (!ts5.isNewExpression(node)) {
    return false;
  }
  const sym = checker.getSymbolAtLocation(node.expression);
  const typeName = sym?.name ?? "";
  if (!typesToArgsLength.has(typeName)) {
    return false;
  }
  if (!node.arguments) {
    return false;
  }
  const expectedArgLength = typesToArgsLength.get(typeName);
  const actualArgLength = node.arguments.length;
  const isUntransformed = actualArgLength === expectedArgLength - 1 || // name only
  actualArgLength === expectedArgLength;
  return isUntransformed && node.typeArguments?.length === 1;
};
var parseAsAny = (s) => factory.createAsExpression(
  factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createIdentifier("JSON"),
      factory.createIdentifier("parse")
    ),
    void 0,
    [factory.createStringLiteral(s)]
  ),
  factory.createKeywordTypeNode(ts5.SyntaxKind.AnyKeyword)
);
var transformNewMooseResource = (node, checker, ctx) => {
  const typeName = checker.getSymbolAtLocation(node.expression).name;
  const typeNode = node.typeArguments[0];
  let ingestPipelineHasTable = true;
  if (typeName === "IngestPipeline" && node.arguments && node.arguments.length >= 2) {
    const configArg = node.arguments[1];
    if (ts5.isObjectLiteralExpression(configArg)) {
      const tableProperty = configArg.properties.find(
        (prop) => ts5.isPropertyAssignment(prop) && ts5.isIdentifier(prop.name) && prop.name.text === "table"
      );
      if (tableProperty) {
        const tableValue = tableProperty.initializer;
        ingestPipelineHasTable = tableValue.kind !== ts5.SyntaxKind.FalseKeyword;
      }
    }
  }
  const allowIndexSignatures = ["IngestApi", "Stream"].includes(typeName) || typeName === "IngestPipeline" && !ingestPipelineHasTable;
  const typeAtLocation = checker.getTypeAtLocation(typeNode);
  const indexSignatures = checker.getIndexInfosOfType(typeAtLocation);
  const hasIndexSignature = allowIndexSignatures && indexSignatures.length > 0;
  if (typeName === "IngestPipeline" && ingestPipelineHasTable && indexSignatures.length > 0) {
    throw new Error(
      `IngestPipeline cannot use a type with index signatures when 'table' is configured. Extra fields would be silently dropped when writing to the ClickHouse table. Either:
  1. Remove the index signature from your type to use a fixed schema, or
  2. Set 'table: false' in your IngestPipeline config if you only need the API and stream`
    );
  }
  const typiaCtx = ctx.typiaContext;
  let internalArguments;
  let columns;
  if (typeName === "DeadLetterQueue") {
    internalArguments = [generateAssertFunction(typiaCtx, typeAtLocation)];
  } else {
    columns = toColumns(typeAtLocation, checker, {
      allowIndexSignatures
    });
    internalArguments = [
      generateJsonSchemas(typiaCtx, typeAtLocation),
      parseAsAny(JSON.stringify(columns))
    ];
  }
  const resourceName = checker.getSymbolAtLocation(node.expression).name;
  const argLength = typesToArgsLength.get(resourceName);
  const needsExtraArg = node.arguments.length === argLength - 1;
  let updatedArgs = [
    ...node.arguments,
    ...needsExtraArg ? [factory.createObjectLiteralExpression([], false)] : [],
    ...internalArguments
  ];
  if (resourceName === "OlapTable" || resourceName === "IngestPipeline") {
    const validatorsObject = factory.createObjectLiteralExpression(
      [
        factory.createPropertyAssignment(
          factory.createIdentifier("validate"),
          wrapValidateFunction(
            generateValidateFunction(typiaCtx, typeAtLocation)
          )
        ),
        factory.createPropertyAssignment(
          factory.createIdentifier("assert"),
          generateAssertFunction(typiaCtx, typeAtLocation)
        ),
        factory.createPropertyAssignment(
          factory.createIdentifier("is"),
          generateIsFunction(typiaCtx, typeAtLocation)
        )
      ],
      true
    );
    updatedArgs = [...updatedArgs, validatorsObject];
    if (resourceName === "OlapTable" && columns) {
      const insertColumnSets = {
        computed: new Set(
          columns.filter((c) => c.alias != null || c.materialized != null).map((c) => c.name)
        ),
        defaults: new Set(
          columns.filter((c) => c.default != null).map((c) => c.name)
        )
      };
      const insertValidatorsObject = factory.createObjectLiteralExpression(
        [
          factory.createPropertyAssignment(
            factory.createIdentifier("validate"),
            wrapValidateFunction(
              generateInsertValidateFunction(
                typiaCtx,
                typeAtLocation,
                insertColumnSets
              )
            )
          ),
          factory.createPropertyAssignment(
            factory.createIdentifier("assert"),
            generateInsertAssertFunction(
              typiaCtx,
              typeAtLocation,
              insertColumnSets
            )
          ),
          factory.createPropertyAssignment(
            factory.createIdentifier("is"),
            generateInsertIsFunction(
              typiaCtx,
              typeAtLocation,
              insertColumnSets
            )
          )
        ],
        true
      );
      updatedArgs = [...updatedArgs, insertValidatorsObject];
    }
    if (resourceName === "IngestPipeline") {
      updatedArgs = [
        ...updatedArgs,
        hasIndexSignature ? factory.createTrue() : factory.createFalse()
      ];
    }
  }
  if (resourceName === "IngestApi" || resourceName === "Stream") {
    updatedArgs = [
      ...updatedArgs,
      factory.createIdentifier("undefined"),
      // validators (not used for these types)
      hasIndexSignature ? factory.createTrue() : factory.createFalse()
    ];
  }
  return ts5.factory.updateNewExpression(
    node,
    node.expression,
    node.typeArguments,
    updatedArgs
  );
};
var wrapValidateFunction = (validateFn) => {
  return factory.createArrowFunction(
    void 0,
    void 0,
    [
      factory.createParameterDeclaration(
        void 0,
        void 0,
        factory.createIdentifier("data"),
        void 0,
        factory.createKeywordTypeNode(ts5.SyntaxKind.UnknownKeyword),
        void 0
      )
    ],
    void 0,
    factory.createToken(ts5.SyntaxKind.EqualsGreaterThanToken),
    factory.createBlock(
      [
        factory.createVariableStatement(
          void 0,
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                factory.createIdentifier("result"),
                void 0,
                void 0,
                factory.createCallExpression(validateFn, void 0, [
                  factory.createIdentifier("data")
                ])
              )
            ],
            ts5.NodeFlags.Const
          )
        ),
        factory.createReturnStatement(
          factory.createObjectLiteralExpression(
            [
              factory.createPropertyAssignment(
                factory.createIdentifier("success"),
                factory.createPropertyAccessExpression(
                  factory.createIdentifier("result"),
                  factory.createIdentifier("success")
                )
              ),
              factory.createPropertyAssignment(
                factory.createIdentifier("data"),
                factory.createConditionalExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier("result"),
                    factory.createIdentifier("success")
                  ),
                  factory.createToken(ts5.SyntaxKind.QuestionToken),
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier("result"),
                    factory.createIdentifier("data")
                  ),
                  factory.createToken(ts5.SyntaxKind.ColonToken),
                  factory.createIdentifier("undefined")
                )
              ),
              factory.createPropertyAssignment(
                factory.createIdentifier("errors"),
                factory.createConditionalExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier("result"),
                    factory.createIdentifier("success")
                  ),
                  factory.createToken(ts5.SyntaxKind.QuestionToken),
                  factory.createIdentifier("undefined"),
                  factory.createToken(ts5.SyntaxKind.ColonToken),
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier("result"),
                    factory.createIdentifier("errors")
                  )
                )
              )
            ],
            true
          )
        )
      ],
      true
    )
  );
};

// src/consumption-apis/typiaValidation.ts
import ts6, { factory as factory2, SyntaxKind } from "typescript";
var isApiV2 = (node, checker) => {
  if (!ts6.isNewExpression(node)) {
    return false;
  }
  const declaration = checker.getResolvedSignature(node)?.declaration;
  if (!declaration || !isMooseFile(declaration.getSourceFile())) {
    return false;
  }
  const sym = checker.getSymbolAtLocation(node.expression);
  return sym?.name === "Api" || sym?.name === "ConsumptionApi";
};
var transformApiV2 = (node, checker, ctx) => {
  if (!isApiV2(node, checker)) {
    return node;
  }
  if (!node.arguments || node.arguments.length < 2 || !node.typeArguments) {
    return node;
  }
  const typiaCtx = ctx.typiaContext;
  const typeNode = node.typeArguments[0];
  const responseTypeNode = node.typeArguments[1] || factory2.createKeywordTypeNode(ts6.SyntaxKind.AnyKeyword);
  const inputType = checker.getTypeAtLocation(typeNode);
  const responseType = checker.getTypeAtLocation(responseTypeNode);
  const handlerFunc = node.arguments[1];
  const assertQueryFunc = generateHttpAssertQueryFunction(typiaCtx, inputType);
  const wrappedHandler = factory2.createArrowFunction(
    void 0,
    void 0,
    [
      factory2.createParameterDeclaration(
        void 0,
        void 0,
        factory2.createIdentifier("params"),
        void 0,
        void 0,
        void 0
      ),
      factory2.createParameterDeclaration(
        void 0,
        void 0,
        factory2.createIdentifier("utils"),
        void 0,
        void 0,
        void 0
      )
    ],
    void 0,
    factory2.createToken(ts6.SyntaxKind.EqualsGreaterThanToken),
    factory2.createBlock(
      [
        // const assertGuard = <generated http assert query function>
        factory2.createVariableStatement(
          void 0,
          factory2.createVariableDeclarationList(
            [
              factory2.createVariableDeclaration(
                factory2.createIdentifier("assertGuard"),
                void 0,
                void 0,
                assertQueryFunc
              )
            ],
            ts6.NodeFlags.Const
          )
        ),
        // const searchParams = new URLSearchParams(params as any)
        factory2.createVariableStatement(
          void 0,
          factory2.createVariableDeclarationList(
            [
              factory2.createVariableDeclaration(
                factory2.createIdentifier("searchParams"),
                void 0,
                void 0,
                factory2.createNewExpression(
                  factory2.createIdentifier("URLSearchParams"),
                  void 0,
                  [
                    factory2.createAsExpression(
                      factory2.createIdentifier("params"),
                      factory2.createKeywordTypeNode(ts6.SyntaxKind.AnyKeyword)
                    )
                  ]
                )
              )
            ],
            ts6.NodeFlags.Const
          )
        ),
        // const processedParams = assertGuard(searchParams)
        factory2.createVariableStatement(
          void 0,
          factory2.createVariableDeclarationList(
            [
              factory2.createVariableDeclaration(
                factory2.createIdentifier("processedParams"),
                void 0,
                void 0,
                factory2.createCallExpression(
                  factory2.createIdentifier("assertGuard"),
                  void 0,
                  [factory2.createIdentifier("searchParams")]
                )
              )
            ],
            ts6.NodeFlags.Const
          )
        ),
        factory2.createVariableStatement(
          void 0,
          factory2.createVariableDeclarationList(
            [
              factory2.createVariableDeclaration(
                factory2.createIdentifier("originalHandler"),
                void 0,
                factory2.createFunctionTypeNode(
                  void 0,
                  [
                    factory2.createParameterDeclaration(
                      void 0,
                      void 0,
                      "params",
                      void 0,
                      typeNode
                    ),
                    factory2.createParameterDeclaration(
                      void 0,
                      void 0,
                      "utils",
                      void 0,
                      factory2.createImportTypeNode(
                        factory2.createLiteralTypeNode(
                          factory2.createStringLiteral("@514labs/moose-lib")
                        ),
                        void 0,
                        factory2.createIdentifier("ApiUtil"),
                        [],
                        false
                      )
                    )
                  ],
                  factory2.createKeywordTypeNode(SyntaxKind.AnyKeyword)
                ),
                factory2.createParenthesizedExpression(handlerFunc)
              )
            ],
            ts6.NodeFlags.Const
          )
        ),
        // return originalHandler(processedParams, utils)
        factory2.createReturnStatement(
          factory2.createCallExpression(
            factory2.createIdentifier("originalHandler"),
            void 0,
            [
              factory2.createIdentifier("processedParams"),
              factory2.createIdentifier("utils")
            ]
          )
        )
      ],
      true
    )
  );
  const inputSchemaArg = node.arguments.length > 3 ? node.arguments[3] : generateJsonSchemas(typiaCtx, inputType);
  const responseSchemaArg = generateJsonSchemas(typiaCtx, responseType);
  const inputColumnsArg = toColumns(inputType, checker);
  const configArg = node.arguments.length > 2 ? node.arguments[2] : factory2.createObjectLiteralExpression([], false);
  return factory2.updateNewExpression(
    node,
    node.expression,
    node.typeArguments,
    [
      node.arguments[0],
      // name
      wrappedHandler,
      // wrapped handler
      configArg,
      // config object
      inputSchemaArg,
      // input schema
      parseAsAny(JSON.stringify(inputColumnsArg)),
      // input columns
      responseSchemaArg
      // response schema
    ]
  );
};

// src/commons.ts
import { createClient } from "@clickhouse/client";
import { KafkaJS } from "@514labs/kafka-javascript";
var { Kafka } = KafkaJS;
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
var compilerLog = (message) => {
  if (!isTruthy(process.env.MOOSE_DISABLE_COMPILER_LOGS)) {
    console.log(message);
  }
};

// src/compilerPlugin.ts
var applyTransformation = (node, ctx) => {
  if (isApiV2(node, ctx.typeChecker)) {
    compilerLog("[CompilerPlugin] Found API v2, transforming...");
    return transformApiV2(node, ctx.typeChecker, ctx);
  }
  if (isNewMooseResourceWithTypeParam(node, ctx.typeChecker)) {
    compilerLog(
      "[CompilerPlugin] Found Moose resource with type param, transforming..."
    );
    return transformNewMooseResource(node, ctx.typeChecker, ctx);
  }
  return void 0;
};
var transform = (typeChecker, program) => (transformationContext) => (sourceFile) => {
  compilerLog(
    `
[CompilerPlugin] ========== Processing file: ${sourceFile.fileName} ==========`
  );
  let transformationCount = 0;
  const typiaContext = createTypiaContext(
    program,
    transformationContext,
    sourceFile
  );
  const ctx = {
    typeChecker,
    program,
    typiaContext
  };
  const visitNode = (node) => {
    const transformed = applyTransformation(node, ctx);
    if (transformed !== void 0) {
      transformationCount++;
      compilerLog(
        `[CompilerPlugin] Transformation #${transformationCount} applied at position ${node.pos}`
      );
    }
    const result = transformed ?? node;
    return ts7.visitEachChild(result, visitNode, transformationContext);
  };
  const transformedSourceFile = ts7.visitEachChild(
    sourceFile,
    visitNode,
    transformationContext
  );
  compilerLog(
    `[CompilerPlugin] Total transformations applied: ${transformationCount}`
  );
  const typiaImports = typiaContext.importer.toStatements();
  if (typiaImports.length === 0) {
    compilerLog(
      `[CompilerPlugin] ========== Completed processing ${sourceFile.fileName} (no import needed) ==========
`
    );
    return transformedSourceFile;
  }
  compilerLog(
    `[CompilerPlugin] ========== Completed processing ${sourceFile.fileName} (with import) ==========
`
  );
  return factory3.updateSourceFile(
    transformedSourceFile,
    factory3.createNodeArray([
      ...typiaImports,
      ...transformedSourceFile.statements
    ])
  );
};
var compilerPlugin_default = createTransformer(transform);
export {
  compilerPlugin_default as default
};
//# sourceMappingURL=compilerPlugin.mjs.map