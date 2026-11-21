import { Cron } from "croner";
import type { SyncService } from "./sync-service.js";

export type SyncSchedule = {
  nextRunAt(): Date | null;
  stop(): void;
};

/** Throws on an invalid cron pattern so a typo in SYNC_CRON fails at startup rather than silently never running. */
export function scheduleSync(pattern: string, syncService: SyncService): SyncSchedule {
  const job = new Cron(pattern, () => {
    // null means a manual sync is still running; the next tick will catch up.
    syncService.start("scheduled");
  });
  return {
    nextRunAt: () => job.nextRun(),
    stop: () => job.stop(),
  };
}
