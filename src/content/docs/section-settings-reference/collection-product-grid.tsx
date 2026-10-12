import { Separator } from "@/components/ui/separator";
import { DocImage, DocList, DocNote, DocSectionBlock, DocSubHeading } from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

const CARD_STYLES = ["Card 1", "Card 2", "Card 3", "Card 4", "Card 5", "Card 6"];
const ASSETS = "/docs/section-settings-reference/collection-product-grid";
const CARD_STYLES_IMAGE = [
  `${ASSETS}/chrome_DwFbP3VvJ7.png`,
  `${ASSETS}/chrome_AmjeORFYLQ.png`,
  `${ASSETS}/chrome_iZAxPVU7qV.png`,
  `${ASSETS}/chrome_WdPUhcDaO4.png`,
  `${ASSETS}/chrome_HcbWALca4A.png`,
  `${ASSETS}/chrome_BhK1hbHBuq.png`
];

export function CollectionProductGridContent() {
  return (
    <>
      <DocSectionBlock id="where-it-appears" heading="Where it appears">
        <p>
          This is the main part of a collection page — the grid of products
          shoppers browse and buy from.
        </p>
        <DocImage src={`${ASSETS}/KpwwgAvYja.png`} alt="the product grid on a collection page" />
        {/* <DocImagePlaceholder label="the product grid on a collection page" /> */}
      </DocSectionBlock>

      <DocSubHeading>Section settings</DocSubHeading>

      <DocSectionBlock id="product-source" heading="Product source">
        <DocList>
          <li><b>Collection</b> — show products from a specific collection instead of the page's own collection.</li>
          <li><b>Products</b> — instead of a collection, hand-pick the exact products to show (these show in full, without paging).</li>
        </DocList>
        <DocNote>
          If both are left empty, the grid shows whichever collection the
          page itself belongs to.
        </DocNote>
      </DocSectionBlock>

      <DocSectionBlock id="layout" heading="Layout">
        <DocList>
          <li><b>Product card style</b> — choose from several card designs.</li>
          <li><b>Display Mode (mobile)</b> — "Grid" shows a normal grid; "Scrollable" lets shoppers swipe sideways through one product at a time.</li>
          <li><b>Columns (desktop / tablet / mobile)</b> — how many products appear per row on each device size.</li>
          <li><b>Padding / Margin (mobile)</b> — spacing around the grid on mobile.</li>
          <li><b>Max width (desktop)</b> and <b>Padding (desktop)</b> — the grid's width and spacing on larger screens.</li>
          <li><b>Background Color</b> — a background color behind the whole section (leave blank for none).</li>
        </DocList>
      </DocSectionBlock>

      <DocSectionBlock id="product-cards" heading="Product cards">
        <DocList>
          <li><b>Max swatches before "+N"</b> — how many color options show before the rest collapse into a "+N" count.</li>
          <li><b>Max sizes before "+N" (card 3)</b> — same idea, for the card style that also lists sizes.</li>
        </DocList>
        <DocImage src={`${ASSETS}/chrome_OwzddZw2EQ.png`} alt="a product card with swatches and the +N overflow count" />
        {/* <DocImagePlaceholder label="a product card with swatches and the +N overflow count" /> */}
      </DocSectionBlock>

      <DocSectionBlock id="pagination" heading="Pagination">
        <DocList>
          <li><b>Products per page</b> — how many products load at a time.</li>
          <li><b>Pagination style</b> — "Load more button" shows a button shoppers click to see more; "Infinite scroll" loads more automatically as they scroll down.</li>
        </DocList>
        <DocImage src={`${ASSETS}/vLOE0rZdXY.png`} alt="the pagination control at the bottom of the grid" />
        {/* <DocImagePlaceholder label="the pagination control at the bottom of the grid" /> */}
      </DocSectionBlock>

      <DocSectionBlock id="filter-and-sort" heading="Filter & sort">
        <p>
          Lets shoppers narrow down the products shown (for example by size,
          color, or price) and change the sort order. This only works when
          showing a collection — it's ignored if specific products were
          hand-picked above.
        </p>
        <DocList>
          <li><b>Enable filter &amp; sort panel</b> — turns filtering and sorting on or off.</li>
          <li><b>Filter List Mode</b> — "Column &amp; Checkbox" lists options in a column with checkboxes; "Pill &amp; Badge" shows them as rounded, tappable pills. This only affects filters like size, color, or availability — not the price filter.</li>
          <li><b>Price Range Mode</b> — "Text Box" lets shoppers type a min/max price; "Slider" shows a draggable range slider.</li>
        </DocList>
        <DocImage src={`${ASSETS}/chrome_B3GPbwA1x9.png`} alt="the filter & sort panel, open on desktop and on mobile" />
        {/* <DocImagePlaceholder label="the filter & sort panel, open on desktop and on mobile" /> */}
      </DocSectionBlock>

      <Separator className="my-6" />

      <DocSubHeading>Block settings</DocSubHeading>

      <DocSectionBlock id="custom-badges" heading="Custom badges">
        <p>
          Add a small badge to chosen products — for example "New" or "Best
          Seller".
        </p>
        <DocSubHeading>Each badge has</DocSubHeading>
        <DocList>
          <li><b>Title</b> — an internal name to help you tell badges apart (not shown to shoppers).</li>
          <li><b>Label</b> — the text shown on the badge.</li>
          <li><b>Background color</b> and <b>Text color</b> — the badge's colors.</li>
          <li><b>Show in Products</b> — which product(s) this badge appears on.</li>
        </DocList>
        <DocImage src={`${ASSETS}/chrome_lm78Cvh41a.png`} alt="a product card showing a custom badge" />
        {/* <DocImagePlaceholder label="a product card showing a custom badge" /> */}

        <Separator className="my-6" />

        <DocSubHeading>Product cards layout</DocSubHeading>
        <p>The available product card styles you can choose from in Layout above:</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CARD_STYLES.map((card, index) => (
            <DocImage key={card} src={CARD_STYLES_IMAGE[index]} alt={`the ${card} product card style`} />
          ))}
        </div>
      </DocSectionBlock>
    </>
  );
}

export const collectionProductGridArticle: DocArticleMeta = {
  slug: "collection-product-grid",
  title: "Collection Product Grid",
  description: "The product grid, its layout, pagination, filtering, and badges.",
  sections: [
    { id: "where-it-appears", heading: "Where it appears" },
    { id: "product-source", heading: "Product source" },
    { id: "layout", heading: "Layout" },
    { id: "product-cards", heading: "Product cards" },
    { id: "pagination", heading: "Pagination" },
    { id: "filter-and-sort", heading: "Filter & sort" },
    { id: "custom-badges", heading: "Custom badges" },
  ],
};
