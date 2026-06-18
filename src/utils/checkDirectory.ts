import { Vault } from "obsidian";

export async function checkDirectory(vault: Vault, pathParts: string[]) {
  let currentPath = "";

  for (const [index, part] of pathParts.entries()) {
    currentPath += index === 0 ? part : `/${part}`;

    const isExist = vault.getAbstractFileByPath(currentPath);

    if (!isExist) {
      await vault.createFolder(currentPath);
    }
  }
}
