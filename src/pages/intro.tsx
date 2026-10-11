import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon, PackageIcon, MapIcon, SlidersHorizontalIcon, PaletteIcon, BookOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { docCategories } from "@/content/docs/registry";

const CATEGORY_ICONS: Record<string, ReactNode> = {
  "page-section-mapping": <MapIcon className="size-5" />,
  "section-settings-reference": <SlidersHorizontalIcon className="size-5" />,
  "global-theme-settings": <PaletteIcon className="size-5" />,
  "operational-guidelines": <BookOpenIcon className="size-5" />,
};

export function IntroPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 p-6">
      <div className="space-y-3">
        <Badge variant="secondary">5DLA Shopify Tools</Badge>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          One place to run product data and read the store's documentation
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          This app brings together day-to-day Shopify tools and the written
          knowledge base for the 5DLA theme and store, so both the team
          running the shop and anyone handing it over have one shared place
          to work from.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <PackageIcon className="size-5" />
              <CardTitle>Tools</CardTitle>
            </div>
            <CardDescription>
              Sync and bulk-update product data between a CSV file and your
              live Shopify store.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link to="/productdatatool">
                Open Product Data Tool
                <ArrowRightIcon />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <BookOpenIcon className="size-5" />
              <CardTitle>Documents</CardTitle>
            </div>
            <CardDescription>
              Reference guides covering how pages, sections, and theme
              settings are put together and operated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {docCategories.map((category) => {
              const firstArticle = category.articles[0];
              return (
                <div key={category.slug} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {CATEGORY_ICONS[category.slug]}
                    {category.title}
                  </span>
                  {firstArticle ? (
                    <Link
                      to={`/doc/${category.slug}/${firstArticle.slug}`}
                      className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
                    >
                      {category.articles.length} article{category.articles.length === 1 ? "" : "s"}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">Coming soon</span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Use the sidebar to switch between the tools and the documentation at
        any time.
      </p>
    </div>
  );
}
