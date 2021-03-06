import path from "path";
import fs from "fs";
import chicago from "style-chicago";
import citeproc from "citeproc";
import { BibLatexParser, CSLExporter } from "biblatex-csl-converter-ts";
import { STYLES, LOCALES } from "./const.js";
import { CSLBibliography, Format, Options } from "./types/bibliography.js";
import citations from "./citations.js";
import type { Style } from "./types/style";
import type { Locale } from "./types/locale";
import type { XMLJson } from "./types/xmljson";

// import MdIt from "markdown-it";

const getFormat = (pathToBib: string) => {
  const extname = path.extname(pathToBib);
  if (extname === ".bib") {
    return Format.Biblatex;
  }
  if (extname === ".json") {
    return Format.CSLJson;
  }
  throw new Error(`Unknown bibliohgraphy extension: ${extname}`);
};

const readFile = (pathToBib: string) => {
  return fs.readFileSync(pathToBib, "utf-8");
};

const cslFromBibLatex = (
  biblatex: string,
): [CSLBibliography, Map<string, string>] => {
  const parsed = new BibLatexParser(biblatex).parse();
  for (const error of parsed.errors) {
    throw new Error(
      `Encountered error while parsing biblatex: ${JSON.stringify(error)}`,
    );
  }
  const idToKey = new Map<string, string>();
  for (const id in parsed.entries) {
    idToKey.set(parsed.entries[id].entry_key, id);
  }
  const csl = new CSLExporter(parsed.entries).parse();
  for (const id in csl) {
    csl[id].title = (csl[id].title as string).replace(
      /<span class="nocase">(\w)<\/span>/g,
      "$1",
    );
    csl[id].title = (csl[id].title as string).replace(
      /[“”]/g,
      csl[id].type === "book" ? '"' : "'",
    );
  }
  return [csl, idToKey];
};

const cslFromJson = (
  json: string,
): [CSLBibliography, Map<string, string> | undefined] => {
  let parsed = JSON.parse(json);
  if (Array.isArray(parsed)) {
    const res: CSLBibliography = {};
    for (const i of parsed) {
      res[i.id] = i;
    }
    parsed = res;
  }
  return [parsed, undefined];
};

const getCSLJson = (
  pathToBib: string,
  format: Format,
): [CSLBibliography, Map<string, string> | undefined] => {
  const content = readFile(pathToBib);
  return format === Format.Biblatex
    ? cslFromBibLatex(content)
    : cslFromJson(content);
};

export default function bibliography(
  pathToBib: string,
  {
    style = chicago,
    locales = LOCALES,
    lang,
    defaultLocale = "en-US",
  }: Options = {},
) {
  const format = getFormat(pathToBib);
  const [csl, idToKey] = getCSLJson(pathToBib, format);

  for (const id in csl) {
    const entry = csl[id];
    // ugly hack
    if (
      "original-date" in entry &&
      entry["original-date"]["date-parts"].length === 2
    ) {
      const newId = `author_only_${id}`;
      if (newId in csl)
        throw new Error(
          `${newId} and ${id} cannot both be keys when ${id} uses a date range for original-date`,
        );
      csl[newId] = { ...entry, "original-date": undefined, id: newId };
    }
  }

  let cslStyle: Style;
  if (typeof style === "object") cslStyle = style;
  else if (style in STYLES) cslStyle = STYLES[style];
  else throw new Error(`Unknown style: ${style}`);

  return citations(csl, {
    style: cslStyle,
    idToKey,
    locales,
    lang,
    defaultLocale,
  });
}

const parseXml = citeproc.parseXml as (src: string) => XMLJson;

export { parseXml, Style, Locale };
