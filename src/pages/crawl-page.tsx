import {
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
import { crawlHandle } from "@/lib/shopify"
import { Spinner } from "@/components/ui/spinner"
import { SummaryCards } from "@/components/summary-cards"
import { toast } from "sonner"
import {
  columns,
  type StaticShopifyCSVRow,
  type ShopifyCSVContainer
} from "@/types/crawl"
import { TanstackProductDataTable } from "@/components/shopify-data-table"
import { sleep } from "@/lib/utils"

const SLEEP_MS_DURING_FETCH = 500;
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
      const { rows: newRows } = await crawlHandle(handle, "https://fusionworld.com", headers);
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

  const handleFileImport = (file: File) => {
    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      complete: (results: { data: StaticShopifyCSVRow[] }) => {
        const first = results.data[0];

        console.log("Uploaded file:", file);
        console.log("Import completed with", results.data.length, "rows");
        console.log("First row:", first);

        if (first) {
          const handles = Array.from(new Set<string>(results.data.map(row => row.Handle).filter(Boolean)));
          const keys = Object.keys(first);
          setShopifyCsvContainer((prev) => ({
            ...prev,
            headers: keys,
            data: results.data as StaticShopifyCSVRow[],
            handles,
          }));
          setOutputContainer((prev) => ({
            ...prev,
            headers: keys,
          }));
        }
      },
      error: (error: Error) => {
        console.error("Error parsing CSV:", error);
      }
    });
  }

  const handleFetching = async () => {
    setFetching(true);
    fetchProductData(shopifyCsvContainer.handles, shopifyCsvContainer.headers).then((newData) => {
      setOutputContainer((prev) => ({
        ...prev,
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
              </div>
            </div>
            <div className="flex-[0_0_calc(100%-var(--sidebar-width))] max-w-[calc(100%-var(--sidebar-width))]">
              {/* <DefaultProductTable
                headers={shopifyCsvContainer.headers}
                data={shopifyCsvContainer.data as AnyDataRow[]}
                fetching={fetching}
                className="w-[calc(100%-var(--sidebar-width))]"
              /> */}
              <TanstackProductDataTable
                columns={columns}
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
