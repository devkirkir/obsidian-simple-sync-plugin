import sync from "@modules/sync";
import services, { CreateBody } from "@services";
import { Plugin, TFile } from "obsidian";

interface Files {
  id: string;
  rev: string;
  isSync: boolean;
  updatedAt: number;
}

interface DefaultSettings {
  lastSeq: string | number;
  mode: "online" | "offline";
  files: Record<string, Files>;
}

export default class SimpleSyncPlugin extends Plugin {
  settings: DefaultSettings = { lastSeq: 0, mode: "offline", files: {} };

  async onload() {
    // await services().removeAllDocs();
    await this.loadSettings();
    const isSynced = await sync(this.settings.lastSeq);

    if (isSynced.success && isSynced.data) {
      const results = isSynced.data.results;

      // if (results.length > 0) {
      // }

      this.settings = { ...this.settings, lastSeq: isSynced.data.last_seq, mode: "online" };
      await this.saveSettings();
    }

    this.registerEvent(
      this.app.vault.on("create", async (entity) => {
        if (entity instanceof TFile) {
          const body: CreateBody = {
            name: entity.basename,
            extension: entity.extension,
            path: entity.path,
            content: "",
            updatedAt: Date.now(),
          };

          const resultData = await services().create(body);

          console.log(resultData);

          if (resultData.success && resultData.data) {
            this.settings.files[entity.path] = {
              id: resultData.data.id,
              rev: resultData.data.rev,
              isSync: true,
              updatedAt: Date.now(),
            };

            await this.saveSettings();
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

  async loadSettings() {
    const saved = (await this.loadData()) as Partial<DefaultSettings>;

    this.settings = { ...this.settings, ...saved, mode: "online" };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {}
}
