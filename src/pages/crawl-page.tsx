import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  SingleSummaryCard
} from "@/components/summary-cards";
import { TanstackProductDataTable } from "@/components/shopify-data-table";
import { EmptyCover } from "@/components/custom/empty-cover";
import { ConfigurationDrawer } from "@/components/custom/configuration-drawer";
import { FetchErrorsDialog } from "@/components/custom/fetch-errors-dialog";
import { useCSVFile } from "@/hooks/use-csv-file";
import { useShopifyAPI } from "@/hooks/use-shopify-api";
import { useTableDataControl } from "@/hooks/use-table-data-control";
import { useConfiguration } from "@/hooks/use-configuration";
import { IconAdjustments } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export function CrawlPage() {
  const { configuration, setConfiguration } = useConfiguration();
  const tableControl = useTableDataControl(configuration.columnConfiguration);
  const { setOrigin, setIncomingData } = tableControl;
  const csvFile = useCSVFile();
  const shopifyApi = useShopifyAPI();
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    setOrigin(csvFile.toReactTableData);
  }, [csvFile.toReactTableData, setOrigin]);

  useEffect(() => {
    setIncomingData(shopifyApi.toReactTableData);
  }, [shopifyApi.toReactTableData, setIncomingData]);

  const handleFetching = () => {
    shopifyApi.startFetch(
      tableControl.origin.handles,
      tableControl.origin.headers,
      configuration.storeOrigin,
      configuration.fetchOptions
    );
  };

  const handleDownload = () => {
    csvFile.download(tableControl.stagingCsv.headers, tableControl.stagingCsv.data);
  };

  const handleDetach = () => {
    csvFile.detach();
    tableControl.reset();
  };

  return (
    <>
      {csvFile.csvFile ? (
        <div className="p-6">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 pb-4 md:gap-6">
              <SingleSummaryCard container={tableControl.origin} className="w-full md:w-1/3" />
            </div>
          </div>
          <div className="flex flex-row flex-wrap">
            <div className="flex-[0_0_100%] max-w-[100%] mb-4">
              <div className="flex items-start gap-1">
                {
                  shopifyApi.fetching ? (
                    <Button className="cursor-pointer" disabled>
                      <Spinner data-icon="inline-start" />
                      Fetching
                    </Button>
                  ) : (
                    <Button className="cursor-pointer" variant="outline" onClick={handleFetching}>
                      Fetch
                    </Button>
                  )
                }
                <Button className="cursor-pointer" variant="outline" onClick={() => setConfigOpen(true)}>
                  <IconAdjustments />
                  Configuration
                </Button>
                <Button className="cursor-pointer" variant="secondary" onClick={tableControl.clearIncoming}
                  disabled={shopifyApi.fetching || !tableControl.hasIncoming}>
                  Rollback
                </Button>
                <Button className="cursor-pointer" variant="secondary" onClick={handleDownload}
                  disabled={tableControl.origin.data.length === 0}>
                  Download
                </Button>
                <Button className="cursor-pointer ml-auto" variant="destructive"
                  onClick={handleDetach}
                  disabled={!csvFile.csvFile || shopifyApi.fetching}>
                  Detach
                </Button>
              </div>
            </div>
            <div className="flex-[0_0_100%] max-w-[100%]">
              <TanstackProductDataTable
                columns={tableControl.tableColumns}
                data={tableControl.stagingRows}
                fetching={shopifyApi.fetching}
              />
            </div>
          </div>
        </div>
      ) : (
        <EmptyCover onImport={csvFile.uploadFile} />
      )}
      <ConfigurationDrawer
        open={configOpen}
        onOpenChange={setConfigOpen}
        configuration={configuration}
        onSave={setConfiguration}
      />
      <FetchErrorsDialog
        errors={shopifyApi.fetchErrors}
        onAcknowledge={shopifyApi.acknowledgeFetchErrors}
      />
    </>
  );
}
