import Link from "next/link";
import { Lock } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function MessageNotFound() {
  return (
    <EmptyState
      icon={<Lock />}
      title="Not available"
      description="This message either is not in your vault, or it is sealed until a future date. Sealed messages stay unreadable until the moment they open."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/inbox">Back to inbox</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/scheduled">See what is sealed</Link>
          </Button>
        </div>
      }
    />
  );
}
