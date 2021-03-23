import MdIt from "markdown-it";
import biblio, { parseXml } from "./index.js";

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
//console.log(res);

const vancouver = `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="sort-only" page-range-format="minimal">
  <info>
    <title>Vancouver</title>
    <id>http://www.zotero.org/styles/vancouver</id>
    <link href="http://www.zotero.org/styles/vancouver" rel="self"/>
    <link href="http://www.nlm.nih.gov/bsd/uniform_requirements.html" rel="documentation"/>
    <author>
      <name>Michael Berkowitz</name>
      <email>mberkowi@gmu.edu</email>
    </author>
    <contributor>
      <name>Sean Takats</name>
      <email>stakats@gmu.edu</email>
    </contributor>
    <contributor>
      <name>Sebastian Karcher</name>
    </contributor>
    <category citation-format="numeric"/>
    <category field="medicine"/>
    <summary>Vancouver style as outlined by International Committee of Medical Journal Editors Uniform Requirements for Manuscripts Submitted to Biomedical Journals: Sample References</summary>
    <updated>2014-09-06T16:03:01+00:00</updated>
    <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights>
  </info>
  <locale xml:lang="en">
    <date form="text" delimiter=" ">
      <date-part name="year"/>
      <date-part name="month" form="short" strip-periods="true"/>
      <date-part name="day"/>
    </date>
    <terms>
      <term name="collection-editor" form="long">
        <single>editor</single>
        <multiple>editors</multiple>
      </term>
      <term name="presented at">presented at</term>
      <term name="available at">available from</term>
      <term name="section" form="short">sect.</term>
    </terms>
  </locale>
  <locale xml:lang="fr">
    <date form="text" delimiter=" ">
      <date-part name="day"/>
      <date-part name="month" form="short" strip-periods="true"/>
      <date-part name="year"/>
    </date>
  </locale>
  <macro name="author">
    <names variable="author">
      <name sort-separator=" " initialize-with="" name-as-sort-order="all" delimiter=", " delimiter-precedes-last="always"/>
      <label form="long" prefix=", "/>
      <substitute>
        <names variable="editor"/>
      </substitute>
    </names>
  </macro>
  <macro name="editor">
    <names variable="editor" suffix=".">
      <name sort-separator=" " initialize-with="" name-as-sort-order="all" delimiter=", " delimiter-precedes-last="always"/>
      <label form="long" prefix=", "/>
    </names>
  </macro>
  <macro name="chapter-marker">
    <choose>
      <if type="chapter paper-conference entry-dictionary entry-encyclopedia" match="any">
        <text term="in" text-case="capitalize-first"/>
      </if>
    </choose>
  </macro>
  <macro name="publisher">
    <choose>
      <!--discard publisher info for articles-->
      <if type="article-journal article-magazine article-newspaper" match="none">
        <group delimiter=": " suffix=";">
          <choose>
            <if type="thesis">
              <text variable="publisher-place" prefix="[" suffix="]"/>
            </if>
            <else-if type="speech"/>
            <else>
              <text variable="publisher-place"/>
            </else>
          </choose>
          <text variable="publisher"/>
        </group>
      </if>
    </choose>
  </macro>
  <macro name="access">
    <choose>
      <if variable="URL">
        <group delimiter=": ">
          <text term="available at" text-case="capitalize-first"/>
          <text variable="URL"/>
        </group>
      </if>
    </choose>
  </macro>
  <macro name="accessed-date">
    <choose>
      <if variable="URL">
        <group prefix="[" suffix="]" delimiter=" ">
          <text term="cited" text-case="lowercase"/>
          <date variable="accessed" form="text"/>
        </group>
      </if>
    </choose>
  </macro>
  <macro name="container-title">
    <choose>
      <if type="article-journal article-magazine chapter paper-conference article-newspaper review review-book entry-dictionary entry-encyclopedia" match="any">
        <group suffix="." delimiter=" ">
          <choose>
            <if type="article-journal review review-book" match="any">
              <text variable="container-title" form="short" strip-periods="true"/>
            </if>
            <else>
              <text variable="container-title" strip-periods="true"/>
            </else>
          </choose>
          <choose>
            <if variable="URL">
              <text term="internet" prefix="[" suffix="]" text-case="capitalize-first"/>
            </if>
          </choose>
        </group>
        <text macro="edition" prefix=" "/>
      </if>
      <!--add event-name and event-place once they become available-->
      <else-if type="bill legislation" match="any">
        <group delimiter=", ">
          <group delimiter=". ">
            <text variable="container-title"/>
            <group delimiter=" ">
              <text term="section" form="short" text-case="capitalize-first"/>
              <text variable="section"/>
            </group>
          </group>
          <text variable="number"/>
        </group>
      </else-if>
      <else-if type="speech">
        <group delimiter=": " suffix=";">
          <group delimiter=" ">
            <text variable="genre" text-case="capitalize-first"/>
            <text term="presented at"/>
          </group>
          <text variable="event"/>
        </group>
      </else-if>
      <else>
        <group delimiter=", " suffix=".">
          <choose>
            <if variable="collection-title" match="none">
              <group delimiter=" ">
                <label variable="volume" form="short" text-case="capitalize-first"/>
                <text variable="volume"/>
              </group>
            </if>
          </choose>
          <text variable="container-title"/>
        </group>
      </else>
    </choose>
  </macro>
  <macro name="title">
    <text variable="title"/>
    <choose>
      <if type="article-journal article-magazine chapter paper-conference article-newspaper review review-book entry-dictionary entry-encyclopedia" match="none">
        <choose>
          <if variable="URL">
            <text term="internet" prefix=" [" suffix="]" text-case="capitalize-first"/>
          </if>
        </choose>
        <text macro="edition" prefix=". "/>
      </if>
    </choose>
    <choose>
      <if type="thesis">
        <text variable="genre" prefix=" [" suffix="]"/>
      </if>
    </choose>
  </macro>
  <macro name="edition">
    <choose>
      <if is-numeric="edition">
        <group delimiter=" ">
          <number variable="edition" form="ordinal"/>
          <text term="edition" form="short"/>
        </group>
      </if>
      <else>
        <text variable="edition" suffix="."/>
      </else>
    </choose>
  </macro>
  <macro name="date">
    <choose>
      <if type="article-journal article-magazine article-newspaper review review-book" match="any">
        <group suffix=";" delimiter=" ">
          <date variable="issued" form="text"/>
          <text macro="accessed-date"/>
        </group>
      </if>
      <else-if type="bill legislation" match="any">
        <group delimiter=", ">
          <date variable="issued" delimiter=" ">
            <date-part name="month" form="short" strip-periods="true"/>
            <date-part name="day"/>
          </date>
          <date variable="issued">
            <date-part name="year"/>
          </date>
        </group>
      </else-if>
      <else-if type="report">
        <date variable="issued" delimiter=" ">
          <date-part name="year"/>
          <date-part name="month" form="short" strip-periods="true"/>
        </date>
        <text macro="accessed-date" prefix=" "/>
      </else-if>
      <else-if type="patent">
        <group suffix=".">
          <group delimiter=", ">
            <text variable="number"/>
            <date variable="issued">
              <date-part name="year"/>
            </date>
          </group>
          <text macro="accessed-date" prefix=" "/>
        </group>
      </else-if>
      <else-if type="speech">
        <group delimiter="; ">
          <group delimiter=" ">
            <date variable="issued" delimiter=" ">
              <date-part name="year"/>
              <date-part name="month" form="short" strip-periods="true"/>
              <date-part name="day"/>
            </date>
            <text macro="accessed-date"/>
          </group>
          <text variable="event-place"/>
        </group>
      </else-if>
      <else>
        <group suffix=".">
          <date variable="issued">
            <date-part name="year"/>
          </date>
          <text macro="accessed-date" prefix=" "/>
        </group>
      </else>
    </choose>
  </macro>
  <macro name="pages">
    <choose>
      <if type="article-journal article-magazine article-newspaper review review-book" match="any">
        <text variable="page" prefix=":"/>
      </if>
      <else-if type="book" match="any">
        <text variable="number-of-pages" prefix=" "/>
        <choose>
          <if is-numeric="number-of-pages">
            <label variable="number-of-pages" form="short" prefix=" " plural="never"/>
          </if>
        </choose>
      </else-if>
      <else>
        <group prefix=" " delimiter=" ">
          <label variable="page" form="short" plural="never"/>
          <text variable="page"/>
        </group>
      </else>
    </choose>
  </macro>
  <macro name="journal-location">
    <choose>
      <if type="article-journal article-magazine review review-book" match="any">
        <text variable="volume"/>
        <text variable="issue" prefix="(" suffix=")"/>
      </if>
    </choose>
  </macro>
  <macro name="collection-details">
    <choose>
      <if type="article-journal article-magazine article-newspaper review review-book" match="none">
        <choose>
          <if variable="collection-title">
            <group delimiter=" " prefix="(" suffix=")">
              <names variable="collection-editor" suffix=".">
                <name sort-separator=" " initialize-with="" name-as-sort-order="all" delimiter=", " delimiter-precedes-last="always"/>
                <label form="long" prefix=", "/>
              </names>
              <group delimiter="; ">
                <text variable="collection-title"/>
                <group delimiter=" ">
                  <label variable="volume" form="short"/>
                  <text variable="volume"/>
                </group>
              </group>
            </group>
          </if>
        </choose>
      </if>
    </choose>
  </macro>
  <macro name="report-details">
    <choose>
      <if type="report">
        <text variable="number" prefix="Report No.: "/>
      </if>
    </choose>
  </macro>
  <citation collapse="citation-number">
    <sort>
      <key variable="citation-number"/>
    </sort>
    <layout prefix="(" suffix=")" delimiter=",">
      <text variable="citation-number"/>
    </layout>
  </citation>
  <bibliography et-al-min="7" et-al-use-first="6" second-field-align="flush">
    <layout>
      <text variable="citation-number" suffix=". "/>
      <group delimiter=". " suffix=". ">
        <text macro="author"/>
        <text macro="title"/>
      </group>
      <group delimiter=" " suffix=". ">
        <group delimiter=": ">
          <text macro="chapter-marker"/>
          <group delimiter=" ">
            <text macro="editor"/>
            <text macro="container-title"/>
          </group>
        </group>
        <text macro="publisher"/>
        <group>
          <text macro="date"/>
          <text macro="journal-location"/>
          <text macro="pages"/>
        </group>
      </group>
      <text macro="collection-details" suffix=". "/>
      <text macro="report-details" suffix=". "/>
      <text macro="access"/>
    </layout>
  </bibliography>
</style>
`;

//console.log(parseXml(vancouver));

const readmeExample = `
Here is a citation [@chomsky], one with page info (a.k.a locator) [@chomsky{p. 4}], one with a prefix [@chomsky{See}{p. 4}].

Multiple citations: [@chomsky{p. 4}; @hermanChomsky; @lafeber{Cf.}{xi}]
`;

const readmeExampleText = `
Here is a citation @chomsky, one with page info (a.k.a locator) @chomsky{p. 4}, one with a prefix @chomsky{See}{p. 4}.

Multiple citations: @chomsky{p. 5}; @hermanChomsky; @lafeber{Cf.}{xii}
`;

const mdIt2 = MdIt().use(biblio("readme.bib"));
const res2 = mdIt2.render(readmeExample);
console.log(res2);
const res3 = mdIt2.render(readmeExampleText);
console.log(res3);
