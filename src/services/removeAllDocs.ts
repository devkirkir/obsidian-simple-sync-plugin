import { DbData } from "@services";
import { requestUrl } from "obsidian";

interface Row {
  id: string;
  value: {
    rev: string;
  };
}

export const removeAllDocs = (dbData: DbData) => async () => {
  const res = await requestUrl({
    url: `${dbData.url}/_all_docs`,
    method: "GET",
    headers: {
      Authorization: "Basic " + btoa(dbData.credentials!),
      "Content-Type": "application/json",
    },
  });
  const q = res.json.rows as Row[];

  if (res.status === 200) {
    for (let row of q) {
      await requestUrl({
        url: `${dbData.url}/_purge`,
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(dbData.credentials!),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [row.id]: [row.value.rev] }),
      });
    }
  }
};
