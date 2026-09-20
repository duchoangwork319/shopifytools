import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { PreviewDialog } from "@/components/preview-dialog";
import { mergeOriginWithOutput } from "@/lib/merge";
import {
  getPreviewDialogHeaderNames,
  loadColumnConfiguration,
  saveColumnConfiguration,
} from "@/lib/column-configuration";
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
 * Single source of truth for the table: holds `origin` (parsed CSV) and
 * `incoming` (freshly fetched rows) — both `ShopifyCSVContainer` — and derives
 * the merged `staging` view (what the table renders and what gets downloaded)
 * via `mergeOriginWithOutput`. `CrawlPage` pushes into this hook through
 * `setOrigin`/`setIncomingData`; this hook never talks to the file system or
 * the network itself.
 */
export function useTableDataControl() {
  const [origin, setOrigin] = useState<ShopifyCSVContainer>(EMPTY_CONTAINER);
  const [incoming, setIncoming] = useState<ShopifyCSVContainer>(EMPTY_CONTAINER);
  const [columnConfiguration, setColumnConfigurationState] = useState<ColumnConfig[]>(() => loadColumnConfiguration());

  const previewDialogHeaders = useMemo(() => getPreviewDialogHeaderNames(), []);
  const tableColumns = useMemo(
    () => createColumnsFromHeaders(origin.headers, previewDialogHeaders),
    [origin.headers, previewDialogHeaders]
  );

  const hasIncoming = incoming.data.length > 0;

  const stagingCsv = useMemo(() => {
    if (!hasIncoming) {
      return {
        headers: origin.headers,
        data: origin.data.map((row) => origin.headers.map((header) => String(row[header] ?? ""))),
      };
    }
    return mergeOriginWithOutput(origin, incoming, columnConfiguration);
  }, [origin, incoming, hasIncoming, columnConfiguration]);

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

  const setColumnConfiguration = useCallback((config: ColumnConfig[]) => {
    setColumnConfigurationState(config);
    saveColumnConfiguration(config);
  }, []);

  return {
    origin,
    setOrigin,
    hasIncoming,
    tableColumns,
    stagingRows,
    stagingCsv,
    columnConfiguration,
    setColumnConfiguration,
    setIncomingData,
    clearIncoming,
    reset,
  };
}
