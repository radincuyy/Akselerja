# Azure Architecture

Reference doc untuk integrasi Akselerja dengan Microsoft Azure. Pasangan teknis dari `PLAN.md` (yang menjelaskan urutan dan alasan); dokumen ini menjelaskan **apa** yang di-provision, **dengan SKU mana**, **dengan nama apa**, dan **dengan secret apa**.

Audience: developer yang akan menulis kode integrasi atau melakukan provisioning. Bukan onboarding doc, bukan strategy doc.

---

## 1. Arsitektur ringkas

```
                        Browser (Android 4-inch / Laptop)
                                    │
                                    ▼
                   ┌─────────────────────────────────┐
                   │   Azure App Service (Linux)     │
                   │   Next.js 15 + React 19         │
                   │   Node 22 runtime               │
                   └─────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
  ┌──────────┐              ┌─────────────┐             ┌──────────────┐
  │  Cosmos  │              │   Azure     │             │   Blob       │
  │   DB     │              │   OpenAI    │             │   Storage    │
  │  NoSQL   │              │  gpt-4o-    │             │   (CV PDF)   │
  │          │              │  mini +     │             │              │
  │          │              │  embeddings │             │              │
  └──────────┘              └─────────────┘             └──────────────┘
        │                           │                           │
        └───────────────┬───────────┴───────────────────────────┘
                        ▼
                  ┌──────────────┐
                  │  Key Vault   │
                  │  (secrets)   │
                  └──────────────┘
                        │
                        ▼
                  ┌──────────────────────────┐
                  │  Application Insights    │
                  │  (logging + telemetry)   │
                  └──────────────────────────┘
```

Tambahan untuk Fase 3 (lihat `PLAN.md`): Azure AI Search di antara App Service dan OpenAI, untuk hybrid matching. Tidak provision sekarang.

---

## 2. Service inventory

| Service | SKU | Region | Purpose | Estimasi biaya/bulan |
|---|---|---|---|---|
| **Resource Group** | `akselerja-prod` | Sweden Central | Container untuk semua resource | 0 |
| **App Service Plan** | B1 (Basic) atau P0v3 saat demo | Sweden Central | Hosting Next.js | $13 (B1) sampai $80 (P0v3) |
| **App Service** | Linux, Node 22 | Sweden Central | Web app | (termasuk plan) |
| **Cosmos DB** | Free tier 1000 RU/s + 25 GB | Sweden Central | Persistence (users, jobs, applications, etc.) | 0 (free tier) |
| **Blob Storage** | Standard LRS | Sweden Central | CV upload, sertifikat | < $1 |
| **Key Vault** | Standard | Sweden Central | Secret store | $0.03 per 10k operations |
| **Application Insights** | Pay as you go (5 GB free) | Sweden Central | Logging, traces | 0 (within free) |
| **Azure OpenAI** | Pay as you go | Sweden Central | gpt-4o-mini + text-embedding-3-small | $5 sampai $30 (depends usage) |
| **Azure AI Search** *(Fase 3)* | Basic | Sweden Central | Hybrid semantic search | $74 |

**Region rationale:** Sweden Central. Konsistensi Azure OpenAI availability paling tinggi, latency dari Indonesia ~250ms (acceptable untuk demo). Alternatif: Southeast Asia (Singapore) — latency lebih rendah, tapi OpenAI deployment kadang antrian.

**Estimasi total per bulan untuk demo**: $20-50 selama development, $80-150 saat presentasi (P0v3 plan + heavier OpenAI usage). AI Search menambah $74 di Fase 3.

---

## 3. Environment variables schema

Disimpan di `.env.local` (gitignored). Production: App Service references ke Key Vault.

