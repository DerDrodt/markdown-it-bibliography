import type { CiteItem } from "./types/citation";
import type { Sys } from "./types/sys";
import type StateInline from "markdown-it/lib/rules_inline/state_inline";
import { getLocator } from "./locator.js";

export const parseCitationItems = (
  state: StateInline,
  start: number,
  max: number,
  labelEnd: number,
  sys: Sys,
  defaultLocale: string,
  renderInline: (text: string) => string,
  idToKey?: Map<string, string>,
): [CiteItem[], number] | undefined => {
  const items: CiteItem[] = [];
  let pos = start;
  while (pos < max && pos < labelEnd) {
    const possibleItem = parseCitationItem(
      state,
      pos,
      max,
      sys,
      defaultLocale,
      renderInline,
      idToKey,
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
  sys: Sys,
  defaultLocale: string,
  renderInline: (text: string) => string,
  idToKey?: Map<string, string>,
): [CiteItem, number] | undefined => {
  const suppressAuthor = state.src.charAt(start) === "-";
  if (suppressAuthor) start++;
  const possibleKey = parseCitationKey(state, start, max);
  if (!possibleKey) return;
  const [id, posAfterKey] = possibleKey;
  const [prefix, postNote, afterLabel] = parsePreSuffix(
    state,
    posAfterKey,
    renderInline,
  );
  const normalizedId = idToKey ? idToKey.get(id)! : id;
  const loc = sys.retrieveLocale(
    sys.retrieveItem(normalizedId).language ?? defaultLocale,
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
): [string | undefined, number] => {
  const labelEnd = parseLinkLabel(state, start);
  if (labelEnd < 0) return [undefined, start];
  const label = state.src.substring(start, labelEnd);
  return [label, labelEnd];
};

export const parsePreSuffix = (
  state: StateInline,
  start: number,
  renderInline: (text: string) => string,
): [string | undefined, string | undefined, number] => {
  if (state.src.charCodeAt(start) !== 0x7b)
    return [undefined, undefined, start];
  let [suffix, end] = parseCitationLabel(state, start + 1);
  if (suffix === undefined) return [undefined, undefined, start];
  if (state.src.charCodeAt(end + 1) !== 0x7b)
    return [undefined, suffix, end + 1];
  const prefix = suffix ? renderInline(suffix) : undefined;
  [suffix, end] = parseCitationLabel(state, end + 2);

  return [prefix, suffix, end + 1];
};

const parseLinkLabel = (
  state: StateInline,
  start: number,
  disableNested: boolean = false,
) => {
  let found = false;
  let marker: number | undefined;
  let prevPos: number | undefined;
  let labelEnd = -1;
  const max = state.posMax;
  const oldPos = state.pos;

  state.pos = start + 1;
  let level = 1;

  while (state.pos < max) {
    marker = state.src.charCodeAt(state.pos);
    if (marker === 0x7d /* } */) {
      level--;
      if (level === 0) {
        found = true;
        break;
      }
    }

    prevPos = state.pos;
    state.md.inline.skipToken(state);
    if (marker === 0x7b /* { */) {
      if (prevPos === state.pos - 1) {
        // increase level if we find text `{`, which is not a part of any token
        level++;
      } else if (disableNested) {
        state.pos = oldPos;
        return -1;
      }
    }
  }

  if (found) {
    labelEnd = state.pos;
  }

  // restore old state
  state.pos = oldPos;

  return labelEnd;
};
