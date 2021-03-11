import path from "path";
import fs from "fs";
import chicago from "style-chicago";
import { BibLatexParser, CSLExporter } from "biblatex-csl-converter-ts";
import { STYLES, LOCALES } from "./const.js";
import { CSLBibliography, Format, Options } from "./types/bibliography.js";
import citations from "./citations.js";
import type { Style } from "./types/style";

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

//console.log(bibliography("essay.bib", { locale: "de" }));
// console.log(bibliography("essay.json", { locale: "de" }));

/* const md = MdIt().use(
  bibliography("essay.json", { lang: "de", style: "chicago" }),
);

const example = `
# Hello

Example cit: [@klein[Siehe *weiter*][§ 44--48, 113 & 204 für weitere Details]]

[@logic[44]]

[@onFrazer]

[@onFrazer; @logic[44]; @klein[Siehe *weiter*][44--48, 113, 204]; @memoir]

[@logic[25]]
[@logic[vii]]
[@logic[XIV]]
[@logic[34--38]]
[@logic[185/86]]
[@logic[XI & XV]]
[@logic[3, 5, 7]]
[@logic[vii-x; 5, 7]]
`;

const out = md.render(example);

console.log(out); */
