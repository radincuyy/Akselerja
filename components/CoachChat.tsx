"use client";

import { useEffect, useRef, useState } from "react";

type Role = "coach" | "user";
type Message = { id: string; role: Role; text: string };

type SuggestedPrompt = { label: string; prompt: string };

const SUGGESTED: SuggestedPrompt[] = [
  {
    label: "Kenapa match score saya 72?",
    prompt: "Tolong jelaskan kenapa skor saya 72 untuk Junior Admin Gudang.",
  },
  {
    label: "Skill apa yang harus saya pelajari dulu?",
    prompt: "Dari skill gap saya, mana yang paling penting saya pelajari duluan?",
  },
  {
    label: "Berapa lama saya siap kerja?",
    prompt: "Realistisnya, berapa lama saya butuh sebelum siap melamar?",
  },
  {
    label: "Saya minder, bantu saya",
    prompt: "Saya merasa minder lihat kandidat lain. Bagaimana cara berpikir yang sehat?",
  },
];

const INITIAL_MESSAGE: Message = {
  id: "m-0",
  role: "coach",
  text: "Halo Rahmat. Saya pendamping karier kamu di Akselerja. Saya bisa bantu jelaskan skor kecocokan, urutin skill yang perlu kamu pelajari, atau bantu kamu pikir realistis soal target kerja. Mau mulai dari mana?",
};

