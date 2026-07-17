import { DbData } from "@services";

function checkSettingsFields(data: DbData): string[] {
  return Object.entries(data)
    .filter(([_, val]) => val === null || val === "")
    .map(([key]) => `Fill '${key}' settings field!`);
}

export default checkSettingsFields;
