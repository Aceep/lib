import { describe, expect, it } from "vitest";
import { scheduleSync } from "../src/sync/schedule-sync.js";
import type { SyncService } from "../src/sync/sync-service.js";

const idleSync: SyncService = {
  start: () => null,
  getStatus: () => ({ current: null, lastFinished: null }),
  whenIdle: () => Promise.resolve(),
};

describe("scheduleSync", () => {
  it("exposes the next run of a valid pattern", () => {
    const schedule = scheduleSync("0 4 * * *", idleSync);

    const nextRunAt = schedule.nextRunAt();
    schedule.stop();

    expect(nextRunAt?.getHours()).toBe(4);
    expect(nextRunAt?.getMinutes()).toBe(0);
  });

  it("throws at startup on an invalid pattern", () => {
    expect(() => scheduleSync("every night", idleSync)).toThrow();
  });
});
