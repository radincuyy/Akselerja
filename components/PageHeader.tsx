type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: Props) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="text-sm font-medium text-(--color-muted)">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-tight text-(--color-ink)">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-(--color-muted)">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
