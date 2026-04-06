import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function PreviewDialog({
  triggerContent = "Open Dialog",
  title = "Dialog Title",
  description = "This is the dialog description.",
  realContent = "",
}: {
  triggerContent?: string
  title?: string
  description?: string
  realContent?: string
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerContent}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4"
          dangerouslySetInnerHTML={{ __html: realContent }}>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
