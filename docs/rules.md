---
title: Rules
description: Learn about rules in the Standard Rule Engine
---

# {{ $frontmatter.title }}

Rules are the core building blocks of the Standard Rule Engine. They define the logic that processes facts and updates context.

## Creating Rules

Rules are created using the `rule()` method on an engine:

```ts
const engine = new Engine().rule("example", (facts, { context }) => {
  // Rule logic here
});
```

## Rule Structure

Each rule consists of:

1. A unique name
2. A handler function
3. Optional schema validation

```ts twoslash
import { Engine } from "standard-rule-engine";
import { z } from "zod";

// ---cut---
const engine = new Engine().context("processed", false).rule(
  "process-user", // Rule name
  (facts, { context }) => {
    // Handler function
    context.processed = true;
  },
  {
    // Optional schema
    schema: z.object({
      id: z.string(),
      name: z.string(),
    }),
  },
);
```

## Rule Handlers

Rule handlers receive two parameters:

1. `facts`: The data to process
2. `options`: An object containing `context` and `helpers`

```ts twoslash
import { Engine } from "standard-rule-engine";
import { type } from "arktype";

// ---cut---
const engine = new Engine()
  .context("count", 0)
  .helper("increment", (context) => {
    context.count++;
  })
  .rule(
    "example",
    (facts, { context, helpers }) => {
      helpers.increment();
      console.log(`Processing ${facts.id}`);
    },
    {
      schema: type({ id: "string" }),
    },
  );
```

## Priority

Rules can be given a priority to control the order they are executed in. Rules with a lower priority number are executed first. The default priority is 1.

```ts twoslash
import { Engine } from "standard-rule-engine";

// ---cut---
const engine = new Engine()
  .rule(
    "alwaysRunFirst",
    (_, { context }) => {
      console.log("im first");
    },
    {
      priority: 0,
    },
  )
  .rule(
    "alwaysRunLast",
    (_, { context }) => {
      console.log("im last");
    },
    {
      priority: 100,
    },
  );

const session = engine.createSession().insert({}).fire();

// Output:
// im first
// im last
```

## Schema Validation

Rules can specify a schema to validate facts. The schema property can take any schema validation library that implements the [Standard Schema](https://standardschema.dev).

```ts twoslash
import { Engine } from "standard-rule-engine";
import { z } from "zod";

// ---cut---
const engine = new Engine().context({ isValid: false }).rule(
  "validate-user",
  (user, { context }) => {
    context.isValid = true;
  },
  {
    schema: z.object({
      id: z.string(),
      email: z.string().email(),
      age: z.number().min(18),
    }),
  },
);
```

## Example: User Validation

```ts twoslash
import { Engine } from "standard-rule-engine";
import { z } from "zod";

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  age: z.number(),
  password: z.string().min(8),
});

const engine = new Engine()
  .context({
    isValid: false,
    errors: [] as string[],
  })
  .helper("addError", (context, error: string) => {
    context.errors.push(error);
  })
  .rule(
    "validate-age",
    (user, { context, helpers }) => {
      if (user.age < 18) {
        helpers.addError("User must be at least 18 years old");
      }
    },
    { schema: userSchema },
  )
  .rule(
    "validate-password",
    (user, { context, helpers }) => {
      if (!/[A-Z]/.test(user.password)) {
        helpers.addError("Password must contain at least one uppercase letter");
      }
      if (!/[0-9]/.test(user.password)) {
        helpers.addError("Password must contain at least one number");
      }
    },
    { schema: userSchema },
  )
  .rule("final-validation", (_, { context }) => {
    context.isValid = context.errors.length === 0;
  });

const session = engine.createSession();
session.insert({
  id: "123",
  email: "user@example.com",
  age: 16,
  password: "weak",
});
session.fire();

console.log(session.context);
// {
//   isValid: false,
//   errors: [
//     "User must be at least 18 years old",
//     "Password must contain at least one uppercase letter",
//     "Password must contain at least one number"
//   ]
// }
```
