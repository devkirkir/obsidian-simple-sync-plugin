import { requestUrl } from "obsidian";
import { File, PromiseReturn } from "@/types";

interface Succeed {
  purge_seq: null | string;
  purged: Record<string, string[]>;
}

export const deleteDoc = async (doc: File): PromiseReturn<Succeed> => {
  try {
    const res = await requestUrl({
      url: `http://localhost:5984/files/_purge`,
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa("admin:password"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ [doc.id]: [doc.rev] }),
    });

    return { success: true, data: res.json as Succeed };
  } catch (err) {
    if (typeof err === "object" && err !== null && "message" in err && typeof err.message == "string") {
      return { success: false, message: err.message };
    }
    return { success: false, message: "Unexpected error" };
  }
};
