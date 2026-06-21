import { BulkDoc, Bulk } from "@services";
import { Files } from "@/types";
import isDublicatePathAndNewer from "@utils/compare/isDublicatePathAndNewer";

type PendingDocs = Map<string, BulkDoc>;

export interface ResolvePendingDocs {
  pendingDocs: PendingDocs;
  renamedDocs: PendingDocs;
}

/**
 * Resolves and compare bulk-files with local data
 */

function resolvePendingDocs(bulk: Bulk, files: Files): ResolvePendingDocs {
  const pendingDocs: PendingDocs = new Map();
  const renamedDocs: PendingDocs = new Map();

  bulk.results.forEach(({ docs }) => {
    if (!docs[0]) return;

    const bulkDoc = docs[0].ok,
      localDoc = files[bulkDoc.path];

    // handle when the path already exists in `pendingDocs` (DB has dublicate paths)
    // update to the newest doc by `updatedAt`
    const existingRow = pendingDocs.get(bulkDoc.path);

    if (existingRow) {
      if (isDublicatePathAndNewer(existingRow, bulkDoc)) pendingDocs.set(bulkDoc.path, bulkDoc);
      return;
    }

    if (!localDoc) {
      // handle when the path was changes
      // update local doc to the newest doc
      const isRenamed = Object.entries(files).some(([localPath, file]) => {
        if (file.id === bulkDoc._id) {
          renamedDocs.set(localPath, bulkDoc);

          return true;
        }
        return false;
      });

      if (!isRenamed) {
        pendingDocs.set(bulkDoc.path, bulkDoc);
      }
    } else {
      if (localDoc.rev !== bulkDoc._rev) {
        pendingDocs.set(bulkDoc.path, bulkDoc);
      }
    }

    // if (localDoc && localDoc.updatedAt < bulkDoc.updatedAt && localDoc.rev !== bulkDoc._rev) {
    //   obj[bulkDoc.path] = { ...bulkDoc };
    // }
  });

  return { pendingDocs, renamedDocs };
}

export default resolvePendingDocs;
