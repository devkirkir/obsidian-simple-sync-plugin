import { Notice } from "obsidian";
import { ensureDirectory } from "./ensureDirectory";
import { createOrModifyFileWithDirectory } from "./createOrModifyFileWithDirectory";
import { getAppInstance } from "../appInstance";

function obsidianUtils() {
  try {
    const appInstance = getAppInstance();
    if (!appInstance) throw Error("App instance is not init");

    return {
      ensureDirectory: ensureDirectory({ vault: appInstance.app.vault }),
      createOrModifyFileWithDirectory: createOrModifyFileWithDirectory({ vault: appInstance.app.vault }),
    };
  } catch (err) {
    if (err instanceof Error) {
      new Notice(err.message);
    }

    throw err;
  }
}

export default obsidianUtils;
