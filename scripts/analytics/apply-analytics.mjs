import { applyAnalyticsToSite } from "./html-integration.mjs";

const report = applyAnalyticsToSite({ write: process.argv.includes("--write") });
console.log(JSON.stringify(report, null, 2));

if (!process.argv.includes("--write") && report.changedFiles > 0) {
  process.exitCode = 1;
}
