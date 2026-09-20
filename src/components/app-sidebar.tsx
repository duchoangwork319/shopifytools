import * as React from "react"

// import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
// import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  // SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  // ChartBarIcon, FolderIcon, UsersIcon, SearchIcon, ListIcon,
  CameraIcon, FileTextIcon, CircleHelpIcon,
  DatabaseIcon, FileChartColumnIcon, FileIcon, CommandIcon,
  CloudSyncIcon
} from "lucide-react"

function withDomain(path: string) {
  // if (location.origin.includes("github.io")) {
  //   return new URL(`shopifytools/${path}`, location.origin).toString()
  // }
  return "/" + path
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const data = {
    user: {
      name: "5DLA",
      email: "info@5dla.com",
      avatar: "./5DLA_header_logo_white_bg.png",
    },
    navMain: [
      {
        title: "Sync",
        url: withDomain("/"),
        icon: (
          <CloudSyncIcon />
        ),
      },
    ],
    navClouds: [
      {
        title: "Capture",
        icon: (
          <CameraIcon
          />
        ),
        isActive: true,
        url: withDomain("#"),
        items: [
          {
            title: "Active Proposals",
            url: withDomain("#"),
          },
          {
            title: "Archived",
            url: withDomain("#"),
          },
        ],
      },
      {
        title: "Proposal",
        icon: (
          <FileTextIcon
          />
        ),
        url: withDomain("#"),
        items: [
          {
            title: "Active Proposals",
            url: withDomain("#"),
          },
          {
            title: "Archived",
            url: withDomain("#"),
          },
        ],
      },
      {
        title: "Prompts",
        icon: (
          <FileTextIcon
          />
        ),
        url: withDomain("#"),
        items: [
          {
            title: "Active Proposals",
            url: withDomain("#"),
          },
          {
            title: "Archived",
            url: withDomain("#"),
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: "Get Help",
        url: "https://duchoangwork319.github.io/theme-azeno-v1-guideline/shopify_tools.html",
        icon: (
          <CircleHelpIcon
          />
        ),
      },
    ],
    documents: [
      {
        name: "Data Library",
        url: "#",
        icon: (
          <DatabaseIcon
          />
        ),
      },
      {
        name: "Reports",
        url: "#",
        icon: (
          <FileChartColumnIcon
          />
        ),
      },
      {
        name: "Word Assistant",
        url: "#",
        icon: (
          <FileIcon
          />
        ),
      },
    ],
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">5DLA.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      {/* <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter> */}
    </Sidebar>
  )
}
