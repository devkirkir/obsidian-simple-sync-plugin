import { Notice, TAbstractFile, TFile } from "obsidian";
import SimpleSyncPlugin from "src/main";
import services from "@services";
import checkDbSettings from "@utils/checkDbSettings";

function deleteEvent(app: SimpleSyncPlugin) {
  return async (entity: TAbstractFile) => {
    if (app.isSynced) return;

    try {
      checkDbSettings(app.data.db);

      const isEntityExist = app.data.files[entity.path];

      if (isEntityExist && entity instanceof TFile) {
        const resultData = await services({
          ...app.data.db,
          credentials: app.app.secretStorage.getSecret(app.data.db.credentials!),
        }).purge(isEntityExist);

        if (resultData.success && resultData.data) {
          delete app.data.files[entity.path];
        }

        if (!resultData.success) {
          new Notice(resultData.message || "Unexpected error in delete service");
        }

        await app.saveData(app.data);
      }
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
