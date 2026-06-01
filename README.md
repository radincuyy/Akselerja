# Akselerja

Platform AI untuk pencari kerja Indonesia yang menunjukkan posisimu sekarang, kenapa kamu cocok atau belum, dan apa yang harus dipelajari berikutnya. Tanpa jargon, tanpa skor kosong tanpa arti.

Dibangun untuk Hackathon Tema 22 — Job Matching & Workforce Upskilling (Real Sector Economy).

## Fitur Utama

- **Match Score Berbasis Data** — Setiap lowongan dianalisis untuk membandingkan skill kandidat dengan kebutuhan pasar nyata, lengkap dengan penjelasan.
- **Peta Jalan Belajar Personal** — Rencana 3–5 langkah konkret yang menutup skill gap untuk lowongan sasaran.
- **Latihan Praktik Berbasis AI** — Studi kasus, roleplay, dan simulasi dokumen yang dihasilkan Gemini, didasarkan pada standar SKKNI.
- **Portofolio Kompetensi** — Profil skill yang lebih kredibel dari sekadar daftar di CV biasa.
- **Career Coach AI** — Chatbot berbasis Gemini untuk pertanyaan karier dengan moderasi konten.
- **CV Parser Otomatis** — Upload CV dan profil terisi otomatis menggunakan Gemini Flash (dengan fallback Qwen).

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | Next.js 15 (App Router, Turbopack) |
| **Runtime** | React 19, TypeScript 5.7 |
| **Styling** | Tailwind CSS v4 dengan OKLCH color tokens |
| **Font** | General Sans via Fontshare CDN |
| **Auth** | NextAuth.js v5 (email+password dan Google OAuth) |
| **Database** | Azure Cosmos DB (NoSQL, containers: `jobs`, `candidates`, `users`, `aiCache`) |
| **Search** | Azure AI Search — hybrid vector + BM25 (`jobs-v1` index) |
| **AI** | Google Gemini (chat, JSON, embedding, CV parsing) + Qwen fallback |
| **Storage** | Azure Blob Storage (CV file upload) |
| **Email** | Resend (password reset transaksional) |
| **Testing** | Vitest (unit), Playwright (E2E) |
| **Deployment** | Vercel (rekomendasi) atau Node.js server mana saja |

---

## Prasyarat

Sebelum memulai, pastikan sudah terinstall:

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **npm 10+** (disertakan bersama Node.js)
- Akun **Google AI Studio** untuk Gemini API Key (gratis)
- Akun **Azure** untuk Cosmos DB dan AI Search
- Akun **Resend** untuk email transaksional

---

## Memulai (Local Development)

### 1. Clone Repository

```bash
git clone https://github.com/radincuyy/Akselerja.git
cd Akselerja
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment

Salin file contoh environment:

```bash
cp .env.example .env.local
```

Isi variabel berikut di `.env.local`. Lihat bagian [Environment Variables](#environment-variables) untuk detail lengkap.

### 4. Setup Database (Cosmos DB)

Jalankan skrip setup untuk membuat containers yang diperlukan:

```bash
npx tsx scripts/cosmos-setup.ts
```

Untuk mengisi data lowongan dari Glints:

```bash
# 1. Scrape sitemap Glints
npx tsx scripts/scrape-glints-sitemap.ts

# 2. Ambil detail tiap lowongan
npx tsx scripts/scrape-glints-detail.ts

# 3. Normalisasi dan simpan ke Cosmos
npx tsx scripts/normalize-glints.ts
npx tsx scripts/cosmos-replace-jobs.ts
```

### 5. Setup Azure AI Search (Opsional, tapi Direkomendasikan)

Azure AI Search meningkatkan relevansi pencarian dengan hybrid vector + BM25. Tanpa ini, app fallback ke scan Cosmos yang lebih lambat.

```bash
# Buat index di Azure AI Search
npx tsx scripts/search-setup.ts

# Sinkronisasi data lowongan ke index
npx tsx scripts/search-sync.ts

