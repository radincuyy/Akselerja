import { GoogleGenAI } from "@google/genai";
import { skillById } from "./skills";

export type ParsedSkill = {
  id: string;
  name: string;
};

export type ParsedEducation = {
  institution: string;
  degree: string;
  startMonth?: string;
  endMonth?: string;
  notes?: string;
};

export type ParsedExperience = {
  position: string;
  company: string;
  startMonth?: string;
  endMonth?: string;
  duties?: string;
};

export type ParsedCv = {
  skills: ParsedSkill[];
  education: ParsedEducation[];
  experience: ParsedExperience[];
  notes: string[];
};

export type CvParseInput = {
  buffer: Buffer;
  contentType: string;
  filename: string;
};

type CvParserEngine = (input: CvParseInput) => Promise<ParsedCv>;

// Slug stabil supaya re-upload CV tidak bikin skill duplikat.
export function slugifySkillName(name: string): string {
  return (
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "skill"
  );
}

// Map label umum/colloquial ke skillId taksonomi supaya match score nyala
// untuk skill yang dikenal lib/skills.ts.
const TAXONOMY_ALIASES: Record<string, string> = {
  "microsoft-excel": "excel",
  "ms-excel": "excel",
  "excel": "excel",
  "warehouse-management-system": "wms",
  "wms": "wms",
  "inventory-management": "inventory",
  "inventory": "inventory",
  "manajemen-inventaris": "inventory",
  "manajemen-stok": "inventory",
  "customer-service": "customer-service",
  "layanan-pelanggan": "customer-service",
  "komunikasi": "komunikasi",
  "communication": "komunikasi",
  "sql": "sql",
  "power-bi": "powerbi",
  "powerbi": "powerbi",
  "data-literacy": "data-literacy",
  "literasi-data": "data-literacy",
  "sales": "sales",
  "penjualan": "sales",
  "manufacturing": "manufacturing-basics",
  "manufaktur": "manufacturing-basics",
  "problem-solving": "problem-solving",
  "pemecahan-masalah": "problem-solving",
  "ketelitian": "ketelitian",
  "attention-to-detail": "ketelitian",
  "email-management": "email-management",
  "manajemen-email": "email-management",
  "bookkeeping": "bookkeeping",
  "pembukuan": "bookkeeping",
  "visual-hierarchy": "visual-hierarchy",
  "laporan-stok": "laporan-stok",
  "stock-report": "laporan-stok",
  "sap-inventory": "sap-inventory",
  "sap": "sap-inventory",
};

function resolveSkillId(name: string): string {
  const slug = slugifySkillName(name);
  return TAXONOMY_ALIASES[slug] ?? slug;
}

// Gemini Flash: terima file inline, balikkan struktur sesuai responseSchema.
// Free tier 15 RPM/1500 RPD; "limit: 0" 429 berarti API key tidak punya akses
// free tier — buat key baru di aistudio.google.com.
const geminiEngine: CvParserEngine = async (input) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY tidak terkonfigurasi.");
  }
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Kamu adalah parser CV untuk job board Indonesia. Tugas:
ekstrak skill kandidat (hard + soft + tools), riwayat pendidikan, dan
riwayat pengalaman kerja dari isi CV.

Aturan skill:
- Kembalikan nama skill apa adanya seperti yang tertulis di CV. Boleh Bahasa
  Indonesia atau Bahasa Inggris, sesuai aslinya. Jangan terjemahkan.
- Pakai bentuk standar: "Microsoft Excel", "JavaScript", "Komunikasi".
- Maksimal 15 skill, prioritaskan yang paling jelas didukung isi CV.
- Hanya skill yang benar-benar disebut atau jelas tersirat. Jangan menebak.

Aturan pendidikan & pengalaman:
- startMonth dan endMonth pakai format "YYYY-MM" (mis. "2022-09"). Kalau
  hanya ada tahun tanpa bulan, pakai bulan 01 atau 12 sesuai konteks
  (start = bulan paling awal yang mungkin, end = bulan terakhir).
