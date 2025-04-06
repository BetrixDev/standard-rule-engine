import { defineConfig } from "vitepress";
import { transformerTwoslash } from "@shikijs/vitepress-twoslash";

export default defineConfig({
  title: "Standard Rule Engine",
  description:
    "A simple, type-safe, rule engine that uses the Standard Schema to validate rule facts",
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Getting Started", link: "/getting-started" },
      { text: "Examples", link: "/examples/hono" },
    ],
    sidebar: [
      {
        text: "Docs",
        items: [
          { text: "Getting Started", link: "/getting-started" },
          { text: "The Engine", link: "/the-engine" },
          { text: "Rules", link: "/rules" },
          { text: "Context", link: "/context" },
          { text: "Sessions", link: "/sessions" },
        ],
      },
      {
        text: "Examples",
        items: [{ text: "Hono Full", link: "/examples/hono" }],
      },
    ],
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/BetrixDev/standard-rule-engine",
      },
    ],
    editLink: {
      pattern:
        "https://github.com/BetrixDev/standard-rule-engine/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
  },
  markdown: {
    // @ts-expect-error
    codeTransformers: [transformerTwoslash()],
    // @ts-expect-error
    languages: ["js", "jsx", "ts", "tsx"],
  },
});
