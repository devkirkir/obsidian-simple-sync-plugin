import { Notice, TAbstractFile, TFile } from "obsidian";
import SimpleSyncPlugin from "@/main";
import serviceFactory from "@services";
import { DocWithRev } from "@/types";

function modify(app: SimpleSyncPlugin) {
  return async (entity: TAbstractFile) => {
    if (app.isSynced) return;
    if (!(entity instanceof TFile)) return;

    try {
      const localFile = app.data.files[entity.path];
      const updatedAt = Date.now();

      if (!app.data.isOnline) {
        const unsyncedFile = app.data.unsyncedFiles[entity.path];

        if (!localFile && !unsyncedFile) {
          app.data.unsyncedFiles[entity.path] = {
            updatedAt,
            event: "create",
          };

          await app.saveData(app.data);
          return;
        }

        if (unsyncedFile) {
          app.data.unsyncedFiles[entity.path] = {
            updatedAt,
            event: "update",
          };

          await app.saveData(app.data);
          return;
        }
      }

      if (localFile && app.data.isOnline) {
        const updateService = serviceFactory("update");
        if (!updateService) return;

        const body: DocWithRev = {
          name: entity.basename,
          extension: entity.extension,
          path: entity.path,
          content: await app.app.vault.cachedRead(entity),
          _rev: localFile.rev,
          updatedAt,
        };

        const resultData = await updateService(body, localFile);

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
