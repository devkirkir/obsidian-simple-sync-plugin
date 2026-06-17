interface Succeed<T = unknown> {
  success: true;
  data: T;
}

interface Failed {
  success: false;
  message?: string;
}

export type PromiseReturn<T> = Promise<Succeed<T> | Failed>;
