import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DocImage,
  DocImageGrid,
  DocList,
  DocNote,
  DocSectionBlock,
  DocSubHeading,
} from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

const ASSETS = "/docs/page-section-mapping/product-detail-page";

function MetafieldStep({ fieldKey }: { fieldKey: string }) {
  return (
    <>
      <p>
        <b>1.</b> From your Shopify admin, go to <b>Settings</b> &gt;{" "}
        <b>Metafields</b>.
      </p>
      <DocImage src={`${ASSETS}/meta-1.jpg`} alt="Shopify admin Metafields settings" />
      <p>
        <b>2.</b> Create a metafield with the same name required:{" "}
        <b>{fieldKey}</b>
      </p>
    </>
  );
}

export function ProductDetailPageContent() {
  return (
    <>
      <DocSectionBlock id="product-pages" heading="Product pages">
        <p>
          <b>1.</b> From your Shopify admin, go to <b>Online Store</b> &gt;{" "}
          <b>Themes</b>.
        </p>
        <p>
          <b>2.</b> Find the theme that you want to edit and click{" "}
          <b>Customize</b>.
        </p>
        <p>
          <b>3.</b> Go to the Product page.
        </p>
        <DocImage src={`${ASSETS}/image73.jpg`} alt="Theme editor on a product page" />
      </DocSectionBlock>

      <DocSectionBlock id="general-settings" heading="General settings">
        <DocImage src={`${ASSETS}/image74.jpg`} alt="Product template general settings" />
        <DocSubHeading>Media</DocSubHeading>
        <DocImage src={`${ASSETS}/media.jpg`} alt="Media settings" />
        <DocSubHeading>Options form</DocSubHeading>
        <DocImage src={`${ASSETS}/media-1.jpg`} alt="Options form settings" />
        <DocSubHeading>Quantity form</DocSubHeading>
        <DocImage src={`${ASSETS}/media-2.jpg`} alt="Quantity form settings" />
        <DocSubHeading>Collections</DocSubHeading>
        <DocImage src={`${ASSETS}/media-3.jpg`} alt="Collections settings" />
      </DocSectionBlock>

      <DocSectionBlock id="product-recommendations" heading="Product recommendations">
        <p>You can enable, disable and configure product recommendations here.</p>
        <DocImage src={`${ASSETS}/image80.jpg`} alt="Product recommendations settings" />
      </DocSectionBlock>

      <DocSectionBlock id="product-type" heading="Product Type">
        <DocSubHeading>1. Group Product</DocSubHeading>
        <p>You need to create metafields to import group products.</p>
        <MetafieldStep fieldKey="bwp_fields.group_product" />
        <DocImage src={`${ASSETS}/meta-2.jpg`} alt="Group product metafield" />
        <p>
          You can create group products by adding the IDs of the products you
          want to group here; IDs are separated by comma.
        </p>
        <DocImage src={`${ASSETS}/typepro-1.jpg`} alt="Group product IDs" />
        <p>You can get the product ID here.</p>
        <DocImage src={`${ASSETS}/typepro-2.jpg`} alt="Finding a product ID" />
        <p>Front end:</p>
        <DocImage src={`${ASSETS}/typepro-6.jpg`} alt="Group product storefront" />

        <DocSubHeading>2. Buy Together Product</DocSubHeading>
        <p>You need to create metafields to import buy-together products.</p>
        <MetafieldStep fieldKey="bwp_fields.bundler" />
        <DocImage src={`${ASSETS}/meta-3.jpg`} alt="Buy-together metafield" />
        <p>
          You can create a buy-together product by adding the IDs you want to
          sell together in the Bundler field; IDs are separated by comma.
        </p>
        <DocImage src={`${ASSETS}/typepro-3.jpg`} alt="Buy-together product IDs" />
        <p>You can get the product ID here.</p>
        <DocImage src={`${ASSETS}/typepro-2.jpg`} alt="Finding a product ID" />
        <p>Front end:</p>
        <DocImage src={`${ASSETS}/typepro-7.jpg`} alt="Buy-together storefront" />

        <DocSubHeading>3. External &amp; Affiliate Product</DocSubHeading>
        <p>You need to create metafields to import external &amp; affiliate products.</p>
        <MetafieldStep fieldKey="bwp_fields.external" />
        <DocImage src={`${ASSETS}/meta-4.jpg`} alt="External product metafield" />
        <p>
          You can create a buy-together product by adding the IDs you want to
          sell together in the External &amp; Affiliate Product field.
        </p>
        <DocImage src={`${ASSETS}/typepro-4.jpg`} alt="External product IDs" />
        <p>Front end:</p>
        <DocImage src={`${ASSETS}/typepro-8.jpg`} alt="External product storefront" />

        <DocSubHeading>4. Countdown</DocSubHeading>
        <p>You need to create metafields to import a countdown.</p>
        <MetafieldStep fieldKey="bwp_fields.countdowns" />
        <DocImage src={`${ASSETS}/meta-5.jpg`} alt="Countdown metafield" />
        <p>You can enter the time for the countdown product in the countdown field.</p>
        <DocImage src={`${ASSETS}/typepro-5.jpg`} alt="Countdown field" />
        <p>Front end:</p>
        <DocImage src={`${ASSETS}/typepro-9.jpg`} alt="Countdown storefront" />
      </DocSectionBlock>

      <DocSectionBlock id="buy-it-with" heading="Buy it with">
        <p>You need to create metafields to import Buy it with.</p>
        <MetafieldStep fieldKey="bwp_fields.buy_it_with" />
        <DocImage src={`${ASSETS}/filed-1.jpg`} alt="Buy it with metafield" />
        <p>
          You can create a Buy it with product by adding the IDs you want to
          sell together in the Buy it with field.
        </p>
        <DocImage src={`${ASSETS}/filed-2.jpg`} alt="Buy it with product IDs" />
        <p>Front end:</p>
        <DocImage src={`${ASSETS}/filed-3.jpg`} alt="Buy it with storefront" />
      </DocSectionBlock>

      <DocSectionBlock id="buy-more-save-more" heading="Buy more save more">
        <p>You need to create discounts here.</p>
        <DocImage src={`${ASSETS}/filed-4.jpg`} alt="Discounts list" />
        <p>Configure your discounts.</p>
        <DocImage src={`${ASSETS}/filed-5.jpg`} alt="Discount configuration" />
        <p>
          Select products that will receive discounts here. Then merge those
          products into collections.
        </p>
        <DocImage src={`${ASSETS}/filed-6.jpg`} alt="Discount products" />
        <p>Select the collection that you have included those products in here.</p>
        <DocImage src={`${ASSETS}/filed-7.jpg`} alt="Discount collection" />
      </DocSectionBlock>

      <DocSectionBlock id="estimated-delivery" heading="Estimated delivery">
        <p>
          The delivery date will be calculated from the current date plus the
          number of days you enter here.
        </p>
        <DocImage src={`${ASSETS}/filed-8.jpg`} alt="Estimated delivery setting" />
        <p>
          Products that are configured to continue selling when out of stock,
          and are no longer in stock, will be counted as pre-order products.
        </p>
        <DocImage src={`${ASSETS}/filed-9.jpg`} alt="Pre-order detection" />
        <p>The delivery time of the product will be calculated from the time it arrives at the warehouse.</p>
        <DocImage src={`${ASSETS}/filed-10.jpg`} alt="Warehouse arrival time" />
      </DocSectionBlock>

      <DocSectionBlock id="product-pick-up" heading="Product pick up">
        <p>You need to configure the location here.</p>
        <DocImage src={`${ASSETS}/filed-11.jpg`} alt="Pick up locations" />
        <p>Then select Shipping and delivery.</p>
        <DocImage src={`${ASSETS}/filed-13.jpg`} alt="Shipping and delivery" />
        <p>Go to Local pickup.</p>
        <DocImage src={`${ASSETS}/filed-12.jpg`} alt="Local pickup" />
        <p>Select the locales and configure them.</p>
        <DocImage src={`${ASSETS}/filed-14.jpg`} alt="Configure locales" />
        <p>You can choose the location for the product here.</p>
        <DocImage src={`${ASSETS}/filed-15.jpg`} alt="Choose product location" />
        <p>It will be displayed here.</p>
        <DocImage src={`${ASSETS}/filed-16.jpg`} alt="Pick up on storefront" />
      </DocSectionBlock>

      <DocSectionBlock id="product-image-360" heading="Product image 360">
        <p>
          The images you use for image 360. You need to set the alt for that
          image to be <b>'bwp-image-360'</b>.
        </p>
        <DocImageGrid>
          <DocImage src={`${ASSETS}/img-360-1.jpg`} alt="Product image 360 example 1" />
          <DocImage src={`${ASSETS}/img-360-2.jpg`} alt="Product image 360 example 2" />
          <DocImage src={`${ASSETS}/img-360-3.jpg`} alt="Product image 360 example 3" />
        </DocImageGrid>
      </DocSectionBlock>

      <DocSectionBlock id="variant-images-grouped" heading="Variant Images Grouped">
        <p>
          The images you want to group into a variant. You need to set the
          alt for that image to match the variant you want.
        </p>
        <DocImageGrid>
          <DocImage src={`${ASSETS}/grouped-0.jpg`} alt="Grouped variant images example 1" />
          <DocImage src={`${ASSETS}/grouped-1.jpg`} alt="Grouped variant images example 2" />
          <DocImage src={`${ASSETS}/grouped-2.jpg`} alt="Grouped variant images example 3" />
        </DocImageGrid>
      </DocSectionBlock>

      <DocSectionBlock id="variant-images-color" heading="Variant Images Color">
        <p>You can use product images for variants.</p>
        <p>
          Select the image you want to use as a variation, then type the alt
          for it. The alt must have the characters <b>"Color-"</b> in front of
          it. Then go to the variant name you want to set as the image.
        </p>
        <DocImageGrid>
          <DocImage src={`${ASSETS}/image-color-0.jpg`} alt="Variant image color example 1" />
          <DocImage src={`${ASSETS}/image-color-1.jpg`} alt="Variant image color example 2" />
          <DocImage src={`${ASSETS}/image-color-2.jpg`} alt="Variant image color example 3" />
        </DocImageGrid>
      </DocSectionBlock>

      <DocSectionBlock id="size-chart" heading="Size Chart">
        <DocList ordered>
          <li className="space-y-3">
            <p>Create Size Chart content.</p>
            <p>Go to Online Store &gt; Pages &gt; Add page.</p>
            <p>
              File name <b>MUST</b> have the prefix <b>SizeChart_cm_*</b> or{" "}
              <b>SizeChart_inch_*</b>. Casing does not matter.
            </p>
            <DocImage src={`${ASSETS}/sizechart/chrome_bXIf4tGkk3.png`} alt="Size chart page naming" />
            <p>You can copy and paste content from Google Sheets to retain the HTML table structure.</p>
            <DocImage src={`${ASSETS}/sizechart/pXzmTI2JaW.png`} alt="Pasting size chart content" />
          </li>
          <li className="space-y-3">
            <p>Create a Size Chart metaobject.</p>
            <p>Go to Content &gt; Metaobjects &gt; select "BW Field Size Chart" &gt; Add entry.</p>
            <DocImage src={`${ASSETS}/sizechart/kED1CpN931.png`} alt="Size chart metaobject entry" />
            <p>Add a label. Select up to 2 size chart pages created above. Select a visual image (if any) to show on the popup.</p>
            <DocImage src={`${ASSETS}/sizechart/chrome_Mo92RLH3Nj.png`} alt="Size chart metaobject fields" />
          </li>
          <li className="space-y-3">
            <p>Link the Size Chart metaobject to product(s).</p>
            <p>Go to Product, scroll down to "Size Chart".</p>
            <DocImage src={`${ASSETS}/sizechart/chrome_FA5HVnw4R9.png`} alt="Size chart field on product" />
            <p>Click on it to select the Size Chart metaobject and save.</p>
            <DocImageGrid>
              <DocImage src={`${ASSETS}/sizechart/chrome_WFCpGJJdaJ.png`} alt="Select size chart metaobject" />
              <DocImage src={`${ASSETS}/sizechart/chrome_wdVwaUMf9B.png`} alt="Save size chart selection" />
            </DocImageGrid>
            <p>Check the UI on the storefront.</p>
            <DocImage src={`${ASSETS}/sizechart/I0QfiDFJmm.png`} alt="Size chart on storefront" />
          </li>
          <li className="space-y-3">
            <p>Bulk edit via product import.</p>
            <p>
              Export product(s), then update the{" "}
              <b>"Size Chart (product.metafields.bwp_fields.size_chart)"</b>{" "}
              field in the CSV.
            </p>
            <DocImage src={`${ASSETS}/sizechart/t6CoXEeao1.png`} alt="Size chart CSV column" />
            <p>
              The value <b>MUST BE</b> the Size Chart metaobject handle.
            </p>
            <DocImage src={`${ASSETS}/sizechart/chrome_u2IxcU2kS0.png`} alt="Size chart metaobject handle" />
          </li>
        </DocList>
      </DocSectionBlock>

      <DocSectionBlock id="bundle" heading="Bundle">
        <DocList ordered>
          <li className="space-y-3">
            <p>Create the metaobject and metafield.</p>
            <DocSubHeading>Metaobject</DocSubHeading>
            <DocList>
              <li>Name: BW Field Bundle</li>
              <li>Type: bw_field_bundle</li>
            </DocList>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Constraint</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Bundle Name</TableCell>
                  <TableCell>bundle_name</TableCell>
                  <TableCell>Single line text</TableCell>
                  <TableCell>Required</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Products</TableCell>
                  <TableCell>products</TableCell>
                  <TableCell>List of products</TableCell>
                  <TableCell>Required, Min: 2</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Percentage Discount</TableCell>
                  <TableCell>percentage_discount</TableCell>
                  <TableCell>Decimal</TableCell>
                  <TableCell>Optional, Min: 1.0 - Max: 100.0</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <DocSubHeading>Metafield</DocSubHeading>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Bundle</TableCell>
                  <TableCell>bwp_fields.bundle</TableCell>
                  <TableCell>Metaobject: bw_field_bundle</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </li>
          <li className="space-y-3">
            <p>Create a bundle product by adding the metaobject entry and linking it to the product via metafield.</p>
            <p>Go to Content &gt; Metaobjects &gt; select "BW Field Bundle" &gt; Add entry.</p>
            <DocImage src={`${ASSETS}/bundle/chrome_ucKXybXjWw.png`} alt="Bundle metaobject entry" />
            <p>Then go to the product and link the metaobject entry to the product via metafield.</p>
            <DocNote>
              NOTE: You need to link the bundle metaobject to all products
              included in the bundle.
            </DocNote>
            <DocImage src={`${ASSETS}/bundle/chrome_GikV5uFn6S.png`} alt="Linking bundle metaobject to products" />
            <DocNote>
              NOTE: The Percentage Discount field is only used to calculate
              and display the price on the storefront. It will not apply any
              discount in the backend — use the Bundler app to create a
              discount for the bundle products.
            </DocNote>
            <DocImage src={`${ASSETS}/bundle/chrome_YKu3kjkfqh.png`} alt="Bundle percentage discount field" />
          </li>
          <li className="space-y-3">
            <p>UI on storefront.</p>
            <DocImage src={`${ASSETS}/bundle/Screenshot_1.png`} alt="Bundle on storefront" />
            <p>UI after adding the bundle product to cart.</p>
            <DocImage src={`${ASSETS}/bundle/chrome_MvXkvgVTo4.png`} alt="Bundle added to cart" />
          </li>
        </DocList>
      </DocSectionBlock>
    </>
  );
}

export const productDetailPageArticle: DocArticleMeta = {
  slug: "product-detail-page",
  title: "Product Detail Page",
  description: "Section-by-section configuration reference for the PDP.",
  sections: [
    { id: "product-pages", heading: "Product pages" },
    { id: "general-settings", heading: "General settings" },
    { id: "product-recommendations", heading: "Product recommendations" },
    { id: "product-type", heading: "Product Type" },
    { id: "buy-it-with", heading: "Buy it with" },
    { id: "buy-more-save-more", heading: "Buy more save more" },
    { id: "estimated-delivery", heading: "Estimated delivery" },
    { id: "product-pick-up", heading: "Product pick up" },
    { id: "product-image-360", heading: "Product image 360" },
    { id: "variant-images-grouped", heading: "Variant Images Grouped" },
    { id: "variant-images-color", heading: "Variant Images Color" },
    { id: "size-chart", heading: "Size Chart" },
    { id: "bundle", heading: "Bundle" },
  ],
};
