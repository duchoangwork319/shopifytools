import { AppSidebar } from "@/components/custom/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { ProductDataTool } from "./pages/product-data";
import { IntroPage } from "./pages/intro";
import { DocPage } from "./pages/doc";
import { Toaster } from "./components/ui/sonner";
import { Route, Routes } from "react-router-dom";

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
            <Route index element={<IntroPage />} />
            <Route path="/" element={<IntroPage />} />
            <Route path="/productdatatool" element={<ProductDataTool />} />
            <Route path="/doc/:category/:article" element={<DocPage />} />
          </Routes>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </>
  );
}
