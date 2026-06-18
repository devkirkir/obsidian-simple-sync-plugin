import { TFile, Vault } from "obsidian";
import { checkDirectory } from "./checkDirectory";
import { Doc } from "@/types";

export async function createFileWithDirectory(vault: Vault, doc: Doc) {
  await checkDirectory(vault, doc.path.split("/").slice(0, -1));

  const isFileExist = vault.getAbstractFileByPath(doc.path);

  if (isFileExist && isFileExist instanceof TFile) {
    await vault.modify(isFileExist, doc.content);
    return;
  }

  if (!isFileExist) {
    await vault.create(doc.path, doc.content);
  }
}
