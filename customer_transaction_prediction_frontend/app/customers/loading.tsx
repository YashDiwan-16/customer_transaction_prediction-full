import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 px-2">
        <div>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-72" />
        </div>

        <div className="rounded-md border">
          <div className="h-10 border-b px-4 flex items-center">
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 w-1/5 ml-auto" />
          </div>

          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 border-b px-4 flex items-center">
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-20 ml-8" />
              <Skeleton className="h-4 w-24 ml-auto" />
              <Skeleton className="h-4 w-16 ml-8" />
              <Skeleton className="h-4 w-16 ml-8" />
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Skeleton className="h-8 w-64" />
        </div>
      </div>
    </div>
  );
}
