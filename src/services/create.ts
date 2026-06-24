import { requestUrl } from "obsidian";
import { v4 as uuidv4 } from "uuid";
import { Doc, PromiseReturn } from "@/types";
import { DbData } from "@services";

interface Succeed {
  ok: true;
  id: string;
  rev: string;
}

export const create =
  (dbData: DbData) =>
  async (body: Doc): PromiseReturn<Succeed> => {
    try {
      const id = uuidv4();

      const res = await requestUrl({
        url: `${dbData.url}/${id}`,
        method: "PUT",
        headers: {
          Authorization: "Basic " + btoa(dbData.credentials!),
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
      if (err instanceof Error) {
        return { success: false, message: err.message };
      }

      if (typeof err === "object" && err !== null && "message" in err && typeof err.message == "string") {
        return { success: false, message: err.message };
      }

      return { success: false, message: "Unexpected error" };
    }
  };
