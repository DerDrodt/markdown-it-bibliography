import apa from "style-apa";
import vancouver from "style-vancouver";
import mla from "style-mla";
import chicago from "style-chicago";
import deDE from "locale-de-de";
import enGB from "locale-en-gb";
import enUS from "locale-en-us";
import esES from "locale-es-es";
import frFR from "locale-fr-fr";

import type { Style } from "./types/style";
import type { Locale } from "./types/locale";

export type StyleStringOption = keyof typeof STYLES;
export type LocaleStringOption = keyof typeof LOCALES;

export const STYLES = {
  apa: apa as Style,
  chicago: chicago as Style,
  mla: mla as Style,
  vancouver: vancouver as Style,
};

export const LOCALES = {
  de: deDE as Locale,
  "de-DE": deDE as Locale,
  "en-GB": enGB as Locale,
  en: enUS as Locale,
  "en-US": enUS as Locale,
  "es-ES": esES as Locale,
  fr: frFR as Locale,
  "fr-FR": frFR as Locale,
};
