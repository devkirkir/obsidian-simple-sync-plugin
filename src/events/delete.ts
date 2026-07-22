import { Notice, TAbstractFile, TFile } from "obsidian";
import SimpleSyncPlugin from "@/main";
import serviceFactory from "@services";

function deleteEvent(app: SimpleSyncPlugin) {
  return async (entity: TAbstractFile) => {
    if (app.isSynced) return;
    if (!(entity instanceof TFile)) return;

    try {
      const localFile = app.data.files[entity.path];
      const updatedAt = Date.now();

      if (!app.data.isOnline) {
        if (!localFile) {
          delete app.data.unsyncedFiles[entity.path];

          await app.saveData(app.data);
          return;
        }

        if (localFile) {
          app.data.unsyncedFiles[entity.path] = {
            updatedAt,
            event: "purge",
          };

          await app.saveData(app.data);
          return;
        }
      }

      if (localFile && app.data.isOnline) {
        const purgeService = serviceFactory("purge");
        if (!purgeService) return;

        const resultData = await purgeService(localFile);

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
