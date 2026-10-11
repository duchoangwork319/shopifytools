import { DocImage, DocList, DocSubHeading, DocSectionBlock } from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

const ASSETS = "/docs/global-theme-settings/theme-settings";

export function ThemeSettingsContent() {
  return (
    <>
      <DocImage src={`${ASSETS}/theme_settings.jpg`} alt="Theme settings panel overview" />

      <DocSectionBlock id="colors" heading="Colors">
        <p>
          Most of the colors used across your store are customizable, with
          clear, self-explanatory names. Click on a color swatch to edit it —
          a color picker will pop up, letting you adjust or experiment with
          custom colors.
        </p>
        <DocImage src={`${ASSETS}/image9.jpg`} alt="Color settings list" />
        <DocSubHeading>Color select box</DocSubHeading>
        <p>
          The label on the right means "transparent", while the box on the
          left shows the color you've picked. You can also type a specific
          color code (for example <b>#ff4000</b>) in the bottom right corner
          if you want to match a precise color across your store — for
          example, copy a color code from "Text color primary" and paste it
          into another color setting to keep them identical. Recently used
          colors are listed below for quick reuse.
        </p>
        <DocImage src={`${ASSETS}/image10.png`} alt="Color picker with hex code input" />
      </DocSectionBlock>

      <DocSectionBlock id="typography" heading="Typography">
        <p>
          The theme comes with a set of hand-picked fonts for your store. You
          can also bring in Google fonts or any font that Shopify supports.
          Font size can be adjusted with a slider.
        </p>
        <DocImage src={`${ASSETS}/image11.jpg`} alt="Typography settings panel" />
        <p>The theme uses two fonts:</p>
        <DocList>
          <li>
            <b>Body text</b> — used for regular paragraph text.
            <DocImage src={`${ASSETS}/image-font-body.jpg`} alt="Body text font setting" />
          </li>
          <li>
            <b>Headings</b> — used for menu text and, in some places, for headings.
            <DocImage src={`${ASSETS}/image-font-heading.jpg`} alt="Heading font setting" />
          </li>
        </DocList>
        <p>To use a new font, follow the steps below.</p>
        <DocSubHeading>1. Use a Google font</DocSubHeading>
        <p>
          Google Fonts makes it easy to bring quality typography to your
          store, and all Google Fonts are free to use.
        </p>
        <DocList ordered>
          <li>
            Visit <a href="https://fonts.google.com/" target="_blank" rel="noreferrer" className="underline underline-offset-2">Google Fonts</a>.
          </li>
          <li>Use the search and filters to find a font you want to use.</li>
          <li>Click the plus button for each font style you want.</li>
          <li>Click <b>(x) Families Selected</b> at the bottom of the page to view your selected fonts.</li>
          <li>Copy the link shown in the Standard area.</li>
        </DocList>
        <DocImage src={`${ASSETS}/image12.jpg`} alt="Copying the Google Fonts link" />
        <p>Then, add the link to your theme:</p>
        <DocList ordered>
          <li>Open your Shopify admin in a new browser tab.</li>
          <li>Go to <b>Online Store &gt; Themes</b>.</li>
          <li>Open the <b>Theme settings</b> tab and expand the <b>Typography</b> panel.</li>
          <li>Paste the link you copied into the <b>Google font URL</b> field.</li>
          <li>Type the font's name into the <b>Fonts name</b> field.</li>
        </DocList>
        <DocImage src={`${ASSETS}/image-font-cus.jpg`} alt="Entering a custom Google font" />
        <DocSubHeading>2. Use a Shopify font</DocSubHeading>
        <p>
          If you'd rather use a font Shopify already provides, turn on "Use
          Shopify font" and pick the font you want.
        </p>
        <DocImage src={`${ASSETS}/image-font-cus2.jpg`} alt="Selecting a Shopify font" />
      </DocSectionBlock>

      <DocSectionBlock id="collection" heading="Collection">
        <DocSubHeading>Types of sidebars</DocSubHeading>
        <DocImage src={`${ASSETS}/sidebar-1.jpg`} alt="Collection sidebar style 1" />
        <DocImage src={`${ASSETS}/sidebar-2.jpg`} alt="Collection sidebar style 2" />
        <DocImage src={`${ASSETS}/sidebar-3.jpg`} alt="Collection sidebar style 3" />
        <DocSubHeading>Style of view items</DocSubHeading>
        <DocImage src={`${ASSETS}/sidebar-4.jpg`} alt="Collection view item style 1" />
        <DocImage src={`${ASSETS}/sidebar-5.jpg`} alt="Collection view item style 2" />
      </DocSectionBlock>

      <DocSectionBlock id="product-card" heading="Product card">
        <DocSubHeading>Types of product hover</DocSubHeading>
        <DocImage src={`${ASSETS}/hover-1.jpg`} alt="Product hover style 1" />
        <DocImage src={`${ASSETS}/hover-2.jpg`} alt="Product hover style 2" />
        <DocSubHeading>Hover image styles</DocSubHeading>
        <DocImage src={`${ASSETS}/hover-3.jpg`} alt="Hover image style 1" />
        <DocImage src={`${ASSETS}/hover-4.jpg`} alt="Hover image style 2" />
      </DocSectionBlock>

      <DocSectionBlock id="sale-notification" heading="Sale notification">
        <p>Choose the collection whose products are shown.</p>
        <DocImage src={`${ASSETS}/sale-1.jpg`} alt="Sale notification collection setting" />
        <p>Choose which pages should show the sale notification.</p>
        <DocImage src={`${ASSETS}/sale-2.jpg`} alt="Sale notification page settings" />
        <p>Set how long the sale notification stays on screen.</p>
        <DocImage src={`${ASSETS}/sale-3.jpg`} alt="Sale notification display time" />
        <p>Choose what information is shown on the sale notification.</p>
        <DocImage src={`${ASSETS}/sale-4.jpg`} alt="Sale notification content settings" />
      </DocSectionBlock>

      <DocSectionBlock id="cart" heading="Cart page">
        <DocSubHeading>Cart type</DocSubHeading>
        <p>Choose how the cart behaves when a product is added:</p>
        <DocImage src={`${ASSETS}/cart.jpg`} alt="Cart type setting" />
        <p>
          <b>Drawer:</b> a sidebar slides in from the right showing your cart contents.
        </p>
        <DocImage src={`${ASSETS}/cart-1.jpg`} alt="Cart drawer example" />
        <p>
          <b>Modal:</b> a popup appears in the center of the screen showing your cart contents.
        </p>
        <DocImage src={`${ASSETS}/cart-3.jpg`} alt="Cart modal example" />
        <p>
          <b>Page:</b> the shopper is taken to a dedicated cart page.
        </p>
        <DocSubHeading>Free shipping</DocSubHeading>
        <p>
          Configure free shipping under <b>Settings &gt; Shipping and delivery</b> in your Shopify admin.
        </p>
        <DocImage src={`${ASSETS}/cart-5.jpg`} alt="Shipping and delivery settings" />
        <p>Then select <b>Shipping</b> and set a minimum order price to qualify for free shipping.</p>
        <DocImage src={`${ASSETS}/cart-6.jpg`} alt="Shipping rate setup" />
        <DocImage src={`${ASSETS}/cart-7.jpg`} alt="Free shipping rate" />
        <p><b>Note:</b> that price should match what you set here in the theme.</p>
        <DocImage src={`${ASSETS}/cart-8.jpg`} alt="Matching free shipping threshold in theme settings" />
        <p>
          <b>Free shipping celebration:</b> you can turn on a small celebration effect shown once a shopper's cart total qualifies for free shipping.
        </p>
        <DocImage src={`${ASSETS}/cart-9.jpg`} alt="Free shipping celebration setting" />
        <DocSubHeading>Gift wrap</DocSubHeading>
        <p>
          First create a gift wrap product in Shopify admin via <b>Products &gt; Gift cards &gt; Add gift card product</b>.
        </p>
        <DocImage src={`${ASSETS}/cart-10.jpg`} alt="Creating a gift wrap product" />
        <DocImage src={`${ASSETS}/cart-11.jpg`} alt="Gift wrap product details" />
        <p>Once set up, it shows up as an option in the cart drawer and on the cart page.</p>
        <DocImage src={`${ASSETS}/cart-12.jpg`} alt="Gift wrap option in cart" />
        <DocSubHeading>Terms and conditions</DocSubHeading>
        <p>Shoppers can be required to accept your terms before checking out.</p>
        <DocImage src={`${ASSETS}/cart-13.jpg`} alt="Terms and conditions checkbox" />
        <p>The content of your terms is shown here.</p>
        <DocImage src={`${ASSETS}/cart-14.jpg`} alt="Terms and conditions content" />
        <p>In the cart drawer, you can also turn on order notes, a coupon field, and a shipping estimator.</p>
        <DocImage src={`${ASSETS}/cart-2.jpg`} alt="Cart drawer extra options" />
      </DocSectionBlock>

      <DocSectionBlock id="social-media" heading="Social media">
        <p>Enter links to your social media profiles here.</p>
        <DocImage src={`${ASSETS}/social-link.jpg`} alt="Social media links setting" />
      </DocSectionBlock>

      <DocSectionBlock id="favicon" heading="Favicon">
        <p>Upload the small icon shown in the browser tab.</p>
        <DocImage src={`${ASSETS}/favicon.jpg`} alt="Favicon upload setting" />
      </DocSectionBlock>

      <DocSectionBlock id="newsletter-popup" heading="Newsletter popup">
        <p>Enter the content shown in the newsletter signup popup.</p>
        <DocImage src={`${ASSETS}/newsletter.jpg`} alt="Newsletter popup settings" />
      </DocSectionBlock>

      <DocSectionBlock id="before-you-leave" heading="Before you leave">
        <p>
          This popup appears when a shopper is about to leave the page
          without having interacted with the tab for a while.
        </p>
        <DocImage src={`${ASSETS}/you_leave.jpg`} alt="Before you leave popup settings" />
      </DocSectionBlock>

      <DocSectionBlock id="language-currencies" heading="Language & currencies">
        <p>
          To offer multiple currencies in your store, first edit your store's
          currency format in Shopify admin.
        </p>
        <DocImage src={`${ASSETS}/sectioncurrency.jpg`} alt="Currency format settings" />
        <p>
          Example formats: <code>{"<span class=money>${{amount}} USD</span>"}</code>{" "}
          or <code>{"<span class=money>${{amount}}</span>"}</code>.
        </p>
        <DocImage src={`${ASSETS}/sectioncurrency1.jpg`} alt="Currency format examples" />
      </DocSectionBlock>

      <DocSectionBlock id="checkout" heading="Checkout">
        <p>
          Under the Checkout section of the theme editor, you can add custom
          banner images, logos, and backgrounds, and customize the fonts and
          colors used throughout checkout.
        </p>
        <p>
          This follows Shopify's default checkout customization. You can read
          more in{" "}
          <a
            href="https://help.shopify.com/manual/sell-online/checkout-settings/checkout-style"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Shopify's documentation
          </a>
          .
        </p>
        <DocImage src={`${ASSETS}/image35.jpg`} alt="Checkout branding settings" />
      </DocSectionBlock>
    </>
  );
}

export const themeSettingsArticle: DocArticleMeta = {
  slug: "theme-settings",
  title: "Theme Settings",
  description: "Store-wide colors, fonts, cart, popups, and checkout branding.",
  sections: [
    { id: "colors", heading: "Colors" },
    { id: "typography", heading: "Typography" },
    { id: "collection", heading: "Collection" },
    { id: "product-card", heading: "Product card" },
    { id: "sale-notification", heading: "Sale notification" },
    { id: "cart", heading: "Cart page" },
    { id: "social-media", heading: "Social media" },
    { id: "favicon", heading: "Favicon" },
    { id: "newsletter-popup", heading: "Newsletter popup" },
    { id: "before-you-leave", heading: "Before you leave" },
    { id: "language-currencies", heading: "Language & currencies" },
    { id: "checkout", heading: "Checkout" },
  ],
};
