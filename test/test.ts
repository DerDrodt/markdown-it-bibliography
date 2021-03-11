import fs from "fs";
import path from "path";
import MdIt from "markdown-it";
import biblio from "../src/index.js";
import test from "ava";

fs.readdirSync("test/fixtures").forEach((f) => {
  const isBib = path.extname(f) === ".bib";
  if (isBib) return;
  const name = path.basename(f, ".md");
  test(name, (t) => {
    const full = `test/fixtures/${f}`;
    const md = fs.readFileSync(full, "utf-8");
    const bib = full.replace(".md", ".bib");
    const mdIt = MdIt().use(biblio(bib));
    const rendered = mdIt.render(md);
    t.snapshot(rendered);
  });
});
