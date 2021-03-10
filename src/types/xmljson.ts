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
