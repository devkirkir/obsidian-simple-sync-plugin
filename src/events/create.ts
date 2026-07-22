import { Notice, TAbstractFile, TFile } from "obsidian";
import SimpleSyncPlugin from "@/main";
import serviceFactory from "@services";
import { Doc } from "@/types";

function create(app: SimpleSyncPlugin) {
  return async (entity: TAbstractFile) => {
    if (app.isSynced) return;
    if (!(entity instanceof TFile)) return;

    try {
      const localFile = app.data.files[entity.path];
      const updatedAt = Date.now();

      if (!app.data.isOnline) {
        if (!localFile) {
          app.data.unsyncedFiles[entity.path] = {
            updatedAt,
            event: "create",
          };

          await app.saveData(app.data);
          return;
        }

        if (localFile) {
          app.data.unsyncedFiles[entity.path] = {
            updatedAt,
            event: "update",
          };

          await app.saveData(app.data);
          return;
        }
      }

      if (!localFile && app.data.isOnline) {
        const createService = serviceFactory("create");
        if (!createService) return;

        const body: Doc = {
          name: entity.basename,
          extension: entity.extension,
          path: entity.path,
          content: "",
          updatedAt,
        };

        const resultData = await createService(body);

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
