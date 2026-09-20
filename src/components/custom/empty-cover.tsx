import { useRef } from "react";
import { IconFolderCode } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";

export function EmptyCover({ onImport }: { onImport: (file: File) => boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isValid = onImport(file);
      if (!isValid) {
        event.target.value = "";
      }
    }
  };

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
  );
}
