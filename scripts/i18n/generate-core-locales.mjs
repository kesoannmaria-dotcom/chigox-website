import path from "node:path";
import { generateCoreLocales } from "./core-localization.mjs";

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirectRun) {
  console.log(JSON.stringify(generateCoreLocales({ write: process.argv.includes("--write") }), null, 2));
}
