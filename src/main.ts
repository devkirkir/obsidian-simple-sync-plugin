import { Plugin, Notice } from "obsidian";
import { Data, SettingTab } from "./settings";
import sync from "@usecases/sync";
import events from "@events";
import obsidianUtils, { initAppInstance } from "@utils/obsidian";
import services from "@services";
import { Doc, DocWithRev } from "./types";
import resolveUnsyncedFiles from "@usecases/resolveUnsyncedFiles";

export default class SimpleSyncPlugin extends Plugin {
  data: Data = { lastSeq: 0, files: {}, unsyncedFiles: {}, db: { credentials: null, url: null } };
  isSynced: boolean = false;

  async onload() {
    await this.initApp();

    // await services(this.data.db).removeAllDocs();

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
        return;
      }

      const utils = obsidianUtils();

      const isSynced = await sync(this);
      if (!isSynced.success) {
        this.isSynced = false;

        return;
      }

      if (isSynced.data && isSynced.data.docs) {
        const docs = isSynced.data.docs;

        for (const [oldPath, newDoc] of docs.renamedDocs) {
          delete this.data.files[oldPath];

          this.data.files[newDoc.path] = { updatedAt: newDoc.updatedAt, rev: newDoc._rev, id: newDoc._id };

          const file = this.app.vault.getFileByPath(oldPath);

          if (file) {
            await this.app.fileManager.renameFile(file, newDoc.path);
            await this.app.vault.modify(file, newDoc.content);
          }
        }

        // couch is newer update local files, clear from unsyncedFiles
        for (const [, newDoc] of docs.pendingDocs) {
          this.data.files[newDoc.path] = { updatedAt: newDoc.updatedAt, rev: newDoc._rev, id: newDoc._id };
          delete this.data.unsyncedFiles[newDoc.path];

          await utils.createOrModifyFileWithDirectory(newDoc);
        }

        // unsyncedFile is newer push to CouchDB using _rev from DB response
        for (const [path, unsyncedFile] of Object.entries(this.data.unsyncedFiles)) {
          // if (unsyncedFile.event === "purge") {
          //   console.log("purge", unsyncedFile);
          // }

          if (unsyncedFile.event === "update") {
            const dbDoc = docs.dbRevDocs.get(path);
            const file = this.app.vault.getFileByPath(path);

            if (!dbDoc || !file) continue;

            const content = await this.app.vault.cachedRead(file);
            const body: DocWithRev = {
              name: file.basename,
              extension: file.extension,
              path: file.path,
              content,
              _rev: dbDoc._rev,
              updatedAt: unsyncedFile.updatedAt,
            };

            const result = await services({
              ...this.data.db,
              credentials: this.app.secretStorage.getSecret(this.data.db.credentials!),
            }).update(body, { id: dbDoc._id, rev: dbDoc._rev, updatedAt: dbDoc.updatedAt });

            if (result.success && result.data) {
              this.data.files[path] = {
                id: result.data.id,
                rev: result.data.rev,
                updatedAt: unsyncedFile.updatedAt,
              };

              delete this.data.unsyncedFiles[path];
            }

            if (!result.success) {
              new Notice(result.message || "Sync error: failed to push local changes");
            }
          }
        }

        await this.saveData(this.data);
      }

      await resolveUnsyncedFiles(this, this.data.unsyncedFiles);

      // delete
      for (const fileName in this.data.files) {
        if (!this.app.vault.getFileByPath(fileName)) {
          delete this.data.files[fileName];
        }
      }

      this.data = {
        ...this.data,
        lastSeq: isSynced.data.lastSeq,
      };

      await this.saveData(this.data);

      this.isSynced = false;
    });
  }

  async initApp() {
    initAppInstance(this.app);

    await this.loadDataFromFile();
  }

  async loadDataFromFile() {
    const saved = (await this.loadData()) as unknown as Partial<Data>;

    this.data = { ...this.data, ...saved };
  }

  onunload() {}
}