# Populate embedding vectors (768-dim Gemini)
npx tsx scripts/embed-jobs.ts
```

### 6. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

### Wajib (app tidak bisa jalan tanpa ini)

| Variabel | Deskripsi | Cara Mendapatkan |
|---|---|---|
| `AUTH_SECRET` | Secret untuk signing session NextAuth | `openssl rand -base64 32` |
| `COSMOS_ENDPOINT` | URL endpoint Cosmos DB | Azure Portal > Cosmos DB > Keys |
| `COSMOS_KEY` | Primary key Cosmos DB | Azure Portal > Cosmos DB > Keys |
| `COSMOS_DATABASE` | Nama database | Default: `akselerja` |
| `GEMINI_API_KEY` | Google Gemini API key | [aistudio.google.com](https://aistudio.google.com) |
| `NEXT_PUBLIC_APP_URL` | URL publik deployment | Misal: `https://akselerja.id` |
| `RESEND_API_KEY` | API key Resend untuk email | [resend.com](https://resend.com) |
| `RESEND_FROM` | Alamat pengirim email | `Akselerja <no-reply@domain.com>` |

### Opsional (app terdegradasi dengan baik jika tidak ada)

| Variabel | Deskripsi | Default |
|---|---|---|
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | Login email+password saja |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | Login email+password saja |
| `AZURE_SEARCH_ENDPOINT` | Azure AI Search endpoint | Fallback ke Cosmos scan |
| `AZURE_SEARCH_KEY` | Azure AI Search API key | Fallback ke Cosmos scan |
| `AZURE_SEARCH_INDEX_JOBS` | Nama index AI Search | `jobs-v1` |
| `AZURE_STORAGE_CONNECTION_STRING` | Koneksi Azure Blob Storage | CV diparse tapi tidak disimpan |
| `AZURE_STORAGE_CV_CONTAINER` | Container untuk CV | `cv` |
| `QWEN_API_KEY` | Qwen API key untuk fallback AI | Tidak ada fallback saat Gemini rate-limited |
| `YOUTUBE_API_KEY` | YouTube Data API v3 | Halaman belajar tanpa video |
| `AZURE_CONTENT_SAFETY_ENDPOINT` | Azure Content Safety endpoint | Coach tanpa moderasi |
| `AZURE_CONTENT_SAFETY_KEY` | Azure Content Safety key | Coach tanpa moderasi |
| `GEMINI_MODEL` | Override model Gemini | Default dari kode |

### Testing / Development Only

| Variabel | Deskripsi |
|---|---|
| `E2E_MODE` | Aktifkan backdoor `/api/test/sign-in` untuk Playwright. **Jangan pernah set di production.** |

---

## Arsitektur

### Struktur Direktori

```
├── app/                      # Next.js App Router
│   ├── app/                  # Route kandidat (butuh login)
│   │   ├── belajar/          # Roadmap belajar dan latihan praktik
│   │   ├── coach/            # Career coach AI
│   │   ├── lowongan/         # Daftar dan detail lowongan
│   │   ├── profil/           # Manajemen profil dan CV
│   │   └── pengaturan/       # Pengaturan akun
│   ├── api/                  # API routes (auth, profile, jobs, dll)
│   ├── daftar/               # Halaman registrasi
│   ├── masuk/                # Halaman login
│   ├── onboarding/           # Onboarding kandidat baru
│   ├── globals.css           # Design tokens OKLCH + Tailwind v4
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page (redirect ke /app jika sudah login)
│
├── components/
│   ├── auth/                 # Form login, register, reset password
│   ├── belajar/              # SkillPracticeRunner, GenerationLoadingState
│   ├── jobs/                 # JobCard, ScoreDisplay, JobFilterSheet
│   ├── layout/               # AppShell (sidebar + header), Logo
│   ├── marketing/            # Landing page: Nav, Hero, WhatYouGet, dll
│   └── ui/                   # Komponen UI reusable
│
├── lib/
│   ├── ai/                   # Gemini dan Qwen JSON generation
│   ├── auth/                 # Session helpers
│   ├── infra/                # Cosmos DB + Azure Blob clients
│   ├── jobs/                 # Match scoring, ranking, recommendation
│   ├── learning/             # Practice generation, checkpoint, SKKNI search
│   ├── profile/              # CV parser, profile mutations, scoring
│   └── shared/               # TypeScript types dan format utilities
│
├── scripts/                  # CLI scripts untuk data pipeline
│   ├── scrape-glints-*.ts    # Scraping lowongan dari Glints
│   ├── normalize-glints.ts   # Normalisasi ke schema Akselerja
│   ├── cosmos-*.ts           # Operasi Cosmos DB
│   ├── search-*.ts           # Azure AI Search sync
│   └── embed-jobs.ts         # Populate embedding vectors
│
├── public/                   # Static assets (logo, fonts)
├── tests/                    # Unit dan E2E tests
│   ├── unit/                 # Vitest unit tests
│   └── e2e/                  # Playwright browser tests
└── docs/                     # PRODUCT.md (strategi) dan DESIGN.md (visual)
```

### Alur Request

```
Browser → Next.js Middleware (auth check)
       → App Router (Server Component)
       → Cosmos DB / Azure AI Search
       → React (hydration)
```

### Alur Data Match Score

```
Profil Kandidat (skills, pengalaman, pendidikan)
       ↓
lib/jobs/recommendations.ts → rankCandidateJobs()
       ↓
lib/jobs/match-reason.ts → buildMatchReason()
       ↓
Match Score (0–100) + penjelasan positif/negatif
       ↓
JobCard + ScoreDisplay
```

### Alur Latihan Praktik AI

```
Kandidat klik "Mulai belajar"
       ↓
app/app/belajar/[slug]/page.tsx
       ↓
Promise.all([
  practice-generation → generateTask() via Gemini
  checkpoint-generator → generateCheckpointSet() via Gemini
  lib/learning/youtube-search → cari video materi
])
       ↓
SkillPracticeRunner (client component)
       ↓
Jawaban kandidat → /api/practice/[taskId]/submit → rubric grading
```

### Sistem AI (Multi-Layer)

| Fitur | Model Utama | Fallback |
|---|---|---|
| CV Parsing | Gemini 2.5 Flash | Qwen (qwen-plus, Singapore region) |
| Chat Coach | Gemini (chat model) | Qwen |
| JSON Generation | Gemini 2.5 Flash | Qwen |
| Embeddings | Gemini embedding-001 (768-dim) | Tidak ada |
| Practice Task | Gemini (JSON) | Qwen |
| Moderasi | Azure Content Safety | Fails open (atau closed jika `AZURE_CONTENT_SAFETY_FAIL_CLOSED=1`) |

### Database Schema (Cosmos DB Containers)

**`candidates`** — Profil kandidat
```
id, userId, name, location, experienceYears, skills[], education[],
experience[], cv (blob URL), readinessScore, profileVector (768-dim)
```

**`jobs`** — Data lowongan (dari Glints)
```
id, companyId (partition key), title, company, location, type,
requirements[], salaryMin, salaryMax, minEducation, descriptionVector
```

**`users`** — Akun auth
```
id, email, passwordHash, name, role, createdAt
```

**`aiCache`** — Cache response AI
```
id, key, task/checkpoint (JSON), createdAt, TTL (168 jam)
```

---

## Scripts yang Tersedia

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Server development (Next.js + Turbopack) |
| `npm run build` | Build production |
| `npm run start` | Jalankan production build |
| `npm run lint` | ESLint check |
| `npm run test` | Jalankan unit tests (Vitest) |
| `npm run test:watch` | Unit tests dalam mode watch |
| `npm run test:e2e` | Jalankan E2E tests (Playwright) |
| `npx tsc --noEmit` | Type check TypeScript |

### Data Pipeline Scripts

| Perintah | Deskripsi |
|---|---|
| `npx tsx scripts/cosmos-setup.ts` | Buat containers Cosmos DB |
| `npx tsx scripts/scrape-glints-sitemap.ts` | Scrape URL lowongan dari Glints sitemap |
| `npx tsx scripts/scrape-glints-detail.ts` | Scrape detail setiap lowongan |
| `npx tsx scripts/normalize-glints.ts` | Normalisasi ke schema Akselerja |
| `npx tsx scripts/cosmos-replace-jobs.ts` | Upsert lowongan ke Cosmos |
| `npx tsx scripts/search-setup.ts` | Buat index Azure AI Search |
| `npx tsx scripts/search-sync.ts` | Sinkronisasi scalar fields ke AI Search |
| `npx tsx scripts/embed-jobs.ts` | Populate embedding vectors (idempoten) |
| `npx tsx scripts/refresh-profile-vectors.ts` | Refresh embedding vektor semua profil |

---

## Testing

### Unit Tests (Vitest)

```bash
# Jalankan semua unit tests
npm run test

# Mode watch
npm run test:watch
```

Test tersedia di `tests/unit/`:
- `match.test.ts` — Logika match scoring
- `practice-grading.test.ts` — Rubric grading latihan
- `password-rules.test.ts` — Validasi password
- `skills.test.ts` — Data skills
- dan lainnya

### E2E Tests (Playwright)

```bash
# Pastikan E2E_MODE=true di .env.local
npm run test:e2e
```

---

## Deployment

### Vercel (Direkomendasikan)

1. Push ke GitHub
2. Import repo di [vercel.com](https://vercel.com)
3. Set semua environment variables di Vercel dashboard
4. Deploy otomatis di setiap push ke `main`

```bash
# Atau deploy via CLI
npx vercel --prod
```

### Node.js Server

```bash
# Build
npm run build

# Jalankan
npm start
```

Pastikan semua environment variables di-set sebelum menjalankan `npm start`.

### Environment Production

Variabel tambahan yang perlu di-set saat production:

```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://domain-kamu.com
AUTH_SECRET=<generated-secret>
```

---

## Troubleshooting

### "Cosmos DB connection failed"

Pastikan `COSMOS_ENDPOINT` dan `COSMOS_KEY` sudah benar. Format endpoint: `https://<account>.documents.azure.com:443/`.

Jalankan `npx tsx scripts/cosmos-setup.ts` untuk membuat containers jika belum ada.

### "Gemini API quota exceeded"

App akan otomatis fallback ke Qwen jika `QWEN_API_KEY` sudah di-set. Jika tidak, fitur AI akan gagal dengan graceful degradation.

Untuk meningkatkan limit, upgrade ke Gemini API paid tier atau atur `GEMINI_MODEL` ke model yang lebih hemat token.

### "Azure AI Search tidak mengembalikan hasil"

Pastikan:
1. `AZURE_SEARCH_ENDPOINT`, `AZURE_SEARCH_KEY`, dan `AZURE_SEARCH_INDEX_JOBS` sudah di-set.
2. Index sudah dibuat: `npx tsx scripts/search-setup.ts`
3. Data sudah disinkronkan: `npx tsx scripts/search-sync.ts`
4. Vectors sudah di-populate: `npx tsx scripts/embed-jobs.ts`

Tanpa AI Search, app fallback ke pencarian Cosmos DB biasa (hasil tetap muncul tapi ranking kurang relevan).

### "CV tidak tersimpan setelah parsing"

Azure Blob Storage tidak dikonfigurasi. Set `AZURE_STORAGE_CONNECTION_STRING` dan `AZURE_STORAGE_CV_CONTAINER`. Parsing CV tetap berfungsi, hanya file aslinya yang tidak disimpan.

### Port 3000 sudah terpakai

```bash
# Gunakan port lain
PORT=3001 npm run dev
```

### TypeScript errors

```bash
npx tsc --noEmit
```

Pola `text-(--color-X)` di Tailwind adalah intentional (OKLCH custom tokens). Linting akan warn tapi ini bukan error.

---

## Kontribusi

Branch utama: `main`  
Branch development: `new-dev`

Workflow:
```bash
git checkout new-dev
git pull origin new-dev
# Buat perubahan
git add <files>
git commit -m "feat/fix/style: deskripsi singkat"
git push origin new-dev
# Buka PR dari new-dev ke main di GitHub
```

---

## Lisensi

Hak cipta dilindungi oleh pemilik proyek. Dibuat untuk keperluan hackathon.
