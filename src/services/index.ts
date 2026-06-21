import { changes } from "./changes";
import { create } from "./create";
import { removeAllDocs } from "./removeAllDocs";
import { ChangesSucceed } from "./changes";
import { getBulk, BulkDoc, Bulk } from "./getBulk";
import { update } from "./update";

export default function services() {
  return {
    create,
    update,
    changes,
    getBulk,
    removeAllDocs,
  };
}

export type { ChangesSucceed, BulkDoc, Bulk };
