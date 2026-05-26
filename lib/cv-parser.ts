import { GoogleGenAI } from "@google/genai";
import { skillById } from "./skills";

type ParsedSkill = {
  id: string;
  name: string;
};

type ParsedEducation = {
  institution: string;
  degree: string;
  startMonth?: string;
  endMonth?: string;
  notes?: string;
};

type ParsedExperience = {
  position: string;
  company: string;
  startMonth?: string;
  endMonth?: string;
  duties?: string;
};

type ParsedOrganization = {
  role: string;
  organization: string;
  startMonth?: string;
  endMonth?: string;
  duties?: string;
};

type ParsedProject = {
  title: string;
  context?: string;
  startMonth?: string;
  endMonth?: string;
  duties?: string;
  link?: string;
};

type ParsedAchievement = {
  title: string;
  year: string;
  description?: string;
};

type ParsedPersonal = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  bio?: string;
};

export type ParsedCv = {
  personal: ParsedPersonal;
  skills: ParsedSkill[];
  education: ParsedEducation[];
  experience: ParsedExperience[];
  organizations: ParsedOrganization[];
  projects: ParsedProject[];
  achievements: ParsedAchievement[];
  notes: string[];
};

export type CvParseInput = {
  buffer: Buffer;
  contentType: string;
  filename: string;
};

type CvParserEngine = (input: CvParseInput) => Promise<ParsedCv>;

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

// Slug stabil supaya re-upload CV tidak bikin skill duplikat.
function slugifySkillName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "skill";
}

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
ekstrak data identitas kandidat, skill (hard + soft + tools), riwayat
pendidikan, pengalaman kerja, pengalaman organisasi, dan proyek.

Aturan data identitas (personal):
- "name" = nama lengkap kandidat seperti tertulis di header CV.
- "email" = alamat email pribadi yang tertulis di CV (kosongkan kalau
  tidak ada).
- "phone" = nomor telepon dalam format yang tertulis di CV.
- "location" = nama kota tempat tinggal saja (mis. "Jakarta Selatan",
  "Surabaya"). Jangan masukkan provinsi atau alamat lengkap.
- "linkedin", "github", "portfolio" = URL lengkap kalau disebut di CV.
- "bio" = ringkasan profil dari section "About Me", "Profile", atau
  "Summary". Salin apa adanya, jangan dipotong. Maksimal 2000 karakter.
  Kalau CV tidak punya summary, kosongkan.
- Field yang tidak ada di CV → kosongkan (jangan menebak).

Aturan skill:
- Pecah skill umbrella jadi item terpisah. Kalau CV menulis "Pemrograman
  (Java, Python, C++)", kembalikan 4 item: "Pemrograman", "Java",
  "Python", "C++". Kalau CV menulis "Pengembangan Web (HTML, CSS,
  JavaScript, React)", kembalikan 5 item: "Pengembangan Web", "HTML",
  "CSS", "JavaScript", "React". Hapus tanda kurung dari nama skill.
- Kembalikan nama skill apa adanya seperti yang tertulis di CV. Boleh Bahasa
  Indonesia atau Bahasa Inggris, sesuai aslinya. Jangan terjemahkan.
- Pakai bentuk standar: "Microsoft Excel", "JavaScript", "Komunikasi".
- Maksimal 100 skill, prioritaskan yang paling jelas didukung isi CV.
- Hanya skill yang benar-benar disebut atau jelas tersirat. Jangan menebak.

Aturan pendidikan, pengalaman, organisasi, dan proyek:
- startMonth dan endMonth pakai format "YYYY-MM" (mis. "2022-09"). Kalau
  hanya ada tahun tanpa bulan, pakai bulan 01 atau 12 sesuai konteks
  (start = bulan paling awal yang mungkin, end = bulan terakhir).
- Kalau pekerjaan/pendidikan/organisasi/proyek masih berjalan, kosongkan
  endMonth.
