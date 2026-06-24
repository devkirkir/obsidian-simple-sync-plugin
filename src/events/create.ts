import { Notice, TAbstractFile, TFile } from "obsidian";
import SimpleSyncPlugin from "src/main";
import services from "@services";
import { Doc } from "@/types";
import checkDbSettings from "@utils/checkDbSettings";

function create(app: SimpleSyncPlugin) {
  return async (entity: TAbstractFile) => {
    if (app.isSynced) return;

    try {
      checkDbSettings(app.data.db);

      const isEntityExist = app.data.files[entity.path];

      if (!isEntityExist && entity instanceof TFile) {
        const updatedAt = Date.now();

        const body: Doc = {
          name: entity.basename,
          extension: entity.extension,
          path: entity.path,
          content: "",
          updatedAt,
        };

        const resultData = await services({
          ...app.data.db,
          credentials: app.app.secretStorage.getSecret(app.data.db.credentials!),
        }).create(body);

        if (resultData.success && resultData.data) {
          app.data.files[entity.path] = {
            id: resultData.data.id,
            rev: resultData.data.rev,
            updatedAt,
          };

          await app.saveData(app.data);
        }

        if (!resultData.success) {
          new Notice(resultData.message || "Unexpected error in create service");
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        new Notice(err.message || "Unexpected error in create service");
        return;
      }

      new Notice("Unexpected error");
    }
  };
}

export default create;
