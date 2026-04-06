"use client"

import {
  Card,
  // CardAction,
  CardContent,
  CardDescription,
  // CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ShopifyCSVContainer } from "@/types/crawl"

export function SummaryCards({ container }: { container: ShopifyCSVContainer }) {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Handles</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {container.handles.length}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Columns</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {container.headers.length}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Rows</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {container.data.length}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}

export function SingleSummaryCard({ container, ...props }: React.ComponentProps<"div"> & { container: ShopifyCSVContainer }) {
  return (
    <Card size="sm" {...props}>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
        <CardDescription>
          Display a summary of the Shopify CSV data.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-base">
        <p>
          <strong>Total Handles:</strong> {container.handles.length}
        </p>
        <p>
          <strong>Total Columns:</strong> {container.headers.length}
        </p>
        <p>
          <strong>Total Rows:</strong> {container.data.length}
        </p>
      </CardContent>
      {/* <CardFooter>
        <p>Card Footer</p>
      </CardFooter> */}
    </Card>
  )
}