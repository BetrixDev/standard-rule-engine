import { mergeDeep, standardValidate } from './utils';
import type {
  Reconcile,
  EngineSingletonBase,
  SessionSingletonBase,
  DeepReadonly,
} from './types';
import clone from 'clone';
import type { StandardSchemaV1 } from '@standard-schema/spec';

export type AnyEngine = Engine<any>;

type Rule = {
  name: string;
  handler: (...args: any[]) => void;
  meta?: {
    schema?: StandardSchemaV1;
  };
};

class Session<
  const in out Singleton extends SessionSingletonBase = { context: {} },
> {
  '~types' = {
    Singleton: {} as Singleton,
  };

  private insertedFacts: unknown[] = [];

  constructor(
    public context: Singleton['context'],
    private rules: Rule[],
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
        if (!rule.meta?.schema) {
          rule.handler(facts, { context: this.context });
          continue;
        }

        const validationResult = standardValidate(rule.meta.schema, facts);

        if (!validationResult.success) {
          continue;
        }

        rule.handler(validationResult.data, {
          context: this.context,
        });
      }
    }
  }
}

export class Engine<
  const in out Singleton extends EngineSingletonBase = {
    context: {};
  },
> {
  '~types' = {
    Singleton: {} as Singleton,
  };

  private initialContext = {} as Singleton['context'];
  private rules: Rule[] = [];

  context<const Name extends string | number | symbol, Value>(
    name: Name,
    value: Value,
  ): Engine<{
    context: Reconcile<Singleton['context'], { [key in Name]: Value }>;
  }>;
  context<IncomingContext extends Record<string, unknown>>(
    context: IncomingContext,
  ): Engine<{
    context: Reconcile<Singleton['context'], IncomingContext>;
  }>;
  context(nameOrContext: string | Record<string, unknown>, value?: unknown) {
    if (value === undefined && typeof nameOrContext === 'object') {
      this.initialContext = mergeDeep(this.initialContext, nameOrContext);
    } else if (typeof nameOrContext === 'string') {
      this.initialContext = mergeDeep(this.initialContext, {
        [nameOrContext]: value,
      });
    }

    return this as any;
  }

  rule<
    const RuleName extends string,
    const FactsSchema extends StandardSchemaV1 | unknown,
  >(
    name: RuleName,
    handler: (
      facts: DeepReadonly<
        FactsSchema extends StandardSchemaV1
          ? StandardSchemaV1.InferOutput<FactsSchema>
          : unknown
      >,
      { context }: { context: Singleton['context'] },
    ) => void,
    meta?: {
      schema?: FactsSchema;
    },
  ): Engine<{
    context: Reconcile<Singleton['context'], { [key: string]: unknown }>;
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
    context: Singleton['context'] & NewEngine['~types']['Singleton']['context'];
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
    return new Session<{
      context: Singleton['context'];
    }>(clone(this.initialContext), this.rules);
  }
}
