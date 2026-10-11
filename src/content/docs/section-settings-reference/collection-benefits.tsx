import { DocImagePlaceholder, DocList, DocSectionBlock } from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

export function CollectionBenefitsContent() {
  return (
    <>
      <DocSectionBlock id="where-it-appears" heading="Where it appears">
        <p>
          A simple strip at the very bottom of a collection page, highlighting
          three shopping benefits side by side.
        </p>
        <DocImagePlaceholder label="the benefits strip at the bottom of a collection page" />
      </DocSectionBlock>

      <DocSectionBlock id="settings" heading="Settings">
        <p>
          This section has fixed content and no settings to change in the
          editor. It always shows these three benefits, each linking to the
          matching policy page in your store:
        </p>
        <DocList>
          <li><b>Free Shipping</b> — links to your Shipping &amp; delivery page.</li>
          <li><b>Free Returns</b> — links to your Return &amp; exchange page.</li>
          <li><b>Crash Replacement</b> — links to your Crash/damage replacement page.</li>
        </DocList>
      </DocSectionBlock>
    </>
  );
}

export const collectionBenefitsArticle: DocArticleMeta = {
  slug: "collection-benefits",
  title: "Collection Benefits",
  description: "The free shipping, returns, and crash replacement strip at the bottom of a collection page.",
  sections: [
    { id: "where-it-appears", heading: "Where it appears" },
    { id: "settings", heading: "Settings" },
  ],
};
