---
title: Context
description: Learn about context in the Standard Rule Engine
---

# {{ $frontmatter.title }}

Context is a powerful feature that allows rules to share state and communicate with each other during rule execution. Each session has its own isolated context that persists throughout the rule execution process.

## Basic Usage

Context can be defined in two ways:

1. Using key-value pairs:

```ts
const engine = new Engine().context("count", 0).context("message", "");
```

2. Using an object:

```ts
const engine = new Engine().context({
  count: 0,
  message: "",
  metadata: {
    timestamp: new Date(),
    version: "1.0",
  },
});
```

## Type Safety

Context is fully type-safe. The types are inferred from your context definitions:

<!-- prettier-ignore-start -->
```ts twoslash
import { Engine } from "standard-rule-engine";

// ---cut---
const engine = new Engine()
  .context({
    count: 0,
    message: "",
    items: [] as string[],
  })
  .rule("example", (facts, { context }) => {
    //                         ^?






    
    context.count++;
    context.message = "Hello";
    context.items.push("item");
  });
```
<!-- prettier-ignore-end -->

## Context Functions

If you want to create reusabled functions that can interact with context, see [helpers](./helpers.md)

## Context Inheritance

When combining engines, context is merged:

```ts twoslash
import { Engine } from "standard-rule-engine";

// ---cut---
const baseEngine = new Engine().context({ base: "value" });

const extendedEngine = new Engine()
  .context({ extended: "value" })
  .use(baseEngine);

// The context now has both 'base' and 'extended' properties

const session = extendedEngine.createSession();

session.context.base;
session.context.extended;
```

## Best Practices

- **Initialize All Properties**: Always initialize all context properties you plan to use
- **Use Type Assertions**: When working with arrays or complex types, use type assertions for better type inference