```bash
# === Cosmos DB ===
COSMOS_ENDPOINT=https://akselerja-cosmos.documents.azure.com:443/
COSMOS_KEY=<primary-key-from-portal>
COSMOS_DATABASE=akselerja

# === Blob Storage ===
BLOB_ACCOUNT=akselerjastorage
BLOB_KEY=<primary-key>
BLOB_CONTAINER_CV=cvs
BLOB_CONTAINER_DOCS=documents

# === Azure OpenAI ===
AZURE_OPENAI_ENDPOINT=https://akselerja-openai.openai.azure.com/
AZURE_OPENAI_KEY=<api-key-1>
AZURE_OPENAI_API_VERSION=2024-10-21
AZURE_OPENAI_DEPLOYMENT_CHAT=gpt-4o-mini
AZURE_OPENAI_DEPLOYMENT_EMBED=text-embedding-3-small

# === Application Insights ===
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...

# === Auth.js (Fase 1.2) ===
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=http://localhost:3000   # production: https://akselerja.id
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
EMAIL_SERVER=<smtp-url>          # for magic link
EMAIL_FROM=halo@akselerja.id

# === Azure AI Search (Fase 3, optional) ===
AZURE_SEARCH_ENDPOINT=https://akselerja-search.search.windows.net
AZURE_SEARCH_KEY=<admin-key>
AZURE_SEARCH_INDEX_JOBS=jobs-v1
AZURE_SEARCH_INDEX_CANDIDATES=candidates-v1
```

**Aturan:**
- Tidak pernah commit `.env.local`. `.gitignore` sudah cover `.env.*`.
- Production: tiap variable di-resolve via Key Vault reference, bukan plain env var.
- Format Key Vault reference di App Service: `@Microsoft.KeyVault(VaultName=akselerja-kv;SecretName=cosmos-key)`.
- Secret rotation: minimal per quarter saat production.

---

## 4. Resource naming convention

Hindari nama generik supaya tidak bentrok antar project/lingkungan.

| Resource type | Format | Contoh |
|---|---|---|
| Resource group | `akselerja-{env}` | `akselerja-prod`, `akselerja-staging` |
| App Service | `akselerja-app-{env}` | `akselerja-app-prod` |
| Cosmos DB account | `akselerja-cosmos-{env}` | `akselerja-cosmos-prod` |
| Blob Storage | `akselerjastorage{env}` (no dash, max 24 char, lowercase) | `akselerjastorageprod` |
| Key Vault | `akselerja-kv-{env}` | `akselerja-kv-prod` |
| Azure OpenAI | `akselerja-openai-{env}` | `akselerja-openai-prod` |
| Application Insights | `akselerja-insights-{env}` | `akselerja-insights-prod` |

**Tag wajib di setiap resource:**
- `project=akselerja`
- `env=prod` atau `env=staging`
- `owner=<your-email>`
- `cost-center=demo` (atau actual cost center kalau sudah production)

---

## 5. Cosmos DB design

### Containers

| Container | Partition Key | Purpose |
|---|---|---|
| `users` | `/userId` | Auth user record (Auth.js adapter) |
| `candidates` | `/userId` | Profil pencari kerja (1:1 dengan user) |
| `companies` | `/companyId` | Profil perusahaan |
| `jobs` | `/companyId` | Lowongan, partition by perusahaan untuk query "all jobs from company X" |
| `applications` | `/candidateId` | Lamaran, partition by kandidat untuk query "lamaran saya" |
| `assessments` | `/skillId` | Definisi assessment + soal |
| `assessmentAttempts` | `/userId` | Hasil per user |
| `notes` | `/applicationId` | HR notes per lamaran |
| `practiceAttempts` | `/userId` | Hasil latihan SkillPracticeRunner (untuk arsip live) |

### Indexing policy

Default indexing semua field. Untuk container `jobs`, exclude field `description` dari indexing (full-text panjang, query lewat AI Search di Fase 3).

### TTL

- `assessmentAttempts` dan `practiceAttempts`: TTL 365 hari (data history).
- Lainnya: tidak ada TTL.

### Throughput

Free tier 1000 RU/s shared across all containers. Cukup untuk demo (single-digit concurrent user). Production scale: per-container dedicated, mulai 400 RU/s, autoscale.

---

## 6. Blob Storage layout

```
akselerjastorageprod (account)
├── cvs/
│   └── {userId}/{timestamp}-{filename}.pdf
├── documents/
│   └── {userId}/{type}/{filename}
└── certificates/
    └── {userId}/{certId}.{ext}
```

**Akses:**
- Default: privat. Akses lewat SAS URL yang di-generate server-side, expiry 5 menit.
- Tidak pernah public.
- Soft delete enabled, 30 hari, supaya CV yang dihapus user bisa di-restore kalau salah pencet.

**Validasi sebelum upload:**
- Max 5 MB per file.
- MIME type whitelist: PDF, DOC, DOCX (CV); JPG, PNG, PDF (sertifikat).
- Nama file di-sanitize sebelum disimpan.

---

## 7. Azure OpenAI model deployment

