import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import "./index.css"
import "./App.css";
import ShadcnApp from "./ShadcnApp.tsx"
import { TooltipProvider } from "./components/ui/tooltip.tsx"
import { ThemeProvider } from "./components/mode-toggle.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <BrowserRouter>
          <ShadcnApp />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
)
