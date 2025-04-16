import { Engine } from "..";
import { z } from "zod";

describe("Helpers", () => {
  it("should allow defining and using helper functions", () => {
    const engine = new Engine()
      .context("count", 0)
      .helper("increment", (context) => {
        context.count++;
      })
      .helper("add", (_, a: number, b: number) => {
        return a + b;
      })
      .rule("use-helper", (_, { helpers }) => {
        helpers.increment();
        const sum = helpers.add(5, 3);
        expect(sum).toBe(8);
      });

    const session = engine.createSession();
    session.insert({});
    session.fire();

    expect(session.context.count).toBe(1);
  });

  it("should allow using helpers with schema validation", () => {
    const engine = new Engine()
      .context("count", 0)
      .helper("increment", (context) => {
        context.count++;
      })
      .rule(
        "use-helper-with-schema",
        (facts, { helpers }) => {
          helpers.increment();
          expect(facts.age).toBe(25);
        },
        {
          schema: z.object({
            age: z.number(),
          }),
        },
      );

    const session = engine.createSession();
    session.insert({ age: 25 });
    session.fire();

    expect(session.context.count).toBe(1);
  });

  it("should merge helpers when using use()", () => {
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
      .rule("use-both-helpers", (_, { helpers }) => {
        helpers.increment1();
        helpers.increment2();
      });

    const session = combinedEngine.createSession();
    session.insert({});
    session.fire();

    expect(session.context.count1).toBe(1);
    expect(session.context.count2).toBe(1);
  });
});
