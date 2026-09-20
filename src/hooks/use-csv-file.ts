import { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { createTimestampedFilename, downloadCsv } from "@/lib/csv";
import { excludeHeaders } from "@/lib/column-configuration";
import { showError } from "@/lib/toast";
import type { AnyDataRow, ShopifyCSVContainer } from "@/types/crawl";

const EMPTY_RESULT: ShopifyCSVContainer = { headers: [], data: [], handles: [] };

/**
 * Owns the uploaded CSV `File` and the mechanics of parsing/downloading it.
 * The parsed result is kept as internal state and exposed via `toReactTableData`
 * (a `ShopifyCSVContainer`), for `CrawlPage` to sync into `useTableDataControl`
 * via an effect. This hook does not know about the table-control hook.
 */
export function useCSVFile() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [toReactTableData, setParsedResult] = useState<ShopifyCSVContainer>(EMPTY_RESULT);

  const parseCsv = (data: File | string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(data, {
        header: true,
        complete: (results: { data: AnyDataRow[] }) => {
          const first = results.data[0];

          if (first) {
            const handles = Array.from(new Set<string>(results.data.map((row) => row.Handle).filter(Boolean)));
            const headers = excludeHeaders(Object.keys(first));
            setParsedResult({ headers, data: results.data as AnyDataRow[], handles });
            resolve(handles);
            return;
          }
          resolve([]);
        },
        error: (error: Error) => {
          console.error("Error parsing CSV:", error);
          reject(error);
        },
      });
    });
  };

  const uploadFile = (file: File): boolean => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      showError("Invalid File Type", "Please upload a valid CSV file.", { position: "bottom-right" });
      return false;
    }

    setCsvFile(file);
    parseCsv(file).then((handles) => {
      if (handles.length >= 50) {
        toast.warning(`Too many handles (detected: ${handles.length}) could cause slow fetching issues.`, {
          position: "top-center",
          duration: 3000,
        });
      }
    });
    return true;
  };

  const download = (headers: string[], data: string[][]) => {
    if (!csvFile) return;
    downloadCsv(
      createTimestampedFilename(csvFile),
      Papa.unparse({ fields: headers, data })
    );
  };

  const detach = () => {
    setCsvFile(null);
    setParsedResult(EMPTY_RESULT);
  };

  return { csvFile, uploadFile, download, detach, toReactTableData };
}
