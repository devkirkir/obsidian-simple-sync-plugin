import { BulkDoc } from "@services";

function isDublicatePathAndNewer(pendingRow: BulkDoc | undefined, newRow: BulkDoc): boolean {
  return Boolean(pendingRow && pendingRow.updatedAt < newRow.updatedAt);
}

export default isDublicatePathAndNewer;
