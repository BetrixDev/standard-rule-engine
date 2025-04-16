# Full example using Hono as the API layer

```ts twoslash
import { Hono } from "hono";
import { Engine } from "standard-rule-engine";
import { z } from "zod";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  deragtoryEvents: z.number(),
  creditScore: z.number(),
  openCreditLines: z.number(),
});

type User = z.infer<typeof userSchema>;

const usersDatabase: Record<string, User> = {
  "119357af-5c68-4722-9ab4-252930ddb526": {
    id: "119357af-5c68-4722-9ab4-252930ddb526",
    name: "John Doe",
    deragtoryEvents: 5,
    creditScore: 600,
    openCreditLines: 3,
  },
};

type Condition = {
  id: string;
  message: string;
};

const engine = new Engine()
  .context({ conditions: [] as Condition[] }) // Give conditions a more exact type using casting
  .schema(userSchema) // Only run rules in this engine if the facts match this schema
  .helper("addCondition", (context, id: string, message: string) => {
    context.conditions.push({
      id,
      message,
    });
  })
  .rule("credit-score-check", (facts, { context, helpers }) => {
    if (facts.creditScore < 640) {
      helpers.addCondition("credit-score-check", "Credit score is too low");
    }
  })
  .rule("open-credit-lines-check", (facts, { context, helpers }) => {
    if (facts.openCreditLines > 2) {
      helpers.addCondition(
        "open-credit-lines-check",
        "Open credit lines are too high",
      );
    }
  })
  .rule("deragtory-events-check", (facts, { context, helpers }) => {
    if (facts.deragtoryEvents > 5) {
      helpers.addCondition(
        "deragtory-events-check",
        "Deragtory events are too high",
      );
    }
  });

const app = new Hono();

app.get("/user/:id/conditions", (c) => {
  const { id } = c.req.param();

  const user = usersDatabase[id];

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const session = engine.createSession().insert(user).fire();

  return c.json({
    conditions: session.context.conditions,
  });
});

export default app;
```
