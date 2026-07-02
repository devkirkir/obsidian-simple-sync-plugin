interface Succeed<T = unknown> {
  success: true;
  data: T;
}

interface Failed {
  success: false;
  message?: string;
}

export type PromiseReturn<T> = Promise<Succeed<T> | Failed>;

export interface Doc {
  name: string;
  extension: string;
  path: string;
  content: string;
  updatedAt: number;
}

export interface DocWithRev extends Doc {
  _rev: string;
}

export interface File {
  id: string;
  rev: string;
  updatedAt: number;
}

export type UnsyncedFilesEvents = "create" | "update" | "purge";

export interface UnsyncedFile {
  id?: string;
  rev?: string;
  updatedAt: number;
  event: UnsyncedFilesEvents;
}

export type Files = Record<string, File>;
export type UnsyncedFiles = Record<string, UnsyncedFile>;