| Deployment name | Model | Capacity (TPM) | Use case |
|---|---|---|---|
| `gpt-4o-mini` | gpt-4o-mini (2024-07-18) | 100k | CV parsing, match score reasoning, career coach |
| `text-embedding-3-small` | text-embedding-3-small | 50k | Vector embeddings untuk AI Search Fase 3 |

**Tidak deploy:**
- gpt-4o full (overkill untuk demo, $20/1M input tokens vs gpt-4o-mini $0.15)
- gpt-4 / gpt-3.5-turbo legacy (deprecated path)
- Azure OpenAI fine-tuned models (tidak butuh)

**Rate limit handling:**
- Server-side queue dengan exponential backoff untuk 429.
- Per-user rate limit: max 5 calls per menit ke chat completion (career coach).
- Cache match score reasoning per (candidateId, jobId) di Cosmos selama 24 jam.

---

## 8. Auth.js setup

**Provider yang dipakai:**
- Google OAuth (paling banyak punya akun di target audience).
- Email magic link (fallback untuk yang tidak punya Google atau lebih nyaman).

**Tidak dipakai:**
- Microsoft Entra ID. Pertimbangan: target user fresh grad jarang punya akun Microsoft. Konsistensi dengan Azure ecosystem tidak sebanding dengan friksi user.
- Password-based. Tidak relevan untuk MVP karena Auth.js magic link sudah cukup secure.

**Adapter:** Cosmos DB adapter custom (write minimal, hanya untuk users + sessions container).

**Session strategy:** `database` (bukan JWT). Session disimpan di Cosmos supaya invalidasi mudah saat user delete account.

---

## 9. Application Insights

Auto-instrument server actions, route handlers, dan client-side page navigations.

**Custom events yang dilacak:**
- `application_submitted` — lamaran dikirim
- `application_status_changed` — HR pindah status
- `assessment_completed` — assessment selesai
- `cv_parsed` — CV berhasil di-parse via OpenAI
- `coach_session_started` — career coach dimulai
- `match_score_computed` — score dihitung untuk pasangan kandidat-job

**Sampling:** 100% di staging, 50% di production untuk request telemetry.

**Alert:**
- App Service 5xx error rate > 1% selama 5 menit
- Azure OpenAI 429 rate > 10% selama 5 menit
- Cosmos DB 429 rate > 5% selama 5 menit

---

## 10. Decision log

Catat keputusan arsitektur dan kenapa, supaya future-self atau onboarding teman tidak perlu menebak.

### 2026-05-16: Region Sweden Central

**Konteks:** OpenAI deployment + Cosmos di region yang sama.
**Keputusan:** Sweden Central.
**Alasan:** Availability OpenAI paling konsisten, latency 250ms dari Indonesia masih acceptable.
**Trade-off:** Latensi lebih tinggi dari Singapore. Bisa di-revisit kalau perf demo terganggu.

### 2026-05-16: Auth.js, bukan Microsoft Entra ID

**Konteks:** PLAN.md fase 1.2 menyajikan dua opsi.
**Keputusan:** Auth.js dengan Google + magic link.
**Alasan:** Target audience fresh grad Indonesia jarang punya akun Microsoft. Friksi onboarding kalah penting daripada konsistensi Azure stack untuk presentasi juri.
**Trade-off:** Satu cerita arsitektur "all Azure" hilang. Mitigasi: tetap pakai Cosmos sebagai session store, semua secret di Key Vault.

### 2026-05-16: gpt-4o-mini, bukan gpt-4o full

**Konteks:** Quality vs cost.
**Keputusan:** gpt-4o-mini untuk semua chat completion.
**Alasan:** Untuk parsing CV, reasoning match score, dan career coach, gpt-4o-mini sudah cukup. Cost 100x lebih murah.
**Trade-off:** Untuk pertanyaan terbuka coach yang butuh reasoning kompleks, mungkin terasa kurang. Bisa di-upgrade ke gpt-4o per-feature kalau perlu.

### 2026-05-16: Cosmos NoSQL API, bukan PostgreSQL

**Konteks:** Pilihan database.
**Keputusan:** Cosmos DB NoSQL API.
**Alasan:** Free tier 1000 RU/s + 25 GB cocok untuk demo. Schema yang berkembang (profil candidate yang fields-nya bertambah dari assessment, practice, dll) lebih natural di NoSQL. Konsistensi "all Azure".
**Trade-off:** Query relational lebih awkward. JOIN candidate-application-job butuh denormalization atau multiple round-trips. Bisa di-mitigate dengan struktur partition key yang tepat.

