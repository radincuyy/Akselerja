"use client";

import Image from "next/image";
import { useState } from "react";

type Size = "sm" | "md" | "lg";

const SIZE_PX: Record<Size, number> = {
  sm: 40,
  md: 48,
  lg: 64,
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-14 w-14 sm:h-16 sm:w-16",
};

const SIZE_FONT: Record<Size, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base sm:text-lg",
};

function initialsFor(name: string): string {
  return (
    (name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

type Props = {
  src?: string;
  alt: string;
  size?: Size;
  priority?: boolean;
  className?: string;
};

export default function CompanyLogo({
  src,
  alt,
  size = "md",
  priority,
  className,
}: Props) {
  const [errored, setErrored] = useState(false);
  const dim = SIZE_PX[size];
  const sizeCls = SIZE_CLASS[size];
  const fontCls = SIZE_FONT[size];
  const ringCls = "ring-1 ring-(--color-line)";

  if (!src || errored) {
    return (
      <div
        aria-hidden
        className={`flex shrink-0 items-center justify-center rounded-md bg-(--color-tint) font-semibold text-(--color-teal-deep) ${sizeCls} ${fontCls} ${className ?? ""}`}
      >
        {initialsFor(alt)}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={dim}
      height={dim}
      sizes={`${dim}px`}
      loading={priority ? "eager" : "lazy"}
      priority={priority}
      onError={() => setErrored(true)}
      className={`shrink-0 rounded-md object-contain ${ringCls} ${sizeCls} ${className ?? ""}`}
    />
  );
}
