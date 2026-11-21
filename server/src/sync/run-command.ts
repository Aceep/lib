import { spawn } from "node:child_process";

export type CommandResult = {
  exitCode: number | null;
  /** Last part of stderr only: rclone can be very verbose on a large first sync. */
  stderrTail: string;
};

export type CommandRunner = (command: string, args: string[]) => Promise<CommandResult>;

const STDERR_TAIL_LENGTH = 4000;

export class CommandNotFoundError extends Error {
  constructor(command: string) {
    super(`"${command}" is not installed or not on PATH`);
    this.name = "CommandNotFoundError";
  }
}

export const runCommand: CommandRunner = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderrTail = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderrTail = (stderrTail + chunk).slice(-STDERR_TAIL_LENGTH);
    });
    child.on("error", (error: NodeJS.ErrnoException) => {
      reject(error.code === "ENOENT" ? new CommandNotFoundError(command) : error);
    });
    child.on("close", (exitCode) => resolve({ exitCode, stderrTail }));
  });
