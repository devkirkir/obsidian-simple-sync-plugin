import { requestUrl } from "obsidian";
import { ChangesResult } from "./changes";
import { DbData } from "@services";
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

export const getBulk =
  (dbData: DbData) =>
  async (docs: ChangesResult[]): PromiseReturn<Bulk> => {
    try {
      const res = await requestUrl({
        url: `${dbData.url}/_bulk_get`,
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(dbData.credentials!),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ docs: docs.map(({ id }) => ({ id })) }),
      });

      return { success: true, data: res.json as unknown as Bulk };
    } catch (err) {
      if (err instanceof Error) {
        return { success: false, message: err.message };
      }

      if (typeof err === "object" && err !== null && "message" in err && typeof err.message == "string") {
        return { success: false, message: err.message };
      }
      return { success: false, message: "Unexpected error" };
    }
  };
