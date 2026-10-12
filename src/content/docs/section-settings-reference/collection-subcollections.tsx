import { Separator } from "@/components/ui/separator";
import { DocImage, DocList, DocSectionBlock, DocSubHeading } from "@/components/custom/doc-content";
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
        <DocImage src="/docs/section-settings-reference/collection-product-grid/chrome_UvxVa6gGj9.png" alt="the category shortcut buttons below the banner" />
        {/* <DocImagePlaceholder label="the category shortcut buttons below the banner" /> */}
      </DocSectionBlock>

      <DocSectionBlock id="settings" heading="Settings">
        <DocSubHeading>Section settings</DocSubHeading>
        <DocList>
          <li><b>Enable</b> — turns the whole row on or off.</li>
        </DocList>

        <Separator className="my-6" />

        <DocSubHeading>Block settings</DocSubHeading>
        <p>
          Add one or more <b>Activity Links</b> blocks to build the row of
          shortcut buttons.
        </p>
        <DocList>
          <li><b>Title</b> — a tooltip shown when hovering the buttons (not visible text on the page).</li>
          <li><b>Links</b> — pick a menu (link list) whose links will be displayed as buttons, in that menu's order.</li>
          <li><b>Show in Collections</b> — choose which collection(s) this set of buttons should appear on.</li>
        </DocList>
        <p>
          A button automatically appears bold/active when it points to the
          collection the shopper is currently viewing.
        </p>
        <DocImage src="/docs/section-settings-reference/collection-product-grid/chrome_4pz4Ba4rH0.png" alt="an Activity Links block shown as shortcut buttons" />
        {/* <DocImagePlaceholder label="an Activity Links block shown as shortcut buttons" /> */}
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
  ],
};