### 2026-05-16: Mock fallback untuk dev tanpa Azure

**Konteks:** Tidak semua dev punya akses Azure subscription.
**Keputusan:** `lib/db.ts`, `lib/blob.ts`, `lib/ai/client.ts` punya fallback ke mock store kalau env var Azure tidak ada.
**Alasan:** Kontributor (seperti "bing" yang merge fitur belajar) bisa run aplikasi tanpa Azure setup.
**Trade-off:** Risiko bug yang baru muncul di production. Mitigasi: CI run dengan Azure env vars set ke staging, supaya path Azure-aware selalu di-test.

---

## 11. Open questions

Hal yang belum diputuskan, perlu dibahas sebelum eksekusi terkait.

- **Custom domain.** Apa pakai `akselerja.id` (kalau sudah dimiliki) atau subdomain Azure default? Cek registrar dan DNS.
- **TLS cert.** Azure-managed cert auto-renew, atau Let's Encrypt manual? Default rekomendasi: Azure-managed.
- **Email provider untuk magic link.** Azure Communication Services (mahal, $0.001 per email tapi minimum komitmen), Resend (gratis 3k email/bulan), atau SMTP Gmail (cepat tapi tidak production-ready)? Demo: Resend. Production: revisit.
- **Cost cap.** Apakah set budget alert di Azure ke $100/bulan? Cocok untuk demo, mencegah surprise charge.
- **Backup Cosmos.** Continuous backup default 7 hari di Free tier. Production: extend ke 30 hari?
- **Analytics consent banner.** Application Insights tracking butuh consent dari user (UU PDP). Banner kapan ditambah?

---

## 12. Provisioning checklist (Hari 1)

Eksekusi via Azure Portal atau Azure CLI. Ini deklaratif, bukan urutan kode.

```bash
# Login dan set subscription
az login
az account set --subscription <subscription-id>

# Resource group
az group create --name akselerja-prod --location swedencentral

# Cosmos DB (free tier)
az cosmosdb create \
  --name akselerja-cosmos-prod \
  --resource-group akselerja-prod \
  --kind GlobalDocumentDB \
  --enable-free-tier true \
  --default-consistency-level Session

# Storage account
az storage account create \
  --name akselerjastorageprod \
  --resource-group akselerja-prod \
  --location swedencentral \
  --sku Standard_LRS \
  --kind StorageV2

# Key Vault
az keyvault create \
  --name akselerja-kv-prod \
  --resource-group akselerja-prod \
  --location swedencentral

# Application Insights
az monitor app-insights component create \
  --app akselerja-insights-prod \
  --location swedencentral \
  --resource-group akselerja-prod

# Azure OpenAI (asumsi sudah approved)
az cognitiveservices account create \
  --name akselerja-openai-prod \
  --resource-group akselerja-prod \
  --location swedencentral \
  --kind OpenAI \
  --sku S0

# Deploy gpt-4o-mini
az cognitiveservices account deployment create \
  --name akselerja-openai-prod \
  --resource-group akselerja-prod \
  --deployment-name gpt-4o-mini \
  --model-name gpt-4o-mini \
  --model-version "2024-07-18" \
  --model-format OpenAI \
  --sku-capacity 100 \
  --sku-name Standard

# Deploy text-embedding-3-small
az cognitiveservices account deployment create \
  --name akselerja-openai-prod \
  --resource-group akselerja-prod \
  --deployment-name text-embedding-3-small \
  --model-name text-embedding-3-small \
  --model-version "1" \
  --model-format OpenAI \
  --sku-capacity 50 \
  --sku-name Standard

# Tag everything
az tag create --resource-id /subscriptions/<id>/resourceGroups/akselerja-prod \
  --tags project=akselerja env=prod owner=<your-email> cost-center=demo
```

Setelah selesai, kumpulkan output keys/connection strings, masukkan ke `.env.local`. Belum perlu push ke Key Vault sampai App Service di-deploy (Fase 1.5).

---

## 13. Referensi

- `PLAN.md` — fase implementasi, urutan, dan timeline.
- `PRODUCT.md` — kenapa fitur ini dibuat, untuk siapa.
- `DESIGN.md` — design tokens dan komponen UI.
- Azure docs — tetap rujukan utama untuk syntax CLI dan SDK terbaru.
