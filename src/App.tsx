import { Navigate, Route, Routes } from "react-router-dom"

// import { AppShell } from "@/components/layout/app-shell"
import { CrawlPage } from "@/pages/crawl-page"
import { MergePage } from "@/pages/merge-page"

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/crawl" replace />} />
        <Route path="/crawl" element={<CrawlPage />} />
        <Route path="/merge" element={<MergePage />} />
      </Routes>
    </>
  )
}

export default App
