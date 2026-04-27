# Akselerja

Akselerja adalah prototype web career intelligence untuk topik **Job Matching & Workforce Upskilling** pada industri **Real Sector Economy**. Produk ini membantu kandidat melihat kecocokan lowongan, memahami gap skill, dan mendapatkan arah belajar yang lebih konkret.

Tagline: **Dari skill gap ke peluang kerja**

## Status Prototype

Website saat ini adalah prototype frontend berbasis data demo. Label Azure OpenAI, Azure AI Document Intelligence, Azure AI Search, dan Microsoft Learn ditampilkan sebagai representasi konsep di UI, tetapi integrasi backend/API live belum aktif.

## Fitur Utama

- Landing page responsif dengan akses demo kandidat dan perusahaan.
- Demo autentikasi untuk kandidat dan employer.
- Onboarding kandidat dengan simulasi upload CV dan ekstraksi profil.
- Dashboard kandidat berisi career readiness score, rekomendasi lowongan, radar chart gap skill, transferable skill detector, skill gap simulator, dan roadmap upskilling 4 minggu.
- Halaman learning path dengan kartu rekomendasi modul Microsoft Learn contoh.
- AI Career Advisor chatbot simulatif berdasarkan profil demo.
- Job board publik dengan search, filter, daftar lowongan, dan detail pekerjaan.
- Employer dashboard berisi talent pool, kandidat demo terurut, skill distribution, dan flow pasang lowongan 3 langkah.

## Alur Kandidat

1. Buka landing page di `/`.
2. Pilih **Masuk Kandidat** lalu masuk melalui `/auth`.
3. Upload CV di `/onboarding` atau gunakan **Pakai CV Contoh**.
4. Review profil demo dan pilih target posisi.
5. Lihat hasil matching dan gap skill di `/dashboard`.
6. Buka rekomendasi belajar di `/learning`.
7. Diskusi dengan chatbot di `/chat`.
8. Cari dan buka detail lowongan di `/jobs` dan `/jobs/:jobId`.

## Alur Perusahaan

1. Pilih **Demo Perusahaan** dari landing page lalu masuk melalui `/auth`.
2. Lihat talent pool di `/company` atau `/talent-pool`.
3. Buat lowongan baru di `/post-job`.
4. Isi info dasar, generate deskripsi pekerjaan secara simulatif, lalu tentukan target skill kandidat.

## Credential Demo

Kandidat:

```text
demo@akselerja.id / demo123
```

Perusahaan:

```text
company@akselerja.id / demo123
```

Form autentikasi masih demo. Email valid dan password minimal 6 karakter dapat melewati form.

## Teknologi

- React
- Vite
- React Router
- Tailwind CSS
- Chart.js
- Vercel-ready SPA routing melalui `vercel.json`

## Menjalankan Lokal

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

## Deployment Vercel

Project sudah memiliki `vercel.json` dengan rewrite SPA agar route seperti `/dashboard`, `/jobs/1`, dan `/company` tidak 404 saat deploy.

Konfigurasi Vercel:

```text
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

Public deployment URL: https://akselerja.vercel.app/
