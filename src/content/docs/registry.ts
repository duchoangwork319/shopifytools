import type { DocArticle, DocArticleMeta, DocCategory } from "@/content/docs/types";
import type { ComponentType } from "react";
import { homepageArticle, HomepageContent } from "@/content/docs/page-section-mapping/homepage";
import {
  productListingPageArticle,
  ProductListingPageContent,
} from "@/content/docs/page-section-mapping/product-listing-page";
import {
  productDetailPageArticle,
  ProductDetailPageContent,
} from "@/content/docs/page-section-mapping/product-detail-page";
import {
  collectionBreadcrumbArticle,
  CollectionBreadcrumbContent,
} from "@/content/docs/section-settings-reference/collection-breadcrumb";
import {
  collectionBannerArticle,
  CollectionBannerContent,
} from "@/content/docs/section-settings-reference/collection-banner";
import {
  collectionSubcollectionsArticle,
  CollectionSubcollectionsContent,
} from "@/content/docs/section-settings-reference/collection-subcollections";
import {
  collectionProductGridArticle,
  CollectionProductGridContent,
} from "@/content/docs/section-settings-reference/collection-product-grid";
import {
  collectionContentSlotsArticle,
  CollectionContentSlotsContent,
} from "@/content/docs/section-settings-reference/collection-content-slots";
import {
  collectionBenefitsArticle,
  CollectionBenefitsContent,
} from "@/content/docs/section-settings-reference/collection-benefits";
import { contentSlotsArticle, ContentSlotsContent } from "@/content/docs/section-settings-reference/content-slots";
import { pageContentArticle, PageContentContent } from "@/content/docs/section-settings-reference/page-content";
import { themeSettingsArticle, ThemeSettingsContent } from "@/content/docs/global-theme-settings/theme-settings";
import { customVariantArticle, CustomVariantContent } from "@/content/docs/global-theme-settings/custom-variant";
import { searchArticle, SearchContent } from "@/content/docs/operational-guidelines/search";
import { shopifyToolsArticle, ShopifyToolsContent } from "@/content/docs/operational-guidelines/shopify-tools";
import {
  preorderWholesaleArticle,
  PreorderWholesaleContent,
} from "@/content/docs/operational-guidelines/preorder-wholesale";

function withContent(meta: DocArticleMeta, Content: ComponentType): DocArticle {
  return { ...meta, Content };
}

export const docCategories: DocCategory[] = [
  {
    slug: "page-section-mapping",
    title: "Page & Section Mapping",
    articles: [
      withContent(homepageArticle, HomepageContent),
      withContent(productListingPageArticle, ProductListingPageContent),
      withContent(productDetailPageArticle, ProductDetailPageContent),
    ],
  },
  {
    slug: "section-settings-reference",
    title: "Section Settings Reference",
    articles: [
      withContent(collectionBreadcrumbArticle, CollectionBreadcrumbContent),
      withContent(collectionBannerArticle, CollectionBannerContent),
      withContent(collectionSubcollectionsArticle, CollectionSubcollectionsContent),
      withContent(collectionProductGridArticle, CollectionProductGridContent),
      withContent(collectionContentSlotsArticle, CollectionContentSlotsContent),
      withContent(collectionBenefitsArticle, CollectionBenefitsContent),
      withContent(contentSlotsArticle, ContentSlotsContent),
      withContent(pageContentArticle, PageContentContent),
    ],
  },
  {
    slug: "global-theme-settings",
    title: "Global Theme Settings",
    articles: [
      withContent(themeSettingsArticle, ThemeSettingsContent),
      withContent(customVariantArticle, CustomVariantContent),
    ],
  },
  {
    slug: "operational-guidelines",
    title: "Operational Guidelines",
    articles: [
      withContent(searchArticle, SearchContent),
      withContent(shopifyToolsArticle, ShopifyToolsContent),
      withContent(preorderWholesaleArticle, PreorderWholesaleContent),
    ],
  },
];

export function getDocCategory(categorySlug: string): DocCategory | undefined {
  return docCategories.find((category) => category.slug === categorySlug);
}

export function getDocArticle(
  categorySlug: string,
  articleSlug: string
): { category: DocCategory; article: DocArticle } | undefined {
  const category = getDocCategory(categorySlug);
  const article = category?.articles.find((item) => item.slug === articleSlug);
  if (!category || !article) return undefined;
  return { category, article };
}
