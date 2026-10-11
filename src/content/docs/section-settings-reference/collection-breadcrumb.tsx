import { DocImagePlaceholder, DocList, DocSectionBlock } from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

export function CollectionBreadcrumbContent() {
  return (
    <>
      <DocSectionBlock id="where-it-appears" heading="Where it appears">
        <p>
          At the very top of a collection (product listing) page, above the
          banner. It shows a short trail like "Home / Men's Running" so
          shoppers can see where they are and get back to the homepage
          quickly.
        </p>
        <DocImagePlaceholder label="the breadcrumb trail at the top of a collection page" />
      </DocSectionBlock>

      <DocSectionBlock id="settings" heading="Settings">
        <DocList>
          <li><b>Enable</b> — turns the breadcrumb trail on or off.</li>
          <li><b>Home label</b> — the text used for the first link (defaults to "Home").</li>
          <li><b>Show current collection</b> — adds the current collection's name after the separator.</li>
          <li><b>Separator character</b> — the character shown between "Home" and the collection name (defaults to "/").</li>
        </DocList>
      </DocSectionBlock>
    </>
  );
}

export const collectionBreadcrumbArticle: DocArticleMeta = {
  slug: "collection-breadcrumb",
  title: "Collection Breadcrumb",
  description: "The small navigation trail shown at the top of a collection page.",
  sections: [
    { id: "where-it-appears", heading: "Where it appears" },
    { id: "settings", heading: "Settings" },
  ],
};
