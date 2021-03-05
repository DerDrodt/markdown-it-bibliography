export interface CiteItem {
  id: string;
  locator?: number | string;
  label?: string;
  prefix?: string;
  suffix?: string;
  "suppress-auhtor": boolean;
  "author-only": boolean;
}

export interface Citation {
  citationItems: CiteItem[];
  key: string;
  properties?: {
    noteIndex: number;
  };
  citationID?: string;
  sortedItems?: any;
}
