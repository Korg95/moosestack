var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/dataModels/toDataModels.ts
import { isEnumDeclaration, isInterfaceDeclaration } from "typescript";

// src/dataModels/typeConvert.ts
import ts2, {
  displayPartsToString,
  isIdentifier,
  isTypeReferenceNode,
  SymbolFlags,
  TypeFlags
} from "typescript";

// src/dataModels/enumConvert.ts
import ts from "typescript";

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
var isEnum = (t) => !!(t.getFlags() & ts.TypeFlags.EnumLiteral);
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
      if (arg && ts2.isLiteralTypeNode(arg) && ts2.isNumericLiteral(arg.literal)) {
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
      if (ts2.isLiteralTypeNode(defaultValueType) && ts2.isStringLiteral(defaultValueType.literal)) {
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

// src/dataModels/toDataModels.ts
import * as fs from "fs";

// src/compiler-config.ts
import { existsSync, readFileSync } from "fs";
import path from "path";
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
    let content = readFileSync(
      path.join(projectRoot, "tsconfig.json"),
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
  return path.resolve(projectRoot2, outDir, sourceDir, "index.js");
}
function hasCompiledArtifacts(projectRoot2 = process.cwd()) {
  return existsSync(getCompiledIndexPath(projectRoot2));
}
function detectModuleSystem(projectRoot2 = process.cwd()) {
  const pkgPath = path.join(projectRoot2, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkgContent = readFileSync(pkgPath, "utf-8");
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
  return __require(modulePath);
}

// src/dataModels/toDataModels.ts
var convertSourceFile = (sourceFile, checker) => {
  const output = {
    models: [],
    enums: []
  };
  let fileSymbol = checker.getSymbolAtLocation(sourceFile);
  let exports = fileSymbol === void 0 ? [] : checker.getExportsOfModule(fileSymbol);
  exports.forEach((exported) => {
    const declaration = exported.declarations[0];
    if (isInterfaceDeclaration(declaration)) {
      const name = declaration.name.text;
      const t = checker.getTypeAtLocation(declaration);
      const columns = toColumns(t, checker);
      output.models.push({
        name,
        columns
      });
    }
    if (isEnumDeclaration(declaration)) {
      const t = checker.getTypeAtLocation(declaration);
      output.enums.push(enumConvert(t));
    }
  });
  return output;
};
function toDataModels_default(program, _pluginConfig, _extras) {
  const checker = program.getTypeChecker();
  const cwd = program.getCurrentDirectory();
  const dataModelDir = `${cwd}/${getSourceDir()}/datamodels/`;
  const oldVersionDir = `${cwd}/.moose/versions/`;
  const outputDir = `${cwd}/.moose/serialized_datamodels/`;
  fs.mkdirSync(outputDir, { recursive: true });
  return (_ctx) => {
    return (sourceFile) => {
      if (sourceFile.fileName.startsWith(dataModelDir) || sourceFile.fileName.startsWith(oldVersionDir)) {
        let output;
        try {
          output = convertSourceFile(sourceFile, checker);
        } catch (e) {
          if (e instanceof UnknownType) {
            output = {
              error_type: "unknown_type",
              field: e.fieldName,
              parent: e.typeName,
              type: e.t.getSymbol()?.name
            };
          } else if (e instanceof NullType) {
            output = {
              error_type: "unknown_type",
              field: e.fieldName,
              parent: e.typeName,
              type: "null"
            };
          } else if (e instanceof IndexType) {
            output = {
              error_type: "index_type",
              type: e.typeName,
              index_signatures: e.indexSignatures
            };
          } else if (e instanceof UnsupportedEnum) {
            output = {
              error_type: "unsupported_enum",
              type_name: e.enumName
            };
          } else if (e instanceof UnsupportedFeature) {
            output = {
              error_type: "unsupported_feature",
              feature_name: e.featureName
            };
          } else {
            throw e;
          }
        }
        const nameWithoutExtension = sourceFile.fileName.slice(sourceFile.fileName.lastIndexOf("/")).replace(/\.ts$/, "");
        fs.writeFileSync(
          `${outputDir}/${nameWithoutExtension}.json`,
          JSON.stringify(output),
          "utf8"
        );
      }
      return sourceFile;
    };
  };
}
export {
  toDataModels_default as default
};
//# sourceMappingURL=toDataModels.mjs.map