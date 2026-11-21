// Manual database backup: npm run backup -w server. Same folder, retention and remote as the scheduled one.
import { backupDatabase } from "./backup/backup-database.js";
import { loadConfig } from "./config.js";
import { openLibraryDatabase } from "./db/database.js";
import { runCommand } from "./sync/run-command.js";

const config = loadConfig();
const database = openLibraryDatabase(config.databasePath);
try {
  const result = await backupDatabase({
    database,
    backupsDirectory: config.backupsDirectory,
    keep: config.backupKeep,
    rcloneRemote: config.rcloneBackupRemote,
    runCommand,
  });
  console.log(`backup written to ${result.filePath}`);
  for (const name of result.pruned) {
    console.log(`  removed old copy ${name}`);
  }
  if (config.rcloneBackupRemote) {
    console.log(result.remoteError ? `  remote copy failed: ${result.remoteError}` : `  mirrored to ${config.rcloneBackupRemote}`);
  }
  process.exitCode = result.remoteError ? 1 : 0;
} finally {
  database.close();
}
