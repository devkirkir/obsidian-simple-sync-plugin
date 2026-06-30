import { Notice, TAbstractFile, TFile } from "obsidian";
import SimpleSyncPlugin from "src/main";
import services from "@services";
import { Doc } from "@/types";
import checkDbSettings from "@utils/checkDbSettings";

function create(app: SimpleSyncPlugin) {
  return async (entity: TAbstractFile) => {
    if (app.isSynced) return;

    try {
      const localFile = app.data.files[entity.path];
      const errors = checkDbSettings(app.data.db);

      if (!localFile && entity instanceof TFile) {
        const updatedAt = Date.now();

        if (errors.length > 0) {
          errors.forEach((error) => {
            new Notice(error);
          });

          app.data.unsyncedFiles[entity.path] = {
            updatedAt,
            event: "create",
          };

          await app.saveData(app.data);

          return;
        }

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

          // TODO сделать resync, если пропадало соединение
          // сделать проверку на unsyncedFiles и обновить их
          // ТУТ НАДО ПОДУМАТЬ ПОЛУЧШЕ
          // чтобы не было проблемы перезатирания???
        }

        if (!resultData.success) {
          new Notice(resultData.message || "Unexpected error in create service");

          app.data.unsyncedFiles[entity.path] = {
            updatedAt,
            event: "create",
          };

          await app.saveData(app.data);
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
