import * as React from "react";

export function SettingsSection({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id ?? title.toLowerCase().replace(/\s+/g, "-")}-heading`}
      className="scroll-mt-24"
    >
      <div className="mb-4">
        <h2
          id={`${id ?? title.toLowerCase().replace(/\s+/g, "-")}-heading`}
          className="font-display text-xl tracking-tightest text-ink"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-quiet">{description}</p>
        )}
      </div>
      <div className="grain overflow-hidden rounded-2xl border border-ink/[0.08] bg-surface px-5 shadow-card sm:px-6">
        {children}
      </div>
    </section>
  );
}

export function SettingsDivider() {
  return <div className="h-px bg-ink/[0.07]" />;
}
