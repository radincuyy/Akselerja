type Props = {
  title: string;
  description: string;
};

export default function GenerationLoadingState({ title, description }: Props) {
  return (
    <div
      className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className="h-9 w-9 animate-spin rounded-full border-2 border-(--color-line) border-t-(--color-teal)"
      />
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-(--color-ink)">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
        {description}
      </p>
    </div>
  );
}
