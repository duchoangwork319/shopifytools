import { useState } from "react";
import { toast } from "sonner";
import { buildProductData, fetchProduct } from "@/lib/shopify";
import { sleep } from "@/lib/helpers";
import { showError } from "@/lib/toast";
import type { AnyDataRow, FetchError, FetchOptions, ShopifyCSVContainer } from "@/types/crawl";

const SLEEP_MS_DURING_FETCH = 1000;
const FETCH_MS_PER_PRODUCT = 1000;
const EMPTY_RESULT: ShopifyCSVContainer = { headers: [], data: [], handles: [] };

function estimateFetchTime(numProducts: number): number {
  return (numProducts * (FETCH_MS_PER_PRODUCT + SLEEP_MS_DURING_FETCH)) / 1000;
}

/**
 * Fetch every handle, continuing past individual failures instead of aborting
 * the whole batch. Failed handles are collected (not silently dropped) so the
 * caller can surface them to the user; successfully fetched rows are kept.
 */
async function fetchProductData(
  handles: string[], storeOrigin: string, headers: string[], options: FetchOptions
): Promise<{ data: AnyDataRow[]; errors: FetchError[] }> {
  const outputData: AnyDataRow[] = [];
  const errors: FetchError[] = [];

  for (const handle of handles) {
    console.log("Fetching handle:", handle);
    try {
      const fetched = await fetchProduct(handle, storeOrigin);
      const { rows: newRows } = buildProductData(fetched, headers, options);
      outputData.push(...newRows);
    } catch (error) {
      console.error("Error fetching handle:", handle, error);
      errors.push({ handle, message: error instanceof Error ? error.message : String(error) });
    }
    await sleep(SLEEP_MS_DURING_FETCH);
  }

  return { data: outputData, errors };
}

/**
 * Owns talking to the store (fetch loop + fetching status). The fetch result
 * is kept as internal state and exposed via `toReactTableData` (a `ShopifyCSVContainer`,
 * same shape as `useCSVFile`'s), for `CrawlPage` to sync into `useTableDataControl`
 * via an effect. This hook does not know about the table-control hook, and
 * takes `storeOrigin`/`options` from the caller rather than owning configuration.
 */
export function useShopifyAPI() {
  const [fetching, setFetching] = useState(false);
  const [toReactTableData, setFetchResult] = useState<ShopifyCSVContainer>(EMPTY_RESULT);
  const [fetchErrors, setFetchErrors] = useState<FetchError[]>([]);

  const acknowledgeFetchErrors = () => {
    setFetchErrors([]);
  };

  const startFetch = (handles: string[], headers: string[], storeOrigin: string, options: FetchOptions) => {
    if (!storeOrigin) {
      showError("Missing Store Origin", "Please set the store origin in Configuration.");
      return;
    }

    let resolvedStoreOrigin: string;
    try {
      resolvedStoreOrigin = new URL(storeOrigin).origin;
    } catch (error) {
      console.error("Invalid store origin URL:", error);
      showError("Invalid Store Origin", "Please check the store origin format.");
      return;
    }

    let targetHandles = handles;
    if (options.handleSuffix) {
      const re = new RegExp(`${options.handleSuffix}$`, "g");
      targetHandles = targetHandles.map((handle) => (re.test(handle) ? handle.replace(re, "") : handle));
    }

    setFetching(true);
    fetchProductData(targetHandles, resolvedStoreOrigin, headers, options).then(({ data, errors }) => {
      const fetchedHandles = Array.from(new Set(data.map((row) => row.Handle).filter(Boolean)));
      setFetchResult({ headers, data, handles: fetchedHandles });
      setFetchErrors(errors);
      setFetching(false);
    });

    toast.info(`This may take about ${estimateFetchTime(targetHandles.length).toFixed(1)} seconds depending on the number of products.`, {
      position: "top-center",
      duration: 3000,
    });
  };

  return { fetching, startFetch, toReactTableData, fetchErrors, acknowledgeFetchErrors };
}
