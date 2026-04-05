import type { ColumnDef } from "@tanstack/react-table"

export type CsvCellValue = string | number | boolean | null

export interface CrawlResult {
  handle: string
  json: string
  html: string
  rows: string[][]
}

export type AnyDataRow = Record<string, string>
export interface ShopifyCSVContainer {
  headers: string[]
  data: StaticShopifyCSVRow[]
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

// export interface CamelCaseShopifyCSVRow {
//   handle: string
//   title: string
//   bodyHtml: string
//   vendor: string
//   productCategory: string
//   type: string
//   tags: string
//   published: string
//   option1Name: string
//   option1Value: string
//   option1LinkedTo: string
//   option2Name: string
//   option2Value: string
//   option2LinkedTo: string
//   option3Name: string
//   option3Value: string
//   option3LinkedTo: string
//   variantSku: string
//   variantGrams: string
//   variantInventoryTracker: string
//   variantInventoryQty: string
//   variantInventoryPolicy: string
//   variantFulfillmentService: string
//   variantPrice: string
//   variantCompareAtPrice: string
//   variantRequiresShipping: string
//   variantTaxable: string
//   unitPriceTotalMeasure: string
//   unitPriceTotalMeasureUnit: string
//   unitPriceBaseMeasure: string
//   unitPriceBaseMeasureUnit: string
//   variantBarcode: string
//   imageSrc: string
//   imagePosition: string
//   imageAltText: string
//   giftCard: string
//   seoTitle: string
//   seoDescription: string
//   googleShoppingGoogleProductCategory: string
//   googleShoppingGender: string
//   googleShoppingAgeGroup: string
//   googleShoppingMpn: string
//   googleShoppingCondition: string
//   googleShoppingCustomProduct: string
//   googleShoppingCustomLabel0: string
//   googleShoppingCustomLabel1: string
//   googleShoppingCustomLabel2: string
//   googleShoppingCustomLabel3: string
//   googleShoppingCustomLabel4: string
//   sizeChartProductMetafieldsBwpFieldsSizeChart: string
//   googleCustomProductProductMetafieldsMmGoogleShoppingCustomProduct: string
//   productRatingCountProductMetafieldsReviewsRatingCount: string
//   colorProductMetafieldsShopifyColorPattern: string
//   targetGenderProductMetafieldsShopifyTargetGender: string
//   complementaryProductsProductMetafieldsShopifyDiscoveryProductRecommendationComplementaryProducts: string
//   relatedProductsProductMetafieldsShopifyDiscoveryProductRecommendationRelatedProducts: string
//   relatedProductsSettingsProductMetafieldsShopifyDiscoveryProductRecommendationRelatedProductsDisplay: string
//   searchProductBoostsProductMetafieldsShopifyDiscoveryProductSearchBoostQueries: string
//   variantImage: string
//   variantWeightUnit: string
//   variantTaxCode: string
//   costPerItem: string
//   status: string
// }

export const columns: ColumnDef<StaticShopifyCSVRow>[] = [
  {
    accessorKey: "Handle",
    header: "Handle",
  },
  {
    accessorKey: "Title",
    header: "Title",
  },
  {
    accessorKey: "Body (HTML)",
    header: "Body (HTML)",
  },
  {
    accessorKey: "Vendor",
    header: "Vendor",
  },
  {
    accessorKey: "Product Category",
    header: "Product Category",
  },
  {
    accessorKey: "Type",
    header: "Type",
  },
  {
    accessorKey: "Tags",
    header: "Tags",
  },
  {
    accessorKey: "Published",
    header: "Published",
  },
  {
    accessorKey: "Option1 Name",
    header: "Option1 Name",
  },
  {
    accessorKey: "Option1 Value",
    header: "Option1 Value",
  },
  {
    accessorKey: "Option1 Linked To",
    header: "Option1 Linked To",
  },
  {
    accessorKey: "Option2 Name",
    header: "Option2 Name",
  },
  {
    accessorKey: "Option2 Value",
    header: "Option2 Value",
  },
  {
    accessorKey: "Option2 Linked To",
    header: "Option2 Linked To",
  },
  {
    accessorKey: "Option3 Name",
    header: "Option3 Name",
  },
  {
    accessorKey: "Option3 Value",
    header: "Option3 Value",
  },
  {
    accessorKey: "Option3 Linked To",
    header: "Option3 Linked To",
  },
  {
    accessorKey: "Variant SKU",
    header: "Variant SKU",
  },
  {
    accessorKey: "Variant Grams",
    header: "Variant Grams",
  },
  {
    accessorKey: "Variant Inventory Tracker",
    header: "Variant Inventory Tracker",
  },
  {
    accessorKey: "Variant Inventory Qty",
    header: "Variant Inventory Qty",
  },
  {
    accessorKey: "Variant Inventory Policy",
    header: "Variant Inventory Policy",
  },
  {
    accessorKey: "Variant Fulfillment Service",
    header: "Variant Fulfillment Service",
  },
  {
    accessorKey: "Variant Price",
    header: "Variant Price",
  },
  {
    accessorKey: "Variant Compare At Price",
    header: "Variant Compare At Price",
  },
  {
    accessorKey: "Variant Requires Shipping",
    header: "Variant Requires Shipping",
  },
  {
    accessorKey: "Variant Taxable",
    header: "Variant Taxable",
  },
  {
    accessorKey: "Unit Price Total Measure",
    header: "Unit Price Total Measure",
  },
  {
    accessorKey: "Unit Price Total Measure Unit",
    header: "Unit Price Total Measure Unit",
  },
  {
    accessorKey: "Unit Price Base Measure",
    header: "Unit Price Base Measure",
  },
  {
    accessorKey: "Unit Price Base Measure Unit",
    header: "Unit Price Base Measure Unit",
  },
  {
    accessorKey: "Variant Barcode",
    header: "Variant Barcode",
  },
  {
    accessorKey: "Image Src",
    header: "Image Src",
  },
  {
    accessorKey: "Image Position",
    header: "Image Position",
  },
  {
    accessorKey: "Image Alt Text",
    header: "Image Alt Text",
  },
  {
    accessorKey: "Gift Card",
    header: "Gift Card",
  },
  {
    accessorKey: "SEO Title",
    header: "SEO Title",
  },
  {
    accessorKey: "SEO Description",
    header: "SEO Description",
  },
  {
    accessorKey: "Google Shopping / Google Product Category",
    header: "Google Shopping / Google Product Category",
  },
  {
    accessorKey: "Google Shopping / Gender",
    header: "Google Shopping / Gender",
  },
  {
    accessorKey: "Google Shopping / Age Group",
    header: "Google Shopping / Age Group",
  },
  {
    accessorKey: "Google Shopping / MPN",
    header: "Google Shopping / MPN",
  },
  {
    accessorKey: "Google Shopping / Condition",
    header: "Google Shopping / Condition",
  },
  {
    accessorKey: "Google Shopping / Custom Product",
    header: "Google Shopping / Custom Product",
  },
  {
    accessorKey: "Google Shopping / Custom Label 0",
    header: "Google Shopping / Custom Label 0",
  },
  {
    accessorKey: "Google Shopping / Custom Label 1",
    header: "Google Shopping / Custom Label 1",
  },
  {
    accessorKey: "Google Shopping / Custom Label 2",
    header: "Google Shopping / Custom Label 2",
  },
  {
    accessorKey: "Google Shopping / Custom Label 3",
    header: "Google Shopping / Custom Label 3",
  },
  {
    accessorKey: "Google Shopping / Custom Label 4",
    header: "Google Shopping / Custom Label 4",
  },
  {
    accessorKey: "Size Chart (product.metafields.bwp_fields.size_chart)",
    header: "Size Chart (product.metafields.bwp_fields.size_chart)",
  },
  {
    accessorKey: "Google: Custom Product (product.metafields.mm-google-shopping.custom_product)",
    header: "Google: Custom Product (product.metafields.mm-google-shopping.custom_product)",
  },
  {
    accessorKey: "Product rating count (product.metafields.reviews.rating_count)",
    header: "Product rating count (product.metafields.reviews.rating_count)",
  },
  {
    accessorKey: "Color (product.metafields.shopify.color-pattern)",
    header: "Color (product.metafields.shopify.color-pattern)",
  },
  {
    accessorKey: "Target gender (product.metafields.shopify.target-gender)",
    header: "Target gender (product.metafields.shopify.target-gender)",
  },
  {
    accessorKey: "Complementary products (product.metafields.shopify--discovery--product_recommendation.complementary_products)",
    header: "Complementary products (product.metafields.shopify--discovery--product_recommendation.complementary_products)",
  },
  {
    accessorKey: "Related products (product.metafields.shopify--discovery--product_recommendation.related_products)",
    header: "Related products (product.metafields.shopify--discovery--product_recommendation.related_products)",
  },
  {
    accessorKey: "Related products settings (product.metafields.shopify--discovery--product_recommendation.related_products_display)",
    header: "Related products settings (product.metafields.shopify--discovery--product_recommendation.related_products_display)",
  },
  {
    accessorKey: "Search product boosts (product.metafields.shopify--discovery--product_search_boost.queries)",
    header: "Search product boosts (product.metafields.shopify--discovery--product_search_boost.queries)",
  },
  {
    accessorKey: "Variant Image",
    header: "Variant Image",
  },
  {
    accessorKey: "Variant Weight Unit",
    header: "Variant Weight Unit",
  },
  {
    accessorKey: "Variant Tax Code",
    header: "Variant Tax Code",
  },
  {
    accessorKey: "Cost per item",
    header: "Cost per item",
  },
  {
    accessorKey: "Status",
    header: "Status",
  },
]
