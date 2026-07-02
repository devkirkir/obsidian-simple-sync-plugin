import { Notice, TAbstractFile, TFile } from "obsidian";
import SimpleSyncPlugin from "src/main";
import services from "@services";
import checkSettingsFields from "@utils/checkSettingsFields";

function deleteEvent(app: SimpleSyncPlugin) {
  return async (entity: TAbstractFile) => {
    if (app.isSynced) return;
    if (!(entity instanceof TFile)) return;

    try {
      const localFile = app.data.files[entity.path];
      const unsyncedFile = app.data.unsyncedFiles[entity.path];

      const errors = checkSettingsFields(app.data.db);

      const updatedAt = Date.now();

      if (errors.length > 0) {
        app.data.unsyncedFiles[entity.path] = {
          updatedAt,
          event: "purge",
        };

        await app.saveData(app.data);

        return;
      }

      if (localFile) {
        const resultData = await services({
          ...app.data.db,
          credentials: app.app.secretStorage.getSecret(app.data.db.credentials!),
        }).purge(localFile);

        if (resultData.success && resultData.data) {
          delete app.data.files[entity.path];
        }

        if (!resultData.success) {
          new Notice(resultData.message || "Unexpected error in delete service");

          app.data.unsyncedFiles[entity.path] = {
            updatedAt,
            event: "purge",
            id: localFile.id,
            rev: localFile.rev,
          };
        }
      }

      if (localFile && unsyncedFile) {
        app.data.unsyncedFiles[entity.path] = {
          updatedAt,
          event: "purge",
          id: localFile.id,
          rev: localFile.rev,
        };
      }

      if (!localFile && unsyncedFile) {
        if (!unsyncedFile.id) {
          delete app.data.unsyncedFiles[entity.path];
        } else {
          app.data.unsyncedFiles[entity.path] = {
            ...app.data.unsyncedFiles[entity.path],
            updatedAt,
            event: "purge",
          };
        }
      }

      await app.saveData(app.data);
    } catch (err) {
      if (err instanceof Error) {
        new Notice(err.message || "Unexpected error in delete service");
        return;
      }

      new Notice("Unexpected error");
    }
  };
}

export default deleteEvent;
