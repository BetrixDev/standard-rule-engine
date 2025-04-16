# standard-rule-engine

<a href="https://pkg-size.dev/standard-rule-engine"><img src="https://pkg-size.dev/badge/bundle/4997" title="Bundle size for standard-rule-engine"></a>

_A work in progress_

A rule engine that uses the standard schema to evaluate rule facts.

The API is very much inspired by [Elysia](https://elysiajs.com)

## Defining an Engine

Engines are modular building blocks that can be combined and chained, allowing you to break down complex functionality into smaller, reusable components.

```ts
import { Engine } from "standard-rule-engine";

// We can't do anything with this yet
const engine = new Engine();
```

### Creating a rule

For our engine to actually do anything, we need to create rules that will be run. By default, all rules are run for any given set of facts.

> [!IMPORTANT]  
> Notice the user of method chaining in the example below. This is crucial to allow for correct type inferencing throughout the library.

```ts
import { Engine } from "standard-rule-engine";

const engine = new Engine().rule("ruleName", (facts) => {
  console.log("I will be run for every set of facts", facts);
});
```

#### Defining rule facts

We can define a custom schema for a rule's facts so that the rule is only run when the facts match that schema. Facts are readonly and cannot be mutated.

> [!NOTE]  
> Any validation library that implements the [Standard Schema](https://standardschema.dev) is supported. (zod, arktype, valibot, etc)

```ts
import { Engine } from "standard-rule-engine";
import { z } from "zod";

const engine = new Engine().rule(
  "ruleName",
  (facts) => {
    // facts is now strongly typed to what the `schema` is
    console.log(`The user's age is ${facts.age}`);
  },
  {
    schema: z.object({
      age: z.number(),
    }),
  },
);
```

#### Engine scoped schemas

You can call the `.schema()` method on an Engine class to have all rules that directly build off of that engine have their facts derrived from that schema. If a rule attempts to define its own schema when its parent engine has a scoped schema, the rule's schema **must** extend the engine's schema or there will be an error.

```ts
import { Engine } from "standard-rule-engine";
import { z } from "zod";

const engine = new Engine()
  .schema(z.object({ age: z.number() }))
  .rule("ruleName", (facts) => {
    // facts is now strongly typed to what the `schema` is
    console.log(`The user's age is ${facts.age}`);
  });
```

```ts
import { Engine } from "standard-rule-engine";
import { z } from "zod";

const engine = new Engine().schema(z.object({ age: z.number() })).rule(
  "ruleName",
  (facts) => {
    console.log(`The user's age is ${facts.age}`);
  },
  {
    schema: z.object({
      randomProperty: z.string(), // Error on this line because this schema doesn't extend the scoped schema
    }),
  },
);
```

```ts
import { Engine } from "standard-rule-engine";
import { z } from "zod";

const engine = new Engine().schema(z.object({ age: z.number() })).rule(
  "ruleName",
  (facts) => {
    console.log(`The user's age is ${facts.age}`);
  },
  {
    schema: z.object({
      age: z.number(),
      randomProperty: z.string(), // This one doesn't error
    }),
  },
);
```

### Context

For our rules to actually do anything meaningful, they have to mutate context. Context is defined on the Engine using the `.context()` method. Context is unique between sessions, and is shared between rules run in that session.

```ts
import { Engine } from "standard-rule-engine";

const engine = new Engine()
  .context("amountOfRulesRun", 0)
  .rule("ruleName", (facts, { context }) => {
    // `context` is fully inferred. This is why method chaining is so useful
    context.amountOfRulesRun++;
  });
```

##### .context() signatures

Context can be called with either the name of the key in context and value, or by passing in an object as the first and only parameter. When an object is passed in, it is deeply merged with the current contexts.

```ts
import { Engine } from "standard-rule-engine";

const engine = new Engine()
  .context({ hello: "world" })
  .context("amountOfRulesRun", 0)
  .rule("ruleName", (facts, { context }) => {
    // `context` is fully inferred. This is why method chaining is so useful
    context.amountOfRulesRun++;
    console.log(context.hello);
  });
```

#### Helper functions

Context can hold things other than primitives, such as functions. This is useful for having helper methods that can be shared between rules.

```ts
import { Engine } from "standard-rule-engine";

const engine = new Engine()
  .context({ conditions: [] as string[] }) // Cast the array to more specific type for better inference
  .context("addCondition", (context, conditionName: string) => {
    context.conditions.push({ name: conditionName, appliedAt: new Date() });
  })
  .rule("ruleName", (facts, { context }) => {
    context.addCondition("Very bad condition");
  });
```

### Helpers

Helpers allow you to define reusable functions that have access to the engine's context. They are defined on the engine and can be accessed in rules via the `helpers` object.

```ts
import { Engine } from "standard-rule-engine";

const engine = new Engine()
  .context("count", 0)
  .helper("increment", (context) => {
    context.count++;
  })
  .helper("add", (context, a: number, b: number) => {
    return a + b;
  })
  .rule("use-helper", (_, { context, helpers }) => {
    helpers.increment();
    const sum = helpers.add(5, 3);
    console.log(`Sum: ${sum}`);
  });
```

Helpers are particularly useful for:

1. **Reusable logic**: Define common operations that can be used across multiple rules
2. **Complex calculations**: Encapsulate complex logic in a helper function
3. **Shared functionality**: Create utility functions that can be used by any rule

When defining a helper function, the context is always the first parameter. However, when calling a helper function in a rule, you don't need to pass the context - it's automatically injected for you.

## Sessions

Sessions are similar to how they behave in [NRules](https://nrules.net/index.html). They are how you actually execute rules against a set of facts.

[TypeScript Playground Link](https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAbzgUQHYHNioKZwL5wBmUEIcARAM4wCGqAJjVPQLRQCuANti9hltnIBYAFChIsRHABe+IiTLlpEesJGiAxhFTU4fTDjgBeODgDuKfjgAUASlFw4AOi2oY2AB4xr5YJQCC9Fww5AA0RDSclNj2Io5OHNw+fgCq0VCBwQBKXILh1oQ0GjCU4Uiu7l74tsYAfIgOjnAVnjBOfpmc8CaFxZRONOi4tSYAjAAcANyNeGWNjpQaABbYIDQAXDJOEABGAFbYxdYI802D2JvSTqjsIDvYUHahp3i2z3HV0+oirrrRlJRgNpjHorNgXFBsDR3ABlbAAoGoOxfUT-QHado6B7eJDnTYTT5wAD0RLgAEksZJeiU4DAIHAOKgGblKHBBjQsNRRKj4ejUE5CMBIcjiaTkAA3SLsaG4SKcZncVkrSHcn7aSgQbhOTgQdDWNGIlzaSptDpBLq2SaiuAAAxaXhtcD8zWgkOKnAAnrSPWBsPQ4DsaNF-cCYCtQQZsAByVn0bCC1DAGCIoA)

```ts
import { Engine } from "standard-rule-engine";
import { z } from "zod";

const engine = new Engine().context("isAdult", false).rule(
  "isUserAdultRule",
  (facts, { context }) => {
    context.isAdult = facts.age >= 18;
  },
  {
    schema: z.object({
      age: z.number(),
    }),
  },
);

const session = engine.createSession();

session.insert({ age: 18 }); // Insert facts to run rules against

session.fire(); // Evaluate all rules here

console.log(session.context.isAdult); // `context` is correctly typed based on the engine's definition
```
