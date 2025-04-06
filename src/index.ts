import { mergeDeep, standardValidate } from "./utils";
import type {
  Reconcile,
  EngineSingletonBase,
  SessionSingletonBase,
  DeepReadonly,
} from "./types";
import clone from "clone";
import type { StandardSchemaV1 } from "@standard-schema/spec";

export type AnyEngine = Engine<any>;

type Rule = {
  name: string;
  handler: (...args: any[]) => void;
  meta?: {
    schema?: StandardSchemaV1;
  };
};

class Session<Context extends Record<string, unknown>> {
  private insertedFacts: unknown[] = [];

  constructor(
    public context: Context,
    private rules: Rule[],
    private globalSchema?: StandardSchemaV1 | undefined,
  ) {}

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
        if (!rule.meta?.schema && !this.globalSchema) {
          rule.handler(facts, { context: this.context });
          continue;
        }

        const validationResult = standardValidate(
          // @ts-expect-error
          rule.meta?.schema ?? this.globalSchema,
          facts,
        );

        if (!validationResult.success) {
          continue;
        }

        rule.handler(validationResult.data, {
          context: this.context,
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
  },
> {
  "~types" = {
    Singleton: {} as Singleton,
  };

  private initialContext = {} as Singleton["context"];
  private rules: Rule[] = [];
  private globalSchema: StandardSchemaV1 | undefined;

  schema<const GlobalFactsSchema extends StandardSchemaV1>(
    schema: GlobalFactsSchema,
  ): Engine<{
    context: Singleton["context"];
    globalSchema: GlobalFactsSchema;
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
  }>;
  context<IncomingContext extends Record<string, unknown>>(
    context: IncomingContext,
  ): Engine<{
    context: Reconcile<Singleton["context"], IncomingContext>;
    globalSchema: Singleton["globalSchema"];
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
      { context }: { context: Singleton["context"] },
    ) => void,
    meta?: {
      schema?: FactsSchema;
    },
  ): Engine<{
    context: Singleton["context"];
    globalSchema: Singleton["globalSchema"];
  }> {
    this.rules.push({
      name,
      handler,
      meta: {
        schema: meta?.schema as any,
      },
    });

    return this as any;
  }

  use<const NewEngine extends AnyEngine>(
    instance: NewEngine,
  ): Engine<{
    context: Singleton["context"] & NewEngine["~types"]["Singleton"]["context"];
    globalSchema: Singleton["globalSchema"];
  }> {
    // TODO: Rules coming from other instances should inherit instance scoped schemas (when those exist)
    this.rules = [...this.rules, ...instance.rules];
    this.initialContext = mergeDeep(
      this.initialContext,
      instance.initialContext,
    );

    return this as any;
  }

  createSession() {
    return new Session<Singleton["context"]>(
      clone(this.initialContext),
      this.rules,
      this.globalSchema,
    );
  }
}
