# standard-rule-engine

_A work in progress_

A rule engine that uses the standard schema to evaluate rule facts.

The API is very much inspired by [Elysia](https://elysiajs.com)

## Defining an Engine

Engines are modular building blocks that can be combined and chained, allowing you to break down complex functionality into smaller, reusable components.

```ts
import { Engine } from "standard-rule-engine"

// We can't do anything with this yet
const engine = new Engine();
```

### Creating a rule

For our engine to actually do anything, we need to create rules that will be run. By default, all rules are run for any given set of facts.

> [!IMPORTANT]  
> Notice the user of method chaining in the example below. This is crucial to allow for correct type inferencing throughout the library.

```ts
import { Engine } from "standard-rule-engine"

const engine = new Engine()
  .rule("ruleName", (facts) => {
    console.log("I will be run for every set of facts", facts);
  });
```

#### Defining rule facts

We can define a custom schema for a rule's facts so that the rule is only run when the facts match that schema.

> [!NOTE]  
> Any validation library that implements the [Standard Schema](https://standardschema.dev) is supported. (zod, arktype, valibot, etc)


```ts
import { Engine } from "standard-rule-engine"
import { z } from "zod";

const engine = new Engine()
  .rule("ruleName", (facts) => {
    // facts is now strongly typed to the `schema` is
    console.log(`The user's age is ${facts.age}`);
  }, {
    schema: z.object({
      age: z.number(),
    }),
  });
```

### Context

For our rules to actually do anything meaningful, they have to mutate context. Context is defined on the Engine using the `.context()` method. Context is unique between sessions, and is shared between rules run in that session.

```ts
import { Engine } from "standard-rule-engine"

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
import { Engine } from "standard-rule-engine"

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
import { Engine } from "standard-rule-engine"

const engine = new Engine()
  .context({ conditions: [] as string[] }) // Cast the array to more specific type for better inference
  .context("addCondition", (context, conditionName: string) => {
    context.conditions.push({ name: conditionName, appliedAt: new Date() })
  })
  .rule("ruleName", (facts, { context }) => {
    context.addCondition("Very bad condition");
  });
```

## Sessions

Sessions are similar to how they behave in [NRules](https://nrules.net/index.html). They are how you actually execute rules against a set of facts.

```ts
const engine = new Engine()
  .context("isAdult", false)
  .rule("isUserAdultRule", (facts, { context }) => {
    context.isAdult = facts.age >= 18;
  }, {
    schema: z.object({
      age: z.number(),
    }),
  });

const session = engine.createSession();

session.insert({ age: 18 }); // Insert facts to run rules against

session.fire(); // Evaluate all rules here

console.log(session.context.isAdult); // `context` is correctly typed based on the engine's definition
```