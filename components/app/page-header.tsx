import * as React from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="label mb-2.5 text-ember">{eyebrow}</p>}
        <h1 className="font-display text-[2rem] leading-[1.1] tracking-tightest text-ink sm:text-[2.5rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-xl text-pretty text-[15px] leading-relaxed text-quiet">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
