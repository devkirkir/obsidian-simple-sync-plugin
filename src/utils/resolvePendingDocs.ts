import { BulkDoc, Bulk } from "@services";
import { Files, UnsyncedFiles } from "@/types";
import isDublicatePathAndNewer from "@utils/compare/isDublicatePathAndNewer";

type PendingDocs = Map<string, BulkDoc>;

export interface ResolvePendingDocs {
  // all newest docs from DB
  pendingDocs: PendingDocs;
  // newest and renamed docs from DB
  renamedDocs: PendingDocs;
  // DB docs where local unsyncedFile is newer used to get _rev for pushing local
  dbRevDocs: PendingDocs;
}

/**
 * Resolves and compare bulk-files with local data
 */

function resolvePendingDocs(bulk: Bulk, files: Files, unsyncedFiles: UnsyncedFiles): ResolvePendingDocs {
  const pendingDocs: PendingDocs = new Map();
  const renamedDocs: PendingDocs = new Map();
  const dbRevDocs: PendingDocs = new Map();

  bulk.results.forEach(({ docs }) => {
    if (!docs[0]) return;

    const bulkDoc = docs[0].ok;
    if (!bulkDoc) return;

    const localDoc = files[bulkDoc.path];

    // handle when the path already exists in `pendingDocs` or `dbRevDocs` (DB has duplicate paths)
    // update to the newest doc by `updatedAt`
    const existingPending = pendingDocs.get(bulkDoc.path);
    if (existingPending) {
      if (isDublicatePathAndNewer(existingPending, bulkDoc)) pendingDocs.set(bulkDoc.path, bulkDoc);
      return;
    }

    const existingDbRev = dbRevDocs.get(bulkDoc.path);
    if (existingDbRev) {
      if (isDublicatePathAndNewer(existingDbRev, bulkDoc)) dbRevDocs.set(bulkDoc.path, bulkDoc);
      return;
    }

    if (!localDoc) {
      const unsyncedFile = unsyncedFiles[bulkDoc.path];

      const isRenamed = Object.entries(files).some(([localPath, file]) => {
        if (file.id === bulkDoc._id) {
          if (!unsyncedFile) {
            renamedDocs.set(localPath, bulkDoc);
            return true;
          }

          if (unsyncedFile.updatedAt < bulkDoc.updatedAt) {
            renamedDocs.set(localPath, bulkDoc);
            return true;
          }
        }

        return false;
      });

      if (!isRenamed) {
        if (!unsyncedFile || unsyncedFile.updatedAt < bulkDoc.updatedAt) {
          pendingDocs.set(bulkDoc.path, bulkDoc);
        } else {
          // local unsyncedFile is newer than DB doc
          dbRevDocs.set(bulkDoc.path, bulkDoc);
        }
      }
    } else {
      const unsyncedFile = unsyncedFiles[bulkDoc.path];

      if (!unsyncedFile && localDoc.rev !== bulkDoc._rev) {
        pendingDocs.set(bulkDoc.path, bulkDoc);
      }

      if (unsyncedFile && unsyncedFile.updatedAt < bulkDoc.updatedAt) {
        pendingDocs.set(bulkDoc.path, bulkDoc);
      }

      if (unsyncedFile && unsyncedFile.updatedAt >= bulkDoc.updatedAt) {
        dbRevDocs.set(bulkDoc.path, bulkDoc);
      }
    }
  });

  return { pendingDocs, renamedDocs, dbRevDocs };
}

export default resolvePendingDocs;
