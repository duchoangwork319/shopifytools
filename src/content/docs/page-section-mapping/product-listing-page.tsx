import {
  DocImagePlaceholder,
  DocImage,
  DocList,
  DocSectionBlock,
  DocSubHeading,
} from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

const ASSETS = "/docs/page-section-mapping/product-listing-page";

export function ProductListingPageContent() {
  return (
    <>
      <DocSectionBlock id="overview" heading="Overview">
        <p>
          The product listing page (also called a collection page) is where
          shoppers browse a group of products — for example "Men's Running"
          or "Sale". From top to bottom it's built from a breadcrumb trail, a
          banner, an optional row of category shortcuts, the product grid
          itself with its filter and sort panel, optional extra content, and
          a shipping/returns benefits strip.
        </p>
        <DocImage src={`${ASSETS}/64348060-0eefb4a2f7a374fe7372a5ce9a1a9237.png`} alt="the full collection page, top to bottom" />
        {/* <DocImagePlaceholder label="the full collection page, top to bottom" /> */}
      </DocSectionBlock>

      <DocSectionBlock id="breadcrumb" heading="Breadcrumb trail">
        <p>
          A small text trail above the banner (for example "Home / Men's
          Running") that helps shoppers find their way back. You can turn it
          off, change the "Home" wording, and change the separator character.
        </p>
        <DocImage src={`${ASSETS}/chrome_zCNFwtMgdv.png`} alt="the breadcrumb trail at the top of a collection page" />
        {/* <DocImagePlaceholder label="the breadcrumb trail at the top of a collection page" /> */}
      </DocSectionBlock>

      <DocSectionBlock id="banner" heading="Banner">
        <p>
          Shows the collection's title and description at the top of the
          page. If you add an image to the start of the collection's
          description, it's used as a background image behind the title.
        </p>
        <p>
          You can also add quick links underneath the banner (for example
          links to related collections like "New Arrivals" or "Bestsellers").
          Each set of links can be limited to show only on chosen
          collections.
        </p>
        <DocImagePlaceholder label="the banner on a collection page" />
      </DocSectionBlock>

      <DocSectionBlock id="category-shortcuts" heading="Category shortcuts">
        <p>
          An optional row of buttons just below the banner that lets shoppers
          jump straight to related collections (for example "Tri Suits",
          "Jerseys", "Shop all"). Like the banner's quick links, each set of
          buttons can be limited to specific collections, so different
          collections can show different shortcuts.
        </p>
        <DocImagePlaceholder label="the category shortcut buttons below the banner" />
      </DocSectionBlock>

      <DocSectionBlock id="product-grid" heading="Product grid">
        <p>
          The main area of the page: the products themselves. You can choose
          what to show here — either a specific collection, or a hand-picked
          list of products — and how it looks.
        </p>
        <DocImagePlaceholder label="the product grid on a collection page" />
        <DocSubHeading>Layout</DocSubHeading>
        <DocList>
          <li>Which product card style to use.</li>
          <li>How many columns to show on desktop, tablet, and mobile.</li>
          <li>Whether mobile shoppers scroll sideways through products or see a grid.</li>
          <li>Spacing, width, and background color around the grid.</li>
        </DocList>
        <DocSubHeading>Product cards</DocSubHeading>
        <DocList>
          <li>How many color swatches show before collapsing into a "+N" count.</li>
          <li>How many sizes show before collapsing into a "+N" count (on the card style that lists sizes).</li>
        </DocList>
        <DocSubHeading>Pagination</DocSubHeading>
        <DocList>
          <li>How many products show per page.</li>
          <li>Whether shoppers click a "Load more" button or new products load automatically while scrolling.</li>
        </DocList>
        <DocSubHeading>Filter &amp; sort</DocSubHeading>
        <p>
          Lets shoppers narrow down products by things like size, color, or
          price, and sort the results. This only works when showing a
          collection (not a hand-picked product list). You can choose how the
          filter options are displayed, and how the price filter is
          presented.
        </p>
        <DocImagePlaceholder label="the product grid with the filter & sort panel open" />
        <DocSubHeading>Custom badges</DocSubHeading>
        <p>
          You can add a small badge (for example "New" or "Best Seller") to
          chosen products. Each badge has its own text, background color, and
          text color, and you decide which products it appears on.
        </p>
      </DocSectionBlock>

      <DocSectionBlock id="extra-content" heading="Extra content">
        <p>
          Collections can show extra written content underneath the product
          grid — for example SEO text about the collection, or any other
          page you want to surface here. This content comes from pages you
          already manage elsewhere in the store, so there's nothing extra to
          set up in the page editor itself.
        </p>
        <DocImagePlaceholder label="the extra content shown below the product grid" />
      </DocSectionBlock>

      <DocSectionBlock id="benefits" heading="Benefits strip">
        <p>
          A simple row at the bottom of the page highlighting Free Shipping,
          Free Returns, and Crash Replacement, each linking to the matching
          policy page in your store.
        </p>
        <DocImage src={`${ASSETS}/chrome_RAHWWnMq3T.png`} alt="the benefits strip at the bottom of a collection page" />
        {/* <DocImagePlaceholder label="the benefits strip at the bottom of a collection page" /> */}
      </DocSectionBlock>
    </>
  );
}

export const productListingPageArticle: DocArticleMeta = {
  slug: "product-listing-page",
  title: "Product Listing Page",
  description: "How a collection page is put together and what you can customize.",
  sections: [
    { id: "overview", heading: "Overview" },
    { id: "breadcrumb", heading: "Breadcrumb trail" },
    { id: "banner", heading: "Banner" },
    { id: "category-shortcuts", heading: "Category shortcuts" },
    { id: "product-grid", heading: "Product grid" },
    { id: "extra-content", heading: "Extra content" },
    { id: "benefits", heading: "Benefits strip" },
  ],
};
