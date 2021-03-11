import type { Locale } from "./locale";
import type { CSLEntry } from "biblatex-csl-converter-ts";

export interface Sys {
  retrieveLocale: (lang: string) => Locale;
  retrieveItem: (id: string | number) => CSLEntry;
}
