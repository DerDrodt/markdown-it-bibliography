import CSL from "citeproc";
import type MdIt from "markdown-it";
import type Token from "markdown-it/lib/token";
import type Renderer from "markdown-it/lib/renderer";
import type ParserInline from "markdown-it/lib/parser_inline";
import type ParserCore from "markdown-it/lib/parser_core";
import type { CSLBibliography } from "./types/bibliography";
import type { Citation } from "./types/citation";
import type { Locale } from "./types/locale";
import type { Style } from "./types/style";
import { parseCitationItems } from "./citation-parser.js";

interface Options {
  style: Style;
  locales: { [key: string]: Locale };
  idToKey?: Map<string, string>;
  lang?: string;
  defaultLocale: string;
}

export default function citations(
  items: CSLBibliography,
  { style, lang, idToKey, locales, defaultLocale }: Options,
) {
  const sys = {
    retrieveLocale: (lang: string) => {
      return locales[lang];
    },
    retrieveItem: (id: string | number) => {
      //if (idToKey) id = idToKey.get(id as string)!;
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
        (env.citations.list as Citation[])
          .map((c) => c.citationItems.map((i) => i.id))
          .flat(),
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
    <h3>Bibliography</h3>
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
      const isNormalAuto =
        state.src.charCodeAt(start) === 0x5b /* [ */ &&
        state.src.charCodeAt(start + 1) === 0x40; /* @ */
      const isSuppressedAuto =
        state.src.charCodeAt(start) === 0x5b /* [ */ &&
        state.src.charCodeAt(start + 1) === 0x2d /* - */ &&
        state.src.charCodeAt(start + 2) === 0x40; /* @ */
      if (!isNormalAuto && !isSuppressedAuto) return false;

      labelStart = start + 1;
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

        const possibleCiteItems = parseCitationItems(
          state,
          labelStart,
          max,
          labelEnd,
          sys,
          defaultLocale,
          parseLinkLabel,
          (text) => md.renderInline(text, { ...state.env, disableBib: true }),
          idToKey,
        );
        if (!possibleCiteItems) return false;

        const [citationItems, afterItems] = possibleCiteItems;

        // TODO: Parse postfix?
        const citeId = state.env.citations.list.length;
        token = state.push("citation_auto", "", 0);
        token.meta = { id: citeId };

        state.env.citations.list[citeId] = {
          citationItems: idToKey
            ? citationItems.map((i) => ({ ...i, id: idToKey.get(i.id) }))
            : citationItems,
          properties: {
            noteIndex: 0,
          },
        };
      }

      state.pos = end;
      state.posMax = max;
      return true;
    };

    const citationBib: ParserCore.RuleCore = (state) => {
      if (
        !state.env.citations ||
        state.env.citations.length === 0 ||
        state.env.disableBib
      ) {
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
