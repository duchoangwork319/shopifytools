import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
// import { Route, Routes } from "react-router-dom"
import { CrawlPage } from "./pages/crawl-page"
import { Toaster } from "./components/ui/sonner"

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
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          {/* <Routes>
            <Route index element={<CrawlPage />} />
          </Routes> */}
          <CrawlPage />
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </>
  )
}
