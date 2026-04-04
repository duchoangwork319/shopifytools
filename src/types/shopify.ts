export interface ShopifyImagePreview {
  aspect_ratio: number
  height: number
  width: number
  src: string
}

export interface ShopifyFeaturedMedia {
  alt: string | null
  id: number
  position: number
  preview_image: ShopifyImagePreview
}

export interface ShopifyVariantImage {
  id: number
  product_id: number
  position: number
  created_at: string
  updated_at: string
  alt: string | null
  width: number
  height: number
  src: string
  variant_ids: number[]
}

export interface ShopifyQuantityRule {
  min: number
  max: number | null
  increment: number
}

export interface ShopifyProductVariant {
  id: number
  title: string
  option1?: string | null
  option2?: string | null
  option3?: string | null
  sku: string
  requires_shipping: boolean
  taxable: boolean
  featured_image?: ShopifyVariantImage | null
  available: boolean
  name: string
  public_title?: string | null
  options: string[]
  price: number
  weight: number
  compare_at_price?: number | null
  inventory_management?: string | null
  barcode?: string | null
  featured_media?: ShopifyFeaturedMedia | null
  quantity_rule: ShopifyQuantityRule
  quantity_price_breaks: unknown[]
  requires_selling_plan: boolean
  selling_plan_allocations: unknown[]
}

export interface ShopifyProductOption {
  name: string
  position: number
  values: string[]
}

export interface ShopifyProductMedia {
  alt: string | null
  id: number
  position: number
  preview_image: ShopifyImagePreview
  aspect_ratio: number
  height: number
  media_type: string
  src: string
  width: number
}

export interface ShopifyProduct {
  id: number
  title: string
  handle: string
  description: string
  published_at?: string | null
  created_at: string
  vendor: string
  type: string
  tags: string[]
  price: number
  price_min: number
  price_max: number
  available: boolean
  price_varies: boolean
  compare_at_price?: number | null
  compare_at_price_min: number
  compare_at_price_max: number
  compare_at_price_varies: boolean
  variants: ShopifyProductVariant[]
  images: string[]
  featured_image?: string | null
  options: ShopifyProductOption[]
  url: string
  media: ShopifyProductMedia[]
  requires_selling_plan: boolean
  selling_plan_groups: unknown[]
  gift_card?: boolean
}
