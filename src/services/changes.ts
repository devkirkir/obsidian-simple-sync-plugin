import { requestUrl } from "obsidian";
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

export const changes = async (lastSeq: string | number): PromiseReturn<ChangesSucceed> => {
  try {
    const res = await requestUrl({
      url: `http://localhost:5984/files/_changes?since=${lastSeq}`,
      method: "GET",
      headers: {
        Authorization: "Basic " + btoa("admin:password"),
        "Content-Type": "application/json",
      },
    });

    return { success: true, data: res.json as unknown as ChangesSucceed };
  } catch (err) {
    if (typeof err === "object" && err !== null && "message" in err && typeof err.message == "string") {
      return { success: false, message: err.message };
    }
    return {
      success: false,
      message: "Unexpected error",
    };
  }
};
