---
title: Getting Started
description: Get started using the Standard Rule Engine
---

# {{ $frontmatter.title }}

Much of the API is inspired by projects such as [Elysia](https://github.com/elysiajs/elysia) and [NRules](https://github.com/nRules/nRules).

[[toc]]

## Installation

::: code-group

```bash [npm]
npm install standard-rule-engine
```

```bash [yarn]
yarn add standard-rule-engine
```

```bash [pnpm]
pnpm install standard-rule-engine
```

```bash [bun]
bun install standard-rule-engine
```

:::

## Creating an Engine

Engines are modular building blocks that can be combined and chained, allowing you to break down complex functionality into smaller, reusable components.

```ts twoslash
import { Engine } from "standard-rule-engine";

// We can't do anything with this yet
const engine = new Engine();
```

::: info
For any methods you call on an engine, you must use method chaining in order
to ensure type safety.
:::

Learn more about [Engines](/the-engine)

## Creating a Rule

```ts twoslash
import { Engine } from "standard-rule-engine";

const engine = new Engine().rule("is-even", (fact) => {
  if (typeof fact === "number") {
    const isEven = fact % 2 === 0;

    if (isEven) {
      console.log("even");
    } else {
      console.log("odd");
    }
  }
});
```

### Using a schema validation library

Since we support the [Standard Schema](https://standardschema.dev), you can use any schema validation library to validate and strongly type your facts.

```ts twoslash
import { Engine } from "standard-rule-engine";
import { z } from "zod";

const engine = new Engine().rule(
  "is-even",
  (fact) => {
    const isEven = fact % 2 === 0;
    //             ^?

    if (isEven) {
      console.log("even");
    } else {
      console.log("odd");
    }
  },
  {
    schema: z.number(),
  },
);
```

::: info
All rule facts are immutable. See [context](/context) to see how to
return data from a rule.
:::

Learn more about [Rules](/rules)

## Running rules with a session

Sessions are used to run rules on sets of facts.

```ts twoslash
import { Engine } from "standard-rule-engine";

const engine = new Engine().rule("is-even", (fact) => {
  if (typeof fact === "number") {
    const isEven = fact % 2 === 0;

    if (isEven) {
      console.log("even");
    } else {
      console.log("odd");
    }
  }
});

const session = engine.createSession().insert(1).insert(2).fire();
```

Learn more about [Sessions](/sessions)

## Using context to get data out

Context is unique for each session and can be accessed by rules to return data from the rule.

```ts twoslash
import { Engine } from "standard-rule-engine";
import { z } from "zod";

const engine = new Engine()
  .context("message", "") // Create a context variable called message, fully typed // [!code highlight]
  .rule(
    "hasPlayerFouledOut",
    (facts, { context }) => {
      if (
        (facts.gameDuration === 40 && facts.personalFoulCount >= 5) ||
        (facts.gameDuration === 48 && facts.personalFoulCount >= 6)
      ) {
        context.message = "Player has fouled out"; // [!code highlight]
      }
    },
    {
      schema: z.object({
        personalFoulCount: z.number(),
        gameDuration: z.number(),
      }),
    },
  );

const session = engine
  .createSession()
  .insert({ personalFoulCount: 5, gameDuration: 40 })
  .fire();

console.log(session.context.message); // [!code highlight]
```

Learn more about [Context](/context)

## Using helpers for reusable functions

Helpers allow you to define reusable functions that have access to the engine's context. They are defined on the engine and can be accessed in rules via the `helpers` object.

```ts twoslash
import { Engine } from "standard-rule-engine";
import { z } from "zod";

const engine = new Engine()
  .context("count", 0)
  .helper("increment", (context) => {
    context.count++;
  })
  .helper("add", (_, a: number, b: number) => {
    return a + b;
  })
  .rule("use-helper", (_, { context, helpers }) => {
    helpers.increment();
    const sum = helpers.add(5, 3);
    console.log(`Sum: ${sum}`);
  });

const session = engine.createSession().insert({}).fire();

console.log(session.context.count); // 1
```

Helpers are particularly useful for:

1. **Reusable logic**: Define common operations that can be used across multiple rules
2. **Complex calculations**: Encapsulate complex logic in a helper function
3. **Shared functionality**: Create utility functions that can be used by any rule

When defining a helper function, the context is always the first parameter. However, when calling a helper function in a rule, you don't need to pass the context - it's automatically injected for you.

Learn more about [Helpers](/helpers)
