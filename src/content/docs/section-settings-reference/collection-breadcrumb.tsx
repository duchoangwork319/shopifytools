import { DocImage, DocList, DocNote, DocSectionBlock } from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

export function CollectionBreadcrumbContent() {
  return (
    <>
      <DocSectionBlock id="where-it-appears" heading="Where it appears">
        <p>
          At the very top of a collection (product listing) page, above the
          banner. It shows a short trail like "Home / All products / Men's
          Running" so shoppers can see where they are and get back to the
          homepage or the full catalog quickly.
        </p>
        <DocImage src="/docs/page-section-mapping/product-listing-page/chrome_zCNFwtMgdv.png" alt="the breadcrumb trail at the top of a collection page" />
        {/* <DocImagePlaceholder label="the breadcrumb trail at the top of a collection page" /> */}
      </DocSectionBlock>

      <DocSectionBlock id="settings" heading="Settings">
        <DocList>
          <li><b>Enable</b> — turns the breadcrumb trail on or off.</li>
          <li><b>Use custom hierarchy</b> — off by default. See below for what each option shows.</li>
        </DocList>
      </DocSectionBlock>

      <DocSectionBlock id="default-trail" heading="Default trail (Use custom hierarchy off)">
        <p>Shows a fixed trail built from the collection being viewed:</p>
        <DocList ordered>
          <li><b>Home</b> — always first, links to the homepage.</li>
          <li>
            <b>All products</b> — links to the full catalog. Skipped if the
            collection being viewed already is "All products" (shown only
            when that's turned on in your store's general settings).
          </li>
          <li>
            The current <b>collection's name</b> — shown as plain text (not
            a link), since it's the page the shopper is already on.
          </li>
          <li>
            If the shopper arrived by filtering with tags, the trail ends
            with those <b>tag names</b> instead of the collection name.
          </li>
        </DocList>
      </DocSectionBlock>

      <DocSectionBlock id="custom-hierarchy" heading="Custom hierarchy (Use custom hierarchy on)">
        <p>
          Instead of the fixed trail above, this builds the breadcrumb from
          your store's actual navigation structure — so it can show, for
          example, a parent collection the shopper came through, rather than
          always just "Home / All products".
        </p>
        <DocNote>
          This only works for a store set up with that navigation structure
          in place. If your store doesn't use it, leave this setting off and
          use the default trail instead.
        </DocNote>
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
    { id: "default-trail", heading: "Default trail (Use custom hierarchy off)" },
    { id: "custom-hierarchy", heading: "Custom hierarchy (Use custom hierarchy on)" },
  ],
};
