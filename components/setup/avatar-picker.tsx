"use client";

import * as React from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AVATAR_MAX_BYTES } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";

export function AvatarPicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);

  async function upload(file: File) {
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error(`That photo is ${formatBytes(file.size)} — keep it under 3 MB.`);
      return;
    }

    // Show it immediately; the network catches up.
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/avatar", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "That photo would not upload.");
      onChange(data.avatarUrl);
      toast.success("Photo saved");
    } catch (error) {
      toast.error((error as Error).message);
      setPreview(null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localUrl);
    }
  }

  const shown = preview ?? value;

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <Avatar src={shown} name={name} size="xl" seal />
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/50">
            <Loader2 className="size-5 animate-spin text-paper" aria-hidden />
          </span>
        )}
      </div>

      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="size-4" />
            {shown ? "Change photo" : "Add a photo"}
          </Button>
          {shown && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={async () => {
                setPreview(null);
                onChange(null);
                await fetch("/api/avatar", { method: "DELETE" });
              }}
            >
              <Trash2 className="size-4" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs leading-relaxed text-faint">
          JPG, PNG, WebP or HEIC, up to 3 MB. People write more when they can
          see who they are writing to.
        </p>
      </div>
    </div>
  );
}
