import { requestUrl } from "obsidian";

interface Row {
  id: string;
  value: {
    rev: string;
  };
}

export const removeAllDocs = async () => {
  const res = await requestUrl({
    url: `http://localhost:5984/files/_all_docs`,
    method: "GET",
    headers: {
      Authorization: "Basic " + btoa("admin:password"),
      "Content-Type": "application/json",
    },
  });
  const q = res.json.rows as Row[];

  if (res.status === 200) {
    for (let row of q) {
      await requestUrl({
        url: `http://localhost:5984/files/_purge`,
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa("admin:password"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [row.id]: [row.value.rev] }),
      });
    }
  }
};
