import type { PackageManager } from "../types/package-manager.js";

export type { PackageManager };

export type PackageExecutor = {
  readonly command: string;
  readonly args: readonly string[];
};

import { spawnCommand } from "./spawn.js";

// Timeout for dependency installation (5 minutes)
const INSTALL_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Detect the package manager based on how the CLI was invoked.
 * Priority:
 * 1. npm_config_user_agent (set by npx/pnpx/yarn dlx/bunx)
 * 2. process.versions.bun (running under bun runtime)
 * 3. process.argv[0] contains "bun" (bun link scenario)
 * 4. Default to npm
 */
export function detectPackageManager(): PackageManager {
  // Check npm_config_user_agent first (most reliable for npx/bunx/pnpx/yarn dlx)
  const userAgent = process.env.npm_config_user_agent?.toLowerCase() ?? "";

  if (userAgent.includes("bun")) {
    return "bun";
  }

  if (userAgent.includes("pnpm")) {
    return "pnpm";
  }

  if (userAgent.includes("yarn")) {
    return "yarn";
  }

  if (userAgent.includes("npm")) {
    return "npm";
  }

  // Check if running under bun runtime (covers bun link and direct bun execution)
  if (process.versions.bun) {
    return "bun";
  }

  // Check if invoked via bun command
  const execPath = process.argv[0]?.toLowerCase() ?? "";
  if (execPath.includes("bun")) {
    return "bun";
  }

  // Default to npm
  return "npm";
}

export function formatRunDevCommand(packageManager: PackageManager): string {
  return packageManager === "npm" ? "npm run dev" : `${packageManager} dev`;
}

export function getPackageManagerDlxCommand(packageManager: PackageManager): PackageExecutor {
  switch (packageManager) {
    case "bun":
      return {
        command: "bun",
        args: ["x"],
      };
    case "pnpm":
      return {
        command: "pnpm",
        args: ["dlx"],
      };
    case "yarn":
      return {
        command: "yarn",
        args: ["dlx"],
      };
    case "npm":
      return {
        command: "npx",
        args: [],
      };
    default:
      return {
        command: "npx",
        args: [],
      };
  }
}

export async function installDependencies(
  packageManager: PackageManager,
  cwd: string,
): Promise<void> {
  const args = packageManager === "yarn" ? [] : ["install"];
  await spawnCommand(packageManager, args, cwd, INSTALL_TIMEOUT_MS);
}
