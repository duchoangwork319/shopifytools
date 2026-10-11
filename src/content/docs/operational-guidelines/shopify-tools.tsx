import { DocImage, DocList, DocNote, DocSectionBlock, DocSubHeading } from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

const ASSETS = "/docs/operational-guidelines/shopify-tools";

export function ShopifyToolsContent() {
  return (
    <>
      <DocSectionBlock id="step-1" heading="Step 1: Prepare product CSV">
        <p>Go to your Shopify admin and export the products you want to sync.</p>
        <DocImage src={`${ASSETS}/chrome_uM0AbTpkIZ.png`} alt="Exporting products from Shopify admin" />
      </DocSectionBlock>

      <DocSectionBlock id="step-2" heading="Step 2: Open the tool and import your CSV">
        <DocList ordered>
          <li className="space-y-3">
            <p>
              Open this link:{" "}
              <a
                href="https://duchoangwork319.github.io/shopifytools/"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Shopify Tools
              </a>
            </p>
            <DocImage src={`${ASSETS}/0BoFR4Zyuk.png`} alt="Shopify Tools landing page" />
          </li>
          <li className="space-y-3">
            <p>Click <b>Import CSV</b> and choose the file you exported in Step 1.</p>
            <DocImage src={`${ASSETS}/AWLopsCTwD.png`} alt="Importing a CSV file" />
            <p>Once the file is imported, the app shows a preview table of your products.</p>
            <DocImage src={`${ASSETS}/D40biG5eyV.png`} alt="Preview table of imported products" />
            <p>
              If you try to import a very large file (50 handles or more),
              the app will warn you that fetching may take a while. This is
              just a heads-up — you can still continue.
            </p>
          </li>
        </DocList>
      </DocSectionBlock>

      <DocSectionBlock id="step-3" heading="Step 3: Set up configuration">
        <p>
          Click the <b>Configuration</b> button to open the settings panel.
          Everything you set here is saved in your browser, so you only need
          to set it up once — it will still be there next time you open the
          tool.
        </p>
        <DocImage src={`${ASSETS}/PJXPP1GLOi.png`} alt="Configuration panel" />
        <DocImage src={`${ASSETS}/8QAEpIiQC3.png`} alt="Configuration panel options" />
        <DocList ordered>
          <li>
            <b>Store Origin:</b> enter your store's web address (for example{" "}
            <code>https://examplestore.myshopify.com</code>). This tells the
            tool where to fetch the latest product information from.
          </li>
          <li className="space-y-2">
            <p><b>Visibility</b></p>
            <DocList>
              <li><b>Publish products:</b> turn this on to mark products as published and active after fetching.</li>
              <li><b>Inventory Policy Continue:</b> turn this on to let customers keep buying a product after it's out of stock.</li>
            </DocList>
          </li>
          <li>
            <b>Handle Suffix:</b> if you want to create duplicate products for
            a special sale or occasion, type a short suffix here (for example{" "}
            <code>sale</code>). It's automatically added to the end of each
            product's handle after fetching.
          </li>
          <li>
            <b>Append Tags:</b> type one or more tags, separated by commas
            (for example <code>preorder, sales</code>). They're automatically
            added to every product's tags after fetching — handy if you want
            the products to show up in a specific collection.
          </li>
          <li className="space-y-2">
            <p>
              <b>Columns:</b> a checklist of every possible product column the
              tool knows about, not just the columns already in your CSV. It
              controls which columns appear in the preview table and in the
              file you download.
            </p>
            <DocList>
              <li><b>Checked</b> means the column is included — it shows in the preview table, and fetching fills it in with the latest information from your store.</li>
              <li><b>Unchecked</b> means the column is left out entirely — it won't appear in the preview table or the downloaded file.</li>
              <li>
                Columns shown in <span className="font-semibold text-destructive">bold red</span> (such as <b>Handle</b>) have no checkbox and are always included. Their value never changes when fetching — the tool always keeps what's already in your CSV, since Handle uniquely identifies each product.
              </li>
              <li>
                Columns shown in <span className="font-semibold text-amber-600">bold yellow</span> (such as <b>Title</b> and the Option columns) are always included and can't be unchecked, but unlike the red ones, their value <b>can</b> still be refreshed when you fetch.
              </li>
              <li>
                A number of columns — such as pricing, inventory quantity, and a few extra Shopify fields — are <b>unchecked by default</b> to keep the file simple. These are ordinary checkboxes, so you can turn any of them on if you want that data included.
              </li>
            </DocList>
            <DocNote>
              Your CSV doesn't need to already contain every column. For
              example, if your file only has a <b>Handle</b> column, the tool
              can still fetch and fill in Title, Vendor, and every other
              column you've checked here — you don't need to prepare those
              columns yourself first.
            </DocNote>
            <DocImage src={`${ASSETS}/chrome_Ax1G3xQ6gy.png`} alt="Column checklist" />
          </li>
          <li>
            When you're done, click <b>Save</b> to keep your changes, or{" "}
            <b>Close</b> to discard them and leave everything as it was.
          </li>
        </DocList>
      </DocSectionBlock>

      <DocSectionBlock id="step-4" heading="Step 4: Fetch the latest product data">
        <DocList ordered>
          <li className="space-y-3">
            <p>
              Click the <b>Fetch</b> button to start pulling the latest
              product data from your store, using the settings from Step 3.
            </p>
            <DocImage src={`${ASSETS}/VEJBdkHpTK.png`} alt="Fetch button" />
            <p>
              A short message tells you roughly how long the fetch will take.
              While it's running, the button shows <b>Fetching</b> and the
              table keeps showing your current data.
            </p>
            <DocImage src={`${ASSETS}/uA510VSrF4.png`} alt="Fetching in progress" />
          </li>
          <li className="space-y-3">
            <p>
              Once fetching finishes, the table automatically updates to
              preview the merged result — combining your original CSV with
              the fresh data, following the Columns choices from Step 3.
            </p>
            <DocImage src={`${ASSETS}/Re5ySbngtO.png`} alt="Merged preview after fetching" />
            <p>
              For every included column (except the bold red ones), the tool
              always uses whatever value comes back from your store — even if
              that value happens to be blank. This is intentional: an empty
              value after fetching usually means your store genuinely has no
              value there, rather than the tool silently keeping an old value
              and hiding the problem from you.
            </p>
          </li>
          <li className="space-y-3">
            <p>
              If one or more products couldn't be fetched (for example, a
              product no longer exists on your store), a message box lists
              which ones failed and why. All other successfully fetched
              products are kept — just click <b>OK</b> to acknowledge the
              message and continue.
            </p>
            <DocImage src={`${ASSETS}/aCOmAVyMWv.png`} alt="Fetch error message" />
          </li>
        </DocList>
      </DocSectionBlock>

      <DocSectionBlock id="step-5" heading="Step 5: Download the updated CSV">
        <p>
          Click the <b>Download</b> button to save the CSV file shown in the
          preview table to your computer.
        </p>
        <DocImage src={`${ASSETS}/chrome_mj1WpVf0Xd.png`} alt="Download button" />
        <p>
          You don't have to fetch first — this button is available as soon as
          a CSV is imported, so you can also use it to simply save a copy of
          your original file.
        </p>
      </DocSectionBlock>

      <DocSectionBlock id="step-6" heading="Step 6: Rollback and detach">
        <p>After fetching, you have two ways to undo what you've done.</p>
        <DocSubHeading>Rollback</DocSubHeading>
        <p>
          Discards the freshly fetched data and brings the table back to
          showing only your original imported CSV. This is only available
          after a successful fetch.
        </p>
        <DocImage src={`${ASSETS}/chrome_ArxjUAVxV6.png`} alt="Rollback button" />
        <DocSubHeading>Detach</DocSubHeading>
        <p>
          Removes the imported file from the app completely and resets
          everything, so you can import a different CSV from scratch.
        </p>
        <DocImage src={`${ASSETS}/chrome_dUZh9ZTcti.png`} alt="Detach button" />
      </DocSectionBlock>

      <DocSectionBlock id="note" heading="Note">
        <p>
          <b>Handle</b> is the only column that can never be included or
          excluded, and its value can never be changed by fetching. It's
          shown in <span className="font-semibold text-destructive">bold red</span>{" "}
          with no checkbox, because it uniquely identifies each of your
          products — always keeping your original value avoids accidentally
          mixing products up.
        </p>
        <p>
          To keep the downloaded file simple, a number of other columns are{" "}
          <b>unchecked by default</b> — including pricing columns, inventory
          quantity, and a handful of extra fields (such as Badge Label,
          Activity, and Age group). These are ordinary checkboxes though —
          open <b>Configuration</b> and check any of them if you want that
          data included in the table and the downloaded CSV.
        </p>
      </DocSectionBlock>
    </>
  );
}

export const shopifyToolsArticle: DocArticleMeta = {
  slug: "shopify-tools",
  title: "Shopify Tools",
  description: "Step-by-step guide to syncing product data with the Shopify Tools app.",
  sections: [
    { id: "step-1", heading: "Step 1: Prepare product CSV" },
    { id: "step-2", heading: "Step 2: Open the tool and import your CSV" },
    { id: "step-3", heading: "Step 3: Set up configuration" },
    { id: "step-4", heading: "Step 4: Fetch the latest product data" },
    { id: "step-5", heading: "Step 5: Download the updated CSV" },
    { id: "step-6", heading: "Step 6: Rollback and detach" },
    { id: "note", heading: "Note" },
  ],
};
