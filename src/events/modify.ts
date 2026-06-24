import { Notice, TAbstractFile, TFile } from "obsidian";
import SimpleSyncPlugin from "src/main";
import services from "@services";
import { DocWithRev } from "@/types";
import checkDbSettings from "@utils/checkDbSettings";

function modify(app: SimpleSyncPlugin) {
  return async (entity: TAbstractFile) => {
    if (app.isSynced) return;

    try {
      checkDbSettings(app.data.db);

      const isEntityExist = app.data.files[entity.path];

      if (isEntityExist && entity instanceof TFile) {
        const updatedAt = Date.now();

        const body: DocWithRev = {
          name: entity.basename,
          extension: entity.extension,
          path: entity.path,
          content: await app.app.vault.cachedRead(entity),
          _rev: isEntityExist.rev,
          updatedAt,
        };

        const resultData = await services({
          ...app.data.db,
          credentials: app.app.secretStorage.getSecret(app.data.db.credentials!),
        }).update(body, isEntityExist);

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
