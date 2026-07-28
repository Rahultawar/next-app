import { spawn, type ChildProcess } from "node:child_process";

// Track active child processes for cleanup
const activeProcesses = new Set<ChildProcess>();

/**
 * Kill all active child processes. Called during cleanup/shutdown.
 */
export function killActiveProcesses(): void {
  for (const child of activeProcesses) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
  activeProcesses.clear();
}

/**
 * Spawn a process cross-platform and return a promise.
 */
export function spawnCommand(
  command: string,
  args: readonly string[],
  cwd: string,
  timeoutMs?: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let timedOut = false;
    let child: ChildProcess;

    try {
      child = spawn(command, args, {
        cwd,
        env: process.env,
        stdio: "inherit",
        // Required on Windows to execute .cmd/.bat files (like npx, npm, yarn)
        shell: process.platform === "win32",
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown spawn error";
      reject(new Error(`Failed to run "${command}": ${reason}`));
      return;
    }

    activeProcesses.add(child);

    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (timeoutMs !== undefined) {
      timeout = setTimeout(() => {
        if (!child.killed) {
          timedOut = true;
          child.kill("SIGTERM");
        }
      }, timeoutMs);
    }

    const cleanup = (): void => {
      if (timeout !== undefined) clearTimeout(timeout);
      activeProcesses.delete(child);
    };

    child.on("error", (error) => {
      cleanup();
      reject(new Error(`Failed to run "${command}": ${error.message}`));
    });

    child.on("close", (code) => {
      cleanup();

      if (timedOut) {
        reject(
          new Error(
            `Command "${command} ${args.join(" ")}" timed out after ${timeoutMs! / 1000}s.`,
          ),
        );
        return;
      }

      if (code === 0) {
        resolve();
        return;
      }

      const fullCommand = [command, ...args].join(" ");
      reject(new Error(`Command "${fullCommand}" failed with exit code ${code ?? "unknown"}.`));
    });
  });
}
