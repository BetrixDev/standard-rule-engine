---
title: Sessions
description: Learn about sessions in the Standard Rule Engine
---

# {{ $frontmatter.title }}

Sessions are the execution environment for rules. They manage the lifecycle of rule execution and maintain the state of the context during processing.

## Creating a Session

Sessions are created from an engine using the `createSession()` method:

```ts
const engine = new Engine()
  .context("count", 0)
  .rule("example", (facts, { context }) => {
    context.count++;
  });

const session = engine.createSession();
```

## Inserting Facts

Facts are the data that rules operate on. You can insert facts into a session using the `insert()` method:

```ts
// Insert a single fact
session.insert({ id: "123", value: 42 });

// Insert multiple facts
session.insert([
  { id: "123", value: 42 },
  { id: "456", value: 84 },
]);
```

## Executing Rules

Rules are executed using the `fire()` method:

```ts
session.fire();
```

You can chain these operations together:

```ts
const session = engine.createSession().insert({ id: "123", value: 42 }).fire();
```

## Session Context

Each session maintains its own context, which persists throughout the rule execution:

```ts
const engine = new Engine()
  .context("processed", [] as string[])
  .rule("process", (facts, { context }) => {
    context.processed.push(facts.id);
  });

const session = engine.createSession();
session.insert({ id: "123" });
session.fire();

console.log(session.context.processed); // ["123"]
```

## Multiple Sessions

You can create multiple sessions from the same engine, each with its own isolated context:

```ts
const session1 = engine.createSession();
const session2 = engine.createSession();

session1.insert({ id: "123" });
session2.insert({ id: "456" });

session1.fire();
session2.fire();

console.log(session1.context.processed); // ["123"]
console.log(session2.context.processed); // ["456"]
```

## Best Practices

1. **One Session Per Operation**: Create a new session for each distinct operation
2. **Clear Context**: Don't rely on context state between different sessions
3. **Batch Facts**: When possible, insert multiple related facts together
4. **Validate Facts**: Ensure facts match the expected schema before insertion
5. **Handle Errors**: Wrap session operations in try-catch blocks

## Example: Order Processing

```ts
import { Engine } from "standard-rule-engine";
import { z } from "zod";

const orderSchema = z.object({
  id: z.string(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number(),
    }),
  ),
  customerId: z.string(),
});

const engine = new Engine()
  .context({
    processedOrders: [] as string[],
    totalItems: 0,
    addOrder: (context: any, orderId: string) => {
      context.processedOrders.push(orderId);
    },
    updateTotal: (context: any, count: number) => {
      context.totalItems += count;
    },
  })
  .rule(
    "process-order",
    (order, { context }) => {
      context.addOrder(order.id);
      const itemCount = order.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      context.updateTotal(itemCount);
    },
    {
      schema: orderSchema,
    },
  );

// Process multiple orders
const session = engine.createSession();
session.insert([
  {
    id: "order1",
    items: [
      { productId: "p1", quantity: 2 },
      { productId: "p2", quantity: 1 },
    ],
    customerId: "c1",
  },
  {
    id: "order2",
    items: [{ productId: "p3", quantity: 3 }],
    customerId: "c2",
  },
]);
session.fire();

console.log(session.context);
// {
//   processedOrders: ["order1", "order2"],
//   totalItems: 6
// }
```
