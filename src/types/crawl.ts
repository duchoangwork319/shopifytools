import type { ColumnDef } from "@tanstack/react-table"

export type CsvCellValue = string | number | boolean | null

export interface FetchByHandleResult {
  handle: string
  json: string
  html: string
  rows: string[][]
}

export type AnyDataRow = Record<string, string>
export interface ShopifyCSVContainer {
  headers: string[]
  data: AnyDataRow[]
  handles: string[]
}

export interface StaticShopifyCSVRow {
  Handle: string
  Title: string
  "Body (HTML)": string
  Vendor: string
  "Product Category": string
  Type: string
  Tags: string
  Published: string
  "Option1 Name": string
  "Option1 Value": string
  "Option1 Linked To": string
  "Option2 Name": string
  "Option2 Value": string
  "Option2 Linked To": string
  "Option3 Name": string
  "Option3 Value": string
  "Option3 Linked To": string
  "Variant SKU": string
  "Variant Grams": string
  "Variant Inventory Tracker": string
  "Variant Inventory Qty": string
  "Variant Inventory Policy": string
  "Variant Fulfillment Service": string
  "Variant Price": string
  "Variant Compare At Price": string
  "Variant Requires Shipping": string
  "Variant Taxable": string
  "Unit Price Total Measure": string
  "Unit Price Total Measure Unit": string
  "Unit Price Base Measure": string
  "Unit Price Base Measure Unit": string
  "Variant Barcode": string
  "Image Src": string
  "Image Position": string
  "Image Alt Text": string
  "Gift Card": string
  "SEO Title": string
  "SEO Description": string
  "Google Shopping / Google Product Category": string
  "Google Shopping / Gender": string
  "Google Shopping / Age Group": string
  "Google Shopping / MPN": string
  "Google Shopping / Condition": string
  "Google Shopping / Custom Product": string
  "Google Shopping / Custom Label 0": string
  "Google Shopping / Custom Label 1": string
  "Google Shopping / Custom Label 2": string
  "Google Shopping / Custom Label 3": string
  "Google Shopping / Custom Label 4": string
  "Size Chart (product.metafields.bwp_fields.size_chart)": string
  "Google: Custom Product (product.metafields.mm-google-shopping.custom_product)": string
  "Product rating count (product.metafields.reviews.rating_count)": string
  "Color (product.metafields.shopify.color-pattern)": string
  "Target gender (product.metafields.shopify.target-gender)": string
  "Complementary products (product.metafields.shopify--discovery--product_recommendation.complementary_products)": string
  "Related products (product.metafields.shopify--discovery--product_recommendation.related_products)": string
  "Related products settings (product.metafields.shopify--discovery--product_recommendation.related_products_display)": string
  "Search product boosts (product.metafields.shopify--discovery--product_search_boost.queries)": string
  "Variant Image": string
  "Variant Weight Unit": string
  "Variant Tax Code": string
  "Cost per item": string
  Status: string
}

