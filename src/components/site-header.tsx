import { matchPath, useLocation } from "react-router-dom"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { getDocArticle } from "@/content/docs/registry"
import { ThemeToggle } from "./mode-toggle"

function usePageBreadcrumb(): string[] {
  const { pathname } = useLocation()
  const docMatch = matchPath("/doc/:category/:article", pathname)
  const found = docMatch
    ? getDocArticle(docMatch.params.category ?? "", docMatch.params.article ?? "")
    : undefined

  if (found) {
    return ["Documents", found.category.title, found.article.title]
  }

  if (matchPath("/productdatatool", pathname)) {
    return ["Tools", "Product"]
  }

  return ["Intro"]
}

export function SiteHeader() {
  const crumbs = usePageBreadcrumb()

  return (
    <header className="sticky top-0 bg-(--background) flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2"
        />
        <h1 className="font-medium text-xs lg:text-base">
          <Breadcrumb className="hidden lg:flex">
            <BreadcrumbList className="flex-nowrap">
              {crumbs.map((label, index) => (
                <li key={`${label}-${index}`} className="contents">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-xs lg:text-base font-medium">{label}</BreadcrumbPage>
                  </BreadcrumbItem>
                </li>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          {
            crumbs.length > 0 &&
            <span className="text-base font-medium lg:hidden">{crumbs[crumbs.length - 1]}</span>
          }
        </h1>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
