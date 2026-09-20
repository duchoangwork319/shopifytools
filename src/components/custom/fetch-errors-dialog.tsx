import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { FetchError } from "@/types/crawl";

/**
 * Surfaces per-handle fetch failures the user must acknowledge. Rendered
 * whenever `errors` is non-empty; successfully fetched rows are unaffected —
 * this is purely informational so failures aren't silently dropped.
 */
export function FetchErrorsDialog({
  errors,
  onAcknowledge,
}: {
  errors: FetchError[]
  onAcknowledge: () => void
}) {
  const open = errors.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onAcknowledge(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {errors.length} handle{errors.length === 1 ? "" : "s"} failed to fetch
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <span>
              Products fetched successfully were kept. The handles below were not updated:
              <ul className="mt-2 max-h-60 list-disc space-y-1 overflow-y-auto rounded-md border p-3 pl-8 text-left">
                {errors.map((error) => (
                  <li key={error.handle}>
                    <span className="font-medium">{error.handle}</span>: {error.message}
                  </li>
                ))}
              </ul>
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onAcknowledge}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
