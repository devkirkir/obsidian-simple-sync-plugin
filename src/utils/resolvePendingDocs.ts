import { BulkDoc, Bulk } from "@services";
import { Files } from "@usecases/sync";
import isDublicatePathAndNewer from "@utils/compare/isDublicatePathAndNewer";

type PendingDocs = Map<string, BulkDoc>;

/**
 * Resolves and compare bulk-files with local data
 */

function resolvePendingDocs(bulk: Bulk, files: Files): PendingDocs {
  const pendingDocs: PendingDocs = new Map();

  bulk.results.forEach(({ docs }) => {
    if (!docs[0]) return;

    const bulkDoc = docs[0].ok,
      localDoc = files[bulkDoc.path];

    if (!localDoc) {
      if (!pendingDocs.has(bulkDoc.path)) {
        pendingDocs.set(bulkDoc.path, bulkDoc);
        return;
      }

      const pendingRow = pendingDocs.get(bulkDoc.path);

      // handle when the path already exists in `pendingDocs` (DB has dublicate paths)
      // update to the newest doc by `updatedAt`
      if (isDublicatePathAndNewer(pendingRow, bulkDoc)) pendingDocs.set(bulkDoc.path, bulkDoc);
    }

    // if (localDoc && localDoc.updatedAt < bulkDoc.updatedAt && localDoc.rev !== bulkDoc._rev) {
    //   obj[bulkDoc.path] = { ...bulkDoc };
    // }
  });

  return pendingDocs;
}

export default resolvePendingDocs;
