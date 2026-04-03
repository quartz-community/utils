import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    path: "src/path.ts",
    dom: "src/dom.ts",
    lang: "src/lang.ts",
    escape: "src/escape.ts",
    date: "src/date.ts",
    emoji: "src/emoji.ts",
    jsx: "src/jsx.tsx",
  },
  format: ["esm"],
  dts: true,
  tsconfig: "tsconfig.build.json",
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2022",
  splitting: false,
  outDir: "dist",
});
