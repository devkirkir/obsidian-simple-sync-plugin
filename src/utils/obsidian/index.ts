import { App, Notice } from "obsidian";
import { ensureDirectory } from "./ensureDirectory";
import { createOrModifyFileWithDirectory } from "./createOrModifyFileWithDirectory";

let _app: App | undefined;

export function initAppInstance(app: App) {
  _app = app;
}

export function getApp() {
  return _app;
}

function obsidianUtils() {
  try {
    if (!_app) throw Error("App instance is not init");

    return {
      ensureDirectory: ensureDirectory({ vault: _app.vault }),
      createOrModifyFileWithDirectory: createOrModifyFileWithDirectory({ vault: _app.vault }),
    };
  } catch (err) {
    if (err instanceof Error) {
      new Notice(err.message);
    }

    throw err;
  }
}

export default obsidianUtils;
