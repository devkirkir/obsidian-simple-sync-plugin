import services, { type BulkDoc } from "@services";
import resolvePendingDocs from "@utils/resolvePendingDocs";
import { File, PromiseReturn } from "@/types";

interface Success {
  lastSeq: string;
  pendingDocs?: Map<string, BulkDoc>;
}

export type Files = Record<string, File>;

const service = services();

/**
 * Fetches changes from the DB since `lastSeq` and compare with local files
 */

async function sync(lastSeq: string | number, files: Files): PromiseReturn<Success> {
  const synced = await service.changes(lastSeq);
  if (!synced.success) return synced;

  if (synced.data.results.length > 0) {
    const bulk = await service.getBulk(synced.data.results);
    if (!bulk.success) return { success: false, message: bulk.message };

    const pendingDocs = resolvePendingDocs(bulk.data, files);

    return { success: true, data: { lastSeq: synced.data.last_seq, pendingDocs } };
  }

  return { success: true, data: { lastSeq: synced.data.last_seq } };
}

export default sync;
