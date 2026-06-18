import { Plugin, TFile } from "obsidian";

import sync from "@usecases/sync";
import services from "@services";

import { Doc, File } from "@/types";
import obsidianUtils, { initAppInstance } from "@utils/obsidian";

interface DefaultSettings {
  lastSeq: string | number;
  mode: "online" | "offline";
  files: Record<string, File>;
}

export default class SimpleSyncPlugin extends Plugin {
  private settings: DefaultSettings = { lastSeq: 0, mode: "offline", files: {} };

  async onload() {
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

          newFiles[doc.path] = { isSync: true, updatedAt: doc.updatedAt, rev: doc._rev, id: doc._id };
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

          const resultData = await services().create(body);

          if (resultData.success && resultData.data) {
            this.settings.files[entity.path] = {
              id: resultData.data.id,
              rev: resultData.data.rev,
              isSync: true,
              updatedAt,
            };

            await this.saveData(this.settings);
          }
        }
      }),
    );

    this.registerEvent(
      this.app.vault.on("modify", async (file) => {
        console.log("modify", file);
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
