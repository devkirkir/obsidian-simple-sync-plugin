import { Notice, TAbstractFile, TFile } from "obsidian";
import SimpleSyncPlugin from "src/main";
import services from "@services";
import { DocWithRev } from "@/types";
import checkSettingsFields from "@utils/checkSettingsFields";

function rename(app: SimpleSyncPlugin) {
  return async (entity: TAbstractFile, oldPath: string) => {
    if (app.isSynced) return;
    if (!(entity instanceof TFile)) return;

    try {
      const localFile = app.data.files[oldPath];

      const unsyncedFileOld = app.data.unsyncedFiles[oldPath];

      const errors = checkSettingsFields(app.data.db);

      const updatedAt = Date.now();

      if (errors.length > 0) {
        app.data.unsyncedFiles[entity.path] = {
          updatedAt,
          event: "update",
        };

        await app.saveData(app.data);

        return;
      }

      if (localFile) {
        const updatedAt = Date.now();

        const body: DocWithRev = {
          name: entity.basename,
          extension: entity.extension,
          path: entity.path,
          content: await app.app.vault.cachedRead(entity),
          _rev: localFile.rev,
          updatedAt,
        };

        const resultData = await services({
          ...app.data.db,
          credentials: app.app.secretStorage.getSecret(app.data.db.credentials!),
        }).update(body, localFile);

        if (resultData.success && resultData.data) {
          delete app.data.files[oldPath];

          app.data.files[entity.path] = {
            id: resultData.data.id,
            rev: resultData.data.rev,
            updatedAt,
          };

          // await app.saveData(app.data);
        }

        if (!resultData.success) {
          new Notice(resultData.message || "Unexpected error in rename service");

          app.data.unsyncedFiles[entity.path] = {
            id: localFile.id,
            rev: localFile.rev,
            updatedAt,
            event: "update",
          };

          delete app.data.unsyncedFiles[oldPath];

          // await app.saveData(app.data);
        }

        await app.saveData(app.data);

        return;
      }

      if (!localFile) {
        app.data.unsyncedFiles[entity.path] = {
          ...(unsyncedFileOld || {}),
          updatedAt,
          event: unsyncedFileOld && unsyncedFileOld.id ? "update" : "create",
        };

        delete app.data.unsyncedFiles[oldPath];

        await app.saveData(app.data);
      }
    } catch (err) {
      if (err instanceof Error) {
        new Notice(err.message || "Unexpected error in rename service");
        return;
      }

      new Notice("Unexpected error");
    }
  };
}

export default rename;
