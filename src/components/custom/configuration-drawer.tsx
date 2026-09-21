import { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppConfiguration } from "@/types/crawl";

function ConfigurationDrawerContent({
  onOpenChange,
  configuration,
  onSave,
}: {
  onOpenChange: (open: boolean) => void;
  configuration: AppConfiguration;
  onSave: (config: AppConfiguration) => void;
}) {
  const [draft, setDraft] = useState<AppConfiguration>(configuration);

  const toggleColumn = (name: string, include: boolean) => {
    setDraft((prev) => ({
      ...prev,
      columnConfiguration: prev.columnConfiguration.map((field) =>
        field.name === name && !field.overrideForbidden && !field.required ? { ...field, include } : field
      ),
    }));
  };

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Configuration</DrawerTitle>
        <DrawerDescription>
          All settings here are saved to local storage and persist across sessions.
        </DrawerDescription>
      </DrawerHeader>
      <div className="no-scrollbar overflow-y-auto px-4">
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Store</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="store-origin">Store Origin</FieldLabel>
                <FieldDescription>
                  The Shopify storefront URL products are fetched from.
                </FieldDescription>
                <Input
                  id="store-origin"
                  placeholder="e.g. https://examplestore.myshopify.com"
                  value={draft.storeOrigin}
                  onChange={(event) => setDraft((prev) => ({ ...prev, storeOrigin: event.target.value }))}
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Visibility</FieldLegend>
            <FieldGroup data-slot="checkbox-group">
              <Field orientation="horizontal">
                <Checkbox
                  id="publish-products"
                  checked={draft.fetchOptions.publishProducts}
                  onCheckedChange={(checked: boolean) =>
                    setDraft((prev) => ({ ...prev, fetchOptions: { ...prev.fetchOptions, publishProducts: checked } }))
                  }
                />
                <FieldLabel htmlFor="publish-products" className="font-normal">
                  Publish products
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  id="inventory-policy"
                  checked={draft.fetchOptions.inventoryPolicyContinue}
                  onCheckedChange={(checked: boolean) =>
                    setDraft((prev) => ({ ...prev, fetchOptions: { ...prev.fetchOptions, inventoryPolicyContinue: checked } }))
                  }
                />
                <FieldLabel htmlFor="inventory-policy" className="font-normal">
                  Inventory Policy Continue
                </FieldLabel>
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Handle Suffix</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldDescription>
                  Choose a unique suffix to be added to products after fetching.
                </FieldDescription>
                <Input
                  id="handle-suffix"
                  type="text"
                  value={draft.fetchOptions.handleSuffix}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, fetchOptions: { ...prev.fetchOptions, handleSuffix: event.target.value } }))
                  }
                  placeholder="sales"
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Append Tags</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldDescription>
                  Add additional tags to all products being fetched. Separate multiple tags with commas.
                </FieldDescription>
                <Input
                  id="append-tags"
                  type="text"
                  value={draft.fetchOptions.appendTags}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, fetchOptions: { ...prev.fetchOptions, appendTags: event.target.value } }))
                  }
                  placeholder="preorder, sales"
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Columns</FieldLegend>
            <FieldDescription>
              Choose which columns should be included in the table and the downloaded CSV. Unchecked columns are
              left out entirely.{" "}
              <span className="font-bold text-red-600">Red</span> columns are always included and can never be
              excluded — their value never changes. <span className="font-bold text-yellow-600">Yellow</span>{" "}
              columns are always included and can never be excluded, but their value can still be updated when
              fetching.
            </FieldDescription>
            <div className="h-72 w-full min-w-0 overflow-y-auto rounded-md border">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Column</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draft.columnConfiguration.map((field) => (
                    <TableRow key={field.name}>
                      <TableCell>
                        {!field.overrideForbidden && (
                          <Checkbox
                            id={`column-include-${field.name}`}
                            checked={field.required ? true : field.include}
                            disabled={field.required}
                            onCheckedChange={(checked: boolean) => toggleColumn(field.name, checked)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="whitespace-normal break-words">
                        <label
                          htmlFor={`column-include-${field.name}`}
                          className={
                            field.overrideForbidden
                              ? "font-bold text-red-600"
                              : field.required
                                ? "font-bold text-yellow-600"
                                : "cursor-pointer"
                          }
                        >
                          {field.name}
                        </label>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </FieldSet>
        </FieldGroup>
      </div>
      <DrawerFooter className="flex-row justify-end">
        <DrawerClose asChild>
          <Button variant="outline" className="cursor-pointer">
            Close
          </Button>
        </DrawerClose>
        <Button className="cursor-pointer" onClick={handleSave}>
          Save
        </Button>
      </DrawerFooter>
    </DrawerContent>
  );
}

export function ConfigurationDrawer({
  open,
  onOpenChange,
  configuration,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configuration: AppConfiguration;
  onSave: (config: AppConfiguration) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      {open && (
        <ConfigurationDrawerContent
          key={JSON.stringify(configuration)}
          onOpenChange={onOpenChange}
          configuration={configuration}
          onSave={onSave}
        />
      )}
    </Drawer>
  );
}
