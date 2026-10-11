import { DocImagePlaceholder, DocList, DocSectionBlock, DocSubHeading } from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

export function CollectionSubcollectionsContent() {
  return (
    <>
      <DocSectionBlock id="where-it-appears" heading="Where it appears">
        <p>
          A row of category-shortcut buttons shown just below the banner on a
          collection page, letting shoppers jump straight to related
          collections (for example "Tri Suits", "Jerseys", "Shop all").
        </p>
        <DocImagePlaceholder label="the category shortcut buttons below the banner" />
      </DocSectionBlock>

      <DocSectionBlock id="settings" heading="Settings">
        <DocList>
          <li><b>Enable</b> — turns the whole row on or off.</li>
        </DocList>
      </DocSectionBlock>

      <DocSectionBlock id="activity-links" heading="Activity Links">
        <p>
          Add one or more of these to build the row of shortcut buttons.
        </p>
        <DocSubHeading>Each set of buttons has</DocSubHeading>
        <DocList>
          <li><b>Title</b> — a tooltip shown when hovering the buttons (not visible text on the page).</li>
          <li><b>Links</b> — pick a menu (link list) whose links will be displayed as buttons, in that menu's order.</li>
          <li><b>Show in Collections</b> — choose which collection(s) this set of buttons should appear on.</li>
        </DocList>
        <p>
          A button automatically appears bold/active when it points to the
          collection the shopper is currently viewing.
        </p>
      </DocSectionBlock>
    </>
  );
}

export const collectionSubcollectionsArticle: DocArticleMeta = {
  slug: "collection-subcollections",
  title: "Collection Sub-collections",
  description: "The row of category shortcut buttons shown below the collection banner.",
  sections: [
    { id: "where-it-appears", heading: "Where it appears" },
    { id: "settings", heading: "Settings" },
    { id: "activity-links", heading: "Activity Links" },
  ],
};
