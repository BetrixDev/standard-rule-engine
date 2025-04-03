import { ZodSchema, z } from "zod";
import { mergeDeep } from "./utils";
import { Reconcile, SingletonBase } from "./types";

// Maybe engine class should expose a method to create a new session. The session would allow the user to pass in of their facts at different points in time, then run the rules.

export type AnyEngine = Engine<any>;

class Engine<
  const in out Singleton extends SingletonBase = {
    state: {};
    helpers: {};
  }
> {
  "~types" = {
    Singleton: {} as Singleton,
  };

  private helpers: Singleton["helpers"] = {} as Singleton["helpers"];
  private initialState: Singleton["state"] = {} as Singleton["state"];
  private rules: {
    name: string;
    handler: (...args: any[]) => void;
    meta?: {
      schema?: ZodSchema;
    };
  }[] = [];

  state<IncomingStore extends Record<string, unknown>>(
    store: IncomingStore
  ): Engine<{
    state: Reconcile<Singleton["state"], IncomingStore>;
    helpers: Singleton["helpers"];
  }> {
    this.initialState = mergeDeep(this.initialState, store);

    return this as any;
  }

  helper<
    const Name extends string | number | symbol,
    const Helper extends (
      state: Singleton["state"],
      ...args: any[]
    ) => void | Partial<Singleton["state"]> | void
  >(
    name: Name,
    helper: Helper
  ): Engine<{
    state: Singleton["state"];
    helpers: Singleton["helpers"] & { [key in Name]: Helper };
  }> {
    this.helpers = {
      ...this.helpers,
      [name]: helper,
    };

    return this as any;
  }

  rule<
    const RuleName extends string,
    const FactsSchema extends ZodSchema | unknown
  >(
    name: RuleName,
    handler: (
      facts: FactsSchema extends ZodSchema ? z.infer<FactsSchema> : unknown,
      {
        state,
        helpers,
      }: { state: Singleton["state"]; helpers: Singleton["helpers"] }
    ) => void,
    meta?: {
      schema?: FactsSchema;
    }
  ): Engine<{
    state: Reconcile<Singleton["state"], { [key: string]: unknown }>;
    helpers: Singleton["helpers"];
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
    instance: NewEngine
  ): Engine<{
    helpers: Singleton["helpers"] & NewEngine["~types"]["Singleton"]["helpers"];
    state: Singleton["state"] & NewEngine["~types"]["Singleton"]["state"];
  }> {
    // TODO: Rules coming from other instances should inherit instance scoped schemas (when those exist)
    this.rules = [...this.rules, ...instance.rules];
    this.helpers = { ...this.helpers, ...instance.helpers };
    this.initialState = mergeDeep(this.initialState, instance.initialState);

    return this as any;
  }

  run(facts: unknown) {
    const state = structuredClone(this.initialState);

    for (const rule of this.rules) {
      const shouldRunRule = rule.meta?.schema
        ? rule.meta.schema.safeParse(facts).success
        : true;

      if (!shouldRunRule) continue;

      rule.handler(facts, { state, helpers: this.helpers });
    }

    return state;
  }
}

// Fully type-safe :)

const helperFromAnotherEngine = new Engine().helper(
  "log",
  (_, message: string) => {
    console.log(message);
  }
);

const engine = new Engine()
  .use(helperFromAnotherEngine)
  .state({
    totalFines: 0,
    violations: [] as string[],
    latestViolation: new Date(0),
  })
  .helper("addFine", (state, fine: number) => {
    state.totalFines += fine;
  })
  .helper("addViolation", (state, violation: string) => {
    state.violations.push(violation);
  })
  .rule(
    "traffic-violation",
    (facts, { state, helpers }) => {
      helpers.log(state, "logging in this rule");
      helpers.addFine(state, facts.violation.fine);
      helpers.addViolation(state, facts.violation.type);

      if (facts.violation.date > state.latestViolation) {
        state.latestViolation = facts.violation.date;
      }
    },
    {
      schema: z.object({
        violation: z.object({
          type: z.string(),
          date: z.date(),
          fine: z.number(),
          location: z.string(),
          speed: z.number().optional(),
        }),
      }),
    }
  );

const result = engine.run({
  violation: {
    type: "Speeding",
    date: new Date("2023-11-15"),
    fine: 250.0,
    location: "Main Street",
    speed: 65,
  },
});

console.log(result);
