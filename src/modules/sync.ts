import services, { type BulkDoc } from "@services";
import { File, PromiseReturn } from "@/types";

interface Success {
  lastSeq: string;
  pendingDocs?: Map<string, BulkDoc>;
}

const service = services();

async function sync(lastSeq: string | number, files: Record<string, File>): PromiseReturn<Success> {
  const synced = await service.changes(lastSeq);
  if (!synced.success) return synced;

  if (synced.data.results.length > 0) {
    const bulk = await service.getBulk(synced.data.results);
    if (!bulk.success) return { success: false, message: bulk.message };

    const pendingDocs: Map<string, BulkDoc> = new Map();

    bulk.data.results.forEach(({ docs }) => {
      if (!docs[0]) return;

      const bulkDoc = docs[0].ok,
        localDoc = files[bulkDoc.path];

      if (!localDoc) {
        if (!pendingDocs.has(bulkDoc.path)) {
          pendingDocs.set(bulkDoc.path, bulkDoc);
          return;
        }

        const pendingRow = pendingDocs.get(bulkDoc.path);
        if (pendingRow && pendingRow.updatedAt < bulkDoc.updatedAt) pendingDocs.set(bulkDoc.path, bulkDoc);
      }

      // if (localDoc && localDoc.updatedAt < bulkDoc.updatedAt && localDoc.rev !== bulkDoc._rev) {
      //   obj[bulkDoc.path] = { ...bulkDoc };
      // }
    });

    return { success: true, data: { lastSeq: synced.data.last_seq, pendingDocs } };
  }

  return { success: true, data: { lastSeq: synced.data.last_seq } };
}

export default sync;
