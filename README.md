# standard-rules

### Very heavy work in progress

A rule engine that uses the standard schema to evaluate rule facts.


Most of the current TypeScript / Some JavaScript code is from Elysia, and the API is very much inspired by Elysia


```ts
// state and helpers are correctly inferred every step of the way
// a rule is only evaluated if the schema matches the fact inputted

const helperFromAnotherEngine = new Engine().helper(
  "log",
  (_, message: string) => {
    console.log(message);
  }
);

const engine = new Engine()
  .use(helperFromAnotherEngine)
  .state({
    totalFines: 0,
    violations: [] as string[],
    latestViolation: new Date(0),
  })
  .helper("addFine", (state, fine: number) => {
    state.totalFines += fine;
  })
  .helper("addViolation", (state, violation: string) => {
    state.violations.push(violation);
  })
  .rule(
    "traffic-violation",
    (facts, { state, helpers }) => {
      helpers.log(state, "logging in this rule");
      helpers.addFine(state, facts.violation.fine);
      helpers.addViolation(state, facts.violation.type);

      if (facts.violation.date > state.latestViolation) {
        state.latestViolation = facts.violation.date;
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
```