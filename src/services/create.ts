import { requestUrl } from "obsidian";
import { v4 as uuidv4 } from "uuid";
import { Doc, PromiseReturn } from "@/types";
import { DbData } from "@services";
import ServiceError from "@utils/errors";

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
        throw new ServiceError("Conflict docs. Need update", res.status);
      }

      if (res.status !== 201 && res.json) {
        const json = res.json as Record<string, unknown>;
        const reason = (typeof json?.reason === "string" && json.reason) || "DB Error";

        throw new ServiceError(reason, res.status);
      }

      return { success: true, data: res.json as Succeed };
    } catch (err) {
      if (err instanceof ServiceError) {
        return { success: false, message: err.message };
      }

      if (err instanceof Error) {
        return { success: false, message: err.message };
      }

      return { success: false, message: "Unexpected error" };
    }
  };
