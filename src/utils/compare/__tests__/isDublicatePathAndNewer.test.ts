import { BulkDoc } from "@services";
import isDublicatePathAndNewer from "../isDublicatePathAndNewer";

describe("UTILS/COMPARE: isDublicatePathAndNewer", () => {
  const existingRow: BulkDoc = {
    _id: "1",
    _rev: "1",
    content: "",
    extension: "",
    name: "",
    updatedAt: 111,
    path: "test/test.md",
  };

  test("is dublicate", () => {
    const newRow: BulkDoc = {
      _id: "1",
      _rev: "1",
      content: "",
      extension: "",
      name: "",
      updatedAt: 222,
      path: "test/test.md",
    };

    const result = isDublicatePathAndNewer(existingRow, newRow);

    expect(result).toBe(true);
  });

  test("is dublicate but same updatedAt", () => {
    const result = isDublicatePathAndNewer(existingRow, existingRow);

    expect(result).toBe(false);
  });

  test("is not dublicate", () => {
    const existingRow = undefined;

    const newRow: BulkDoc = {
      _id: "1",
      _rev: "1",
      content: "",
      extension: "",
      name: "",
      updatedAt: 222,
      path: "qqq/test.md",
    };

    const result = isDublicatePathAndNewer(existingRow, newRow);

    expect(result).toBe(false);
  });
});
