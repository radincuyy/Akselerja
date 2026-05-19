"use client";

import { useEffect, useRef, useState } from "react";

type Role = "coach" | "user";
type Message = { id: string; role: Role; text: string };

type SuggestedPrompt = { label: string; prompt: string };

const SUGGESTED: SuggestedPrompt[] = [
  {
    label: "Kenapa match score saya segini?",
    prompt:
      "Tolong jelaskan kenapa match score saya untuk lowongan target saya seperti itu.",
  },
  {
    label: "Skill apa yang harus saya pelajari dulu?",
    prompt:
      "Dari skill gap saya, mana yang paling penting saya pelajari duluan?",
  },
  {
    label: "Berapa lama saya siap kerja?",
    prompt: "Realistisnya, berapa lama saya butuh sebelum siap melamar?",
  },
  {
    label: "Saya minder, bantu saya",
    prompt:
      "Saya merasa minder lihat kandidat lain. Bagaimana cara berpikir yang sehat?",
  },
];

const INITIAL_MESSAGE: Message = {
  id: "m-0",
  role: "coach",
  text: "Halo. Saya pendamping karier kamu di Akselerja. Saya bisa bantu jelaskan skor kecocokan, urutin skill yang perlu kamu pelajari, atau bantu kamu pikir realistis soal target kerja. Mau mulai dari mana?",
};

const HISTORY_KEY = "akselerja:coach-history:v1";
const HISTORY_TTL_MS = 24 * 60 * 60 * 1000;

type StoredHistory = {
  messages: Message[];
  savedAt: number;
};

function loadHistory(): Message[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredHistory>;
    if (
      !parsed ||
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt > HISTORY_TTL_MS ||
      !Array.isArray(parsed.messages) ||
      parsed.messages.length < 2
    ) {
      return null;
    }
    return parsed.messages as Message[];
  } catch {
    return null;
  }
}

function saveHistory(messages: Message[]) {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredHistory = {
      messages,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(payload));
  } catch {
  }
}

function clearHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(HISTORY_KEY);
}

export default function CoachChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const restored = loadHistory();
    if (restored) setMessages(restored);
  }, []);

  useEffect(() => {
    const hasUserTurn = messages.some((m) => m.role === "user");
    if (hasUserTurn) saveHistory(messages);
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setThinking(true);
    setErrorMsg(null);

    try {
      const payload = nextHistory
        .filter((m) => m.id !== "m-0")
        .map((m) => ({ role: m.role, text: m.text }));
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });
      if (!res.ok) {
        try {
          const data = (await res.json()) as { error?: string };
          setErrorMsg(data.error ?? "Coach belum bisa menjawab sekarang.");
        } catch {
          setErrorMsg("Coach belum bisa menjawab sekarang.");
        }
        setThinking(false);
        return;
      }
      if (!res.body) {
        setErrorMsg("Coach belum mengirim balasan.");
        setThinking(false);
        return;
      }

      const replyId = `c-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: replyId, role: "coach", text: "" },
      ]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffered = "";
      let firstChunk = true;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          buffered += decoder.decode(value, { stream: true });
          if (firstChunk) {
            setThinking(false);
            firstChunk = false;
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === replyId ? { ...m, text: buffered } : m,
            ),
          );
        }
      }
      buffered += decoder.decode();
      setMessages((prev) =>
        prev.map((m) => (m.id === replyId ? { ...m, text: buffered } : m)),
      );
    } catch (err) {
      console.error("[coach] fetch failed:", err);
      setErrorMsg("Tidak bisa menghubungi coach. Cek koneksi internetmu.");
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        role="log"
        aria-live="polite"
        aria-label="Percakapan dengan coach"
        className="flex min-h-[420px] flex-col gap-4 rounded-2xl border border-(--color-line) bg-(--color-paper) p-5 sm:p-7"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} text={msg.text} />
        ))}
        {thinking && <TypingIndicator />}
        {errorMsg ? (
          <p
            role="alert"
            className="rounded-md border border-(--color-signal-clay) bg-(--color-tint) px-4 py-3 text-sm text-(--color-ink)"
          >
            {errorMsg}
          </p>
        ) : null}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-(--color-muted)">
            Saran pertanyaan
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => send(s.prompt)}
                className="rounded-full border border-(--color-line) bg-(--color-paper) px-3.5 py-1.5 text-sm text-(--color-ink) transition-colors hover:border-(--color-teal) hover:text-(--color-teal)"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-3 rounded-2xl border border-(--color-line) bg-(--color-paper) p-3"
      >
        <label htmlFor="coach-input" className="sr-only">
          Tulis pertanyaan untuk coach
        </label>
        <textarea
          id="coach-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Tanya apa saja soal karier kamu..."
          className="min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)"
        />
        <button
          type="submit"
          disabled={!input.trim() || thinking}
          className="inline-flex items-center justify-center rounded-md bg-(--color-teal) px-4 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) transition-colors hover:bg-(--color-teal-deep) disabled:opacity-50"
        >
          Kirim
        </button>
      </form>

      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-(--color-muted)">
          Coach ini panduan, bukan pengganti keputusan kamu. Jawaban dibuat
          berdasarkan profil dan lowongan paling cocok yang ada di akunmu.
        </p>
        {messages.some((m) => m.role === "user") ? (
          <button
            type="button"
            onClick={() => {
              if (thinking) return;
              clearHistory();
              setMessages([INITIAL_MESSAGE]);
              setErrorMsg(null);
              setInput("");
            }}
            disabled={thinking}
            className="shrink-0 text-xs font-medium text-(--color-muted) underline-offset-4 hover:text-(--color-ink) hover:underline disabled:opacity-60"
          >
            Mulai chat baru
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MessageBubble({ role, text }: { role: Role; text: string }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-(--color-teal) px-4 py-2.5 text-sm text-(--color-paper-on-teal) sm:text-base">
          {text.split("\n").map((line, i) => (
            <p key={i} className={i > 0 ? "mt-1" : undefined}>
              {line}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <div
        aria-hidden
        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-tint) text-sm font-semibold text-(--color-teal-deep)"
      >
        AK
      </div>
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-(--color-line) bg-(--color-paper) px-4 py-2.5 text-sm text-(--color-ink) sm:text-base">
        {text.split("\n").map((line, i) => {
          if (line === "") return <div key={i} className="h-2" />;
          return (
            <p key={i} className={i > 0 ? "mt-1" : undefined}>
              {renderInline(line)}
            </p>
          );
        })}
      </div>
    </div>
  );
}

function renderInline(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div
        aria-hidden
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-tint) text-sm font-semibold text-(--color-teal-deep)"
      >
        AK
      </div>
      <div
        role="status"
        aria-label="Coach sedang menulis"
        className="flex gap-1 rounded-2xl rounded-tl-sm border border-(--color-line) bg-(--color-paper) px-4 py-3"
      >
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-(--color-muted)" />
        <span
          className="inline-block h-2 w-2 animate-pulse rounded-full bg-(--color-muted)"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="inline-block h-2 w-2 animate-pulse rounded-full bg-(--color-muted)"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
