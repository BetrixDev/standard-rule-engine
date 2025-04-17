import { mergeDeep, standardValidate } from "./utils";
import type { Reconcile, EngineSingletonBase, DeepReadonly } from "./types";
import clone from "clone";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { ZodSchema } from "zod";

export type AnyEngine = Engine<any>;

type Rule = {
  name: string;
  priority: number;
  handler: (...args: any[]) => void;
  schema?: StandardSchemaV1;
};

class Session<
  Context extends Record<string, unknown>,
  Helpers extends Record<string, Function>,
> {
  private insertedFacts: unknown[] = [];
  private wrappedHelpers: Record<string, Function>;

  constructor(
    public context: Context,
    private rules: Rule[],
    helpers: Helpers = {} as Helpers,
  ) {
    this.wrappedHelpers = Object.entries(helpers).reduce(
      (acc, [key, fn]) => {
        acc[key] = (...args: any[]) => {
          return fn(context, ...args);
        };
        return acc;
      },
      {} as Record<string, Function>,
    );
  }

  insert(facts: unknown) {
    this.insertedFacts.push(facts);
    return this;
  }

  insertMany(facts: unknown[]) {
    this.insertedFacts.push(...facts);
    return this;
  }

  fire() {
    for (const facts of this.insertedFacts) {
      Object.freeze(facts);

      for (const rule of this.rules) {
        if (!rule.schema) {
          rule.handler(facts, {
            context: this.context,
            helpers: this.wrappedHelpers,
          });
          continue;
        }

        const validationResult = standardValidate(rule.schema, facts);

        if (!validationResult.success) {
          continue;
        }

        rule.handler(validationResult.data, {
          context: this.context,
          helpers: this.wrappedHelpers,
        });
      }
    }

    return this;
  }
}

export class Engine<
  const in out Singleton extends EngineSingletonBase = {
    context: {};
    globalSchema: undefined;
    helpers: {};
  },
> {
  "~types" = {
    Singleton: {} as Singleton,
  };

  private initialContext = {} as Singleton["context"];
  private rules: Rule[] = [];
  private globalSchema: StandardSchemaV1 | undefined;
  private helpers = {} as Singleton["helpers"];

  schema<const GlobalFactsSchema extends StandardSchemaV1>(
    schema: GlobalFactsSchema,
  ): Engine<{
    context: Singleton["context"];
    globalSchema: GlobalFactsSchema;
    helpers: Singleton["helpers"];
  }> {
    this.globalSchema = schema;
    return this as any;
  }

  context<const Name extends string | number | symbol, Value>(
    name: Name,
    value: Value,
  ): Engine<{
    context: Reconcile<Singleton["context"], { [key in Name]: Value }>;
    globalSchema: Singleton["globalSchema"];
    helpers: Singleton["helpers"];
  }>;
  context<IncomingContext extends Record<string, unknown>>(
    context: IncomingContext,
  ): Engine<{
    context: Reconcile<Singleton["context"], IncomingContext>;
    globalSchema: Singleton["globalSchema"];
    helpers: Singleton["helpers"];
  }>;
  context(nameOrContext: string | Record<string, unknown>, value?: unknown) {
    if (value === undefined && typeof nameOrContext === "object") {
      this.initialContext = mergeDeep(this.initialContext, nameOrContext);
    } else if (typeof nameOrContext === "string") {
      this.initialContext = mergeDeep(this.initialContext, {
        [nameOrContext]: value,
      });
    }

    return this as any;
  }

  helper<const Name extends string, Args extends any[], ReturnType>(
    name: Name,
    fn: (context: Singleton["context"], ...args: Args) => ReturnType,
  ): Engine<{
    context: Singleton["context"];
    globalSchema: Singleton["globalSchema"];
    helpers: Singleton["helpers"] & {
      [key in Name]: (...args: Args) => ReturnType;
    };
  }> {
    this.helpers = {
      ...this.helpers,
      [name]: fn,
    } as any;

    return this as any;
  }

  rule<
    const RuleName extends string,
    const FactsSchema extends Singleton["globalSchema"] extends undefined
      ? StandardSchemaV1 | undefined
      : Singleton["globalSchema"],
  >(
    name: RuleName,
    handler: (
      facts: DeepReadonly<
        FactsSchema extends StandardSchemaV1
          ? StandardSchemaV1.InferOutput<FactsSchema>
          : unknown
      >,
      {
        context,
        helpers,
      }: { context: Singleton["context"]; helpers: Singleton["helpers"] },
    ) => void,
    meta?: {
      schema?: FactsSchema;
      priority?: number;
    },
  ): Engine<{
    context: Singleton["context"];
    globalSchema: Singleton["globalSchema"];
    helpers: Singleton["helpers"];
  }> {
    const newRule: Rule = {
      name,
      handler,
      priority: meta?.priority ?? 1,
      schema: meta?.schema ?? this.globalSchema,
    };

    this.rules.push(newRule);

    this.rules.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.name.localeCompare(b.name);
    });

    return this as any;
  }

  use<const NewEngine extends AnyEngine>(
    instance: NewEngine,
  ): Engine<{
    context: Singleton["context"] & NewEngine["~types"]["Singleton"]["context"];
    globalSchema: Singleton["globalSchema"];
    helpers: Singleton["helpers"] & NewEngine["~types"]["Singleton"]["helpers"];
  }> {
    this.rules = [...this.rules, ...instance.rules];
    this.initialContext = mergeDeep(
      this.initialContext,
      instance.initialContext,
    );
    this.helpers = mergeDeep(this.helpers, instance.helpers) as any;

    return this as any;
  }

  createSession() {
    return new Session<Singleton["context"], Singleton["helpers"]>(
      clone(this.initialContext),
      this.rules,
      this.helpers,
    );
  }
}
