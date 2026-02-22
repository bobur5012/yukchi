import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

function CardSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 bg-card p-4",
        className
      )}
      {...props}
    >
      <Skeleton className="h-4 w-24 mb-3 rounded-lg" />
      <Skeleton className="h-6 w-16 rounded-lg" />
    </div>
  );
}

function ListSkeleton({
  count = 5,
  className,
  ...props
}: React.ComponentProps<"div"> & { count?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3"
        >
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-[75%] rounded-lg" />
            <Skeleton className="h-3 w-1/2 rounded-lg" />
          </div>
          <Skeleton className="h-3 w-12 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, CardSkeleton, ListSkeleton };
