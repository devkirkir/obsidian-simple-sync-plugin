import { BulkDoc } from "@services";

function isDublicatePathAndNewer(existingRow: BulkDoc | undefined, newRow: BulkDoc): boolean {
  return Boolean(existingRow && existingRow.updatedAt < newRow.updatedAt);
}

export default isDublicatePathAndNewer;
