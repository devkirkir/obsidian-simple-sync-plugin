import { Notice } from "obsidian";
import { changes } from "./changes";
import { create } from "./create";
import { ChangesSucceed } from "./changes";
import { getBulk, BulkDoc, Bulk } from "./getBulk";
import { update } from "./update";
import { purge } from "./purge";
import { getAppInstance } from "@/utils/appInstance";
import checkSettingsFields from "@/utils/checkSettingsFields";

type ServiceFactories = {
  create: typeof create;
  update: typeof update;
  purge: typeof purge;
  changes: typeof changes;
  getBulk: typeof getBulk;
};

export type ServiceTypes = keyof ServiceFactories;

type ServiceRecord = {
  [K in ServiceTypes]: ReturnType<ServiceFactories[K]>;
};

export interface DbData {
  credentials: string | null;
  url: string | null;
}

export default function serviceFactory<T extends ServiceTypes>(type: T): ServiceRecord[T] | false {
  try {
    const appInstance = getAppInstance();
    if (!appInstance) throw Error("App instance is not init");

    const dbData: DbData = {
      ...appInstance.data.db,
      credentials: appInstance.app.secretStorage.getSecret(appInstance.data.db.credentials!),
    };

    const errors = checkSettingsFields(dbData);
    if (errors.length > 0) {
      errors.forEach((errorMessage) => {
        throw Error(errorMessage);
      });
    }

    const services: ServiceRecord = {
      create: create(dbData),
      update: update(dbData),
      purge: purge(dbData),
      changes: changes(dbData),
      getBulk: getBulk(dbData),
    };

    return services[type];
  } catch (err) {
    if (err instanceof Error) {
      new Notice(err.message);
    }

    return false;
  }
}

export type { ChangesSucceed, BulkDoc, Bulk };
