import { Download, Play, Store, Terminal } from "lucide-react"
import { useEffect, useState } from "react"

import { HandleBoard } from "@/components/handle-board"
import { ProductTable } from "@/components/product-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  createCsvString,
  createTimestampedFilename,
  downloadCsv,
} from "@/lib/csv"
import {
  crawlHandle,
  extractHandles,
  getCsvHeaders,
  inferStoreOrigin,
} from "@/lib/shopify"
import type { ProductCsvRow, ProductRecordMap } from "@/types/crawl"

const STORE_ORIGIN_KEY = "spf_store_origin"

export function CrawlPage() {
  const headers = getCsvHeaders()
  const [storeOrigin, setStoreOrigin] = useState("")
  const [pastedValue, setPastedValue] = useState("")
  const [handles, setHandles] = useState<string[]>([])
  const [productRecord, setProductRecord] = useState<ProductRecordMap>(new Map())
  const [status, setStatus] = useState("Idle")
  const [error, setError] = useState("")
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    const savedOrigin = localStorage.getItem(STORE_ORIGIN_KEY)
    setStoreOrigin(savedOrigin || window.location.origin)
  }, [])

  function commitPastedValue() {
    if (!pastedValue.trim()) return

    const inferredOrigin = inferStoreOrigin(pastedValue)
    if (inferredOrigin && !storeOrigin.trim()) {
      setStoreOrigin(inferredOrigin)
      localStorage.setItem(STORE_ORIGIN_KEY, inferredOrigin)
    }

    setHandles((current) =>
      Array.from(new Set([...current, ...extractHandles(pastedValue)])),
    )
    setPastedValue("")
  }

  function removeHandle(handle: string) {
    setHandles((current) => current.filter((item) => item !== handle))
  }

  async function handleStart() {
    if (handles.length === 0) {
      setError("Add at least one handle before starting.")
      return
    }

    if (!storeOrigin.trim()) {
      setError("Enter a Shopify store origin before starting.")
      return
    }

    setIsRunning(true)
    setError("")

    try {
      const newRecord: ProductRecord = new Map();

      for (const handle of handles) {
        setStatus(`Fetching ${handle}...`)
        const result = await crawlHandle(handle, storeOrigin)
        newRecord.set(handle, { handle: handle, rows: result.rows })
      }

      setProductRecord((current) => (new Map([...current.entries(), ...newRecord.entries()])))
      setStatus(`Completed ${handles.length} handle${handles.length === 1 ? "" : "s"}.`)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Crawl failed."
      setError(message)
      setStatus("Failed")
    } finally {
      setIsRunning(false)
    }
  }

  function handleExport() {
    // const csv = createCsvString(headers, productRecord)
    // downloadCsv(createTimestampedFilename(), csv)
    // setStatus(`Exported ${productRecord.length} row${productRecord.length === 1 ? "" : "s"}.`)
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Crawl
        </p>
        <h2 className="text-3xl font-semibold tracking-tight">
          Product crawl workspace
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Paste handles, fetch each Shopify product, flatten the responses into CSV-ready rows, and export the combined table.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid gap-2 xl:min-w-[360px] xl:flex-1">
              <label
                htmlFor="store-origin"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Store className="size-4 text-primary" />
                Shopify store origin
              </label>
              <input
                id="store-origin"
                value={storeOrigin}
                onChange={(event) => {
                  const value = event.target.value
                  setStoreOrigin(value)
                  localStorage.setItem(STORE_ORIGIN_KEY, value)
                }}
                placeholder="https://your-store.myshopify.com"
                className="h-11 rounded-2xl border border-input bg-background/80 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleStart} disabled={isRunning || handles.length === 0}>
                <Play className="size-4" />
                Start
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={productRecord.size === 0}
              >
                <Download className="size-4" />
                Export
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-primary">
              <Terminal className="size-4" />
              <span>{status}</span>
            </div>
            <div className="text-muted-foreground">{handles.length} handles queued</div>
            <div className="text-muted-foreground">{productRecord.size} rows ready</div>
            {error ? <div className="text-destructive">{error}</div> : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <HandleBoard
          handles={handles}
          pastedValue={pastedValue}
          onPastedValueChange={setPastedValue}
          onPasteCommit={commitPastedValue}
          onDeleteHandle={removeHandle}
        />
        <ProductTable headers={headers} record={productRecord} />
      </div>
    </section>
  )
}
