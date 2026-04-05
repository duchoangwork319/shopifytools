import { useRef, useState } from "react"
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  // TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import Papa from "papaparse";
import {
  createTimestampedFilename,
  downloadCsv,
} from "@/lib/csv"
import {
  crawlHandle
} from "@/lib/shopify"
import { Spinner } from "@/components/ui/spinner"
import { SummaryCards } from "@/components/summary-cards"
import type { PapaData, ShopifyCSVContainer } from "@/types/crawl"

export function SkeletonTable() {
  return (
    <div className="flex w-full flex-col gap-2">
      {Array.from({ length: 10 }).map((_, index) => (
        <div className="flex gap-4 w-full" key={index}>
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-100" />
          <Skeleton className="h-8 w-100" />
        </div>
      ))}
    </div>
  )
}

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

export function ProductTable({
  headers,
  data,
  fetching,
  ...props
}: Omit<ShopifyCSVContainer, "handles">
  & { fetching: boolean }
  & React.HTMLAttributes<HTMLDivElement>) {
  const allowedHeaders = headers.filter(header => ["Handle", "Title", "Variant SKU"].includes(header));
  return (
    <div {...props}>
      {
        (data.length === 0 || fetching) ? (
          <SkeletonTable />
        ) : (
          <Table>
            <TableCaption>A list of your products</TableCaption>
            <TableHeader>
              <TableRow>
                {
                  allowedHeaders.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))
                }
              </TableRow>
            </TableHeader>
            <TableBody>
              {
                data.map((row, tridx) => (
                  <TableRow key={`tr-${tridx}`}>
                    {
                      allowedHeaders.map((header, tdidx) => (
                        <TableCell key={`${header}-${tridx}-${tdidx}`}
                          title={String(row[header] ?? "")}>
                          <span className="block break-all">
                            {String(row[header] ?? "")}
                          </span>
                        </TableCell>
                      ))
                    }
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        )
      }
    </div>
  )
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchProductData(handles: string[], headers: string[]) {
  const outputData: string[][] = [];
  for (const handle of handles) {
    console.log("Crawling handle:", handle);
    try {
      const { rows: newRows } = await crawlHandle(handle, "https://fusionworld.com", headers);
      outputData.push(...newRows);
      await sleep(250);
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
      complete: (results: { data: PapaData[] }) => {
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
            data: results.data,
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
            <div className="flex-[0_0_100%] max-w-[100%]">
              <ProductTable
                headers={shopifyCsvContainer.headers}
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
