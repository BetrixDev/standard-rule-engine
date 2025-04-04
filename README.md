# standard-rules

### Very heavy work in progress

A rule engine that uses the standard schema to evaluate rule facts.


Most of the current TypeScript / Some JavaScript code is from Elysia, and the API is very much inspired by Elysia


```ts
// state and helpers are correctly inferred every step of the way
// a rule is only evaluated if the schema matches the fact inputted

const helperFromAnotherEngine = new Engine().context(
  "log",
  (message: string) => {
    console.log(message);
  }
);

const engine = new Engine()
  .use(helperFromAnotherEngine)
  .context({
    totalFines: 0,
    violations: [] as string[],
    latestViolation: new Date(0),
    addFine(fine: number) {
      this.totalFines += fine;
    },
    addViolation(violation: string) {
      this.violations.push(violation);
    },
  })
  .rule(
    "traffic-violation",
    (facts, { context }) => {
      context.log("logging in this rule");
      context.addFine(facts.violation.fine);
      context.addViolation(facts.violation.type);

      if (facts.violation.date > context.latestViolation) {
        context.latestViolation = facts.violation.date;
      }
    },
    {
      schema: z.object({
        violation: z.object({
          type: z.string(),
          date: z.date(),
          fine: z.number(),
          location: z.string(),
          speed: z.number().optional(),
        }),
      }),
    }
  );

const session = engine.createSession();

session.insert({
  violation: {
    type: "Speeding",
    date: new Date("2023-11-15"),
    fine: 250.0,
    location: "Main Street",
    speed: 65,
  },
});

session.fire();

console.log(session.context);
```