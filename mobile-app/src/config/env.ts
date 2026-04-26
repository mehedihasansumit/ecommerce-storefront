import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

// `extra` field from app.config.ts (set per build in eas.json)
export const API_BASE_URL: string =
  (extra.apiBaseUrl as string) ?? "http://localhost:3000";

export const BAKED_STORE_DOMAIN: string = (extra.storeDomain as string) ?? "";

export const EAS_PROJECT_ID: string =
  (extra.eas?.projectId as string) ?? "";
