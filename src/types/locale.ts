import type { XMLJson } from "xmljson";

export interface Locale extends XMLJson {
  name: "locale";
  attrs: {
    xmlns: string;
    version: string;
    "xml:lang": string;
  };
}
