// Applies a plan from `npm run plan-layout` : one server-side `rclone moveto` per file on MEGA, and the same rename on
// the local mirror so the next `rclone sync` has nothing to transfer.
// Usage: node scripts/apply-layout-plan.mjs <plan.json> <remote, e.g. mega:Library> <local books dir> [--apply]
// Without --apply, only prints what would be done.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const [planPath, remote, localDir] = args.filter((arg) => !arg.startsWith("--"));
if (!planPath || !remote || !localDir) {
  console.error("usage: apply-layout-plan <plan.json> <remote> <local books dir> [--apply]");
  process.exit(2);
}

const { renames } = JSON.parse(readFileSync(planPath, "utf8"));
const targets = new Set(renames.map((r) => r.to.toLowerCase()));
if (targets.size !== renames.length) {
  console.error("two files share the same target, refusing to continue");
  process.exit(1);
}
const logPath = path.join(path.dirname(planPath), "apply-layout-plan.log");

let done = 0;
let failed = 0;
for (const { from, to } of renames) {
  const localFrom = path.join(localDir, from);
  const localTo = path.join(localDir, to);
  if (!existsSync(localFrom)) {
    // Already moved by a previous, interrupted run.
    if (existsSync(localTo)) continue;
    console.warn(`missing locally, skipped: ${from}`);
    failed++;
    continue;
  }
  if (!apply) {
    console.log(`${from}\n  -> ${to}`);
    continue;
  }
  try {
    execFileSync("rclone", ["moveto", `${remote}/${from}`, `${remote}/${to}`], { stdio: ["ignore", "ignore", "pipe"] });
    mkdirSync(path.dirname(localTo), { recursive: true });
    renameSync(localFrom, localTo);
    appendFileSync(logPath, `${new Date().toISOString()}\t${from}\t${to}\n`);
    done++;
    if (done % 25 === 0) console.log(`${done}/${renames.length}`);
  } catch (error) {
    failed++;
    console.error(`FAILED ${from}: ${error.stderr?.toString().trim() || error.message}`);
  }
}
console.log(apply ? `${done} renommés, ${failed} échecs (journal : ${logPath})` : `${renames.length} renommages prévus (relancer avec --apply)`);
process.exit(failed > 0 ? 1 : 0);
