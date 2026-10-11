import { DocImage, DocList, DocNote, DocSectionBlock } from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

const ASSETS = "/docs/operational-guidelines/search";

export function SearchContent() {
  return (
    <DocSectionBlock id="exclude-from-search" heading="Exclude products from search">
      <DocList ordered>
        <li className="space-y-3">
          <p>Add a tag to the product(s) you want to hide from search.</p>
          <p>
            You can add the tag directly on the product, or through
            export/import.
          </p>
          <DocImage src={`${ASSETS}/chrome_ruoW2mjZHl.png`} alt="Adding a tag to a product" />
        </li>
        <li className="space-y-3">
          <p>Update the search settings to exclude that tag.</p>
          <p>
            Go to <b>Editor &gt; Theme settings &gt; Search Config</b> and add
            the same tag you used on the product.
          </p>
          <DocImage src={`${ASSETS}/chrome_8bC65DBujy.png`} alt="Adding the exclusion tag in search settings" />
          <DocNote>
            This affects: related and recently viewed products on the product
            page, the search bar, the search page, and Google search.
          </DocNote>
        </li>
      </DocList>
    </DocSectionBlock>
  );
}

export const searchArticle: DocArticleMeta = {
  slug: "search",
  title: "Search",
  description: "How to hide specific products from search results.",
  sections: [{ id: "exclude-from-search", heading: "Exclude products from search" }],
};
