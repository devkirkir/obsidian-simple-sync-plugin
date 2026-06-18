import { ensureDirectory } from "../ensureDirectory";

describe("UTILS/OBSIDIAN: ensureDirectory", () => {
  const makeVault = (existingPaths: string[]) => ({
    createFolder: vi.fn().mockResolvedValue(undefined),
    getAbstractFileByPath: vi.fn((path: string) => (existingPaths.includes(path) ? {} : null)),
  });

  test("creation succeed", async () => {
    const vault = makeVault([]);
    await ensureDirectory({ vault: vault as any })(["a", "b"]);

    expect(vault.getAbstractFileByPath).toHaveBeenCalledTimes(2);
    expect(vault.createFolder).toHaveBeenCalledTimes(2);
    expect(vault.createFolder).toHaveBeenCalledWith("a");
    expect(vault.createFolder).toHaveBeenCalledWith("a/b");
  });

  test("skip first path", async () => {
    const vault = makeVault(["a"]);
    await ensureDirectory({ vault: vault as any })(["a", "b"]);

    expect(vault.getAbstractFileByPath).toHaveBeenCalledTimes(2);
    expect(vault.createFolder).toHaveBeenCalledTimes(1);
    expect(vault.createFolder).toHaveBeenCalledWith("a/b");
  });

  test("skip all", async () => {
    const vault = makeVault(["a", "a/b"]);
    await ensureDirectory({ vault: vault as any })(["a", "b"]);

    expect(vault.getAbstractFileByPath).toHaveBeenCalledTimes(2);
    expect(vault.createFolder).toHaveBeenCalledTimes(0);
  });
});
