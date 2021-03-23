# markdown-it-bibliography

Bibliography and citation plugin for [markdown-it](https://github.com/markdown-it/markdown-it).

Markup is _somewhat_ similar to the [pandoc](http://johnmacfarlane.net/pandoc/README.html#citations) definition.

**Normal citation**:

```md
Here is a citation [@chomsky], one with page info (a.k.a locator) [@chomsky{p. 4}], one with a prefix [@chomsky{See}{p. 4}].

Multiple citations: [@chomsky{p. 4}; @hermanChomsky; @lafeber{Cf.}{xi}]
```

HTML:

```html
<p>
  Here is a citation (Chomsky 2003), one with page info (a.k.a locator) (Chomsky
  2003, 4), one with a prefix (See Chomsky 2003, 4).
</p>
<p>
  Multiple citations: (Chomsky 2003, 4; Herman and Chomsky 1994; Cf. LaFeber
  1983, xi)
</p>
<hr class="bib-sep" />
<section class="bibliography">
  <h3>Bibliography</h3>
  <div class="csl-bib-body">
    <div class="csl-entry">
      Chomsky, Noam. 2003. <i>Necessary Illusions</i>. CBC Massey Lectures.
      House of Anansi Press.
    </div>
    <div class="csl-entry">
      Herman, Edward S., and Noam Chomsky. 1994. <i>Manufacturing Consent</i>.
      Vintage.
    </div>
    <div class="csl-entry">
      LaFeber, Walter. 1983. <i>Inevitable Revolutions</i>. Norton.
    </div>
  </div>
</section>
```

You can suppress the author by adding a `-`:

```md
As LaFeber explained [-@lafeber{p. 84}]
```

It is also possible to create in-text citations by removing the brackets:

```md
Here is a citation @chomsky, one with page info (a.k.a locator) @chomsky{p. 4}, one with a prefix @chomsky{See}{p. 4}.

Multiple citations: @chomsky{p. 5}; @hermanChomsky; @lafeber{Cf.}{xii}
```

HTML:

```html
<p>
  Here is a citation (Chomsky 2003), one with page info (a.k.a locator) (Chomsky
  2003, 4), one with a prefix (See Chomsky 2003, 4).
</p>
<p>
  Multiple citations: Chomsky (2003, 5); Herman and Chomsky (1994); Cf. LaFeber
  (Cf. 1983, xii)
</p>
<hr class="bib-sep" />
<section class="bibliography">
  <h3>Bibliography</h3>
  <div class="csl-bib-body">
    <div class="csl-entry">
      Chomsky, Noam. 2003. <i>Necessary Illusions</i>. CBC Massey Lectures.
      House of Anansi Press.
    </div>
    <div class="csl-entry">
      Herman, Edward S., and Noam Chomsky. 1994. <i>Manufacturing Consent</i>.
      Vintage.
    </div>
    <div class="csl-entry">
      LaFeber, Walter. 1983. <i>Inevitable Revolutions</i>. Norton.
    </div>
  </div>
</section>
```

## Install

```sh
npm install markdown-it-bibliography
# or
yarn add markdown-it-bibliography
```

## Usage

```js
import MdIt from "markdown-it";
import biblio from "markdown-it-bibliography";

const md = MdIt().use(biblio("path-to-bib", options));
```

Where `path-to-bib` is the path to a CSL-JSON or `.bib` file.

The `options` parameter is an optional object. The following options can be set:

| Name          | Type                                                  | Default                                                                           | Explanation                                                                             |
| ------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| style         | `"apa" \| "chicago" \| "mla" \| "vancouver" \| Style` | `"chicago"`                                                                       | The citation and bibliography style as defined by CSL. To get a style object, see below |
| locales       | `{ [key: string]: Locale }`                           | An object containing locales for German, English (US and GB), Spanish, and French | The locales for languages used, as defined by CSL. To get such objects, see below       |
| lang          | `string \| undefined`                                 | `undefined`                                                                       | The language to use as default                                                          |
| defaultLocale | `string \| undefined`                                 | `en-US`                                                                           | The default language to use for locator parsing                                         |

## Locator Parsing

The postnote of a citation is parsed to detect the locator, i.e., the page/chapter/etc. number, and the actual suffix. Here, we take a cue from BibLatex and parse the following things as locators:

- 25
- vii
- XIV
- 34--38
- 185/86
- XI & XV
- 3, 5, 7
- vii-x; 5, 7

The locator has to be the first thing in the postnote.

A locator can contain a label, e.g., `p. xvi` or `ch. 5`. Possible locators are taken from the locale object of the current item's language (or the defaultLocale if there is no current language).

## XML Parsing

To get style or locale objects, it is best to parse the XML files found in the [CSL styles repo](https://github.com/citation-style-language/styles/) and the [CSL locales repo](https://github.com/citation-style-language/locales). For this use the `parseXml` function like this:

```js
import MdIt from "markdown-it";
import biblio, { parseXml } from "markdown-it-bibliography";

const myCustomLocale = parseXml(/* some xml string */);

const md = MdIt().use(
  biblio("path-to-bib", {
    locales: {
      "en-US": myCustomLocale,
    },
  }),
);
```
