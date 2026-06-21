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

  async onload() {
    // await dbServices.removeAllDocs();
    await this.initApp();

    const utils = obsidianUtils();
    if (!utils) return;

    const isSynced = await sync(this.settings.lastSeq, this.settings.files);

    if (isSynced.success && isSynced.data) {
      const newFiles: Record<string, File> = {};

      if (isSynced.data.pendingDocs) {
        const docs = isSynced.data.pendingDocs;

        for (const [, doc] of docs.entries()) {
          await utils.createFileWithDirectory(doc);

          newFiles[doc.path] = { updatedAt: doc.updatedAt, rev: doc._rev, id: doc._id };
        }
      }

      this.settings = {
        ...this.settings,
        files: { ...this.settings.files, ...newFiles },
        lastSeq: isSynced.data.lastSeq,
        mode: "online",
      };

      await this.saveSettings();
    }

    this.registerEvent(
      this.app.vault.on("create", async (entity) => {
        console.log("create TAbstractFile", entity);
        const isEntityExist = this.settings.files[entity.path];

        if (!isEntityExist && entity instanceof TFile) {
          console.log("create", entity);
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

            await this.saveData(this.settings);
          }
        }
      }),
    );

    this.registerEvent(
      this.app.vault.on("modify", async (entity) => {
        const isEntityExist = this.settings.files[entity.path];
        console.log("mofiy TAbstractFile", entity);

        if (isEntityExist && entity instanceof TFile) {
          console.log("mofiy TFIle", entity);
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

          await this.saveData(this.settings);
        }
      }),
    );

    this.registerEvent(
      this.app.vault.on("rename", async (entity, oldPath) => {
        const isEntityExist = this.settings.files[oldPath];
        console.log("rename TAbstractFile", entity, oldPath);

        if (isEntityExist && entity instanceof TFile) {
          console.log("rename TFIle", entity);
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

          await this.saveData(this.settings);
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
