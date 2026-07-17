import { Notice, TAbstractFile, TFile } from "obsidian";
import SimpleSyncPlugin from "@/main";
import services from "@services";
import checkSettingsFields from "@utils/checkSettingsFields";
import { DocWithRev } from "@/types";

function modify(app: SimpleSyncPlugin) {
  return async (entity: TAbstractFile) => {
    if (app.isSynced) return;
    if (!(entity instanceof TFile)) return;

    try {
      const localFile = app.data.files[entity.path];
      const errors = checkSettingsFields(app.data.db);

      const updatedAt = Date.now();
      // http://localhost:5984/notes
      if (errors.length > 0) {
        app.data.unsyncedFiles[entity.path] = {
          updatedAt,
          event: "update",
        };

        errors.forEach((errorMessage) => {
          new Notice(errorMessage);
        });

        await app.saveData(app.data);

        return;
      }

      if (localFile) {
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
          app.data.files[entity.path] = {
            id: resultData.data.id,
            rev: resultData.data.rev,
            updatedAt,
          };
        }

        if (!resultData.success) {
          new Notice(resultData.message || "Unexpected error in modify service");
        }

        await app.saveData(app.data);
      }
    } catch (err) {
      if (err instanceof Error) {
        new Notice(err.message || "Unexpected error in modify service");
        return;
      }

      new Notice("Unexpected error");
    }
  };
}

export default modify;
