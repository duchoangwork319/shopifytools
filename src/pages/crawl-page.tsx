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
import {
  SingleSummaryCard
} from "@/components/summary-cards"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { toast } from "sonner"
import {
  type ShopifyCSVContainer,
  type AnyDataRow,
  type FetchOptions
} from "@/types/crawl"
import { TanstackProductDataTable } from "@/components/shopify-data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { ButtonGroup } from "@/components/ui/button-group"
import { AlertCircleIcon, ChevronDownIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  getAll,
  type AppSettings
} from "@/lib/setting"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { PreviewDialog } from "@/components/preview-dialog"

const SLEEP_MS_DURING_FETCH = 1000;
const FETCH_MS_PER_PRODUCT = 1000;

export function EmptyCover({ onImport }: { onImport: (file: File) => boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isValid = onImport(file);
      if (!isValid) {
        event.target.value = "";
      }
    }
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

export function FetchButtonGroup(
  {
    fetchOptions, fetchHandler
  }: {
    fetchOptions: FetchOptions,
    fetchHandler: (options: FetchOptions) => void
  }
) {
  const [innerFetchOptions, setInnerFetchOptions] = useState<FetchOptions>(fetchOptions);
  const [tempHandleSuffix, setTempHandleSuffix] = useState(fetchOptions.handleSuffix);
  const [tempAppendTags, setTempAppendTags] = useState(fetchOptions.appendTags);

  const handleSuffixRef = useRef<HTMLInputElement>(null);
  const appendTagsRef = useRef<HTMLInputElement>(null);

  const applyOptions = () => {
    const textOptions: Omit<FetchOptions, 'publishProducts' | 'inventoryPolicyContinue'> = {
      handleSuffix: handleSuffixRef.current?.value || "",
      appendTags: appendTagsRef.current?.value || "",
    };
    textOptions.appendTags = textOptions.appendTags.split(",").map(tag => tag.trim()).filter(Boolean).join(", ");
    setInnerFetchOptions(prev => ({ ...prev, ...textOptions }));
  };

  return (
    <ButtonGroup>
      <Button className="cursor-pointer" variant="outline" onClick={() => fetchHandler(innerFetchOptions)}>
        Fetch
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="pl-2! cursor-pointer">
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" onInteractOutside={applyOptions}>
          <FieldGroup className="w-full max-w-xs">
            <FieldSet>
              <FieldLabel>Visibility</FieldLabel>
              <FieldGroup data-slot="checkbox-group">
                <Field orientation="horizontal">
                  <Checkbox id="publish-products" checked={innerFetchOptions.publishProducts}
                    onCheckedChange={(checked: boolean) => setInnerFetchOptions(prev => ({ ...prev, publishProducts: checked }))} />
                  <FieldLabel htmlFor="publish-products" className="font-normal">
                    Publish products
                  </FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <Checkbox id="inventory-policy" checked={innerFetchOptions.inventoryPolicyContinue}
                    onCheckedChange={(checked: boolean) => setInnerFetchOptions(prev => ({ ...prev, inventoryPolicyContinue: checked }))} />
                  <FieldLabel htmlFor="inventory-policy" className="font-normal">
                    Inventory Policy Continue
                  </FieldLabel>
                </Field>
                <Field>
                  <FieldLabel htmlFor="handle-suffix">Handle Suffix</FieldLabel>
                  <FieldDescription>
                    Choose a unique suffix to be added to products after fetching.
                  </FieldDescription>
                  <Input id="handle-suffix" type="text" value={tempHandleSuffix} onChange={(e) => setTempHandleSuffix(e.target.value)}
                    placeholder="sales" ref={handleSuffixRef} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="append-tags">Append Tags</FieldLabel>
                  <FieldDescription>
                    Add additional tags to all products being fetched. Separate multiple tags with commas.
                  </FieldDescription>
                  <Input id="append-tags" type="text" value={tempAppendTags} onChange={(e) => setTempAppendTags(e.target.value)}
                    placeholder="preorder, sales" ref={appendTagsRef} />
                </Field>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </PopoverContent>
      </Popover>
    </ButtonGroup>
  )
}

export function ErrorAlert({ title, description }: { title: string; description: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {description}
      </AlertDescription>
    </Alert>
  )
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchProductData(
  handles: string[], storeOrigin: string, headers: string[], options: FetchOptions
): Promise<string[][]> {
  const outputData: string[][] = [];
  for (const handle of handles) {
    console.log("Fetching handle:", handle);
    try {
      const { rows: newRows } = await fetchByHandle(handle, storeOrigin, headers, options);
      outputData.push(...newRows);
      await sleep(SLEEP_MS_DURING_FETCH);
    } catch (error) {
      console.error("Error fetching handle:", handle, error);
      return [];
    }
  }
  return outputData;
}

function createColumnsFromHeaders(headers: string[]): ColumnDef<AnyDataRow>[] {
  return headers.map((header) => {
    if (header === "Body (HTML)") {
      return {
        header,
        accessorFn: row => `${String(row[header] ?? "")}`,
        cell: ({ row }) => {
          const cellValue = String(row.original[header]).trim();
          return cellValue ? <PreviewDialog
            triggerContent="Preview"
            title="Preview Content"
            description="Preview HTML Content of Body (HTML)"
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

function excludeHeaders(headers: string[]): string[] {
  return headers.filter(header => ![
    "Variant Inventory Qty",
    "Variant Price",
    "Size Chart (product.metafields.bwp_fields.size_chart)",
  ].includes(header));
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
  const [fetchOptions, setFetchOptions] = useState<FetchOptions>({
    publishProducts: false,
    inventoryPolicyContinue: false,
    handleSuffix: "",
    appendTags: "",
  });

  const papaParse = (data: File | string) => {
    return new Promise<string[]>((resolve, reject) => {
      Papa.parse(data, {
        header: true,
        complete: (results: { data: AnyDataRow[] }) => {
          const first = results.data[0];

          console.log("Import completed with", results.data.length, "rows");
          console.log("First row:", first);

          if (first) {
            const handles = Array.from(new Set<string>(results.data.map(row => row.Handle).filter(Boolean)));
            const csvHeaders = excludeHeaders(Object.keys(first));
            setShopifyCsvContainer((prev) => ({
              ...prev,
              headers: csvHeaders,
              data: results.data as AnyDataRow[],
              handles,
            }));
            setTableColumns(createColumnsFromHeaders(csvHeaders));
            resolve(handles);
          }
          resolve([]);
        },
        error: (error: Error) => {
          console.error("Error parsing CSV:", error);
          reject(error);
        }
      });
    });
  }

  const handleFileImport = (file: File) => {
    console.log("Uploaded file:", file);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.custom(() => <ErrorAlert
        title="Invalid File Type"
        description="Please upload a valid CSV file." />, {
        position: "bottom-right",
        duration: 1500,
      });
      return false;
    }
    setCsvFile(file);
    papaParse(file).then((handles) => {
      if (handles.length >= 50) {
        toast.warning(`Too many handles (detected: ${handles.length}) could cause slow fetching issues.`, {
          position: "top-center",
          duration: 3000,
        });
      }
    })
    return true;
  }

  const handleFetching = (options: FetchOptions) => {
    const settings = getAll() as AppSettings;

    let storeOrigin = settings.storeOrigin;

    if (!storeOrigin) {
      toast.custom(() => <ErrorAlert
        title="Missing Store Origin"
        description="Please go to Settings and set the store origin." />, {
        position: "top-center",
        duration: 1500,
      });
      return;
    }

    try {
      storeOrigin = new URL(storeOrigin).origin;
    } catch (error) {
      console.error("Invalid store origin URL:", error);
      toast.custom(() => <ErrorAlert
        title="Invalid Store Origin"
        description="Please check the store origin format." />, {
        position: "top-center",
        duration: 1500,
      });
      return;
    }

    let targetHandles = shopifyCsvContainer.handles;
    if (options.handleSuffix) {
      const re = new RegExp(`${options.handleSuffix}$`, "g");
      targetHandles = targetHandles.map(handle => (re.test(handle) ? handle.replace(re, "") : handle));
    }

    setFetching(true);
    setFetchOptions(options);
    fetchProductData(
      targetHandles,
      storeOrigin,
      shopifyCsvContainer.headers,
      options
    ).then((newData) => {
      setOutputContainer((prev) => ({
        ...prev,
        headers: shopifyCsvContainer.headers,
        data: newData,
      }));
      setFetching(false);
    });
    const est = (targetHandles.length * (FETCH_MS_PER_PRODUCT + SLEEP_MS_DURING_FETCH)) / 1000;
    toast.info(`This may take about ${est.toFixed(1)} seconds depending on the number of products.`, {
      position: "top-center",
      duration: 3000,
    });
  };

  const handleRollback = () => {
    papaParse(csvFile as File);
    setOutputContainer({
      headers: [],
      data: [],
    });
  };

  const handleDownload = () => {
    downloadCsv(
      createTimestampedFilename(csvFile as File),
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
              {/* <SummaryCards container={shopifyCsvContainer} /> */}
              <SingleSummaryCard container={shopifyCsvContainer} className="w-full md:w-1/3" />
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
                    <FetchButtonGroup fetchOptions={fetchOptions} fetchHandler={handleFetching} />
                  )
                }
                <Button className="cursor-pointer" variant="secondary" onClick={handleRollback}
                  disabled={fetching || outputContainer.data.length === 0}>
                  Rollback
                </Button>
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
