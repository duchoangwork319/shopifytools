import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { CrawlPage } from "./pages/crawl-page"
import { Toaster } from "./components/ui/sonner"
import { Route, Routes } from "react-router-dom"

export default function ShadcnApp() {
  return (
    <>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
        className="max-w-full"
      >
        <AppSidebar variant="inset" />
        <SidebarInset
          className="md:max-w-[calc(100%-var(--sidebar-width))] md:peer-data-[state=collapsed]:max-w-[calc(100%-var(--spacing)*4)]">
          <SiteHeader />
          <Routes>
            <Route index element={<CrawlPage />} />
            <Route path="/shopifytools" element={<CrawlPage />} />
          </Routes>
          {/* <CrawlPage /> */}
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </>
  )
}
