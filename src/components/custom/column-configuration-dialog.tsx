import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ColumnConfig } from "@/types/crawl";

function ColumnConfigurationDialogContent({
  onOpenChange,
  columnConfiguration,
  onSave,
}: {
  onOpenChange: (open: boolean) => void
  columnConfiguration: ColumnConfig[]
  onSave: (config: ColumnConfig[]) => void
}) {
  const [draft, setDraft] = useState<ColumnConfig[]>(columnConfiguration);

  const toggleField = (name: string, allowOverride: boolean) => {
    setDraft((prev) =>
      prev.map((field) => (field.name === name ? { ...field, allowOverride } : field))
    );
  };

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  return (
    <DialogContent className="min-w-0 sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Column Configuration</DialogTitle>
        <DialogDescription>
          Choose which columns should be overridden by data fetched from the store. Unchecked columns keep the value from the imported CSV.
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="h-96 w-full min-w-0 rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Column</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {draft.map((field) => (
              <TableRow key={field.name}>
                <TableCell>
                  <Checkbox
                    id={`column-override-${field.name}`}
                    checked={field.allowOverride}
                    onCheckedChange={(checked: boolean) => toggleField(field.name, checked)}
                  />
                </TableCell>
                <TableCell className="whitespace-normal break-words">
                  <label htmlFor={`column-override-${field.name}`} className="cursor-pointer">
                    {field.name}
                  </label>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" className="cursor-pointer">
            Close
          </Button>
        </DialogClose>
        <Button className="cursor-pointer" onClick={handleSave}>
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function ColumnConfigurationDialog({
  open,
  onOpenChange,
  columnConfiguration,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  columnConfiguration: ColumnConfig[]
  onSave: (config: ColumnConfig[]) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <ColumnConfigurationDialogContent
          key={columnConfiguration.map((field) => `${field.name}:${field.allowOverride}`).join("|")}
          onOpenChange={onOpenChange}
          columnConfiguration={columnConfiguration}
          onSave={onSave}
        />
      )}
    </Dialog>
  );
}
