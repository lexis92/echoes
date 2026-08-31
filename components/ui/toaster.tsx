"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/components/theme-provider";

export function Toaster() {
  const { resolved } = useTheme();
  return (
    <Sonner
      theme={resolved}
      position="bottom-center"
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border !border-ink/10 !bg-surface !text-ink !shadow-lift !font-sans",
          description: "!text-quiet",
          actionButton: "!bg-ink !text-paper !rounded-full",
          cancelButton: "!bg-ink/10 !text-ink !rounded-full",
        },
      }}
    />
  );
}
