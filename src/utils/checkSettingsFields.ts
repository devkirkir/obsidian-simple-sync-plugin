import { DbData } from "@services";
import { Notice } from "obsidian";

function checkSettingsFields(data: DbData): string[] {
  return Object.entries(data)
    .filter(([_, val]) => val === null)
    .map(([key]) => {
      const error = `Fill '${key}' settings field!`;
      new Notice(error);

      return error;
    });
}

export default checkSettingsFields;
