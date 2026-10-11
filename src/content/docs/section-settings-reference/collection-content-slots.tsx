import { DocNote, DocSectionBlock } from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

export function CollectionContentSlotsContent() {
  return (
    <>
      <DocSectionBlock id="where-it-appears" heading="Where it appears">
        <p>
          Below the product grid on a collection page. It automatically shows
          extra written content that's already linked to that collection —
          for example background text about the collection for shoppers (and
          search engines) to read.
        </p>
      </DocSectionBlock>

      <DocSectionBlock id="settings" heading="Settings">
        <p>
          There's nothing to configure in this section itself — it simply
          displays whatever content has already been linked to the
          collection elsewhere.
        </p>
        <DocNote>
          If a collection has no linked content, this section doesn't show
          anything.
        </DocNote>
      </DocSectionBlock>
    </>
  );
}

export const collectionContentSlotsArticle: DocArticleMeta = {
  slug: "collection-content-slots",
  title: "Collection Content Slots",
  description: "Extra written content shown automatically below a collection's products.",
  sections: [
    { id: "where-it-appears", heading: "Where it appears" },
    { id: "settings", heading: "Settings" },
  ],
};
