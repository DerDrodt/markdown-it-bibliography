import MdIt from "markdown-it";
import biblio from "./index.js";

const src = `
- [@logic{25}]
- [@logic{vii}]
- [@logic{XIV}]
- [@logic{34--38}]
- [@logic{185/86}]
- [@logic{XI & XV}]
- [@logic{3, 5, 7}]
- [@logic{vii-x; 5, 7}]
- [-@logic{25}]
- [-@logic{vii}]
- [-@logic{XIV}]
- [-@logic{34--38}]
- [-@logic{185/86}]
- [-@logic{XI & XV}]
- [-@logic{3, 5, 7}]
- [-@logic{vii-x; 5, 7}]

- [@logic{25]
- [@logic{See{25]]
`;
const mdIt = MdIt().use(biblio("test/fixtures/Autocite.bib"));
const res = mdIt.render(src);
console.log(res);
