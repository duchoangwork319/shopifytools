import {
  useEffect,
  useRef,
  useState
} from "react"
import { IconFolderCode } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import Papa from "papaparse";
import {
  createTimestampedFilename,
  downloadCsv,
} from "@/lib/csv"
import { fetchByHandle } from "@/lib/shopify"
import { Spinner } from "@/components/ui/spinner"
import { SummaryCards } from "@/components/summary-cards"
import { toast } from "sonner"
import {
  type ShopifyCSVContainer,
  type AnyDataRow,
  createColumnsFromHeaders
} from "@/types/crawl"
import { TanstackProductDataTable } from "@/components/shopify-data-table"
import { sleep } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

const SLEEP_MS_DURING_FETCH = 1000;
const FETCH_MS_PER_PRODUCT = 1000;

export function EmptyCover({ onImport }: { onImport: (file: File) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onImport(file);
  }

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>No CSV Found</EmptyTitle>
        <EmptyDescription>
          Please import a CSV file to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button onClick={triggerUpload} className="cursor-pointer">
          Import CSV
        </Button>
        <Input ref={fileInputRef} onChange={handleFileChange}
          className="hidden" id="csv" type="file" />
      </EmptyContent>
    </Empty>
  )
}

async function fetchProductData(handles: string[], headers: string[]) {
  const outputData: string[][] = [];
  for (const handle of handles) {
    console.log("Crawling handle:", handle);
    try {
      const { rows: newRows } = await fetchByHandle(handle, "https://fusionworld.com", headers);
      outputData.push(...newRows);
      await sleep(SLEEP_MS_DURING_FETCH);
    } catch (error) {
      console.error("Error crawling handle:", handle, error);
      return [];
    }
  }
  return outputData;
}

export function CrawlPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [shopifyCsvContainer, setShopifyCsvContainer] = useState<ShopifyCSVContainer>({
    headers: [],
    data: [],
    handles: [],
  });
  const [outputContainer, setOutputContainer] = useState<{
    headers: string[]
    data: string[][]
  }>({
    headers: [],
    data: [],
  });
  const [fetching, setFetching] = useState(false);
  const [tableColumns, setTableColumns] = useState<ColumnDef<AnyDataRow>[]>([]);

  const papaParse = (data: File | string) => {
    Papa.parse(data, {
      header: true,
      complete: (results: { data: AnyDataRow[] }) => {
        const first = results.data[0];

        console.log("Import completed with", results.data.length, "rows");
        console.log("First row:", first);

        if (first) {
          const handles = Array.from(new Set<string>(results.data.map(row => row.Handle).filter(Boolean)));
          const keys = Object.keys(first);
          setShopifyCsvContainer((prev) => ({
            ...prev,
            headers: keys,
            data: results.data as AnyDataRow[],
            handles,
          }));
          setTableColumns(createColumnsFromHeaders(keys));
        }
      },
      error: (error: Error) => {
        console.error("Error parsing CSV:", error);
      }
    });
  }

  const handleFileImport = (file: File) => {
    console.log("Uploaded file:", file);
    setCsvFile(file);
    papaParse(file);
  }

  const handleFetching = async () => {
    setFetching(true);
    fetchProductData(shopifyCsvContainer.handles, shopifyCsvContainer.headers).then((newData) => {
      setOutputContainer((prev) => ({
        ...prev,
        headers: shopifyCsvContainer.headers,
        data: newData,
      }));
      setFetching(false);
    });
    const est = (shopifyCsvContainer.handles.length * (FETCH_MS_PER_PRODUCT + SLEEP_MS_DURING_FETCH)) / 1000;
    toast.info(`This may take about ${est.toFixed(1)} seconds depending on the number of products.`, {
      position: "top-center",
      duration: 3000,
    });
  };

  const handleDownload = () => {
    downloadCsv(
      createTimestampedFilename(),
      Papa.unparse({
        fields: outputContainer.headers,
        data: outputContainer.data,
      })
    );
  };

  const handleDetach = () => {
    setCsvFile(null);
    setShopifyCsvContainer({
      headers: [],
      data: [],
      handles: [],
    });
    setOutputContainer({
      headers: [],
      data: [],
    });
    setTableColumns([]);
  };

  useEffect(() => {
    if (outputContainer.data.length === 0) return;

    const newCsv = Papa.unparse({
      fields: outputContainer.headers,
      data: outputContainer.data,
    });
    papaParse(newCsv);
  }, [outputContainer]);

  return (
    <>
      {csvFile ? (
        <div className="p-6">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 pb-4 md:gap-6">
              <SummaryCards container={shopifyCsvContainer} />
            </div>
          </div>
          <div className="flex flex-row flex-wrap">
            <div className="flex-[0_0_100%] max-w-[100%] mb-4">
              <div className="flex items-start gap-1">
                {
                  fetching ? (
                    <Button className="cursor-pointer" disabled>
                      <Spinner data-icon="inline-start" />
                      Fetching
                    </Button>
                  ) : (
                    <Button className="cursor-pointer" onClick={handleFetching}>
                      Fetch
                    </Button>
                  )
                }
                <Button className="cursor-pointer" variant="secondary" onClick={handleDownload}
                  disabled={outputContainer.data.length === 0}>
                  Download
                </Button>
                <Button className="cursor-pointer ml-auto" variant="destructive"
                  onClick={handleDetach}
                  disabled={!csvFile || fetching}>
                  Detach
                </Button>
              </div>
            </div>
            <div className="flex-[0_0_100%] max-w-[100%]">
              <TanstackProductDataTable
                columns={tableColumns}
                data={shopifyCsvContainer.data}
                fetching={fetching}
              />
            </div>
          </div>
        </div>
      ) : (
        <EmptyCover onImport={handleFileImport} />
      )}
    </>
  )
}
