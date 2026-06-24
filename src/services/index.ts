import { changes } from "./changes";
import { create } from "./create";
import { removeAllDocs } from "./removeAllDocs";
import { ChangesSucceed } from "./changes";
import { getBulk, BulkDoc, Bulk } from "./getBulk";
import { update } from "./update";
import { purge } from "./purge";

export interface DbData {
  credentials: string | null;
  url: string | null;
}

export default function services(dbData: DbData) {
  return {
    create: create(dbData),
    update: update(dbData),
    purge: purge(dbData),
    changes: changes(dbData),
    getBulk: getBulk(dbData),
    removeAllDocs: removeAllDocs(dbData),
  };
}

export type { ChangesSucceed, BulkDoc, Bulk };
