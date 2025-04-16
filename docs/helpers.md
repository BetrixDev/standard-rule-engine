---
title: Helpers
description: Learn how to use helpers in the Standard Rule Engine
---

# {{ $frontmatter.title }}

Helpers allow you to define reusable functions that have access to the engine's context. They are defined on the engine and can be accessed in rules via the `helpers` object.

## Defining Helpers

Helpers are defined using the `.helper()` method on the engine. The first parameter is the name of the helper, and the second parameter is the function itself. The function always receives the context as its first parameter, followed by any additional parameters you define.

```ts twoslash
import { Engine } from "standard-rule-engine";

const engine = new Engine()
  .context("count", 0)
  .helper("increment", (context) => {
    context.count++;
  })
  .helper("add", (context, a: number, b: number) => {
    return a + b;
  });
```

## Using Helpers in Rules

Helpers can be accessed in rules via the `helpers` object. When calling a helper function, you don't need to pass the context - it's automatically injected for you. You only need to pass the additional parameters defined in the helper.

```ts twoslash
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

## Helpers with Schema Validation

Helpers work seamlessly with schema validation. You can use helpers in rules that have schema validation, and the helpers will have access to the validated facts.

```ts twoslash
import { Engine } from "standard-rule-engine";
import { z } from "zod";

const engine = new Engine()
  .context("count", 0)
  .helper("increment", (context) => {
    context.count++;
  })
  .rule(
    "use-helper-with-schema",
    (facts, { context, helpers }) => {
      helpers.increment();
      console.log(`Age: ${facts.age}`);
    },
    {
      schema: z.object({
        age: z.number(),
      }),
    },
  );
```

## Combining Helpers with Multiple Engines

When using the `.use()` method to combine multiple engines, the helpers from each engine are merged together. This allows you to create modular engines with their own helpers.

```ts twoslash
import { Engine } from "standard-rule-engine";

const engine1 = new Engine()
  .context("count1", 0)
  .helper("increment1", (context) => {
    context.count1++;
  });

const engine2 = new Engine()
  .context("count2", 0)
  .helper("increment2", (context) => {
    context.count2++;
  });

const combinedEngine = new Engine()
  .use(engine1)
  .use(engine2)
  .rule("use-both-helpers", (_, { context, helpers }) => {
    helpers.increment1();
    helpers.increment2();
  });
```

## Best Practices

1. **Keep helpers focused**: Each helper should do one thing well
2. **Use descriptive names**: Name your helpers based on what they do
3. **Leverage TypeScript**: Take advantage of TypeScript's type system to ensure type safety
4. **Reuse common logic**: Extract common logic into helpers to avoid duplication
5. **Consider performance**: Helpers are called for each rule execution, so keep them efficient
