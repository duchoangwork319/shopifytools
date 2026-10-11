import { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { TableOfContents } from "@/components/custom/table-of-contents";
import { getDocArticle } from "@/content/docs/registry";
import useFancybox from "@/hooks/use-fancybox";

const FANCYBOX_OPTIONS = {};

export function DocPage() {
  const { category: categorySlug, article: articleSlug } = useParams();
  const { hash } = useLocation();
  const found = categorySlug && articleSlug ? getDocArticle(categorySlug, articleSlug) : undefined;
  const [setFancyboxRoot] = useFancybox(FANCYBOX_OPTIONS);

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace(/^#/, "");
    const target = document.getElementById(id);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash, found?.article.slug]);

  if (!found) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Article not found.</p>
      </div>
    );
  }

  const { category, article } = found;

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_240px]">
      <article className="min-w-0" ref={setFancyboxRoot}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {category.title}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{article.title}</h1>
          {article.description ? (
            <p className="text-sm text-muted-foreground">{article.description}</p>
          ) : null}
        </div>
        <article.Content />
      </article>

      <aside className="hidden lg:block">
        <div className="sticky top-20">
          <TableOfContents sections={article.sections} />
        </div>
      </aside>

      <Drawer>
        <DrawerTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-6 right-6 z-40 size-12 rounded-full shadow-lg lg:hidden"
          >
            <ListIcon className="size-5" />
            <span className="sr-only">On this page</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>On this page</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <TableOfContents sections={article.sections} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
