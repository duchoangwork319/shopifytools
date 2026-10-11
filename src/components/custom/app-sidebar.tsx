import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  PackageIcon,
  MapIcon,
  SlidersHorizontalIcon,
  PaletteIcon,
  BookOpenIcon,
} from "lucide-react";
import { getDocCategory } from "@/content/docs/registry";
import { useEffect } from "react";

function withDomain(path: string) {
  return "/" + path;
}

type L3Item = {
  title: string
  url: string
}

type L2Item = {
  title: string
  url?: string
  icon?: React.ReactNode
  items?: L3Item[]
}

type L1Group = {
  title: string
  items: L2Item[]
}

function docCategoryItems(categorySlug: string): L3Item[] {
  const category = getDocCategory(categorySlug);
  if (!category) return [];
  return category.articles.map((article) => ({
    title: article.title,
    url: `/doc/${category.slug}/${article.slug}`,
  }));
}

const data: { groups: L1Group[] } = {
  groups: [
    {
      title: "Tools",
      items: [
        {
          title: "Product",
          url: withDomain("productdatatool"),
          icon: <PackageIcon />,
        },
      ],
    },
    {
      title: "Documents",
      items: [
        {
          title: "Page & Section Mapping",
          icon: <MapIcon />,
          items: docCategoryItems("page-section-mapping"),
        },
        {
          title: "Section Settings Reference",
          icon: <SlidersHorizontalIcon />,
          items: docCategoryItems("section-settings-reference"),
        },
        {
          title: "Global Theme Settings",
          icon: <PaletteIcon />,
          items: docCategoryItems("global-theme-settings"),
        },
        {
          title: "Operational Guidelines",
          icon: <BookOpenIcon />,
          items: docCategoryItems("operational-guidelines"),
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar();
  const { pathname } = useLocation();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="https://5dla.com/" target="_blank" rel="noopener noreferrer">
                <img src="5Dla_New_Logo.png" alt="5DLA Logo" className="size-6!" />
                <span className="text-base font-semibold uppercase">5DLA.com</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.groups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) =>
                item.items && item.items.length > 0 ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          {item.icon}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link to={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link to={item.url ?? "#"}>
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