function generateResponse(prompt: string): string {
  const p = prompt.toLowerCase();

  if (p.includes("skor") || p.includes("match") || p.includes("kenapa") && p.includes("72")) {
    return [
      "Skor 72 untuk Junior Admin Gudang itu posisinya \"trainable\", artinya kamu cocok tapi ada 1-2 hal yang masih perlu diasah.",
      "",
      "Yang bikin skor kamu tinggi: kamu sudah punya basic Excel, kamu pernah handle stok di toko orang tua kamu, dan kamu domisili Bekasi (cocok lokasi).",
      "",
      "Yang menahan: pengalaman formal kamu masih 1 tahun (mereka ekspektasi 1-2 tahun), dan satu skill SOP gudang formal kamu belum ada. Itu bisa kamu tutup lewat satu kursus dasar 4-6 jam.",
      "",
      "Mau saya buatkan urutan belajar yang paling cepat naikkan skor ini?",
    ].join("\n");
  }

  if (p.includes("skill") && (p.includes("duluan") || p.includes("pertama") || p.includes("prioritas"))) {
    return [
      "Saran saya, ambil dua skill ini berurutan:",
      "",
      "1. **SOP gudang dasar** (4-6 jam). Ini yang paling banyak diminta lowongan logistik di Bekasi, dan paling cepat selesai. Setelah ini, skor kamu naik ke ~78.",
      "",
      "2. **Excel intermediate (pivot table, vlookup)** (8-10 jam). Skill ini muncul di 70% lowongan admin. Kalau kamu lulus assessment Excel intermediate, skor naik ke ~82 dan kamu masuk kategori \"siap kerja\".",
      "",
      "Pelajaran softskill seperti komunikasi tim biarkan nanti. Itu lebih cocok diasah sambil kerja.",
    ].join("\n");
  }

  if (p.includes("lama") || p.includes("kapan") || p.includes("berapa") && p.includes("waktu")) {
    return [
      "Realistisnya, untuk masuk kategori \"siap kerja\" (skor 80+) di posisi yang kamu incar sekarang, kamu butuh sekitar **2-3 minggu** kalau kamu konsisten 1 jam per hari.",
      "",
      "Rinciannya: SOP gudang 1 minggu, Excel intermediate 1.5 minggu, plus satu kali kerjakan ulang assessment supaya skornya terupdate.",
      "",
      "Tapi kamu nggak harus tunggu 80 untuk mulai melamar. Skor 72 kamu sekarang ini sudah bisa melamar posisi \"trainable\". Banyak perusahaan terbuka kandidat trainable kalau motivasinya jelas.",
    ].join("\n");
  }

  if (p.includes("minder") || p.includes("rendah") || p.includes("malu") || p.includes("takut")) {
    return [
      "Wajar kok merasa begitu. Tapi saya mau bantu kamu lihat dari angle lain.",
      "",
      "Skor di Akselerja itu bukan nilai kamu sebagai orang. Itu cuma deskripsi: \"untuk posisi spesifik ini, kamu masih perlu apa\". Kandidat dengan skor 90 untuk satu posisi bisa jadi skor 55 untuk posisi lain.",
      "",
      "Kamu sudah selangkah di depan ribuan kandidat yang nggak tahu skill mereka apa. Kamu tahu kekuatan kamu, kamu tahu gap kamu, dan kamu lagi kerjain gap itu. Itu yang HR cari.",
      "",
      "Coba satu hal dulu: kerjain satu assessment hari ini. Nggak harus lulus. Cuma supaya kamu lihat \"oh, saya bisa kok\".",
    ].join("\n");
  }

  if (p.includes("lamar") || p.includes("apply") || p.includes("interview")) {
    return [
      "Saran saya, lamar sekarang juga ke lowongan dengan skor kamu 75+, dan paralel kerjakan upskilling.",
      "",
      "Untuk interview, tiga hal yang biasanya ditanya HR untuk posisi entry-level:",
      "",
      "1. \"Ceritain pengalaman kamu yang paling related ke pekerjaan ini\" — siapkan satu cerita konkret, dengan angka kalau bisa.",
      "2. \"Kenapa kami harus pilih kamu?\" — jangan jawab generik. Sebut satu hal spesifik dari job desc yang kamu bisa berikan.",
      "3. \"Kapan kamu bisa mulai?\" — jawab langsung, jangan ragu.",
      "",
      "Mau saya bantu kamu latihan satu pertanyaan?",
    ].join("\n");
  }

  if (p.includes("salary") || p.includes("gaji") || p.includes("upah")) {
    return [
      "Untuk posisi Junior Admin Gudang di Bekasi tahun 2026, rentang gaji wajarnya **Rp 4.2-5.5 juta** per bulan untuk kandidat dengan pengalaman 1 tahun.",
      "",
      "Yang menentukan posisi kamu di rentang itu:",
      "- Sertifikasi Excel intermediate bisa naikkan ~Rp 300-500 ribu",
      "- Kemampuan bahasa Inggris dasar bisa naikkan ~Rp 200-400 ribu",
      "- Pengalaman pakai sistem WMS (Warehouse Management System) bisa naikkan ~Rp 500 ribu",
      "",
      "Saat negosiasi, jangan sebut angka duluan. Tanya balik: \"Berapa range yang sudah disiapkan untuk posisi ini?\"",
    ].join("\n");
  }

  return [
    "Saya catat pertanyaan kamu. Untuk sekarang, saya bisa bantu spesifik di tiga area: **menjelaskan match score**, **menyusun urutan belajar**, dan **strategi melamar**.",
    "",
    "Coba pilih salah satu pertanyaan saran di bawah, atau tanya saya lebih spesifik. Misalnya: \"untuk lowongan X, skill apa yang paling kurang dari saya?\"",
  ].join("\n");
}

export default function CoachChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);
    const delay = 600 + Math.min(trimmed.length * 12, 1400);
    setTimeout(() => {
      const reply: Message = {
        id: `c-${Date.now()}`,
        role: "coach",
        text: generateResponse(trimmed),
      };
      setMessages((prev) => [...prev, reply]);
      setThinking(false);
    }, delay);
  };

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
          placeholder="Tanya apa saja soal karier kamu…"
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

      <p className="text-xs text-(--color-muted)">
        Coach ini panduan, bukan pengganti keputusan kamu. Untuk konteks demo, jawaban di-script. Pada versi produksi, coach akan terhubung ke Azure OpenAI dengan akses ke profil dan riwayat assessment kamu.
      </p>
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
