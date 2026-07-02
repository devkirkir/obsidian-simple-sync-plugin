import { requestUrl } from "obsidian";
import { DbData } from "@services";
import { PromiseReturn } from "@/types";

interface Change {
  rev: string;
}

export interface ChangesResult {
  id: string;
  seq: string;
  changes: Change[];
}

export interface ChangesSucceed {
  results: ChangesResult[];
  last_seq: string;
  pending: number;
}

export const changes =
  (dbData: DbData) =>
  async (lastSeq: string | number): PromiseReturn<ChangesSucceed> => {
    try {
      const res = await requestUrl({
        url: `${dbData.url}/_changes?since=${lastSeq}`,
        method: "GET",
        headers: {
          Authorization: "Basic " + btoa(dbData.credentials!),
          "Content-Type": "application/json",
        },
      });

      return { success: true, data: res.json as unknown as ChangesSucceed };
    } catch (err) {
      if (err instanceof Error) {
        return { success: false, message: err.message };
      }

      if (typeof err === "object" && err !== null && "message" in err && typeof err.message == "string") {
        return { success: false, message: err.message };
      }
      return {
        success: false,
        message: "Unexpected error",
      };
    }
  };
