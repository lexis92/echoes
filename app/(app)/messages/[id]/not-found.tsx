import Link from "next/link";
import { Lock } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function MessageNotFound() {
  return (
    <EmptyState
      icon={<Lock />}
      title="Can’t open this"
      description="This message either isn't in your vault, or it's locked until a future date."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/inbox">Back to inbox</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/scheduled">See what's locked</Link>
          </Button>
        </div>
      }
    />
  );
}
