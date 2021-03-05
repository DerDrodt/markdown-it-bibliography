import chicago from "style-chicago";
import CSL from "citeproc";
import enUS from "locale-en-us";
import type MdIt from "markdown-it";
import type Token from "markdown-it/lib/token";
import type Renderer from "markdown-it/lib/renderer";
import type ParserInline from "markdown-it/lib/parser_inline";
import type StateInline from "markdown-it/lib/rules_inline/state_inline";
import type { CSLBibliography } from "./types/bibliography";
import type { Citation } from "./types/citation";

interface Options {
  style?: any;
  locale?: any;
  idToKey?: Map<string, string>;
}

export default function citations(
  items: CSLBibliography,
  { style = chicago, locale = enUS, idToKey }: Options = {},
): [string[], string[][]] {
  const sys = {
    retrieveLocale: () => locale,
    retrieveItem: (id: string) => items[id],
  };

  // Create Citeproc and add items
  const citeproc = new CSL.Engine(sys, style);
  citeproc.updateItems(Object.keys(items));

  // Create citations
  const citations = Object.entries(items)
    .map(([key, val]) => [key, citeproc.makeCitationCluster([val])])
    .reduce(
      (acc, val) =>
        Object.assign(acc, {
          [val[0]]: val[1],
        }),
      {},
    );

  console.log(citations);

  // Create bibliography
  const bibliography = citeproc.makeBibliography();
  const ids = bibliography[0].entry_ids.map((ids: string[]) =>
    ids.join(""),
  ) as string[];
  const bib = bibliography[1].map((str: string) =>
    str
      .trim()
      .replace(/<div[^>]+>/g, "")
      .replace(/<\/div>/g, "")
      .replace(/<\/i>/g, "<i>")
      .split("<i>")
      .map((item, i) =>
        i % 2 === 0
          ? {
              type: "text",
              value: item,
            }
          : {
              type: "emphasis",
              children: [{ type: "text", value: item }],
            },
      ),
  ) as Array<Array<string>>;

  return [ids, bib];
}

const getCitationKey = (
  state: StateInline,
  start: number,
  max: number,
): [string, number] | undefined => {
  if (start + 1 >= max) return undefined;
  if (state.src.charCodeAt(start) !== 0x40 /* @ */) return undefined;
  if (!/[\w\d_]/.test(state.src.charAt(start + 1))) return undefined;
  let pos = start + 1;
  let key = "";
  while (pos < max && /[\w\d_:.#$%&-+?<>~/]/.test(state.src.charAt(pos))) {
    key += state.src.charAt(pos);
    pos++;
  }

  return [key, pos];
};

const render_citation_auto: Renderer.RenderRule = (
  tokens: Token[],
  idx: number,
  options: MdIt.Options,
  env: any,
  self: Renderer,
) => {
  const token = tokens[idx];
  const id = token.meta.id;
  const cit: Citation = env.citations.list[id];
  const item = cit.citationItems[0];

  return `[[key: ${item.id}, label: ${item.label}, locator: ${item.locator}, prefix: ${item.prefix}, suffix: ${item.suffix}]]`;
};

export function citationsPlugin(md: MdIt) {
  const { parseLinkLabel } = md.helpers;

  md.renderer.rules.citation_auto = render_citation_auto;

  // @key | @key[post] | @key[pre][post]
  const textCitation: ParserInline.RuleInline = (state, silent) => {
    return true;
  };

  // (@key | @key[post] | @key[pre][post])
  const parenCitation: ParserInline.RuleInline = (state, silent) => {
    return true;
  };

  // (^@key | ^@key[post] | ^@key[pre][post])
  const footCitation: ParserInline.RuleInline = (state, silent) => {
    return true;
  };

  // [@key] | [@key[post]] | [@key[pre][post]]
  const autoCitation: ParserInline.RuleInline = (state, silent) => {
    let labelStart: number;
    let labelEnd: number;
    let token: Token;
    let tokens: Token[];
    const { posMax: max, pos: start } = state;

    if (start + 2 >= max) return false;
    if (state.src.charCodeAt(start) !== 0x5b /* [ */) return false;
    if (state.src.charCodeAt(start + 1) !== 0x40 /* @ */) return false;

    labelStart = start + 2;
    labelEnd = parseLinkLabel(state, start);

    // parser failed to find ']', so it's not a valid citation
    if (labelEnd < 0) return false;

    // We found the end of the link, and know for a fact it's a valid link

    let end = labelEnd + 1;

    if (!silent) {
      if (!state.env.citations) {
        state.env.citations = {};
      }
      if (!state.env.citations.list) {
        state.env.citations.list = [];
      }

      const potentialKey = getCitationKey(state, start + 1, max);
      if (potentialKey === undefined) return false;
      const [citeKey, keyEnd] = potentialKey;

      let prefixString: string | undefined = undefined;
      let suffixString: string | undefined = undefined;
      let afterKey = keyEnd;
      if (state.src.charCodeAt(keyEnd) === 0x5b /* [ */) {
        const labelEnd = parseLinkLabel(state, keyEnd + 1);
        if (labelEnd < 0) return false;
        suffixString = state.src.substring(keyEnd + 1, labelEnd);
        afterKey = labelEnd + 1;
        if (state.src.charCodeAt(labelEnd + 1) === 0x5b /* [ */) {
          const innerLabelEnd = parseLinkLabel(state, labelEnd + 2);
          if (innerLabelEnd < 0) return false;
          prefixString = suffixString;
          suffixString = state.src.substring(labelEnd + 2, innerLabelEnd);
          afterKey = innerLabelEnd + 1;

          prefixString = state.md.renderInline(prefixString);
        }
      }

      // TODO: Lists

      // TODO: Parse postfix?
      const citeId = state.env.citations.list.length;
      token = state.push("citation_auto", "", 0);
      token.meta = { id: citeId };

      state.env.citations.list[citeId] = {
        // TODO
        citationItems: [
          {
            id: citeKey,
            locator: suffixString,
            prefix: prefixString,
            label: "page",
          },
        ],
        properties: {
          noteIndex: 0,
        },
      };
    }

    state.pos = end;
    state.posMax = max;
    console.log(state.src.charAt(end), state.env);
    return true;
  };

  md.inline.ruler.after("image", "citation_auto", autoCitation);
}
