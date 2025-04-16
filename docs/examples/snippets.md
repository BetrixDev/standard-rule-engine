# Examples

## Credit Approval System

```ts twoslash
import { Engine } from "standard-rule-engine";
import { z } from "zod";

// Define the applicant schema
const applicantSchema = z.object({
  creditScore: z.number(),
  annualIncome: z.number(),
  existingDebt: z.number(),
  employmentHistory: z.number(), // years
  hasBankruptcy: z.boolean(),
});

const engine = new Engine()
  .context({
    approved: false,
    reasons: [] as string[],
    riskScore: 0,
  })
  .helper("addReason", (context, reason: string) => {
    context.reasons.push(reason);
  })
  .helper("calculateRiskScore", (context, score: number) => {
    context.riskScore = score;
  })
  .rule(
    "credit-score-check",
    (applicant, { context, helpers }) => {
      if (applicant.creditScore < 650) {
        helpers.addReason("Credit score is too low");
      } else {
        helpers.calculateRiskScore(context.riskScore + 20);
      }
    },
    { schema: applicantSchema },
  )
  .rule(
    "income-to-debt-ratio",
    (applicant, { context, helpers }) => {
      const ratio = applicant.existingDebt / applicant.annualIncome;
      if (ratio > 0.4) {
        helpers.addReason("Debt-to-income ratio is too high");
      } else {
        helpers.calculateRiskScore(context.riskScore + 15);
      }
    },
    { schema: applicantSchema },
  )
  .rule(
    "employment-history",
    (applicant, { context, helpers }) => {
      if (applicant.employmentHistory < 2) {
        helpers.addReason("Insufficient employment history");
      } else {
        helpers.calculateRiskScore(context.riskScore + 10);
      }
    },
    { schema: applicantSchema },
  )
  .rule(
    "bankruptcy-check",
    (applicant, { context, helpers }) => {
      if (applicant.hasBankruptcy) {
        helpers.addReason("Recent bankruptcy on record");
      } else {
        helpers.calculateRiskScore(context.riskScore + 25);
      }
    },
    { schema: applicantSchema },
  )
  .rule("final-approval", (_, { context }) => {
    context.approved = context.riskScore >= 60 && context.reasons.length === 0;
  });

// Usage example
const session = engine
  .createSession()
  .insert({
    creditScore: 720,
    annualIncome: 75000,
    existingDebt: 15000,
    employmentHistory: 5,
    hasBankruptcy: false,
  })
  .fire();

console.log(session.context);
// {
//   approved: true,
//   reasons: [],
//   riskScore: 70
// }
```

## E-commerce Discount System

```ts twoslash
import { Engine } from "standard-rule-engine";
import { z } from "zod";

const orderSchema = z.object({
  items: z.array(
    z.object({
      price: z.number(),
      category: z.string(),
      quantity: z.number(),
    }),
  ),
  customerType: z.enum(["new", "regular", "vip"]),
  orderDate: z.date(),
  previousOrders: z.number(),
});

const engine = new Engine()
  .context({
    discountPercentage: 0,
    appliedRules: [] as string[],
    totalDiscount: 0,
  })
  .helper("applyDiscount", (context, percentage: number, rule: string) => {
    context.discountPercentage = Math.max(
      context.discountPercentage,
      percentage,
    );
    context.appliedRules.push(rule);
  })
  .helper("calculateTotalDiscount", (context, orderTotal: number) => {
    context.totalDiscount = (orderTotal * context.discountPercentage) / 100;
  })
  .rule(
    "vip-customer-discount",
    (order, { context, helpers }) => {
      if (order.customerType === "vip") {
        helpers.applyDiscount(15, "VIP Customer Discount");
      }
    },
    { schema: orderSchema },
  )
  .rule(
    "bulk-purchase-discount",
    (order, { context, helpers }) => {
      const totalItems = order.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      if (totalItems > 10) {
        helpers.applyDiscount(10, "Bulk Purchase Discount");
      }
    },
    { schema: orderSchema },
  )
  .rule(
    "loyalty-discount",
    (order, { context, helpers }) => {
      if (order.previousOrders > 5) {
        helpers.applyDiscount(5, "Loyalty Discount");
      }
    },
    { schema: orderSchema },
  )
  .rule(
    "holiday-discount",
    (order, { context, helpers }) => {
      const month = order.orderDate.getMonth();
      if (month === 11) {
        // December
        helpers.applyDiscount(20, "Holiday Season Discount");
      }
    },
    { schema: orderSchema },
  );

// Usage example
const session = engine
  .createSession()
  .insert({
    items: [
      { price: 100, category: "electronics", quantity: 2 },
      { price: 50, category: "accessories", quantity: 5 },
    ],
    customerType: "vip",
    orderDate: new Date("2023-12-15"),
    previousOrders: 8,
  })
  .fire();

console.log(session.context);
// {
//   discountPercentage: 20,
//   appliedRules: ["VIP Customer Discount", "Holiday Season Discount"],
//   totalDiscount: 60
// }
```

## Content Moderation System

```ts twoslash
import { Engine } from "standard-rule-engine";
import { z } from "zod";

const contentSchema = z.object({
  text: z.string(),
  author: z.object({
    reputation: z.number(),
    isVerified: z.boolean(),
  }),
  contentType: z.enum(["comment", "post", "review"]),
  timestamp: z.date(),
});

const engine = new Engine()
  .context({
    isApproved: false,
    moderationActions: [] as string[],
    riskLevel: "low" as "low" | "medium" | "high",
  })
  .helper("addAction", (context, action: string) => {
    context.moderationActions.push(action);
  })
  .helper("setRiskLevel", (context, level: "low" | "medium" | "high") => {
    context.riskLevel = level;
  })
  .rule(
    "spam-detection",
    (content, { context, helpers }) => {
      const spamPatterns = [
        /buy now/i,
        /click here/i,
        /limited time/i,
        /\b(viagra|casino|lottery)\b/i,
      ];

      if (spamPatterns.some((pattern) => pattern.test(content.text))) {
        helpers.addAction("Spam content detected");
        helpers.setRiskLevel("high");
      }
    },
    { schema: contentSchema },
  )
  .rule(
    "reputation-check",
    (content, { context, helpers }) => {
      if (content.author.reputation < 0) {
        helpers.addAction("Low reputation author");
        helpers.setRiskLevel("medium");
      }
    },
    { schema: contentSchema },
  )
  .rule(
    "content-length-check",
    (content, { context, helpers }) => {
      if (content.text.length < 10) {
        helpers.addAction("Content too short");
      }
    },
    { schema: contentSchema },
  )
  .rule("final-moderation", (_, { context }) => {
    context.isApproved =
      context.riskLevel === "low" && context.moderationActions.length === 0;
  });

// Usage example
const session = engine
  .createSession()
  .insert({
    text: "This is a great product! Buy now for 50% off!",
    author: {
      reputation: -5,
      isVerified: false,
    },
    contentType: "comment",
    timestamp: new Date(),
  })
  .fire();

console.log(session.context);
// {
//   isApproved: false,
//   moderationActions: ["Spam content detected", "Low reputation author"],
//   riskLevel: "high"
// }
```
