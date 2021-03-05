import type { CSLEntry } from "biblatex-csl-converter-ts";
import type { LocaleOption, StyleOption } from "../const.js";

export interface CSLBibliography {
  [key: string]: CSLEntry;
}

export interface Options {
  style?: StyleOption;
  locale?: LocaleOption;
  lang?: string;
}

export enum Format {
  Biblatex,
  CSLJson,
}
