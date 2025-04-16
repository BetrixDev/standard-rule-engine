---
title: The Engine
description: Learn about the Engine in the Standard Rule Engine
---

# {{ $frontmatter.title }}

The Engine is the core component of the Standard Rule Engine. It serves as a container for rules, context, and helpers, providing a flexible and type-safe way to build rule-based systems.

## Creating an Engine

Engines are created using the `Engine` class:

```ts
import { Engine } from "standard-rule-engine";

const engine = new Engine();
```

## Adding Rules

Rules are added to an engine using the `rule()` method:

```ts twoslash
import { Engine } from "standard-rule-engine";

// ---cut---
const engine = new Engine().rule("example", (facts, { context }) => {
  // Rule logic here
});
```

## Setting Context

Context is set using the `context()` method:

```ts twoslash
import { Engine } from "standard-rule-engine";

// ---cut---
const engine = new Engine().context("count", 0).context({
  message: "",
  timestamp: new Date(),
});
```

## Adding Helpers

Helpers are added using the `helper()` method:

```ts twoslash
import { Engine } from "standard-rule-engine";

// ---cut---
const engine = new Engine()
  .context("count", 0)
  .helper("increment", (context) => {
    context.count++;
  })
  .helper("format", (_, value: string) => {
    return value.toUpperCase();
  });
```

## Creating Sessions

Sessions are created using the `createSession()` method:

```ts
const session = engine.createSession();
```

## Combining Engines

Engines can be combined using the `use()` method:

```ts twoslash
import { Engine } from "standard-rule-engine";

// ---cut---
const baseEngine = new Engine()
  .context("base", "value")
  .rule("base-rule", (facts, { context }) => {
    // Base rule logic
  });

const extendedEngine = new Engine()
  .context("extended", "value")
  .rule("extended-rule", (facts, { context }) => {
    // Extended rule logic
  })
  .use(baseEngine);
```

## Engine Schema

Engines can have a global schema that applies to all rules:

```ts twoslash
import { Engine } from "standard-rule-engine";
import { z } from "zod";

// ---cut---
const engine = new Engine()
  .schema(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  )
  .rule("example", (facts) => {
    //               ^?
  });
```

<br>
<br>

## Example: Modular Engine System

```ts twoslash
import { Engine } from "standard-rule-engine";
import { z } from "zod";

// Base user validation engine
const userValidationEngine = new Engine()
  .context({
    isValid: false,
    errors: [] as string[],
  })
  .helper("addError", (context, error: string) => {
    context.errors.push(error);
  })
  .schema(
    z.object({
      id: z.string(),
      email: z.string().email(),
      age: z.number(),
    }),
  )
  .rule("validate-age", (user, { context, helpers }) => {
    if (user.age < 18) {
      helpers.addError("User must be at least 18 years old");
    }
  })
  .rule("validate-email", (user, { context, helpers }) => {
    if (!user.email.includes("@")) {
      helpers.addError("Invalid email format");
    }
  });

// Extended user processing engine
const userProcessingEngine = new Engine()
  .context({
    processed: false,
    processedAt: null as Date | null,
  })
  .helper("setProcessed", (context) => {
    context.processed = true;
    context.processedAt = new Date();
  })
  .rule("process-user", (user, { helpers }) => {
    helpers.setProcessed();
  })
  .use(userValidationEngine);

// Usage
const session = userProcessingEngine.createSession();
session.insert({
  id: "123",
  email: "user@example.com",
  age: 16,
});
session.fire();

console.log(session.context);
// {
//   isValid: false,
//   errors: ["User must be at least 18 years old"],
//   processed: false,
//   processedAt: null
// }
```
