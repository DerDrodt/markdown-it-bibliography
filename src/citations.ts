import chicago from "style-chicago";
import CSL from "citeproc";
import enUS from "locale-en-us";
import type MdIt from "markdown-it";
import type Token from "markdown-it/lib/token";
import type Renderer from "markdown-it/lib/renderer";
import type ParserInline from "markdown-it/lib/parser_inline";
import type ParserCore from "markdown-it/lib/parser_core";
import type StateInline from "markdown-it/lib/rules_inline/state_inline";
import type { CSLBibliography } from "./types/bibliography";
import type { Citation } from "./types/citation";
import { LOCALES } from "./const.js";

interface Options {
  style?: any;
  locale?: any;
  idToKey?: Map<string, string>;
  lang?: string;
}

export default function citations(
  items: CSLBibliography,
  { style = chicago, lang }: Options = {},
) {
  const sys = {
    retrieveLocale: (lang: string) => {
      return LOCALES[lang.toLowerCase() as keyof typeof LOCALES];
    },
    retrieveItem: (id: string | number) => {
      return items[id];
    },
  };

  // Create Citeproc and add items
  const citeproc = new CSL.Engine(sys, style, lang);

  const rerenderCitation = (citation: Citation, env: any) => {
    const citations: Citation[] = env.citations.seen;
    const index = citations.findIndex(
      (c) => c.citationID === citation.citationID,
    );
    const background = citations.map(
      (c) => [c.citationID!, c.properties!.noteIndex] as [string, number],
    );

    if (!env.citations.rendered) {
      env.citations.rendered = [];
    }
    env.citations.rendered[index] = citeproc.previewCitationCluster(
      citation,
      background.slice(0, index),
      background.slice(index),
      "text",
    );
  };

  const render_citation_auto: Renderer.RenderRule = (
    tokens: Token[],
    idx: number,
    _options: MdIt.Options,
    env: any,
    _self: Renderer,
  ) => {
    const token = tokens[idx];
    const id = token.meta.id;
    const cit: Citation = env.citations.list[id];
    if (!env.citations.seen) {
      env.citations.seen = [];
      citeproc.updateItems(
        (env.citations.list as Citation[]).map((c) => c.key),
      );
    }
    const prev: Citation[] = env.citations.seen;
    const result = citeproc.processCitationCluster(
      cit,
      prev.map((c) => [c.citationID!, c.properties!.noteIndex]),
      [],
    );

    env.citations.seen.push(cit);
    result[1].forEach(([idx]) => rerenderCitation(prev[idx], env));

    return env.citations.rendered[id] as string;
  };

  const renderBibOpen: Renderer.RenderRule = (_a, _b, options) => {
    return `${
      options.xhtmlOut ? '<hr class="bib-sep" />\n' : '<hr class="bib-sep">\n'
    }<section class="bibliography">
    <h3>Literatur</h3>
`;
  };

  const renderBib: Renderer.RenderRule = () => {
    const bib = citeproc.makeBibliography();
    return `${bib[0].bibstart} ${bib[1].join("")} ${bib[0].bibend}`;
  };

  const renderBibClose: Renderer.RenderRule = () => {
    return "</section>\n";
  };

  function citationsPlugin(md: MdIt) {
    const { parseLinkLabel } = md.helpers;

    md.renderer.rules.citation_auto = render_citation_auto;
    md.renderer.rules.citation_bib = renderBib;
    md.renderer.rules.citation_bib_open = renderBibOpen;
    md.renderer.rules.citation_bib_close = renderBibClose;

    // @key | @key[post] | @key[pre][post]

    // (@key | @key[post] | @key[pre][post])

    // (^@key | ^@key[post] | ^@key[pre][post])

    // [@key] | [@key[post]] | [@key[pre][post]]
    const autoCitation: ParserInline.RuleInline = (state, silent) => {
      let labelStart: number;
      let labelEnd: number;
      let token: Token;
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
          key: citeKey,
        };
      }

      state.pos = end;
      state.posMax = max;
      return true;
    };

    const citationBib: ParserCore.RuleCore = (state) => {
      if (!state.env.citations || state.env.citations.length === 0) {
        return false;
      }

      const open = new state.Token("citation_bib_open", "", 1);
      state.tokens.push(open);
      const inner = new state.Token("citation_bib", "", 1);
      state.tokens.push(inner);
      const close = new state.Token("citation_bib_close", "", 1);
      state.tokens.push(close);

      return true;
    };

    md.inline.ruler.after("image", "citation_auto", autoCitation);
    md.core.ruler.after("inline", "citation_bib", citationBib);
  }

  return citationsPlugin;
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
