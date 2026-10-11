import { Link } from "react-router-dom";
import { DocImage, DocImageGrid, DocList, DocNote, DocSectionBlock } from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

const ASSETS = "/docs/operational-guidelines/preorder-wholesale";

export function PreorderWholesaleContent() {
  return (
    <>
      <DocSectionBlock id="step-1" heading="Step 1: Prepare sale products">
        <p>
          Export your products and open the CSV file. The key columns you'll
          edit are <b>Handle</b>, <b>Tags</b>, <b>Published</b>, and{" "}
          <b>Status</b>.
        </p>
        <DocList ordered>
          <li className="space-y-3">
            <DocNote>
              Required — update <b>Handle</b> to separate the sale products
              from the originals (for example{" "}
              <b>womens-urban-shorts → womens-urban-shorts-sale</b>) to avoid
              overwriting the original product.
            </DocNote>
            <DocImage src={`${ASSETS}/chrome_hNfglQmhso.png`} alt="Updating the product handle" />
          </li>
          <li className="space-y-3">
            <DocNote>
              Required — update <b>Tags</b> so you can reuse it later in a
              smart collection's conditions (for example <b>Sale</b>). You'll
              reuse this tag in the next steps.
            </DocNote>
            <DocImage src={`${ASSETS}/chrome_KUEUI3ekrc.png`} alt="Updating the product tags" />
          </li>
          <li className="space-y-3">
            <DocNote>
              Required — set <b>Published</b> to "TRUE" and <b>Status</b> to
              "active" so the sale products are visible on the storefront. To
              hide them instead, set Published to "FALSE" or Status to
              "draft".
            </DocNote>
            <DocImageGrid>
              <DocImage src={`${ASSETS}/chrome_wPZwZ5NIo8.png`} alt="Setting Published and Status columns" />
              <DocImage src={`${ASSETS}/chrome_l5cbsY3Z4d.png`} alt="Published and Status values" />
            </DocImageGrid>
          </li>
        </DocList>
      </DocSectionBlock>

      <DocSectionBlock id="step-2" heading="Step 2: Control inventory">
        <p>
          Optional — update <b>Variant Inventory Policy</b> from "deny" to
          "continue" to let customers keep buying a sale product even when
          it's out of stock. This is useful if you don't want to manage
          inventory for sale products.
        </p>
        <DocImage src={`${ASSETS}/chrome_RoSq9IWors.png`} alt="Updating Variant Inventory Policy" />
        <p>This enables the matching option in the product's Shopify admin page:</p>
        <DocImage src={`${ASSETS}/chrome_9nyffk2dJZ.png`} alt="Continue selling when out of stock option" />
      </DocSectionBlock>

      <DocSectionBlock id="step-3" heading="Step 3: Import products">
        <DocNote>
          Required — after editing, save the CSV file and import it back into
          Shopify. Make sure to choose <b>Overwrite products with matching
          handles</b> so all data is created and updated correctly.
        </DocNote>
        <DocImage src={`${ASSETS}/chrome_4ypHslgtzF.png`} alt="Importing the CSV with overwrite enabled" />
      </DocSectionBlock>

      <DocSectionBlock id="step-4" heading="Step 4: Exclude from search">
        <DocList ordered>
          <li>
            Follow the{" "}
            <Link to="/doc/operational-guidelines/search#exclude-from-search" className="underline underline-offset-2">
              Search
            </Link>{" "}
            guide to exclude products from search.
          </li>
          <li className="space-y-3">
            <p>Add the same sale tag from Step 1 to the theme's search exclusion settings.</p>
            <DocImage src={`${ASSETS}/chrome_qQikTXZlQo.png`} alt="Adding the sale tag to search exclusion settings" />
          </li>
        </DocList>
      </DocSectionBlock>

      <DocSectionBlock id="step-5" heading="Step 5: Create a secret collection">
        <DocList ordered>
          <li>Create a secret (unlisted) smart collection to hold the sale products.</li>
          <li className="space-y-3">
            <p>
              Configure the smart condition to include all sale products: Tag{" "}
              <b>is equal to</b> the sale tag from Step 1.
            </p>
            <DocImage src={`${ASSETS}/chrome_HztuyKpac8.png`} alt="Smart collection condition for the sale tag" />
          </li>
        </DocList>
      </DocSectionBlock>

      <DocSectionBlock id="step-6" heading="Step 6: Exclude from other collections">
        <DocList ordered>
          <li>Go to your other collections that use smart conditions.</li>
          <li className="space-y-3">
            <p>
              Add an exclusion rule so sale products are filtered out: Tag{" "}
              <b>is not equal to</b> the sale tag from Step 1.
            </p>
            <DocImage src={`${ASSETS}/chrome_SJkjKhNxWp.png`} alt="Excluding the sale tag from another collection" />
            <p>
              This ensures sale products only appear in the secret collection
              and aren't duplicated elsewhere.
            </p>
          </li>
        </DocList>
      </DocSectionBlock>
    </>
  );
}

export const preorderWholesaleArticle: DocArticleMeta = {
  slug: "preorder-wholesale",
  title: "Preorder & Wholesale",
  description: "Set up a separate set of sale products without touching the originals.",
  sections: [
    { id: "step-1", heading: "Step 1: Prepare sale products" },
    { id: "step-2", heading: "Step 2: Control inventory" },
    { id: "step-3", heading: "Step 3: Import products" },
    { id: "step-4", heading: "Step 4: Exclude from search" },
    { id: "step-5", heading: "Step 5: Create a secret collection" },
    { id: "step-6", heading: "Step 6: Exclude from other collections" },
  ],
};
