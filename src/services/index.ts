import { changes } from "./changes";
import { create } from "./create";
import { removeAllDocs } from "./removeAllDocs";
import { ChangesSucceed } from "./changes";
import { CreateBody } from "./create";

export default function services() {
  return {
    create,
    changes,
    removeAllDocs,
  };
}

export type { ChangesSucceed, CreateBody };
