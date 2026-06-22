import { changes } from "./changes";
import { create } from "./create";
import { removeAllDocs } from "./removeAllDocs";
import { ChangesSucceed } from "./changes";
import { getBulk, BulkDoc, Bulk } from "./getBulk";
import { update } from "./update";
import { deleteDoc } from "./deleteDoc";

export default function services() {
  return {
    create,
    update,
    deleteDoc,
    changes,
    getBulk,
    removeAllDocs,
  };
}

export type { ChangesSucceed, BulkDoc, Bulk };
