import { requestUrl } from "obsidian";
import { ChangesResult } from "./changes";
import { Doc, PromiseReturn } from "@/types";

export interface BulkDoc extends Doc {
  _rev: string;
  _id: string;
}

export interface Bulk {
  results: {
    id: string;
    docs: {
      ok: BulkDoc;
    }[];
  }[];
}

export const getBulk = async (docs: ChangesResult[]): PromiseReturn<Bulk> => {
  try {
    const res = await requestUrl({
      url: `http://localhost:5984/files/_bulk_get`,
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa("admin:password"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ docs: docs.map(({ id }) => ({ id })) }),
    });

    return { success: true, data: res.json as unknown as Bulk };
  } catch (err) {
    if (typeof err === "object" && err !== null && "message" in err && typeof err.message == "string") {
      return { success: false, message: err.message };
    }
    return { success: false, message: "Unexpected error" };
  }
};
