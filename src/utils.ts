import type { StandardSchemaV1 } from "@standard-schema/spec";

export const isNotEmpty = (obj?: Object) => {
  if (!obj) return false;

  for (const x in obj) return true;

  return false;
};

export const isClass = (v: Object) =>
  (typeof v === "function" && /^\s*class\s+/.test(v.toString())) ||
  // Handle Object.create(null)
  (v.toString &&
    // Handle import * as Sentry from '@sentry/bun'
    // This also handle [object Date], [object Array]
    // and FFI value like [object Prisma]
    v.toString().startsWith("[object ") &&
    v.toString() !== "[object Object]") ||
  // If object prototype is not pure, then probably a class-like object
  isNotEmpty(Object.getPrototypeOf(v));

const isObject = (item: any): item is Object =>
  item && typeof item === "object" && !Array.isArray(item);

export const mergeDeep = <
  A extends Record<string, any>,
  B extends Record<string, any>,
>(
  target: A,
  source: B,
  {
    skipKeys,
    override = true,
  }: {
    skipKeys?: string[];
    override?: boolean;
  } = {},
): A & B => {
  if (!isObject(target) || !isObject(source)) return target as A & B;

  for (const [key, value] of Object.entries(source)) {
    if (skipKeys?.includes(key)) continue;

    if (!isObject(value) || !(key in target) || isClass(value)) {
      if (override || !(key in target))
        target[key as keyof typeof target] = value;

      continue;
    }

    target[key as keyof typeof target] = mergeDeep(
      (target as any)[key] as any,
      value,
      { skipKeys, override },
    );
  }

  return target as A & B;
};

export function standardValidate<T extends StandardSchemaV1>(
  schema: T,
  input: StandardSchemaV1.InferInput<T>,
) {
  let result = schema["~standard"].validate(input);

  if (result instanceof Promise) {
    throw new Error("Facts input must be synchronous");
  }

  if (result.issues) {
    return {
      success: false as const,
      issues: result.issues,
      data: null,
    };
  }

  return {
    success: true as const,
    issues: null,
    data: result.value as StandardSchemaV1.InferOutput<T>,
  };
}
