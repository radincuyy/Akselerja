type Props = { className?: string };

export default function Logo({ className }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className ?? ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "24px",
        verticalAlign: "middle"
      }}
    >
      <img
        src="/logo.png"
        alt=""
        className="h-5 w-auto shrink-0"
        style={{ objectFit: "contain" }}
      />
      <span
        className="font-semibold text-base tracking-tight text-current leading-none"
        style={{
          fontFamily: "var(--font-general-sans), var(--font-sans)",
          display: "inline-block"
        }}
      >
        Akselerja
      </span>
    </span>
  );
}




