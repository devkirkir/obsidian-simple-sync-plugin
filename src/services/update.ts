import { requestUrl } from "obsidian";
import { DocWithRev, File, PromiseReturn } from "@/types";

interface Succeed {
  ok: true;
  id: string;
  rev: string;
}

export const update = async (body: DocWithRev, localFile: File): PromiseReturn<Succeed> => {
  try {
    const res = await requestUrl({
      url: `http://localhost:5984/files/${localFile.id}`,
      method: "PUT",
      headers: {
        Authorization: "Basic " + btoa("admin:password"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      throw: false,
    });

    if (res.status === 409) {
      throw Error("Conflict docs. Need update");
    }

    return { success: true, data: res.json as Succeed };
  } catch (err) {
    if (typeof err === "object" && err !== null && "message" in err && typeof err.message == "string") {
      return { success: false, message: err.message };
    }
    return { success: false, message: "Unexpected error" };
  }
};
