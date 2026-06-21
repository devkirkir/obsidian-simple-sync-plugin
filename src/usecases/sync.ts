import services from "@services";
import resolvePendingDocs, { ResolvePendingDocs } from "@utils/resolvePendingDocs";
import { Files, PromiseReturn } from "@/types";
import { Notice } from "obsidian";

interface Success {
  lastSeq: string;
  docs?: ResolvePendingDocs;
}

const service = services();

/**
 * Fetches changes from the DB since `lastSeq` and compare with local files
 */

async function sync(lastSeq: string | number, files: Files): PromiseReturn<Success> {
  const synced = await service.changes(lastSeq);
  if (!synced.success) {
    new Notice(synced.message || "Ошибка синхронизации");

    return synced;
  }

  if (synced.data.results.length > 0) {
    const bulk = await service.getBulk(synced.data.results);
    if (!bulk.success) return { success: false, message: bulk.message };

    const docs = resolvePendingDocs(bulk.data, files);

    return { success: true, data: { lastSeq: synced.data.last_seq, docs } };
  }

  return { success: true, data: { lastSeq: synced.data.last_seq } };
}

export default sync;
