import { App, Notice, PluginSettingTab, SecretComponent, Setting } from "obsidian";
import SimpleSyncPlugin from "./main";
import { File } from "./types";
import { DbData } from "@services";

export interface Data {
  lastSeq: string | number;
  mode: "online" | "offline";
  files: Record<string, File>;
  db: DbData;
}

export class SettingTab extends PluginSettingTab {
  private plugin: SimpleSyncPlugin;

  constructor(app: App, plugin: SimpleSyncPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async checkSettings() {
    if (!this.plugin.data.db.credentials || !this.plugin.data.db.url) {
      new Notice("Fill settings");

      if ("setting" in this.app) {
        const setting = this.app.setting as { open(): Promise<void>; openTabById(id: string): void };

        await setting.open();
        setting.openTabById(this.plugin.manifest.id);
      }

      return false;
    }

    return true;
  }

  display(): void {
    const { containerEl } = this;

    new Setting(containerEl).setName("Couchdb URL").addText((component) => {
      component
        .setPlaceholder("HTTP[s]://[IP]:[port]/[dbname]")
        .setValue(this.plugin.data.db.url || "")
        .onChange(async (value) => {
          this.plugin.data.db.url = value;

          await this.plugin.saveData(this.plugin.data);
        });
    });

    new Setting(containerEl)
      .setName("Credentials")
      .setDesc("Create a secret for the credentials for couchdb. Format: username:password")
      .addComponent((el) =>
        new SecretComponent(this.app, el).onChange(async (value) => {
          this.plugin.data.db.credentials = value;

          await this.plugin.saveData(this.plugin.data);
        }),
      );
  }
}
