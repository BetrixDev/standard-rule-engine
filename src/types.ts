import type { StandardSchemaV1 } from "@standard-schema/spec";

export interface SessionSingletonBase {
  context: Record<string, unknown>;
}

export interface EngineSingletonBase {
  context: Record<string, unknown>;
  globalSchema: StandardSchemaV1 | undefined;
}

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type RecordKey = string | number | symbol;

export type Reconcile<
  A extends Object,
  B extends Object,
  Override extends boolean = false,
  // Detect Stack limit, eg. circular dependency
  Stack extends number[] = [],
> = Stack["length"] extends 16
  ? A
  : Override extends true
    ? {
        [key in keyof A as key extends keyof B ? never : key]: A[key];
      } extends infer Collision
      ? {} extends Collision
        ? {
            [key in keyof B]: IsBothObject<
              // @ts-ignore trust me bro
              A[key],
              B[key]
            > extends true
              ? Reconcile<
                  // @ts-ignore trust me bro
                  A[key],
                  B[key],
                  Override,
                  [0, ...Stack]
                >
              : B[key];
          }
        : Prettify<
            Collision & {
              [key in keyof B]: B[key];
            }
          >
      : never
    : {
          [key in keyof B as key extends keyof A ? never : key]: B[key];
        } extends infer Collision
      ? {} extends Collision
        ? {
            [key in keyof A]: IsBothObject<
              A[key],
              // @ts-ignore trust me bro
              B[key]
            > extends true
              ? Reconcile<
                  // @ts-ignore trust me bro
                  A[key],
                  // @ts-ignore trust me bro
                  B[key],
                  Override,
                  [0, ...Stack]
                >
              : A[key];
          }
        : Prettify<
            {
              [key in keyof A]: A[key];
            } & Collision
          >
      : never;

type IsBothObject<A, B> =
  A extends Record<RecordKey, unknown>
    ? B extends Record<RecordKey, unknown>
      ? IsClass<A> extends false
        ? IsClass<B> extends false
          ? true
          : false
        : false
      : false
    : false;

type IsClass<V> = V extends abstract new (...args: any) => any ? true : false;

export type DeepReadonly<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends object
      ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
      : T;
