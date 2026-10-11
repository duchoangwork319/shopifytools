import { DocList, DocSectionBlock } from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

export function PageContentContent() {
  return (
    <>
      <DocSectionBlock id="where-it-appears" heading="Where it appears">
        <p>
          A flexible section you can add anywhere a page is built from
          sections, to display the content of a single existing Page — for
          example stacking it alongside a product grid on a landing page.
        </p>
      </DocSectionBlock>

      <DocSectionBlock id="settings" heading="Settings">
        <DocList>
          <li><b>Title</b> — an internal name to help you tell this section apart from others (not shown to shoppers).</li>
          <li><b>Page</b> — choose the Page whose content should be shown here.</li>
        </DocList>
      </DocSectionBlock>
    </>
  );
}

export const pageContentArticle: DocArticleMeta = {
  slug: "page-content",
  title: "Page Content",
  description: "Show the content of a single existing page inside a section.",
  sections: [
    { id: "where-it-appears", heading: "Where it appears" },
    { id: "settings", heading: "Settings" },
  ],
};
