import { DbData } from "@services";

function checkDbSettings(data: DbData): boolean {
  Object.entries(data).forEach(([key, val]) => {
    if (val === null) throw Error(`Fill '${key}' settings field!`);
  });

  return true;
}

export default checkDbSettings;
