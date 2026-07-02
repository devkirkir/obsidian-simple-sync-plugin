import { Notice, TFile, Vault } from "obsidian";
import { Doc } from "@/types";
import { ensureDirectory } from "./ensureDirectory";

interface Deps {
  vault: Vault;
}

/**
 * Creates or updates files ensures path exist
 */

export const createOrModifyFileWithDirectory = (deps: Deps) => async (doc: Doc) => {
  try {
    await ensureDirectory({ vault: deps.vault })(doc.path.split("/").slice(0, -1));

    const isFileExist = deps.vault.getAbstractFileByPath(doc.path);

    if (isFileExist && isFileExist instanceof TFile) {
      await deps.vault.modify(isFileExist, doc.content);
      return;
    }

    if (!isFileExist) {
      await deps.vault.create(doc.path, doc.content);
      return;
    }

    throw Error(`It's not a file: ${doc.path}`);
  } catch (err) {
    if (err instanceof Error) {
      new Notice(err.message);
    }

    console.error("Unexpected error", err);
  }
};
