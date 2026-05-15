type Props = { className?: string };

export default function Logo({ className }: Props) {
  return (
    <svg
      viewBox="0 0 132 24"
      role="img"
      aria-label="Akselerja"
      className={className}
      fill="none"
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M9 12.4 L11.2 14.6 L15.5 9.6"
        stroke="var(--color-paper)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="29"
        y="17"
        fontFamily="General Sans, system-ui, sans-serif"
        fontWeight="600"
        fontSize="16"
        letterSpacing="-0.01em"
        fill="currentColor"
      >
        Akselerja
      </text>
    </svg>
  );
}
