import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    path: "src/path.ts",
    dom: "src/dom.ts",
    lang: "src/lang.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2022",
  splitting: false,
  outDir: "dist",
});
