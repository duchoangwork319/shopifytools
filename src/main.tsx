import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import "./index.css"
import "./App.css";
import ShadcnApp from "./ShadcnApp.tsx"
import { TooltipProvider } from "./components/ui/tooltip.tsx"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TooltipProvider>
        <ShadcnApp />
      </TooltipProvider>
    </BrowserRouter>
  </StrictMode>,
)
