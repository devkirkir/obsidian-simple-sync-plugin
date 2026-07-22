import { Notice } from "obsidian";
import SimpleSyncPlugin from "@/main";
import resolvePendingDocs, { ResolvePendingDocs } from "@utils/resolvePendingDocs";
import { PromiseReturn } from "@/types";
import serviceFactory from "@services";

interface Success {
  lastSeq: string;
  docs?: ResolvePendingDocs;
}

/**
 * Fetches changes from the DB since `lastSeq` and compare with local files
 */

async function sync(app: SimpleSyncPlugin): PromiseReturn<Success> {
  const changeService = serviceFactory("changes"),
    getBulkService = serviceFactory("getBulk");

  if (!changeService || !getBulkService) return { success: false };

  const synced = await changeService(app.data.lastSeq);

  if (!synced.success) {
    new Notice(synced.message || "Sync error");

    return synced;
  }

  if (synced.data.results.length > 0) {
    const bulk = await getBulkService(synced.data.results);
    if (!bulk.success) return { success: false, message: bulk.message };

    const docs = resolvePendingDocs(bulk.data, app.data.files);

    return { success: true, data: { lastSeq: synced.data.last_seq, docs } };
  }

  return { success: true, data: { lastSeq: synced.data.last_seq } };
}

export default sync;
