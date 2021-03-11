import type { CSLEntry } from "biblatex-csl-converter-ts";
import type { Style } from "./style";
import type { Locale } from "./locale";
import type { StyleStringOption } from "../const.js";

export interface CSLBibliography {
  [key: string]: CSLEntry;
}

export interface Options {
  style?: StyleStringOption | Style;
  locales?: { [key: string]: Locale };
  lang?: string;
  defaultLocale?: string;
}

export enum Format {
  Biblatex,
  CSLJson,
}
