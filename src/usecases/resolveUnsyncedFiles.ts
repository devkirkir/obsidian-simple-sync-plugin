import services from "@services";
import { Doc, DocWithRev, UnsyncedFiles } from "@/types";

import SimpleSyncPlugin from "src/main";

async function resolveUnsyncedFiles(app: SimpleSyncPlugin, unsyncedFiles: UnsyncedFiles): Promise<void> {
  for (const [fileName, unsyncedFile] of Object.entries(unsyncedFiles)) {
    if (unsyncedFile.event === "purge") {
      const result = await services({
        ...app.data.db,
        credentials: app.app.secretStorage.getSecret(app.data.db.credentials!),
      }).purge({ id: unsyncedFile.id!, rev: unsyncedFile.rev!, updatedAt: unsyncedFile.updatedAt });

      if (result.success) {
        delete app.data.files[fileName];
        delete app.data.unsyncedFiles[fileName];
      }

      continue;
    }

    if (unsyncedFile.event === "update") {
      const file = app.app.vault.getFileByPath(fileName);
      if (!file || !unsyncedFile.rev || !unsyncedFile.id) continue;

      const content = await app.app.vault.cachedRead(file);

      const body: DocWithRev = {
        name: file.basename,
        extension: file.extension,
        path: file.path,
        content,
        _rev: unsyncedFile.rev,
        updatedAt: unsyncedFile.updatedAt,
      };

      const result = await services({
        ...app.data.db,
        credentials: app.app.secretStorage.getSecret(app.data.db.credentials!),
      }).update(body, { id: unsyncedFile.id, rev: unsyncedFile.rev, updatedAt: unsyncedFile.updatedAt });

      if (result.success && result.data) {
        app.data.files[fileName] = {
          id: result.data.id,
          rev: result.data.rev,
          updatedAt: unsyncedFile.updatedAt,
        };

        delete app.data.unsyncedFiles[fileName];
      }
    }

    if (unsyncedFile.event === "create") {
      const file = app.app.vault.getFileByPath(fileName);
      if (!file) continue;

      const content = await app.app.vault.cachedRead(file);

      const body: Doc = {
        name: file.basename,
        extension: file.extension,
        path: file.path,
        content,
        updatedAt: unsyncedFile.updatedAt,
      };

      const result = await services({
        ...app.data.db,
        credentials: app.app.secretStorage.getSecret(app.data.db.credentials!),
      }).create(body);

      if (result.success && result.data) {
        app.data.files[fileName] = {
          id: result.data.id,
          rev: result.data.rev,
          updatedAt: unsyncedFile.updatedAt,
        };

        delete app.data.unsyncedFiles[fileName];
      }
    }
  }

  await app.saveData(app.data);
}

export default resolveUnsyncedFiles;
