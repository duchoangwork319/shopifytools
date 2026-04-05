import { Skeleton } from "@/components/ui/skeleton"

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