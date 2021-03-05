import apa from "style-apa";
import vancouver from "style-vancouver";
import mla from "style-mla";
import chicago from "style-chicago";
import deDE from "locale-de-de";
import enGB from "locale-en-gb";
import enUS from "locale-en-us";
import esES from "locale-es-es";
import frFR from "locale-fr-fr";

export type StyleOption = keyof typeof STYLES;
export type LocaleOption = keyof typeof LOCALES;

export const STYLES = {
  apa: apa,
  chicago: chicago,
  mla: mla,
  vancouver: vancouver,
};

export const LOCALES = {
  de: deDE,
  "de-de": deDE,
  "en-gb": enGB,
  en: enUS,
  "en-us": enUS,
  "es-es": esES,
  fr: frFR,
  "fr-fr": frFR,
};