export const columns: ColumnDef<StaticShopifyCSVRow>[] = [
  {
    header: "Handle",
    accessorFn: row => `${row["Handle"] || ""}`,
  },
  {
    header: "Title",
    accessorFn: row => `${row["Title"] || ""}`,
  },
  {
    header: "Body (HTML)",
    accessorFn: row => `${row["Body (HTML)"] || ""}`,
  },
  {
    header: "Vendor",
    accessorFn: row => `${row["Vendor"] || ""}`,
  },
  {
    header: "Product Category",
    accessorFn: row => `${row["Product Category"] || ""}`,
  },
  {
    header: "Type",
    accessorFn: row => `${row["Type"] || ""}`,
  },
  {
    header: "Tags",
    accessorFn: row => `${row["Tags"] || ""}`,
  },
  {
    header: "Published",
    accessorFn: row => `${row["Published"] || ""}`,
  },
  {
    header: "Option1 Name",
    accessorFn: row => `${row["Option1 Name"] || ""}`,
  },
  {
    header: "Option1 Value",
    accessorFn: row => `${row["Option1 Value"] || ""}`,
  },
  {
    header: "Option1 Linked To",
    accessorFn: row => `${row["Option1 Linked To"] || ""}`,
  },
  {
    header: "Option2 Name",
    accessorFn: row => `${row["Option2 Name"] || ""}`,
  },
  {
    header: "Option2 Value",
    accessorFn: row => `${row["Option2 Value"] || ""}`,
  },
  {
    header: "Option2 Linked To",
    accessorFn: row => `${row["Option2 Linked To"] || ""}`,
  },
  {
    header: "Option3 Name",
    accessorFn: row => `${row["Option3 Name"] || ""}`,
  },
  {
    header: "Option3 Value",
    accessorFn: row => `${row["Option3 Value"] || ""}`,
  },
  {
    header: "Option3 Linked To",
    accessorFn: row => `${row["Option3 Linked To"] || ""}`,
  },
  {
    header: "Variant SKU",
    accessorFn: row => `${row["Variant SKU"] || ""}`,
  },
  {
    header: "Variant Grams",
    accessorFn: row => `${row["Variant Grams"] || ""}`,
  },
  {
    header: "Variant Inventory Tracker",
    accessorFn: row => `${row["Variant Inventory Tracker"] || ""}`,
  },
  {
    header: "Variant Inventory Qty",
    accessorFn: row => `${row["Variant Inventory Qty"] || ""}`,
  },
  {
    header: "Variant Inventory Policy",
    accessorFn: row => `${row["Variant Inventory Policy"] || ""}`,
  },
  {
    header: "Variant Fulfillment Service",
    accessorFn: row => `${row["Variant Fulfillment Service"] || ""}`,
  },
  {
    header: "Variant Price",
    accessorFn: row => `${row["Variant Price"] || ""}`,
  },
  {
    header: "Variant Compare At Price",
    accessorFn: row => `${row["Variant Compare At Price"] || ""}`,
  },
  {
    header: "Variant Requires Shipping",
    accessorFn: row => `${row["Variant Requires Shipping"] || ""}`,
  },
  {
    header: "Variant Taxable",
    accessorFn: row => `${row["Variant Taxable"] || ""}`,
  },
  {
    header: "Unit Price Total Measure",
    accessorFn: row => `${row["Unit Price Total Measure"] || ""}`,
  },
  {
    header: "Unit Price Total Measure Unit",
    accessorFn: row => `${row["Unit Price Total Measure Unit"] || ""}`,
  },
  {
    header: "Unit Price Base Measure",
    accessorFn: row => `${row["Unit Price Base Measure"] || ""}`,
  },
  {
    header: "Unit Price Base Measure Unit",
    accessorFn: row => `${row["Unit Price Base Measure Unit"] || ""}`,
  },
  {
    header: "Variant Barcode",
    accessorFn: row => `${row["Variant Barcode"] || ""}`,
  },
  {
    header: "Image Src",
    accessorFn: row => `${row["Image Src"] || ""}`,
  },
  {
    header: "Image Position",
    accessorFn: row => `${row["Image Position"] || ""}`,
  },
  {
    header: "Image Alt Text",
    accessorFn: row => `${row["Image Alt Text"] || ""}`,
  },
  {
    header: "Gift Card",
    accessorFn: row => `${row["Gift Card"] || ""}`,
  },
  {
    header: "SEO Title",
    accessorFn: row => `${row["SEO Title"] || ""}`,
  },
  {
    header: "SEO Description",
    accessorFn: row => `${row["SEO Description"] || ""}`,
  },
  {
    header: "Google Shopping / Google Product Category",
    accessorFn: row => `${row["Google Shopping / Google Product Category"] || ""}`,
  },
  {
    header: "Google Shopping / Gender",
    accessorFn: row => `${row["Google Shopping / Gender"] || ""}`,
  },
  {
    header: "Google Shopping / Age Group",
    accessorFn: row => `${row["Google Shopping / Age Group"] || ""}`,
  },
  {
    header: "Google Shopping / MPN",
    accessorFn: row => `${row["Google Shopping / MPN"] || ""}`,
  },
  {
    header: "Google Shopping / Condition",
    accessorFn: row => `${row["Google Shopping / Condition"] || ""}`,
  },
  {
    header: "Google Shopping / Custom Product",
    accessorFn: row => `${row["Google Shopping / Custom Product"] || ""}`,
  },
  {
    header: "Google Shopping / Custom Label 0",
    accessorFn: row => `${row["Google Shopping / Custom Label 0"] || ""}`,
  },
  {
    header: "Google Shopping / Custom Label 1",
    accessorFn: row => `${row["Google Shopping / Custom Label 1"] || ""}`,
  },
  {
    header: "Google Shopping / Custom Label 2",
    accessorFn: row => `${row["Google Shopping / Custom Label 2"] || ""}`,
  },
  {
    header: "Google Shopping / Custom Label 3",
    accessorFn: row => `${row["Google Shopping / Custom Label 3"] || ""}`,
  },
  {
    header: "Google Shopping / Custom Label 4",
    accessorFn: row => `${row["Google Shopping / Custom Label 4"] || ""}`,
  },
  {
    header: "Size Chart (product.metafields.bwp_fields.size_chart)",
    accessorFn: row => `${row["Size Chart (product.metafields.bwp_fields.size_chart)"] || ""}`,
  },
  {
    header: "Google: Custom Product (product.metafields.mm-google-shopping.custom_product)",
    accessorFn: row => `${row["Google: Custom Product (product.metafields.mm-google-shopping.custom_product)"] || ""}`,
  },
  {
    header: "Product rating count (product.metafields.reviews.rating_count)",
    accessorFn: row => `${row["Product rating count (product.metafields.reviews.rating_count)"] || ""}`,
  },
  {
    header: "Color (product.metafields.shopify.color-pattern)",
    accessorFn: row => `${row["Color (product.metafields.shopify.color-pattern)"] || ""}`,
  },
  {
    header: "Target gender (product.metafields.shopify.target-gender)",
    accessorFn: row => `${row["Target gender (product.metafields.shopify.target-gender)"] || ""}`,
  },
  {
    header: "Complementary products (product.metafields.shopify--discovery--product_recommendation.complementary_products)",
    accessorFn: row => `${row["Complementary products (product.metafields.shopify--discovery--product_recommendation.complementary_products)"] || ""}`,
  },
  {
    header: "Related products (product.metafields.shopify--discovery--product_recommendation.related_products)",
    accessorFn: row => `${row["Related products (product.metafields.shopify--discovery--product_recommendation.related_products)"] || ""}`,
  },
  {
    header: "Related products settings (product.metafields.shopify--discovery--product_recommendation.related_products_display)",
    accessorFn: row => `${row["Related products settings (product.metafields.shopify--discovery--product_recommendation.related_products_display)"] || ""}`,
  },
  {
    header: "Search product boosts (product.metafields.shopify--discovery--product_search_boost.queries)",
    accessorFn: row => `${row["Search product boosts (product.metafields.shopify--discovery--product_search_boost.queries)"] || ""}`,
  },
  {
    header: "Variant Image",
    accessorFn: row => `${row["Variant Image"] || ""}`,
  },
  {
    header: "Variant Weight Unit",
    accessorFn: row => `${row["Variant Weight Unit"] || ""}`,
  },
  {
    header: "Variant Tax Code",
    accessorFn: row => `${row["Variant Tax Code"] || ""}`,
  },
  {
    header: "Cost per item",
    accessorFn: row => `${row["Cost per item"] || ""}`,
  },
  {
    header: "Status",
    accessorFn: row => `${row["Status"] || ""}`,
  },
]

export function createColumnsFromHeaders(headers: string[]): ColumnDef<AnyDataRow>[] {
  return headers.map((header) => ({
    header,
    accessorFn: row => `${row[header] ?? ""}`,
  }))
}