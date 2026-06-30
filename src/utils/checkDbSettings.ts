import { DbData } from "@services";

function checkDbSettings(data: DbData): string[] {
  return Object.entries(data)
    .filter(([_, val]) => val === null)
    .map(([key]) => `Fill '${key}' settings field!`);
}

export default checkDbSettings;
