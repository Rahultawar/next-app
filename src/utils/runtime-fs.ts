import type { Dirent } from "node:fs";
import {
  chmod,
  cp,
  lstat,
  mkdir,
  readdir,
  readlink,
  rename,
  rm,
  symlink,
  readFile,
  writeFile,
} from "node:fs/promises";

export { chmod, cp, lstat, mkdir, readdir, readlink, rename, rm, symlink };
export type { Dirent };

export async function readTextFile(path: string): Promise<string> {
  return readFile(path, "utf8");
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  await writeFile(path, content, "utf8");
}
