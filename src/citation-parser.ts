import type { CiteItem } from "citation";
import type { Locale } from "./types/locale";
import type StateInline from "markdown-it/lib/rules_inline/state_inline";
import { getLocator } from "./locator.js";

export const parseCitationItems = (
  state: StateInline,
  start: number,
  max: number,
  labelEnd: number,
  loc: Locale,
  parseLinkLabel: (state: StateInline, start: number) => number,
  renderInline: (text: string) => string,
): [CiteItem[], number] | undefined => {
  const items: CiteItem[] = [];
  let pos = start;
  while (pos < max && pos < labelEnd) {
    const possibleItem = parseCitationItem(
      state,
      pos,
      max,
      loc,
      parseLinkLabel,
      renderInline,
    );
    if (!possibleItem) break;
    const [item, afterItem] = possibleItem;
    items.push(item);
    pos = afterItem;
    if (state.src.charCodeAt(pos) !== 0x3b /* ; */) {
      break;
    }
    pos++;
    while (state.src.charCodeAt(pos) === 0x20 /* SPACE */) {
      pos++;
    }
  }
  if (items.length === 0) return;
  return [items, pos];
};

export const parseCitationItem = (
  state: StateInline,
  start: number,
  max: number,
  loc: Locale,
  parseLinkLabel: (state: StateInline, start: number) => number,
  renderInline: (text: string) => string,
): [CiteItem, number] | undefined => {
  const suppressAuthor = state.src.charAt(start) === "-";
  if (suppressAuthor) start++;
  const possibleKey = parseCitationKey(state, start, max);
  if (!possibleKey) return;
  const [id, posAfterKey] = possibleKey;
  const [prefix, postNote, afterLabel] = parsePreSuffix(
    state,
    posAfterKey,
    parseLinkLabel,
    renderInline,
  );
  const { locator, label, suffix } = postNote
    ? getLocator(postNote, loc)
    : { locator: undefined, label: undefined, suffix: undefined };
  return [
    {
      id,
      prefix,
      locator,
      suffix,
      label,
      "suppress-author": suppressAuthor,
    },
    afterLabel,
  ];
};

export const parseCitationKey = (
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

export const parseCitationLabel = (
  state: StateInline,
  start: number,
  parseLinkLabel: (state: StateInline, start: number) => number,
): [string | undefined, number] => {
  const labelEnd = parseLinkLabel(state, start);
  if (labelEnd < 0) return [undefined, start];
  const label = state.src.substring(start, labelEnd);
  return [label, labelEnd];
};

export const parsePreSuffix = (
  state: StateInline,
  start: number,
  parseLinkLabel: (state: StateInline, start: number) => number,
  renderInline: (text: string) => string,
): [string | undefined, string | undefined, number] => {
  if (state.src.charCodeAt(start) !== 0x5b)
    return [undefined, undefined, start];
  let [suffix, end] = parseCitationLabel(state, start + 1, parseLinkLabel);
  if (state.src.charCodeAt(end + 1) !== 0x5b)
    return [undefined, suffix, end + 1];
  const prefix = suffix ? renderInline(suffix) : undefined;
  [suffix, end] = parseCitationLabel(state, end + 2, parseLinkLabel);

  return [prefix, suffix, end + 1];
};
