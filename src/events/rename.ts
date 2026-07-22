import { Notice, TAbstractFile, TFile } from "obsidian";
import SimpleSyncPlugin from "@/main";
import serviceFactory from "@services";
import { DocWithRev } from "@/types";

function rename(app: SimpleSyncPlugin) {
  return async (entity: TAbstractFile, oldPath: string) => {
    if (app.isSynced) return;
    if (!(entity instanceof TFile)) return;

    try {
      const oldLocalFile = app.data.files[oldPath];
      const updatedAt = Date.now();

      if (!app.data.isOnline) {
        if (!oldLocalFile) {
          app.data.unsyncedFiles[entity.path] = {
            updatedAt,
            event: "update",
          };

          delete app.data.unsyncedFiles[oldPath];

          await app.saveData(app.data);
          return;
        }

        if (oldLocalFile) {
          app.data.unsyncedFiles[entity.path] = {
            updatedAt,
            event: "update",
          };

          app.data.files[entity.path] = {
            ...oldLocalFile,
          };

          delete app.data.unsyncedFiles[oldPath];
          delete app.data.files[oldPath];

          await app.saveData(app.data);
          return;
        }
      }

      if (oldLocalFile && app.data.isOnline) {
        const updateService = serviceFactory("update");
        if (!updateService) return;

        const body: DocWithRev = {
          name: entity.basename,
          extension: entity.extension,
          path: entity.path,
          content: await app.app.vault.cachedRead(entity),
          _rev: oldLocalFile.rev,
          updatedAt,
        };

        const resultData = await updateService(body, oldLocalFile);

        if (resultData.success && resultData.data) {
          delete app.data.files[oldPath];

          app.data.files[entity.path] = {
            id: resultData.data.id,
            rev: resultData.data.rev,
            updatedAt,
          };
        }

        if (!resultData.success) {
          new Notice(resultData.message || "Unexpected error in rename service");
        }

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
