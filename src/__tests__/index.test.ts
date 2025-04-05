import { Engine } from "..";
import { z } from "zod";
import { type } from "arktype";
import * as v from "valibot";

describe("Engine", () => {
  describe("Schema Validation", () => {
    it("should skip running a rule if the schema validation fails", () => {
      const engine = new Engine().context("rulesRun", 0).rule(
        "incrementRulesRun",
        (_, { context }) => {
          context.rulesRun++;
        },
        {
          schema: z.object({
            age: z.number(),
          }),
        },
      );

      const session = engine.createSession();
      session.insert({ age: "not a number" });
      session.fire();

      expect(session.context.rulesRun).toBe(0);
    });

    it("should not error when using multiple schema libraries", () => {
      const engine = new Engine()
        .context("rulesRun", 0)
        .rule(
          "incrementRulesRunZod",
          (_, { context }) => {
            context.rulesRun++;
          },
          {
            schema: z.object({
              age: z.number(),
            }),
          },
        )
        .rule(
          "incrementRulesRunArktype",
          (_, { context }) => {
            context.rulesRun++;
          },
          {
            schema: type({ age: "number" }),
          },
        )
        .rule(
          "incrementRulesRunValibot",
          (_, { context }) => {
            context.rulesRun++;
          },
          {
            schema: v.object({
              age: v.number(),
            }),
          },
        );

      const session = engine.createSession();
      session.insert({ age: 18 });
      session.fire();

      expect(session.context.rulesRun).toBe(3);
    });

    describe("Global Schema", () => {
      it("should use the global schema if no rule schema is provided and run the rule because the schema is valid", () => {
        const engine = new Engine()
          .schema(z.object({ age: z.number() }))
          .context("rulesRun", 0)
          .rule("incrementRulesRun", (_, { context }) => {
            context.rulesRun++;
          });

        const session = engine.createSession();
        session.insert({ age: 18 });
        session.fire();

        expect(session.context.rulesRun).toBe(1);
      });

      it("should not run the rule if the schema is invalid", () => {
        const engine = new Engine()
          .schema(z.object({ age: z.number() }))
          .context("rulesRun", 0)
          .rule("incrementRulesRun", (_, { context }) => {
            context.rulesRun++;
          });

        const session = engine.createSession();
        session.insert({ age: "not a number" });
        session.fire();

        expect(session.context.rulesRun).toBe(0);
      });

      it("should not propagate the an engines schema to one above it", () => {
        const engine = new Engine()
          .context("outsideRulesRun", 0)
          .use(
            new Engine()
              .context("totalRulesRun", 0)
              .schema(z.object({ age: z.number() }))
              .rule("incrementTotalRulesRun", (_, { context }) => {
                context.totalRulesRun++;
              }),
          )
          .rule("testRule", (_, { context }) => {
            context.totalRulesRun++;
            context.outsideRulesRun++;
          });

        const session = engine.createSession();
        session.insert({ age: 18 });
        session.fire();

        expect(session.context.totalRulesRun).toBe(2);
        expect(session.context.outsideRulesRun).toBe(1);
      });
    });
  });

  describe("Context merging", () => {
    it("should merge all contexts", () => {
      const engine = new Engine()
        .context("rulesRun", 0)
        .context("isAdult", false)
        .context({ hello: "world" })
        .rule("incrementRulesRun", (_, { context }) => {
          expect(context.hello).toBe("world");
          expect(context.isAdult).toBe(false);
          expect(context.rulesRun).toBe(0);
          context.rulesRun++;
        });

      const session = engine.createSession();
      session.insert({ age: 18 });
      session.fire();

      expect(session.context.rulesRun).toBe(1);
    });

    it("should merge contexts from other engines when using use()", () => {
      const engine = new Engine().context("textContext", "hello");

      const engine2 = new Engine()
        .use(engine)
        .context("rulesRun", 0)
        .rule("incrementRulesRun", (_, { context }) => {
          context.rulesRun++;
        });

      const session = engine2.createSession();
      session.insert({});
      session.fire();

      expect(session.context.textContext).toBe("hello");
      expect(session.context.rulesRun).toBe(1);
    });
  });

  describe("Context mutations", () => {
    it("should increment rulesRun in context for each rule that is run", () => {
      const engine = new Engine()
        .context("rulesRun", 0)
        .rule("incrementRulesRun", (_, { context }) => {
          context.rulesRun++;
        });

      const session = engine.createSession();
      session.insertMany([{}, {}]);
      session.fire();

      expect(session.context.rulesRun).toBe(2);
    });

    it("should set isAdult to true if age is greater than or equal to 18", () => {
      const engine = new Engine().context("isAdult", false).rule(
        "isAdult",
        (facts, { context }) => {
          if (facts.age >= 18) {
            context.isAdult = true;
          }
        },
        {
          schema: z.object({ age: z.number() }),
        },
      );

      const session = engine.createSession();
      session.insert({ age: 18 });

      session.fire();

      expect(session.context.isAdult).toBe(true);
    });

    it("should set isAdult to false if age is less than 18", () => {
      const engine = new Engine().context("isAdult", false).rule(
        "isAdult",
        (facts, { context }) => {
          if (facts.age < 18) {
            context.isAdult = false;
          }
        },
        {
          schema: z.object({ age: z.number() }),
        },
      );

      const session = engine.createSession();
      session.insert({ age: 17 });

      session.fire();
    });
  });
});
