import { Plugin } from "obsidian";
import { Data, SettingTab } from "./settings";
import sync from "@usecases/sync";
import events from "@events";
import obsidianUtils from "@utils/obsidian";
// import resolveUnsyncedFiles from "./usecases/resolveUnsyncedFiles";
import { initAppInstance } from "./utils/appInstance";

export default class SimpleSyncPlugin extends Plugin {
  data: Data = { lastSeq: 0, files: {}, unsyncedFiles: {}, db: { credentials: null, url: null }, isOnline: false };
  isSynced: boolean = false;

  async onload() {
    await this.initApp();

    this.app.workspace.onLayoutReady(async () => {
      this.isSynced = true;

      this.registerEvent(this.app.vault.on("create", events.create(this)));
      this.registerEvent(this.app.vault.on("modify", events.modify(this)));
      this.registerEvent(this.app.vault.on("rename", events.rename(this)));
      this.registerEvent(this.app.vault.on("delete", events.delete(this)));

      const settings = new SettingTab(this.app, this);
      this.addSettingTab(settings);

      const isSettingsCorrect = await settings.checkSettings();
      if (!isSettingsCorrect) {
        this.isSynced = false;
        await this.saveData(this.data);

        return;
      }

      const utils = obsidianUtils();

      const isSynced = await sync(this);
      if (!isSynced.success) {
        this.data.isOnline = false;
        this.isSynced = false;

        await this.saveData(this.data);
        return;
      }

      if (isSynced.success && isSynced.data.docs) {
        this.data.isOnline = true;

        const docs = isSynced.data.docs;

        for (const [oldPath, newDoc] of docs.renamedDocs) {
          delete this.data.files[oldPath];

          this.data.files[newDoc.path] = { updatedAt: newDoc.updatedAt, rev: newDoc._rev, id: newDoc._id };
          await this.saveData(this.data);

          const file = this.app.vault.getFileByPath(oldPath);

          if (file) {
            await this.app.fileManager.renameFile(file, newDoc.path);
            await this.app.vault.modify(file, newDoc.content);
          }
        }

        for (const [, newDoc] of docs.pendingDocs.entries()) {
          this.data.files[newDoc.path] = { updatedAt: newDoc.updatedAt, rev: newDoc._rev, id: newDoc._id };
          await this.saveData(this.data);

          await utils.createOrModifyFileWithDirectory(newDoc);
        }

        this.data = {
          ...this.data,
          lastSeq: isSynced.data.lastSeq,
        };
      }

      // await resolveUnsyncedFiles(this, this.data.unsyncedFiles);

      this.isSynced = false;

      await this.saveData(this.data);
    });
  }

  async initApp() {
    initAppInstance(this);

    await this.loadDataFromFile();
  }

  async loadDataFromFile() {
    const saved = (await this.loadData()) as unknown as Partial<Data>;

    this.data = { ...this.data, ...saved };
  }

  onunload() {}
}
