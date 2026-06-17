import services, { type ChangesSucceed } from "@services";
import { PromiseReturn } from "@/types";

type Success = Omit<ChangesSucceed, "pending">;

async function sync(lastSeq: string | number): PromiseReturn<Success> {
  const isSynced = await services().changes(lastSeq);
  if (!isSynced.success) return isSynced;

  return { success: true, data: { last_seq: isSynced.data.last_seq, results: isSynced.data.results } };
}

export default sync;
