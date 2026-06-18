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

export interface File {
  id: string;
  rev: string;
  isSync: boolean;
  updatedAt: number;
}
