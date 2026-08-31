import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("shimmer rounded-lg bg-ink/[0.07]", className)}
      aria-hidden
    />
  );
}

export function MessageCardSkeleton() {
  return (
    <div className="rounded-xl border border-ink/[0.08] bg-surface p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[92%]" />
        <Skeleton className="h-3 w-[68%]" />
      </div>
    </div>
  );
}
