import { Bulk } from "@services";

import { Files } from "@usecases/sync";
import resolvePendingDocs from "@utils/resolvePendingDocs";

describe("UTILS: resolvePendingDocs", () => {
  test("synced new file", () => {
    const bulk: Bulk = {
      results: [
        {
          id: "id1",
          docs: [
            {
              ok: {
                name: "title",
                extension: ".md",
                path: "title.md",
                content: "",
                updatedAt: 222,
                _id: "id1",
                _rev: "rev1",
              },
            },
          ],
        },
      ],
    };

    const result = resolvePendingDocs(bulk, {});

    expect(result).toEqual(
      new Map([
        [
          "title.md",
          { name: "title", extension: ".md", path: "title.md", content: "", updatedAt: 222, _id: "id1", _rev: "rev1" },
        ],
      ]),
    );
  });

  test("duplicate paths in bulk and replacement with a newer one", () => {
    const bulk: Bulk = {
      results: [
        {
          id: "id1",
          docs: [
            {
              ok: {
                name: "title",
                extension: ".md",
                path: "title.md",
                content: "",
                updatedAt: 222,
                _id: "id1",
                _rev: "rev1",
              },
            },
          ],
        },
        {
          id: "id2",
          docs: [
            {
              ok: {
                name: "title",
                extension: ".md",
                path: "title.md",
                content: "",
                updatedAt: 333,
                _id: "id2",
                _rev: "rev2",
              },
            },
          ],
        },
      ],
    };

    const result = resolvePendingDocs(bulk, {});

    expect(result).toEqual(
      new Map([
        [
          "title.md",
          { name: "title", extension: ".md", path: "title.md", content: "", updatedAt: 333, _id: "id2", _rev: "rev2" },
        ],
      ]),
    );
  });
});
