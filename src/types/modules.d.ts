declare module "locale-*" {
  const locale: any;
  export default locale;
}

declare module "style-*" {
  const style: any;
  export default style;
}

declare module "citeproc" {
  interface Sys {
    retrieveLocale: (lang: string) => any;
    retrieveItem: (id: string | number) => any;
  }

  export interface CiteItem {
    id: string;
    locator?: number | string;
    label?: string;
    prefix?: string;
    suffix?: string;
    "suppress-author"?: boolean;
    "author-only"?: boolean;
  }

  interface Citation {
    citationItems: CiteItem[];
    properties?: {
      noteIndex: number;
    };
    citationID?: string;
    sortedItems?: any;
  }

  type CitationIdNoteNumPair = [string | number, number][];

  interface FormattingParams {
    maxoffset: number;
    entryspacing: number;
    linespacing: number;
    hangingindent: boolean;
    "second-field-align": boolean;
    bibstart: string;
    bibend: string;
    bibliography_errors: any[];
    entry_ids: (string | number)[];
  }

  export interface XMLJson {
    name: string;
    attrs: {
      xmlns: string;
      version: string;
    };
    children: XMLJsonNode[];
  }

  export interface XMLJsonNode {
    name: string;
    attrs: {
      [key: string]: any;
    };
    children: XMLJsonNode[] | string;
  }

  class Engine {
    constructor(sys: Sys, style: any, lang?: any, forceLang?: any);
    updateItems(idList: (string | number)[]): void;
    updateUncitedItems(idList: (string | number)[]): void;
    processCitationCluster(
      citation: Citation,
      citationsPre: CitationIdNoteNumPair,
      citationsPost: CitationIdNoteNumPair,
    ): [any, [number, string, string][]];
    previewCitationCluster(
      citation: Citation,
      citationsPre: CitationIdNoteNumPair,
      citationsPost: CitationIdNoteNumPair,
      format?: "html" | "text" | "rtf",
    ): string;
    makeCitationCluster(idList: (string | number)[]): string;
    makeBibliography(
      filter?: (string | number)[],
    ): [FormattingParams, string[]];
  }
  const CSL: { Engine: typeof Engine; parseXml: (src: string) => XMLJson };
  export default CSL;
}
