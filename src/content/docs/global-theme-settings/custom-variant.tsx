import { DocImage, DocSectionBlock } from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

const ASSETS = "/docs/global-theme-settings/custom-variant";

export function CustomVariantContent() {
  return (
    <>
      <DocSectionBlock id="variant" heading="Variant">
        <p>
          You can add images and colors to the variants (for example sizes or
          colors) you've already created on your products.
        </p>
      </DocSectionBlock>

      <DocSectionBlock id="create-variant" heading="Create a variant">
        <p>First, create the product variants themselves in Shopify admin.</p>
        <p>
          Go to <b>Products</b>, select the product you want to add a variant
          to, scroll down, and select <b>Options</b>.
        </p>
        <DocImage src={`${ASSETS}/creat.jpg`} alt="Adding product options" />
        <p>Create the variations you want to add to the product.</p>
        <DocImage src={`${ASSETS}/creat-1.jpg`} alt="Setting up product variants" />
      </DocSectionBlock>

      <DocSectionBlock id="select-type" heading="Select variant type">
        <p>You can choose how each variant type is displayed.</p>
        <p>From the theme editor, select <b>Theme Settings &gt; Product</b>.</p>
        <DocImage src={`${ASSETS}/type.jpg`} alt="Product variant display settings" />
        <p>
          Enter the filter name that matches the option name you created on
          the product.
        </p>
        <DocImage src={`${ASSETS}/type-1.jpg`} alt="Matching the option name" />
        <p>Then choose a display style for that option.</p>
        <DocImage src={`${ASSETS}/type-2.jpg`} alt="Choosing a display style" />
      </DocSectionBlock>

      <DocSectionBlock id="custom-variant" heading="Custom variant">
        <p>
          From Shopify admin, go to <b>Online Store &gt; Themes &gt; Customize &gt; Custom Variant</b>.
        </p>
        <DocImage src={`${ASSETS}/custom.jpg`} alt="Custom Variant section in theme editor" />
        <p>To create a new custom variant, select Add Custom Variant.</p>
        <DocImage src={`${ASSETS}/custom-1.jpg`} alt="Adding a custom variant" />
        <p>
          Enter a variant name that matches the option name you created on
          the product page.
        </p>
        <DocImage src={`${ASSETS}/custom-2.jpg`} alt="Matching the variant name" />
        <p>Then enter a color or image to represent that variant.</p>
        <DocImage src={`${ASSETS}/custom-3.jpg`} alt="Setting a color or image for a variant" />
        <p>
          This customization is used across the filter panel, product page,
          quick view, and product card.
        </p>
        <DocImage src={`${ASSETS}/custom-4.jpg`} alt="Custom variant shown across the storefront" />
        <p>
          Any variant not added to Custom Variant will simply show up as plain
          text instead.
        </p>
        <DocImage src={`${ASSETS}/custom-5.jpg`} alt="Variant shown as plain text label" />
      </DocSectionBlock>
    </>
  );
}

export const customVariantArticle: DocArticleMeta = {
  slug: "custom-variant",
  title: "Custom Variant",
  description: "Show product variants as colors or images instead of plain text.",
  sections: [
    { id: "variant", heading: "Variant" },
    { id: "create-variant", heading: "Create a variant" },
    { id: "select-type", heading: "Select variant type" },
    { id: "custom-variant", heading: "Custom variant" },
  ],
};
