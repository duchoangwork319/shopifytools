import { DocImagePlaceholder, DocList, DocNote, DocSectionBlock, DocSubHeading } from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

export function CollectionBannerContent() {
  return (
    <>
      <DocSectionBlock id="where-it-appears" heading="Where it appears">
        <p>
          Just below the breadcrumb trail on a collection page. It shows the
          collection's title and description, and can also show a row of
          quick links to related collections.
        </p>
        <DocImagePlaceholder label="the banner on a collection page, with title, description, and related links" />
      </DocSectionBlock>

      <DocSectionBlock id="settings" heading="Settings">
        <DocList>
          <li><b>Enable</b> — turns the whole banner on or off.</li>
        </DocList>
        <DocNote>
          The title and description shown here come from the collection's own
          title and description (edit them from the collection itself in
          Shopify admin, not from this section). If you add an image at the
          very start of the collection's description, it's used as a
          background image behind the title.
        </DocNote>
      </DocSectionBlock>

      <DocSectionBlock id="related-collection-links" heading="Related Collection Links">
        <p>
          Add one or more of these to show a row of quick links underneath
          the banner.
        </p>
        <DocSubHeading>Each set of links has</DocSubHeading>
        <DocList>
          <li><b>Title</b> — a tooltip shown when hovering the links (not visible text on the page).</li>
          <li><b>Links</b> — pick a menu (link list) whose links will be displayed, in that menu's order.</li>
          <li><b>Show in Collections</b> — choose which collection(s) this set of links should appear on.</li>
        </DocList>
        <p>
          A link automatically appears bold/active when it points to the
          collection the shopper is currently viewing.
        </p>
      </DocSectionBlock>
    </>
  );
}

export const collectionBannerArticle: DocArticleMeta = {
  slug: "collection-banner",
  title: "Collection Banner",
  description: "The title, description, and quick links shown at the top of a collection page.",
  sections: [
    { id: "where-it-appears", heading: "Where it appears" },
    { id: "settings", heading: "Settings" },
    { id: "related-collection-links", heading: "Related Collection Links" },
  ],
};
