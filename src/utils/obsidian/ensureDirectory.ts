import { Vault } from "obsidian";

interface Deps {
  vault: Vault;
}

/**
 * Checks directories in the path, creating missing one step by step
 */

export const ensureDirectory = (deps: Deps) => async (pathParts: string[]) => {
  for (const [index] of pathParts.entries()) {
    const currentPath = pathParts.slice(0, index + 1).join("/");

    const isExist = deps.vault.getAbstractFileByPath(currentPath);

    if (!isExist) {
      await deps.vault.createFolder(currentPath);
    }
  }
};
