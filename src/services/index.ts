import { changes } from "./changes";
import { create } from "./create";
import { removeAllDocs } from "./removeAllDocs";
import { ChangesSucceed } from "./changes";
import { getBulk, BulkDoc, Bulk } from "./getBulk";

export default function services() {
  return {
    create,
    changes,
    getBulk,
    removeAllDocs,
  };
}

export type { ChangesSucceed, BulkDoc, Bulk };
