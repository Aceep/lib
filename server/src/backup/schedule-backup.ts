import { Cron } from "croner";
import { type BackupOptions, type BackupResult, backupDatabase } from "./backup-database.js";

export type BackupSchedule = {
  nextRunAt(): Date | null;
  stop(): void;
};

/** Daily database copy on a cron pattern; failures are logged, never thrown, so a full disk cannot take the app down. */
export function scheduleBackup(
  pattern: string,
  options: BackupOptions,
  log: { info: (result: BackupResult) => void; error: (error: unknown) => void },
): BackupSchedule {
  const job = new Cron(pattern, { protect: true }, async () => {
    try {
      log.info(await backupDatabase(options));
    } catch (error) {
      log.error(error);
    }
  });
  return {
    nextRunAt: () => job.nextRun(),
    stop: () => job.stop(),
  };
}
