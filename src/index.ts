import path from "path";
import fs from "fs";
import { BibLatexParser, CSLExporter } from "biblatex-csl-converter-ts";
import { STYLES, LOCALES } from "./const.js";
import { CSLBibliography, Format, Options } from "./types/bibliography.js";
import citations from "./citations.js";

import MdIt from "markdown-it";

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
    idToKey.set(id, parsed.entries[id].entry_key);
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
  { style = "chicago", locale = "en-us", lang }: Options = {},
) {
  const format = getFormat(pathToBib);
  const [csl, idToKey] = getCSLJson(pathToBib, format);

  const cslStyle = STYLES[style];
  const cslLocale = LOCALES[locale];

  return citations(csl, cslLocale, {
    style: cslStyle,
    idToKey,
    lang,
  });
}

//console.log(bibliography("essay.bib", { locale: "de" }));
// console.log(bibliography("essay.json", { locale: "de" }));

const md = MdIt().use(
  bibliography("essay.json", { locale: "de", lang: "de", style: "chicago" }),
);

const example = `
# Hello

Example cit: [@klein[Siehe *weiter*][§ 44--48, 113 & 204 für weitere Details]]

[@logic[44]]

[@onFrazer]

[@onFrazer; @logic[44]; @klein[Siehe *weiter*][44--48, 113, 204]; @memoir]
`;

const out = md.render(example);

console.log(out);
