import { requestUrl } from "obsidian";
import { File, PromiseReturn } from "@/types";
import { DbData } from "@services";

interface Succeed {
  purge_seq: null | string;
  purged: Record<string, string[]>;
}

export const purge =
  (dbData: DbData) =>
  async (doc: File): PromiseReturn<Succeed> => {
    try {
      const res = await requestUrl({
        url: `${dbData.url}/_purge`,
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(dbData.credentials!),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [doc.id]: [doc.rev] }),
      });

      return { success: true, data: res.json as Succeed };
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