- Kalau pekerjaan/pendidikan masih berjalan, kosongkan endMonth.
- Untuk pendidikan, "degree" = jenjang + jurusan kalau ada (mis. "S1
  Teknik Informatika"). "institution" = nama sekolah/universitas.
- Untuk pengalaman, "position" = jabatan, "company" = perusahaan, "duties"
  = ringkasan tanggung jawab dalam 1-2 kalimat.
- Tidak ada data → kembalikan array kosong. Jangan menebak.

Output JSON sesuai schema.`;

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: input.contentType || "application/pdf",
            data: input.buffer.toString("base64"),
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            skills: {
              type: "array",
              items: { type: "string" },
            },
            education: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  institution: { type: "string" },
                  degree: { type: "string" },
                  startMonth: { type: "string" },
                  endMonth: { type: "string" },
                  notes: { type: "string" },
                },
                required: ["institution", "degree"],
              },
            },
            experience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  position: { type: "string" },
                  company: { type: "string" },
                  startMonth: { type: "string" },
                  endMonth: { type: "string" },
                  duties: { type: "string" },
                },
                required: ["position", "company"],
              },
            },
          },
          required: ["skills", "education", "experience"],
        },
      },
    });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    const raw = String(err);
    if (status === 429 && /limit: 0/.test(raw)) {
      throw new Error(
        "Kuota Gemini di API key ini = 0. Buat API key baru di aistudio.google.com (project default-nya otomatis ada free tier).",
      );
    }
    if (status === 429) {
      throw new Error(
        "Kuota Gemini terlampaui. Tunggu beberapa detik lalu coba lagi.",
      );
    }
    throw err;
  }

  const raw = response.text ?? "{}";
  let parsed: {
    skills?: string[];
    education?: Array<{
      institution?: string;
      degree?: string;
      startMonth?: string;
      endMonth?: string;
      notes?: string;
    }>;
    experience?: Array<{
      position?: string;
      company?: string;
      startMonth?: string;
      endMonth?: string;
      duties?: string;
    }>;
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Parser AI mengembalikan respon tidak valid.");
  }

  const names = Array.isArray(parsed.skills) ? parsed.skills : [];
  const byId = new Map<string, ParsedSkill>();
  for (const rawName of names) {
    const name = String(rawName).trim();
    if (!name) continue;
    const id = resolveSkillId(name);
    if (!byId.has(id)) byId.set(id, { id, name });
  }
  const skills = Array.from(byId.values());

  const education: ParsedEducation[] = (parsed.education ?? [])
    .map((e) => ({
      institution: String(e.institution ?? "").trim(),
      degree: String(e.degree ?? "").trim(),
      startMonth: e.startMonth ? String(e.startMonth).trim() : undefined,
      endMonth: e.endMonth ? String(e.endMonth).trim() : undefined,
      notes: e.notes ? String(e.notes).trim() : undefined,
    }))
    .filter((e) => e.institution && e.degree);

  const experience: ParsedExperience[] = (parsed.experience ?? [])
    .map((e) => ({
      position: String(e.position ?? "").trim(),
      company: String(e.company ?? "").trim(),
      startMonth: e.startMonth ? String(e.startMonth).trim() : undefined,
      endMonth: e.endMonth ? String(e.endMonth).trim() : undefined,
      duties: e.duties ? String(e.duties).trim() : undefined,
    }))
    .filter((e) => e.position && e.company);

  const taxonomyHits = skills.filter((s) => skillById[s.id]).length;

  return {
    skills,
    education,
    experience,
    notes: [
      skills.length > 0
        ? `Kami menemukan ${skills.length} skill dari CV-mu.`
        : "Tidak ada skill yang terbaca dari CV. Coba upload format lain atau isi manual.",
      taxonomyHits > 0
        ? `${taxonomyHits} di antaranya cocok dengan taksonomi lowongan kami; sisanya disimpan apa adanya.`
        : "Skill ini disimpan apa adanya. Kalau tidak cocok dengan taksonomi lowongan, match score-nya tidak terhitung.",
      `Pendidikan terdeteksi: ${education.length}. Pengalaman kerja: ${experience.length}.`,
    ],
  };
};

// Engine registry. Tambahkan provider dengan import + entry baru di sini.
const providers: Record<string, CvParserEngine> = {
  gemini: geminiEngine,
};

function pickEngine(): { name: string; engine: CvParserEngine } {
  const requested = process.env.CV_PARSER_PROVIDER ?? "gemini";
  const engine = providers[requested];
  if (!engine) {
    throw new Error(
      `Unknown CV_PARSER_PROVIDER="${requested}". Available: ${Object.keys(providers).join(", ")}`,
    );
  }
  return { name: requested, engine };
}

export async function parseCv(input: CvParseInput): Promise<ParsedCv> {
  const { name, engine } = pickEngine();
  try {
    return await engine(input);
  } catch (err) {
    console.error(`[cv-parser] Engine "${name}" threw:`, err);
    throw new Error(
      err instanceof Error
        ? err.message
        : "Parser CV gagal memproses file. Coba lagi atau hubungi admin.",
    );
  }
}
