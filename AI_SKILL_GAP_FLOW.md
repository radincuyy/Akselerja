## Ringkasan

AI Skill Gap membantu kandidat menutup gap dari lowongan spesifik, bukan hanya dari judul pekerjaan. Sistem membaca profil kandidat, requirement lowongan, match score, dan hasil latihan untuk membuat roadmap belajar yang personal.

Untuk demo saat ini, kandidat utama adalah Rahmat Saputra:

- Fresh graduate D3 Logistik
- 1 tahun pengalaman magang di gudang ritel
- Target awal: Junior Admin Gudang di PT Cipta Logistik Nusantara

## Flow Utama

1. User membuka halaman Belajar: `/app/belajar`.
2. Sistem menentukan target kerja paling dekat dari profil Rahmat dan daftar lowongan.
3. Sistem menghitung match score berdasarkan requirement lowongan.
4. Jika ada skill gap, sistem menampilkan roadmap belajar.
5. User mengerjakan latihan praktik.
6. Jawaban dinilai dengan rubrik.
7. Jika roadmap selesai, hasilnya masuk arsip.
8. Jika target awal sudah tercapai, sistem bisa menyarankan target lanjutan.

## Mode Roadmap

### 1. Gap Closing

Dipakai saat user belum sepenuhnya memenuhi lowongan target.

Contoh:

- Target: Junior Admin Gudang
- Gap utama: Warehouse Management System
- Roadmap:
  - Pahami alur WMS gudang
  - Latihan receiving barang
  - Perkuat inventory formal
  - Update profil dan lamar

### 2. Target Berikutnya

Dipakai setelah target awal disimulasikan tercapai.

Cara membuka:

```text
/app/belajar?mode=next
```

Contoh:

- Target lama: Junior Admin Gudang
- Target lanjutan: Admin Inventory
- Fokus baru:
  - inventory lebih tinggi
  - laporan stok
  - bukti praktik yang lebih kuat

### 3. Roadmap Tambahan untuk Lowongan Spesifik

Dipakai saat user membuka lowongan lain yang judulnya mirip, tetapi requirement-nya berbeda.

Cara membuka:

```text
/app/belajar?target=j-008
```

Contoh:

- Judul: Junior Admin Gudang
- Perusahaan: PT Bina Distribusi Retail
- Requirement tambahan:
  - WMS level lebih tinggi
  - SAP Inventory dasar
  - Laporan Stok

Roadmap dibuat dari `jobId + company + requirements`, bukan dari judul pekerjaan saja.

## Detail Lowongan

Jika user membuka lowongan `j-008`, sistem menampilkan pesan bahwa judul pekerjaan sama tetapi requirement perusahaan berbeda.

Contoh:

```text
Kamu sudah menyelesaikan roadmap Warehouse Management System untuk PT Cipta Logistik Nusantara.
Untuk mencapai kebutuhan di PT Bina Distribusi Retail, fokus tambahanmu adalah SAP Inventory, WMS level lebih tinggi, dan Laporan Stok.
```

Tombol `Buat roadmap tambahan` mengarah ke:

```text
/app/belajar?target=j-008
```

## Arsip Roadmap

Jika roadmap selesai, hasilnya disimpan sebagai arsip.

Cara membuka dari prototype:

```text
/app/belajar/arsip/junior-admin-gudang
```

Isi arsip:

- latihan yang sudah selesai
- skor rubrik
- jawaban terakhir
- feedback AI
- tombol kerjakan ulang

Tujuannya:

- kandidat bisa melihat bukti belajar
- kandidat bisa mengulang latihan
- sistem tidak perlu memberi roadmap yang sama terus-menerus

## Latihan Praktik

Latihan tidak hanya quiz. Untuk skill kerja, bentuk latihan harus menyerupai pekerjaan nyata.

Contoh latihan yang sudah ada:

- Alur WMS dasar
- Receiving barang dan input WMS
- Stock opname dan FIFO
- Laporan stok berbasis tabel

### Latihan Excel

Excel tidak dibuat sebagai quiz murni. Prototype memakai latihan tabel stok:

```text
SKU | Stok Awal | Barang Masuk | Barang Keluar | Stok Fisik
A01 | 120       | 40            | 30             | 128
B02 | 80        | 20            | 50             | 52
C03 | 200       | 0             | 25             | 175
```

User diminta:

- menghitung stok sistem
- menghitung selisih stok fisik
- menandai SKU yang perlu dicek ulang
- menulis ringkasan untuk supervisor

Latihan ini tersedia di:

```text
/app/belajar/excel-laporan-stok-gudang
```

## Timer Latihan

Halaman detail latihan menyediakan timer custom.

User bisa:

- mengatur durasi sendiri
- mulai timer
- pause timer
- reset timer

Timer hanya membantu fokus belajar. Timer bukan batas pengerjaan final.

## Google Calendar

Setiap langkah roadmap punya tombol `Tambah ke Google Calendar`.

Untuk prototype, integrasi memakai prefilled Google Calendar URL, bukan OAuth.

Alasan:

- cukup untuk demo
- tidak perlu login API
- user bisa langsung menyimpan jadwal belajar

Versi production dapat memakai Google Calendar API + OAuth untuk sync otomatis.

## Aturan Product

1. Roadmap tidak selesai berdasarkan judul pekerjaan.
2. Roadmap selesai berdasarkan lowongan spesifik dan requirement spesifik.
3. Lowongan dengan judul sama bisa punya roadmap berbeda.
4. Jika target awal tercapai, sistem menyarankan target lanjutan yang dekat.
5. Arsip tetap tersedia agar user bisa melihat jawaban, feedback, dan mengulang latihan.
6. Latihan utama harus berbasis tugas kerja, bukan hanya quiz.

## Azure AI Mapping

Rencana integrasi Azure:

- Azure AI Document Intelligence: membaca CV dan dokumen kandidat
- Azure OpenAI: generate roadmap, latihan, feedback rubrik, dan next step
- Azure AI Search: mengambil knowledge base skill, rubrik, dan template latihan
- Azure Blob Storage: menyimpan CV dan bukti latihan
- Azure AI Content Safety: moderasi input dan output AI

Dalam prototype saat ini, scoring masih mock dan deterministic. Versi production mengganti scoring mock dengan Azure OpenAI berbasis rubrik terstruktur.
