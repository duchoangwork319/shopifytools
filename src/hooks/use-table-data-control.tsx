import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { PreviewDialog } from "@/components/preview-dialog";
import { mergeOriginWithOutput } from "@/lib/merge";
import { getIncludedHeaders, getPreviewDialogHeaderNames } from "@/lib/column-configuration";
import type { AnyDataRow, ColumnConfig, ShopifyCSVContainer } from "@/types/crawl";

const EMPTY_CONTAINER: ShopifyCSVContainer = { headers: [], data: [], handles: [] };

function createColumnsFromHeaders(headers: string[], previewDialogHeaders: Set<string>): ColumnDef<AnyDataRow>[] {
  return headers.map((header) => {
    if (previewDialogHeaders.has(header)) {
      return {
        header,
        accessorFn: row => `${String(row[header] ?? "")}`,
        cell: ({ row }) => {
          const cellValue = String(row.original[header]).trim();
          return cellValue ? <PreviewDialog
            triggerContent="Preview"
            title="Preview Content"
            description={`Preview HTML Content of ${header}`}
            realContent={String(cellValue)} /> : "";
        }
      };
    }
    return {
      header,
      accessorFn: row => `${String(row[header] ?? "")}`,
    };
  });
}

function rowsToObjects(headers: string[], rows: string[][]): AnyDataRow[] {
  return rows.map((row) => {
    const record: AnyDataRow = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    return record;
  });
}

/**
 * Single source of truth for the table: holds `origin` (parsed CSV, exactly
 * as imported) and `incoming` (freshly fetched rows) — both
 * `ShopifyCSVContainer` — and derives `visibleHeaders` (the full set of
 * currently-included columns per `columnConfiguration`, in columns.json's
 * order) plus the merged `staging` view (what the table renders and what
 * gets downloaded) via `mergeOriginWithOutput`.
 *
 * `visibleHeaders` is intentionally independent of `origin.headers` — it
 * defines the *output* column set from configuration alone, not a filter on
 * whatever columns the uploaded CSV happened to contain. This means a CSV
 * with only a `Handle` column still fetches and produces every configured
 * column (missing origin cells simply read as empty). Filtering is reactive
 * to `columnConfiguration`, so toggling a column's inclusion in the
 * Configuration drawer immediately hides/shows it here even for an
 * already-imported CSV — no re-import needed.
 *
 * `CrawlPage` pushes into this hook through `setOrigin`/`setIncomingData`;
 * this hook never talks to the file system or the network itself.
 */
export function useTableDataControl(columnConfiguration: ColumnConfig[]) {
  const [origin, setOrigin] = useState<ShopifyCSVContainer>(EMPTY_CONTAINER);
  const [incoming, setIncoming] = useState<ShopifyCSVContainer>(EMPTY_CONTAINER);

  const previewDialogHeaders = useMemo(() => getPreviewDialogHeaderNames(), []);

  const visibleHeaders = useMemo(
    () => getIncludedHeaders(columnConfiguration),
    [columnConfiguration]
  );

  const tableColumns = useMemo(
    () => createColumnsFromHeaders(visibleHeaders, previewDialogHeaders),
    [visibleHeaders, previewDialogHeaders]
  );

  const hasIncoming = incoming.data.length > 0;

  const visibleOrigin = useMemo(
    () => ({ headers: visibleHeaders, data: origin.data, handles: origin.handles }),
    [visibleHeaders, origin.data, origin.handles]
  );

  const stagingCsv = useMemo(() => {
    if (!hasIncoming) {
      return {
        headers: visibleHeaders,
        data: origin.data.map((row) => visibleHeaders.map((header) => String(row[header] ?? ""))),
      };
    }
    return mergeOriginWithOutput(visibleOrigin, incoming, columnConfiguration);
  }, [visibleOrigin, origin.data, visibleHeaders, incoming, hasIncoming, columnConfiguration]);

  const stagingRows = useMemo(
    () => rowsToObjects(stagingCsv.headers, stagingCsv.data),
    [stagingCsv]
  );

  const setIncomingData = useCallback((result: ShopifyCSVContainer) => {
    setIncoming(result);
  }, []);

  const clearIncoming = useCallback(() => {
    setIncoming(EMPTY_CONTAINER);
  }, []);

  const reset = useCallback(() => {
    setOrigin(EMPTY_CONTAINER);
    setIncoming(EMPTY_CONTAINER);
  }, []);

  return {
    origin,
    setOrigin,
    visibleHeaders,
    hasIncoming,
    tableColumns,
    stagingRows,
    stagingCsv,
    setIncomingData,
    clearIncoming,
    reset,
  };
}
