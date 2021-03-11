import type { XMLJsonNode } from "./types/xmljson";
import type { Locale } from "./types/locale";

const possibleLabels = (locale: Locale): { [key: string]: string } => {
  const terms = locale.children.find((c) => c.name === "terms")?.children;
  if (terms === undefined) return {};
  const res: { [key: string]: string } = {};

  for (const term of terms as XMLJsonNode[]) {
    const label = term.attrs.name as string;
    const children = term.children;
    for (const c of children) {
      if (typeof c === "string") {
        if (!(c in res)) res[c] = label;
      } else {
        for (const d of c.children as string) {
          if (!(d in res)) res[d] = label;
        }
      }
    }
  }

  return res;
};

const getLabel = (s: string, loc: Locale): [string | undefined, string] => {
  const possible = possibleLabels(loc);
  let label: string | undefined = undefined;
  let searchTerm = "";
  let i = 0;
  for (const c of s.split("")) {
    searchTerm += c;
    if (searchTerm in possible) {
      label = possible[searchTerm];
      i = searchTerm.length;
    }
  }

  return [label, s.substring(i)];
};

const item = (s: string): [string, string] | false => {
  const re = /^(\d+|[ivxlcdm]+|[IVXLCDM]+)(.*)$/;
  const match = re.exec(s);
  if (!match) return false;
  let [, m, rest] = match;
  rest = rest.trim();
  const double = restOfRange(rest, re, "--");
  const single = restOfRange(rest, re, "-");
  const slash = restOfRange(rest, re, "/");
  if (double) {
    m += double[0];
    rest = double[1];
  } else if (single) {
    m += single[0];
    rest = single[1];
  } else if (slash) {
    m += slash[0];
    rest = slash[1];
  }
  return [m, rest];
};

const restOfRange = (
  s: string,
  re: RegExp,
  rangeSymb: string,
): [string, string] | false => {
  const rre = new RegExp(`^${rangeSymb}[\\diIvVxXlLcCdDmM]`);
  if (rre.test(s)) {
    let m = "–";
    s = s.substring(rangeSymb.length);
    const match2 = re.exec(s);
    if (!match2) return false;
    let [, m2, r] = match2;
    m += m2;
    r = r.trim();
    return [m, r];
  }
  return false;
};

const items = (s: string): [string, string] | false => {
  let possibleItem = item(s);
  if (!possibleItem) return false;
  let [i, r] = possibleItem;
  while (r[0] === "," || r[0] === ";" || r[0] === "&") {
    const sep = r[0] === "&" ? " &" : r[0];
    const oldR = r;
    r = r.substring(1).trim();
    const pi = item(r);
    if (pi) {
      i += `${sep} ${pi[0]}`;
      r = pi[1];
    } else {
      r = oldR;
      return [i, r];
    }
  }
  return [i, r];
};

export const getLocator = (s: string, loc: Locale) => {
  let [label, afterLabel] = getLabel(s, loc);
  const is = items(afterLabel.trim());
  let locator: string | undefined;
  let suffix: string | undefined;
  if (is) {
    [locator, suffix] = is;
  }
  return { label, locator, suffix };
};
