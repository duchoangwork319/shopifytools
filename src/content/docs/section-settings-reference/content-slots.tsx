import { DocList, DocSectionBlock, DocSubHeading } from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

export function ContentSlotsContent() {
  return (
    <>
      <DocSectionBlock id="where-it-appears" heading="Where it appears">
        <p>
          A flexible section you can add anywhere a page is built from
          sections. It lets you show the content of one or more existing
          Pages, stacked one after another.
        </p>
      </DocSectionBlock>

      <DocSectionBlock id="page-blocks" heading="Page blocks">
        <p>Add one of these for each page you want to display.</p>
        <DocSubHeading>Each block has</DocSubHeading>
        <DocList>
          <li><b>Title</b> — an internal name to help you tell blocks apart (not shown to shoppers).</li>
          <li><b>Select content</b> — choose the Page whose content should be shown here.</li>
        </DocList>
      </DocSectionBlock>
    </>
  );
}

export const contentSlotsArticle: DocArticleMeta = {
  slug: "content-slots",
  title: "Content Slots",
  description: "Show the content of one or more existing pages, stacked in a section.",
  sections: [
    { id: "where-it-appears", heading: "Where it appears" },
    { id: "page-blocks", heading: "Page blocks" },
  ],
};
