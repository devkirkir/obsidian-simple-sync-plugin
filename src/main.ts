import { Plugin, TFile } from "obsidian";

import sync from "@usecases/sync";
import services from "@services";

import { Doc, DocWithRev, File } from "@/types";
import obsidianUtils, { initAppInstance } from "@utils/obsidian";

interface DefaultSettings {
  lastSeq: string | number;
  mode: "online" | "offline";
  files: Record<string, File>;
}

const dbServices = services();

export default class SimpleSyncPlugin extends Plugin {
  private settings: DefaultSettings = { lastSeq: 0, mode: "offline", files: {} };
  private isSynced: boolean = false;

  async onload() {
    // await dbServices.removeAllDocs();
    await this.initApp();

    const utils = obsidianUtils();
    if (!utils) return;

    this.app.workspace.onLayoutReady(async () => {
      this.isSynced = true;

      const isSynced = await sync(this.settings.lastSeq, this.settings.files);

      if (isSynced.success && isSynced.data) {
        if (isSynced.data.docs) {
          const docs = isSynced.data.docs;

          for (const [oldPath, newDoc] of docs.renamedDocs) {
            delete this.settings.files[oldPath];

            this.settings.files[newDoc.path] = { updatedAt: newDoc.updatedAt, rev: newDoc._rev, id: newDoc._id };
            await this.saveSettings();

            const file = this.app.vault.getFileByPath(oldPath);

            if (file) {
              await this.app.fileManager.renameFile(file, newDoc.path);
              await this.app.vault.modify(file, newDoc.content);
            }
          }

          for (const [, newDoc] of docs.pendingDocs.entries()) {
            this.settings.files[newDoc.path] = { updatedAt: newDoc.updatedAt, rev: newDoc._rev, id: newDoc._id };
            await this.saveSettings();

            await utils.createFileWithDirectory(newDoc);
          }
        }

        this.settings = {
          ...this.settings,
          lastSeq: isSynced.data.lastSeq,
          mode: "online",
        };

        await this.saveSettings();
      }

      this.isSynced = false;
    });

    this.registerEvent(
      this.app.vault.on("create", async (entity) => {
        if (this.isSynced) return;

        const isEntityExist = this.settings.files[entity.path];

        if (!isEntityExist && entity instanceof TFile) {
          const updatedAt = Date.now();

          const body: Doc = {
            name: entity.basename,
            extension: entity.extension,
            path: entity.path,
            content: "",
            updatedAt,
          };

          const resultData = await dbServices.create(body);

          if (resultData.success && resultData.data) {
            this.settings.files[entity.path] = {
              id: resultData.data.id,
              rev: resultData.data.rev,
              updatedAt,
            };

            await this.saveSettings();
          }
        }
      }),
    );

    this.registerEvent(
      this.app.vault.on("modify", async (entity) => {
        if (this.isSynced) return;

        const isEntityExist = this.settings.files[entity.path];

        if (isEntityExist && entity instanceof TFile) {
          const updatedAt = Date.now();

          const body: DocWithRev = {
            name: entity.basename,
            extension: entity.extension,
            path: entity.path,
            content: await this.app.vault.cachedRead(entity),
            _rev: isEntityExist.rev,
            updatedAt,
          };

          const resultData = await dbServices.update(body, isEntityExist);

          if (resultData.success && resultData.data) {
            this.settings.files[entity.path] = {
              id: resultData.data.id,
              rev: resultData.data.rev,
              updatedAt,
            };
          }

          await this.saveSettings();
        }
      }),
    );

    this.registerEvent(
      this.app.vault.on("rename", async (entity, oldPath) => {
        if (this.isSynced) return;

        const isEntityExist = this.settings.files[oldPath];

        if (isEntityExist && entity instanceof TFile) {
          const updatedAt = Date.now();

          const body: DocWithRev = {
            name: entity.basename,
            extension: entity.extension,
            path: entity.path,
            content: await this.app.vault.cachedRead(entity),
            _rev: isEntityExist.rev,
            updatedAt,
          };

          const resultData = await dbServices.update(body, isEntityExist);

          if (resultData.success && resultData.data) {
            delete this.settings.files[oldPath];

            this.settings.files[entity.path] = {
              id: resultData.data.id,
              rev: resultData.data.rev,
              updatedAt,
            };
          }

          await this.saveSettings();
        }
      }),
    );

    this.registerEvent(
      this.app.vault.on("delete", async (entity) => {
        if (this.isSynced) return;

        const isEntityExist = this.settings.files[entity.path];

        if (isEntityExist && entity instanceof TFile) {
          const resultData = await dbServices.deleteDoc(isEntityExist);

          if (resultData.success && resultData.data) {
            delete this.settings.files[entity.path];
          }

          await this.saveSettings();
        }
      }),
    );
  }

  async initApp() {
    initAppInstance(this.app);

    await this.loadSettings();
  }

  async loadSettings() {
    const saved = (await this.loadData()) as Partial<DefaultSettings>;

    this.settings = { ...this.settings, ...saved };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {}
}
