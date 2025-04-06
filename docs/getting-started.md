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

Learn more about [Engines](/docs/the-engine)

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
    // [!code focus]
    schema: z.number(), // [!code focus]
  }, // [!code focus]
);
```

::: info
All rule facts are immutable. See [context](/docs/context) to see how to
return data from a rule.
:::

Learn more about [Rules](/docs/the-rule)

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

const session = engine.createSession(); // [!code focus]

session.insert(1); // [!code focus]
session.insert(2); // [!code focus]
session.fire(); // [!code focus]
```

Learn more about [Sessions](/docs/sessions)

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
      // [!code highlight]
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
  .insert({ personalFoulCount: 5, gameDuration: 40 });

session.fire();

console.log(session.context.message); // [!code highlight]
```

Learn more about [Context](/docs/context)