- Untuk pendidikan, "degree" = jenjang + jurusan kalau ada (mis. "S1
  Teknik Informatika"). "institution" = nama sekolah/universitas.
- Untuk pengalaman kerja (experience), masukkan posisi yang dibayar:
  pekerjaan tetap, kontrak, magang berbayar, freelance. "position" = jabatan,
  "company" = perusahaan, "duties" = ringkasan tanggung jawab dalam 1-2
  kalimat.
- Untuk pengalaman organisasi (organizations), masukkan kepengurusan
  organisasi mahasiswa, komunitas, BEM/HIMA, kepanitiaan, kegiatan
  kerelawanan, atau ekstrakurikuler. JANGAN masukkan ke experience.
  "role" = jabatan (mis. "Ketua", "Bendahara"), "organization" = nama
  organisasi.
- Untuk proyek (projects), masukkan proyek kuliah, proyek pribadi,
  hackathon, kontribusi open source, atau karya yang berdiri sendiri.
  JANGAN masukkan ke experience. "title" = judul proyek, "context" =
  konteks singkat (mis. "Tugas akhir", "Hackathon Kemenpora 2024",
  "Proyek pribadi"), "link" = URL kalau ada.
- Untuk prestasi (achievements), masukkan penghargaan, juara lomba,
  beasiswa, sertifikat kompetisi, atau pencapaian akademik/profesional
  yang bisa diverifikasi. Section di CV biasanya bernama "Achievements",
  "Awards", "Prestasi", atau "Penghargaan". JANGAN masukkan sertifikasi
  rutin (mis. TOEFL, AWS Certified) ke prestasi. "title" = nama prestasi
  (mis. "Juara 1 Hackathon Kemenpora"), "year" = tahun atau periode
  (mis. "2024"), "description" = ringkasan singkat (boleh kosong).
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
            personal: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                location: { type: "string" },
                linkedin: { type: "string" },
                github: { type: "string" },
                portfolio: { type: "string" },
                bio: { type: "string" },
              },
            },
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
            organizations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: { type: "string" },
                  organization: { type: "string" },
                  startMonth: { type: "string" },
                  endMonth: { type: "string" },
                  duties: { type: "string" },
                },
                required: ["role", "organization"],
              },
            },
            projects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  context: { type: "string" },
                  startMonth: { type: "string" },
                  endMonth: { type: "string" },
                  duties: { type: "string" },
                  link: { type: "string" },
                },
                required: ["title"],
              },
            },
            achievements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  year: { type: "string" },
                  description: { type: "string" },
                },
                required: ["title", "year"],
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

  const organizations: ParsedOrganization[] = (
    (parsed as { organizations?: unknown[] }).organizations ?? []
  )
    .map((raw) => {
      const o = raw as Record<string, unknown>;
      return {
        role: String(o.role ?? "").trim(),
        organization: String(o.organization ?? "").trim(),
        startMonth: o.startMonth ? String(o.startMonth).trim() : undefined,
        endMonth: o.endMonth ? String(o.endMonth).trim() : undefined,
        duties: o.duties ? String(o.duties).trim() : undefined,
      };
    })
    .filter((o) => o.role && o.organization);

  const projects: ParsedProject[] = (
    (parsed as { projects?: unknown[] }).projects ?? []
  )
    .map((raw) => {
      const p = raw as Record<string, unknown>;
      return {
        title: String(p.title ?? "").trim(),
        context: p.context ? String(p.context).trim() : undefined,
        startMonth: p.startMonth ? String(p.startMonth).trim() : undefined,
        endMonth: p.endMonth ? String(p.endMonth).trim() : undefined,
        duties: p.duties ? String(p.duties).trim() : undefined,
        link: p.link ? String(p.link).trim() : undefined,
      };
    })
    .filter((p) => p.title);

  const achievements: ParsedAchievement[] = (
    (parsed as { achievements?: unknown[] }).achievements ?? []
  )
    .map((raw) => {
      const a = raw as Record<string, unknown>;
      return {
        title: String(a.title ?? "").trim(),
        year: String(a.year ?? "").trim(),
        description: a.description ? String(a.description).trim() : undefined,
      };
    })
    .filter((a) => a.title);

  const taxonomyHits = skills.filter((s) => skillById[s.id]).length;

  const rawPersonal = ((parsed as { personal?: unknown }).personal ?? {}) as
    | Record<string, unknown>
    | undefined;
  const personal: ParsedPersonal = {
    name: rawPersonal?.name ? String(rawPersonal.name).trim() : undefined,
    email: rawPersonal?.email
      ? String(rawPersonal.email).trim().toLowerCase()
      : undefined,
    phone: rawPersonal?.phone ? String(rawPersonal.phone).trim() : undefined,
    location: rawPersonal?.location
      ? String(rawPersonal.location).trim()
      : undefined,
    linkedin: rawPersonal?.linkedin
      ? String(rawPersonal.linkedin).trim()
      : undefined,
    github: rawPersonal?.github
      ? String(rawPersonal.github).trim()
      : undefined,
    portfolio: rawPersonal?.portfolio
      ? String(rawPersonal.portfolio).trim()
      : undefined,
    bio: rawPersonal?.bio
      ? String(rawPersonal.bio).trim().slice(0, 2000)
      : undefined,
  };

  return {
    personal,
    skills,
    education,
    experience,
    organizations,
    projects,
    achievements,
    notes: [
      skills.length > 0
        ? `Kami menemukan ${skills.length} skill dari CV-mu.`
        : "Tidak ada skill yang terbaca dari CV. Coba upload format lain atau isi manual.",
      taxonomyHits > 0
        ? `${taxonomyHits} di antaranya cocok dengan taksonomi lowongan kami; sisanya disimpan apa adanya.`
        : "Skill ini disimpan apa adanya. Kalau tidak cocok dengan taksonomi lowongan, match score-nya tidak terhitung.",
      `Pendidikan terdeteksi: ${education.length}. Pengalaman kerja: ${experience.length}. Pengalaman organisasi: ${organizations.length}. Proyek: ${projects.length}.`,
    ],
  };
};

export async function parseCv(input: CvParseInput): Promise<ParsedCv> {
  try {
    return await geminiEngine(input);
  } catch (err) {
    console.error("[cv-parser] Gemini threw:", err);
    throw new Error(
      err instanceof Error
        ? err.message
        : "Parser CV gagal memproses file. Coba lagi atau hubungi admin.",
    );
  }
}
