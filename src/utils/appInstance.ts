import SimpleSyncPlugin from "@/main";

let _app: SimpleSyncPlugin | undefined;

export function initAppInstance(app: SimpleSyncPlugin) {
  _app = app;
}

export function getAppInstance() {
  return _app;
}
