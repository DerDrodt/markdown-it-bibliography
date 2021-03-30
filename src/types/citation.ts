export interface CiteItem {
  id: string;
  locator?: number | string;
  label?: string;
  prefix?: string;
  suffix?: string;
  "suppress-author"?: boolean;
  "author-only"?: boolean;
}

export interface Citation {
  citationItems: CiteItem[];
  properties?: {
    noteIndex: number;
    mode?: "author-only" | "suppress-author" | "composite";
    isPartOfInTextCitation?: boolean;
  };
  citationID?: string;
  sortedItems?: any;
}
