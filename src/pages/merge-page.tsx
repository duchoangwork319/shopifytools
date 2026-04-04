import { Layers3 } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function MergePage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Merge
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Merge workspace
        </h2>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <Layers3 className="size-5" />
            </div>
            Merge is ready for the next phase
          </CardTitle>
          <CardDescription>
            The routed shell is in place, so this page can be expanded with merge tooling whenever you are ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use the Crawl tab to gather product rows first. This page is intentionally lightweight for now.
        </CardContent>
      </Card>
    </section>
  )
}
