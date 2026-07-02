import services from "@services";
import resolvePendingDocs, { ResolvePendingDocs } from "@utils/resolvePendingDocs";
import { PromiseReturn } from "@/types";
import { Notice } from "obsidian";
import SimpleSyncPlugin from "src/main";

interface Success {
  lastSeq: string;
  docs?: ResolvePendingDocs;
}

/**
 * Fetches changes from the DB since `lastSeq` and compare with local files
 */

async function sync(app: SimpleSyncPlugin): PromiseReturn<Success> {
  const synced = await services({
    ...app.data.db,
    credentials: app.app.secretStorage.getSecret(app.data.db.credentials!),
  }).changes(app.data.lastSeq);

  if (!synced.success) {
    new Notice(synced.message || "Sync error");

    return synced;
  }

  if (synced.data.results.length > 0) {
    const bulk = await services({
      ...app.data.db,
      credentials: app.app.secretStorage.getSecret(app.data.db.credentials!),
    }).getBulk(synced.data.results);
    if (!bulk.success) return { success: false, message: bulk.message };

    const docs = resolvePendingDocs(bulk.data, app.data.files, app.data.unsyncedFiles);

    return { success: true, data: { lastSeq: synced.data.last_seq, docs } };
  }

  return { success: true, data: { lastSeq: synced.data.last_seq } };
}

export default sync;
