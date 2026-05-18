"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type Props = {
  label: string;
  optional?: boolean;
  placeholder?: string;
  options: readonly string[];
  values: string[];
  onChange: (next: string[]) => void;
  helperText?: string;
};

export default function MultiSelectInput({
  label,
  optional,
  placeholder = "Ketik atau pilih dari daftar",
  options,
  values,
  onChange,
  helperText,
}: Props) {
  const fieldId = useId();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const available = useMemo(
    () => options.filter((o) => !values.includes(o)),
    [options, values],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((o) => o.toLowerCase().includes(q));
  }, [available, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function add(value: string) {
    if (!options.includes(value)) return;
    if (values.includes(value)) return;
    onChange([...values, value]);
    setQuery("");
    inputRef.current?.focus();
  }

  function remove(value: string) {
    onChange(values.filter((v) => v !== value));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      if (open && filtered[activeIndex]) {
        e.preventDefault();
        add(filtered[activeIndex]);
      }
    } else if (e.key === "Backspace" && query === "" && values.length > 0) {
      e.preventDefault();
      remove(values[values.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-2" ref={wrapperRef}>
      <label
        htmlFor={fieldId}
        className="text-xs font-medium tracking-wide text-(--color-muted)"
      >
        {label}
        {values.length > 0 && (
          <span className="ml-2 font-normal text-(--color-muted)">
            ({values.length} terpilih)
          </span>
        )}
        {optional && (
          <span className="ml-2 font-normal text-(--color-muted)">opsional</span>
        )}
      </label>

      <div className="relative">
        <div
          className="flex flex-wrap items-center gap-1.5 rounded-md border border-(--color-line) bg-(--color-paper) px-2 py-1.5 focus-within:border-(--color-teal)"
          onClick={() => {
            inputRef.current?.focus();
            setOpen(true);
          }}
        >
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-(--color-teal) py-1 pl-3 pr-1 text-sm font-medium text-(--color-paper-on-teal)"
            >
              {v}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(v);
                }}
                aria-label={`Hapus ${v}`}
                className="flex h-5 w-5 items-center justify-center rounded-full text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
              >
                <span aria-hidden>×</span>
              </button>
            </span>
          ))}
          <input
            id={fieldId}
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={values.length === 0 ? placeholder : ""}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            className="min-w-[10ch] flex-1 bg-transparent px-2 py-1 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)"
          />
        </div>

        {open && filtered.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 max-h-60 overflow-auto rounded-md border border-(--color-line) bg-(--color-paper) py-1 shadow-lg"
          >
            {filtered.map((opt, i) => {
              const active = i === activeIndex;
              return (
                <li key={opt} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      add(opt);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={
                      active
                        ? "block w-full px-3 py-2 text-left text-sm text-(--color-ink) bg-(--color-tint)"
                        : "block w-full px-3 py-2 text-left text-sm text-(--color-ink) hover:bg-(--color-tint)"
                    }
                  >
                    {opt}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {open && filtered.length === 0 && query.trim() && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 rounded-md border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm text-(--color-muted) shadow-lg">
            Tidak ada hasil untuk &ldquo;{query}&rdquo;.
          </div>
        )}
      </div>

      {helperText && (
        <p className="text-xs text-(--color-muted)">{helperText}</p>
      )}
    </div>
  );
}
