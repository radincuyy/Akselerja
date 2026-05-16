import type {
  Assessment,
  AssessmentQuestion,
  Candidate,
  Course,
  Job,
  PracticeTask,
  Skill,
} from "./types";

export const skills: Skill[] = [
  { id: "excel", name: "Microsoft Excel", level: 2 },
  { id: "komunikasi", name: "Komunikasi", level: 2 },
  { id: "inventory", name: "Inventory Management", level: 1 },
  { id: "wms", name: "Warehouse Management System", level: 1 },
  { id: "data-literacy", name: "Data Literacy", level: 1 },
  { id: "sql", name: "SQL", level: 1 },
  { id: "powerbi", name: "Power BI", level: 1 },
  { id: "customer-service", name: "Customer Service", level: 2 },
  { id: "sales", name: "Sales", level: 2 },
  { id: "manufacturing-basics", name: "Manufacturing Basics", level: 1 },
  { id: "problem-solving", name: "Problem Solving", level: 2 },
  { id: "ketelitian", name: "Ketelitian", level: 2 },
  { id: "email-management", name: "Email & Calendar Management", level: 1 },
  { id: "bookkeeping", name: "Bookkeeping Dasar", level: 1 },
  { id: "visual-hierarchy", name: "Visual Hierarchy", level: 1 },
  { id: "laporan-stok", name: "Laporan Stok", level: 1 },
  { id: "sap-inventory", name: "SAP Inventory", level: 1 },
];

export const skillById = Object.fromEntries(skills.map((s) => [s.id, s]));

export const jobs: Job[] = [
  {
    id: "j-001",
    title: "Junior Admin Gudang",
    company: "PT Cipta Logistik Nusantara",
    location: "Bekasi, Jawa Barat",
    salaryMin: 4500000,
    salaryMax: 5500000,
    type: "Full-time",
    industry: "Logistik",
    description:
      "Mengelola data masuk dan keluar barang di gudang utama. Berkoordinasi dengan tim kepala gudang dan tim ekspedisi. Cocok untuk fresh graduate yang teliti dengan angka.",
    requirements: [
      { skillId: "excel", required: 2, weight: 0.3 },
      { skillId: "inventory", required: 2, weight: 0.25 },
      { skillId: "wms", required: 1, weight: 0.15 },
      { skillId: "ketelitian", required: 2, weight: 0.2 },
      { skillId: "komunikasi", required: 1, weight: 0.1 },
    ],
    postedAt: "2026-05-08",
  },
  {
    id: "j-002",
    title: "Customer Service Representative",
    company: "PT Sahabat Telekomunikasi",
    location: "Jakarta Selatan",
    salaryMin: 4800000,
    salaryMax: 6000000,
    type: "Full-time",
    industry: "Telekomunikasi",
    description:
      "Menangani pertanyaan pelanggan via telepon, chat, dan email. Membutuhkan komunikasi yang sabar dan kemampuan problem solving cepat.",
    requirements: [
      { skillId: "komunikasi", required: 3, weight: 0.35 },
      { skillId: "customer-service", required: 2, weight: 0.3 },
      { skillId: "problem-solving", required: 2, weight: 0.2 },
      { skillId: "excel", required: 1, weight: 0.15 },
    ],
    postedAt: "2026-05-09",
  },
  {
    id: "j-003",
    title: "Junior Data Analyst",
    company: "PT Ritel Maju Bersama",
    location: "Jakarta Pusat",
    salaryMin: 6500000,
    salaryMax: 8500000,
    type: "Full-time",
    industry: "Ritel",
    description:
      "Membantu tim merchandising menganalisa data penjualan. Membuat dashboard mingguan, menulis query, dan menyajikan insight ke manajer kategori.",
    requirements: [
      { skillId: "excel", required: 2, weight: 0.2 },
      { skillId: "sql", required: 2, weight: 0.3 },
      { skillId: "powerbi", required: 2, weight: 0.25 },
      { skillId: "data-literacy", required: 2, weight: 0.15 },
      { skillId: "komunikasi", required: 2, weight: 0.1 },
    ],
    postedAt: "2026-05-10",
  },
  {
    id: "j-004",
    title: "Sales Officer Lapangan",
    company: "PT Distribusi Cepat Indonesia",
    location: "Surabaya, Jawa Timur",
    salaryMin: 5500000,
    salaryMax: 9000000,
    type: "Full-time",
    industry: "FMCG",
    description:
      "Mengunjungi outlet ritel di area Surabaya Timur. Membangun hubungan dengan toko, mencatat pesanan, dan mendorong target penjualan bulanan.",
    requirements: [
      { skillId: "sales", required: 2, weight: 0.4 },
      { skillId: "komunikasi", required: 3, weight: 0.3 },
      { skillId: "problem-solving", required: 2, weight: 0.15 },
      { skillId: "excel", required: 1, weight: 0.15 },
    ],
    postedAt: "2026-05-07",
  },
  {
    id: "j-005",
    title: "Operator Produksi",
    company: "PT Manufaktur Selaras",
    location: "Karawang, Jawa Barat",
    salaryMin: 4800000,
    salaryMax: 5800000,
    type: "Full-time",
    industry: "Manufaktur",
    description:
      "Mengoperasikan mesin produksi sesuai SOP. Mengikuti pelatihan keselamatan kerja. Tidak butuh pengalaman, kami latih dari nol.",
    requirements: [
      { skillId: "manufacturing-basics", required: 1, weight: 0.4 },
      { skillId: "ketelitian", required: 2, weight: 0.3 },
      { skillId: "problem-solving", required: 1, weight: 0.15 },
      { skillId: "komunikasi", required: 1, weight: 0.15 },
    ],
    postedAt: "2026-05-06",
  },
  {
    id: "j-006",
    title: "Admin HR Junior",
    company: "PT Karya Bersama Indonesia",
    location: "Tangerang Selatan",
    salaryMin: 5000000,
    salaryMax: 6500000,
    type: "Full-time",
    industry: "Layanan Profesional",
    description:
      "Mengelola dokumen kepegawaian, membantu rekrutmen, dan menyusun laporan HR bulanan.",
    requirements: [
      { skillId: "excel", required: 2, weight: 0.3 },
      { skillId: "komunikasi", required: 2, weight: 0.25 },
      { skillId: "ketelitian", required: 2, weight: 0.25 },
      { skillId: "problem-solving", required: 2, weight: 0.2 },
    ],
    postedAt: "2026-05-05",
  },
  {
    id: "j-007",
    title: "Admin Inventory",
    company: "PT Rantai Pasok Bekasi",
    location: "Bekasi, Jawa Barat",
    salaryMin: 5200000,
    salaryMax: 6800000,
    type: "Full-time",
    industry: "Logistik",
    description:
      "Mengelola akurasi stok harian, membuat laporan inventory, dan berkoordinasi dengan tim gudang untuk stock opname berkala.",
    requirements: [
      { skillId: "inventory", required: 3, weight: 0.35 },
      { skillId: "excel", required: 3, weight: 0.25 },
      { skillId: "laporan-stok", required: 2, weight: 0.2 },
      { skillId: "ketelitian", required: 3, weight: 0.2 },
    ],
    postedAt: "2026-05-11",
  },
  {
    id: "j-008",
    title: "Junior Admin Gudang",
    company: "PT Bina Distribusi Retail",
    location: "Cikarang, Jawa Barat",
    salaryMin: 5000000,
    salaryMax: 6200000,
    type: "Full-time",
    industry: "Logistik",
    description:
      "Membantu administrasi gudang retail dengan sistem SAP Inventory, laporan stok harian, dan koordinasi pengiriman cabang.",
    requirements: [
      { skillId: "excel", required: 2, weight: 0.2 },
      { skillId: "inventory", required: 2, weight: 0.2 },
      { skillId: "wms", required: 2, weight: 0.2 },
      { skillId: "sap-inventory", required: 1, weight: 0.25 },
      { skillId: "laporan-stok", required: 1, weight: 0.15 },
    ],
    postedAt: "2026-05-12",
  },
];

export const courses: Course[] = [
  {
    id: "c-001",
    skillId: "wms",
    title: "Pengenalan Warehouse Management System",
    provider: "Akselerja Learning",
    durationHours: 4,
    level: 1,
    free: true,
    description:
      "Dasar-dasar WMS, alur barang dari penerimaan sampai pengiriman, dan praktek di simulator.",
  },
  {
    id: "c-002",
    skillId: "inventory",
    title: "Inventory Management untuk Pemula",
    provider: "Prakerja Mitra",
    durationHours: 8,
    level: 2,
    free: false,
    priceIdr: 250000,
    description: "Konsep stok, metode FIFO/LIFO, dan praktek pencatatan.",
  },
  {
    id: "c-003",
    skillId: "sql",
    title: "SQL Dasar untuk Analis",
    provider: "Akselerja Learning",
    durationHours: 6,
    level: 1,
    free: true,
    description:
      "SELECT, JOIN, GROUP BY, dan studi kasus query data penjualan ritel.",
  },
  {
    id: "c-004",
    skillId: "powerbi",
    title: "Power BI: Dari Data ke Dashboard",
    provider: "Mitra Edukasi",
    durationHours: 10,
    level: 2,
    free: false,
    priceIdr: 350000,
    description:
      "Connect ke sumber data, modeling, dan publikasi laporan ke web.",
  },
  {
    id: "c-005",
    skillId: "data-literacy",
    title: "Data Literacy untuk Profesional",
    provider: "Akselerja Learning",
    durationHours: 3,
    level: 1,
    free: true,
    description:
      "Cara membaca grafik, memahami statistik dasar, dan menghindari kesimpulan menyesatkan.",
  },
  {
    id: "c-006",
    skillId: "customer-service",
    title: "Customer Service Excellence",
    provider: "Mitra Edukasi",
    durationHours: 5,
    level: 2,
    free: false,
    priceIdr: 200000,
    description: "Empati, penanganan komplain, dan teknik de-eskalasi.",
  },
];

export const practiceTasks: PracticeTask[] = [
  {
    id: "p-001",
    slug: "admin-gudang-alur-wms-dasar",
    role: "Admin Gudang",
    title: "Pahami alur WMS gudang",
    skillId: "wms",
    level: 1,
    type: "case-simulation",
    estimatedMinutes: 15,
    sourceLabel: "Bank internal Akselerja + SKKNI Logistik",
    sourceNotes: [
      "Mengukur pemahaman alur receiving sampai stok tersedia.",
      "Cocok sebagai pengantar sebelum simulasi receiving yang lebih detail.",
    ],
    scenario:
      "Rahmat baru masuk sebagai admin gudang junior. Supervisor meminta Rahmat menjelaskan alur barang masuk sampai stok siap dipakai untuk order. Di gudang itu, setiap barang harus dicek dengan PO, surat jalan, kondisi fisik, lalu dicatat di WMS sebelum masuk rak.",
    instructions: [
      "Urutkan langkah dari barang datang sampai stok tersedia.",
      "Jelaskan kapan barang perlu ditahan atau tidak langsung masuk rak.",
      "Sebutkan data minimum yang harus dicatat ke WMS.",
      "Tulis versi singkat yang bisa Rahmat jelaskan ke supervisor.",
    ],
    expectedEvidence: [
      "Menyebut pengecekan PO, surat jalan, dan kondisi fisik",
      "Memahami keputusan hold untuk barang rusak atau dokumen tidak lengkap",
      "Menyebut SKU, jumlah, batch, lokasi, dan status barang",
      "Menjelaskan alur dengan bahasa operasional yang ringkas",
    ],
    rubric: [
      {
        id: "flow",
        name: "Urutan proses",
        description:
          "Menjelaskan alur receiving sampai stok tersedia secara runtut.",
        weight: 35,
        signals: ["barang datang", "po", "surat jalan", "cek", "rak"],
      },
      {
        id: "hold",
        name: "Keputusan hold/release",
        description:
          "Mengenali kondisi barang yang perlu ditahan sebelum masuk stok.",
        weight: 25,
        signals: ["hold", "ditahan", "rusak", "dokumen", "verifikasi"],
      },
      {
        id: "data",
        name: "Data WMS minimum",
        description:
          "Menyebut data utama yang dibutuhkan untuk pencatatan WMS.",
        weight: 25,
        signals: ["sku", "jumlah", "batch", "lokasi", "status"],
      },
      {
        id: "clarity",
        name: "Kejelasan penjelasan",
        description:
          "Menulis jawaban singkat, praktis, dan mudah dipakai di pekerjaan.",
        weight: 15,
        signals: ["pertama", "setelah itu", "lalu", "terakhir", "supervisor"],
      },
    ],
  },
  {
    id: "p-002",
    slug: "admin-gudang-receiving-wms",
    role: "Admin Gudang",
    title: "Simulasi receiving barang dan input WMS",
    skillId: "wms",
    level: 1,
    type: "case-simulation",
    estimatedMinutes: 18,
    sourceLabel: "Bank internal Akselerja + SKKNI Logistik",
    sourceNotes: [
      "Alur penerimaan barang, pengecekan dokumen, dan pencatatan stok.",
      "Rubrik menilai kepatuhan SOP, bukan hafalan nama software tertentu.",
    ],
    scenario:
      "Kamu menerima pengiriman untuk PO-7781: 40 dus SKU-A, 25 dus SKU-B, dan 10 dus SKU-C. Saat dicek, 2 dus SKU-A rusak di kemasan luar, SKU-B sesuai PO, dan SKU-C datang tanpa nomor batch di surat jalan. Supervisor meminta kamu mencatat keputusan penerimaan dan data yang perlu masuk ke WMS.",
    instructions: [
      "Tentukan barang mana yang diterima penuh, diterima sebagian, atau ditahan.",
      "Tuliskan langkah kerja sesuai SOP gudang sebelum stok dinyatakan tersedia.",
      "Sebutkan data utama yang harus dicatat ke WMS.",
      "Jelaskan siapa yang perlu diberi notifikasi untuk kasus SKU-C.",
    ],
    expectedEvidence: [
      "SKU-A diterima sebagian atau ditahan untuk 2 dus rusak",
      "SKU-B diterima penuh karena sesuai PO",
      "SKU-C ditahan sampai nomor batch diverifikasi",
      "Mencatat PO, SKU, quantity accepted, rejected quantity, reason code, dan batch",
      "Memberi notifikasi ke supervisor, procurement, atau vendor",
    ],
    rubric: [
      {
        id: "sop",
        name: "Kepatuhan SOP receiving",
        description:
          "Membedakan barang sesuai, rusak, dan dokumen tidak lengkap sebelum stok dilepas.",
        weight: 35,
        signals: ["ditahan", "hold", "quarantine", "rusak", "sesuai po"],
      },
      {
        id: "accuracy",
        name: "Akurasi pencatatan",
        description:
          "Menyebut data WMS yang cukup untuk audit stok dan tindak lanjut.",
        weight: 30,
        signals: ["po", "sku", "quantity", "accepted", "rejected", "batch"],
      },
      {
        id: "judgement",
        name: "Identifikasi anomali",
        description:
          "Menangkap risiko kemasan rusak dan nomor batch hilang sebagai masalah berbeda.",
        weight: 20,
        signals: ["nomor batch", "dokumen", "surat jalan", "anomali", "verifikasi"],
      },
      {
        id: "communication",
        name: "Komunikasi operasional",
        description:
          "Menjelaskan eskalasi ke pihak yang tepat tanpa memperlambat proses normal.",
        weight: 15,
        signals: ["supervisor", "procurement", "vendor", "notifikasi", "lapor"],
      },
    ],
  },
  {
    id: "p-003",
    slug: "customer-service-komplain-refund",
    role: "Customer Service",
    title: "Roleplay komplain pelanggan dan refund",
    skillId: "customer-service",
    level: 2,
    type: "roleplay",
    estimatedMinutes: 15,
    sourceLabel: "Bank internal Akselerja + pola lowongan layanan pelanggan",
    sourceNotes: [
      "Mengukur empati, de-eskalasi, dan kejelasan solusi.",
      "Cocok untuk kandidat call center, frontliner, dan support chat.",
    ],
    scenario:
      "Pelanggan menulis dengan nada marah karena paket terlambat 4 hari dan meminta refund penuh. Sistem menunjukkan paket sudah di tangan kurir, estimasi sampai besok, dan kebijakan refund penuh hanya berlaku jika barang hilang atau rusak.",
    instructions: [
      "Tulis balasan chat pertama untuk meredakan emosi pelanggan.",
      "Jelaskan status paket dan batasan kebijakan tanpa terdengar defensif.",
      "Tawarkan langkah konkret yang bisa dilakukan hari ini.",
      "Tutup dengan kalimat yang menjaga kepercayaan pelanggan.",
    ],
    expectedEvidence: [
      "Mengakui rasa kecewa pelanggan",
      "Menjelaskan status paket secara jelas",
      "Tidak menjanjikan refund penuh jika belum sesuai kebijakan",
      "Menawarkan tracking aktif, eskalasi kurir, atau follow-up",
      "Menggunakan bahasa singkat, sopan, dan solutif",
    ],
    rubric: [
      {
        id: "empathy",
        name: "Empati dan de-eskalasi",
        description: "Mengakui masalah pelanggan sebelum menjelaskan aturan.",
        weight: 30,
        signals: ["maaf", "kecewa", "paham", "mengerti", "terima kasih"],
      },
      {
        id: "policy",
        name: "Akurasi kebijakan",
        description: "Tidak memberi janji yang bertentangan dengan kebijakan refund.",
        weight: 25,
        signals: ["kebijakan", "refund", "hilang", "rusak", "belum dapat"],
      },
      {
        id: "action",
        name: "Langkah tindak lanjut",
        description: "Memberikan tindakan yang jelas, terukur, dan dapat dipantau.",
        weight: 30,
        signals: ["tracking", "kurir", "eskalasi", "follow-up", "besok"],
      },
      {
        id: "tone",
        name: "Kejelasan bahasa",
        description: "Jawaban ringkas, sopan, dan mudah dipahami pelanggan.",
        weight: 15,
        signals: ["kami", "bantu", "cek", "konfirmasi", "update"],
      },
    ],
  },
  {
    id: "p-004",
    slug: "virtual-assistant-prioritas-inbox",
    role: "Virtual Assistant",
    title: "Prioritasi inbox dan jadwal meeting",
    skillId: "email-management",
    level: 1,
    type: "case-simulation",
    estimatedMinutes: 16,
    sourceLabel: "Bank internal Akselerja + standar administrasi profesional",
    sourceNotes: [
      "Mengukur kemampuan memilah urgensi, menyusun jadwal, dan komunikasi tertulis.",
      "Didesain untuk pekerjaan remote admin dan assistant entry-level.",
    ],
    scenario:
      "Pukul 09.00 kamu menerima 4 pesan: CEO minta meeting dengan investor hari ini, vendor meminta tanda tangan kontrak sebelum 12.00, tim finance menanyakan invoice minggu lalu, dan kandidat interview meminta reschedule. Kalender CEO kosong pukul 11.00-12.00 dan 15.00-16.00.",
    instructions: [
      "Urutkan prioritas dari paling mendesak sampai paling rendah.",
      "Pilih slot meeting investor dan jelaskan alasannya.",
      "Tulis draft balasan singkat untuk vendor atau kandidat.",
      "Sebutkan informasi apa yang perlu kamu konfirmasi sebelum mengirim final.",
    ],
    expectedEvidence: [
      "Investor dan kontrak vendor diprioritaskan karena deadline hari ini",
      "Slot 11.00-12.00 dipertimbangkan untuk kebutuhan sebelum 12.00",
      "Invoice dan reschedule tetap diberi tindak lanjut",
      "Konfirmasi peserta, timezone, dokumen, dan approval",
      "Bahasa email profesional dan ringkas",
    ],
    rubric: [
      {
        id: "priority",
        name: "Prioritas kerja",
        description: "Membedakan urgent, important, dan pekerjaan rutin.",
        weight: 35,
        signals: ["prioritas", "deadline", "hari ini", "sebelum 12", "investor"],
      },
      {
        id: "calendar",
        name: "Manajemen jadwal",
        description: "Memilih slot yang realistis dan menjelaskan tradeoff.",
        weight: 25,
        signals: ["11.00", "15.00", "slot", "kalender", "meeting"],
      },
      {
        id: "writing",
        name: "Komunikasi tertulis",
        description: "Membuat draft balasan yang sopan, singkat, dan jelas.",
        weight: 25,
        signals: ["halo", "terima kasih", "konfirmasi", "jadwalkan", "mohon"],
      },
      {
        id: "checks",
        name: "Kontrol sebelum kirim",
        description: "Menyebut informasi yang harus diverifikasi agar tidak salah kirim.",
        weight: 15,
        signals: ["timezone", "peserta", "approval", "dokumen", "lampiran"],
      },
    ],
  },
  {
    id: "p-005",
    slug: "akuntansi-invoice-rekonsiliasi",
    role: "Junior Akuntansi",
    title: "Cek invoice, PO, dan rekonsiliasi pembayaran",
    skillId: "bookkeeping",
    level: 1,
    type: "document-review",
    estimatedMinutes: 20,
    sourceLabel: "Bank internal Akselerja + standar teknisi akuntansi",
    sourceNotes: [
      "Mengukur ketelitian pada dokumen transaksi sederhana.",
      "Latihan memakai angka kecil agar fokus pada logika pencocokan.",
    ],
    scenario:
      "PO-221 membeli 20 unit barang seharga Rp150.000 per unit. Invoice INV-881 mencatat 22 unit dengan total Rp3.300.000. Bukti transfer menunjukkan pembayaran Rp3.000.000. Manager meminta kamu mengecek apakah invoice bisa diproses.",
    instructions: [
      "Hitung nilai yang seharusnya sesuai PO.",
      "Identifikasi selisih antara PO, invoice, dan pembayaran.",
      "Tentukan status invoice: bisa diproses, ditahan, atau perlu revisi.",
      "Tulis catatan singkat untuk manager finance.",
    ],
    expectedEvidence: [
      "Nilai PO benar adalah 20 x Rp150.000 = Rp3.000.000",
      "Invoice mencatat 22 unit atau selisih 2 unit",
      "Pembayaran sesuai PO, bukan sesuai invoice",
      "Invoice perlu ditahan atau diminta revisi",
      "Catatan menyebut nomor PO, invoice, dan nominal selisih",
    ],
    rubric: [
      {
        id: "calculation",
        name: "Akurasi hitung",
        description: "Menghitung nilai PO dan selisih dokumen dengan benar.",
        weight: 35,
        signals: ["3.000.000", "3000000", "20", "150.000", "selisih"],
      },
      {
        id: "matching",
        name: "Pencocokan dokumen",
        description: "Membandingkan PO, invoice, dan transfer sebagai tiga bukti berbeda.",
        weight: 30,
        signals: ["po", "invoice", "transfer", "22", "2 unit"],
      },
      {
        id: "decision",
        name: "Keputusan proses",
        description: "Memberi status invoice yang aman secara kontrol internal.",
        weight: 20,
        signals: ["ditahan", "revisi", "hold", "jangan diproses", "klarifikasi"],
      },
      {
        id: "note",
        name: "Catatan finance",
        description: "Menulis catatan ringkas dengan angka dan referensi dokumen.",
        weight: 15,
        signals: ["inv-881", "po-221", "manager", "catatan", "nominal"],
      },
    ],
  },
  {
    id: "p-006",
    slug: "graphic-designer-brief-kampanye",
    role: "Graphic Designer",
    title: "Menerjemahkan brief kampanye ke konsep visual",
    skillId: "visual-hierarchy",
    level: 1,
    type: "design-brief",
    estimatedMinutes: 22,
    sourceLabel: "Bank internal Akselerja + standar DKV",
    sourceNotes: [
      "Prototype menilai keputusan desain melalui penjelasan konsep.",
      "Versi produksi dapat menerima upload gambar dan memberi markup feedback.",
    ],
    scenario:
      "Brand kopi lokal ingin poster Instagram untuk promo 'Beli 2 Gratis 1' selama akhir pekan. Target audiens pekerja usia 22-35 tahun. Brand ingin terlihat hangat, modern, dan tidak terlalu ramai. Informasi wajib: nama promo, periode Sabtu-Minggu, lokasi outlet, dan CTA 'Pesan sekarang'.",
    instructions: [
      "Jelaskan layout poster yang akan kamu buat.",
      "Tentukan hirarki informasi dari paling menonjol sampai pendukung.",
      "Pilih arah warna dan tipografi yang sesuai brand.",
      "Sebutkan format output yang akan kamu kirim ke client.",
    ],
    expectedEvidence: [
      "Promo menjadi headline utama",
      "Periode, lokasi, dan CTA mudah ditemukan",
      "Warna hangat modern tanpa terlalu banyak elemen",
      "Tipografi dibedakan untuk headline dan detail",
      "Output menyebut ukuran Instagram dan file siap publikasi",
    ],
    rubric: [
      {
        id: "brief",
        name: "Kesesuaian brief",
        description: "Memenuhi target audiens, mood brand, dan informasi wajib.",
        weight: 30,
        signals: ["beli 2 gratis 1", "sabtu", "minggu", "outlet", "pesan sekarang"],
      },
      {
        id: "hierarchy",
        name: "Hirarki visual",
        description: "Menentukan urutan informasi agar pesan utama cepat terbaca.",
        weight: 30,
        signals: ["headline", "hirarki", "utama", "cta", "detail"],
      },
      {
        id: "style",
        name: "Arah visual",
        description: "Memilih warna dan tipografi yang konsisten dengan brand.",
        weight: 25,
        signals: ["hangat", "modern", "warna", "tipografi", "font"],
      },
      {
        id: "delivery",
        name: "Kesiapan output",
        description: "Menyebut format dan kebutuhan file untuk publikasi.",
        weight: 15,
        signals: ["instagram", "1080", "png", "jpg", "export"],
      },
    ],
  },
  {
    id: "p-007",
    slug: "admin-gudang-stock-opname-fifo",
    role: "Admin Gudang",
    title: "Stock opname singkat dan keputusan FIFO",
    skillId: "inventory",
    level: 2,
    type: "case-simulation",
    estimatedMinutes: 20,
    sourceLabel: "Bank internal Akselerja + SKKNI Logistik",
    sourceNotes: [
      "Mengukur pencocokan stok fisik, kartu stok, dan keputusan rotasi barang.",
      "Cocok sebagai latihan lanjutan setelah alur receiving dipahami.",
    ],
    scenario:
      "Kartu stok menunjukkan 120 unit SKU-MINUMAN-A. Saat stock opname rak, kamu menemukan 112 unit layak jual, 5 unit kemasan penyok, dan 3 unit kedaluwarsa dalam 10 hari. Ada pengiriman baru 60 unit yang baru masuk hari ini. Kepala gudang meminta rekomendasi tindakan sebelum stok dipakai untuk order besok.",
    instructions: [
      "Hitung selisih stok layak jual dibanding kartu stok.",
      "Tentukan perlakuan untuk barang penyok dan barang hampir kedaluwarsa.",
      "Jelaskan keputusan FIFO untuk pengiriman lama dan baru.",
      "Tulis catatan singkat yang perlu masuk ke laporan stock opname.",
    ],
    expectedEvidence: [
      "Menghitung stok layak jual 112 unit dan memisahkan 8 unit bermasalah",
      "Menandai barang penyok untuk pengecekan kualitas atau retur internal",
      "Memprioritaskan barang lama atau hampir kedaluwarsa sesuai FIFO/FEFO",
      "Tidak langsung mencampur pengiriman baru dengan stok lama tanpa pencatatan",
      "Mencatat selisih, kondisi barang, dan rekomendasi tindakan",
    ],
    rubric: [
      {
        id: "counting",
        name: "Akurasi stok",
        description:
          "Menghitung stok layak jual dan barang bermasalah secara terpisah.",
        weight: 30,
        signals: ["112", "5", "3", "8", "selisih"],
      },
      {
        id: "quality",
        name: "Kontrol kualitas barang",
        description:
          "Memisahkan barang penyok dan hampir kedaluwarsa sebelum dipakai order.",
        weight: 25,
        signals: ["penyok", "kedaluwarsa", "quality", "retur", "hold"],
      },
      {
        id: "fifo",
        name: "Keputusan FIFO/FEFO",
        description:
          "Memprioritaskan stok lama atau yang tanggalnya lebih dekat berakhir.",
        weight: 30,
        signals: ["fifo", "fefo", "lama", "baru", "expired"],
      },
      {
        id: "reporting",
        name: "Laporan stock opname",
        description:
          "Menyusun catatan yang cukup untuk audit dan tindak lanjut supervisor.",
        weight: 15,
        signals: ["laporan", "stock opname", "catatan", "supervisor", "rekomendasi"],
      },
    ],
  },
  {
    id: "p-008",
    slug: "excel-laporan-stok-gudang",
    role: "Admin Gudang",
    title: "Latihan tabel laporan stok gudang",
    skillId: "laporan-stok",
    level: 1,
    type: "document-review",
    estimatedMinutes: 25,
    sourceLabel: "Bank internal Akselerja + praktik laporan stok",
    sourceNotes: [
      "Mengukur kemampuan memakai logika spreadsheet untuk laporan stok.",
      "Latihan ini menggantikan quiz Excel murni dengan kasus kerja gudang.",
    ],
    scenario:
      "Supervisor memberi tabel stok: SKU A01 stok awal 120, masuk 40, keluar 30, stok fisik 128. SKU B02 stok awal 80, masuk 20, keluar 50, stok fisik 52. SKU C03 stok awal 200, masuk 0, keluar 25, stok fisik 175. Kamu diminta menghitung stok sistem, selisih dengan stok fisik, dan catatan tindak lanjut.",
    instructions: [
      "Hitung stok sistem untuk setiap SKU.",
      "Hitung selisih antara stok fisik dan stok sistem.",
      "Tandai SKU yang perlu dicek ulang.",
      "Tulis ringkasan singkat untuk supervisor gudang.",
    ],
    expectedEvidence: [
      "A01 stok sistem 130 dan selisih -2 atau fisik kurang 2",
      "B02 stok sistem 50 dan selisih +2 atau fisik lebih 2",
      "C03 stok sistem 175 dan selisih 0",
      "A01 dan B02 perlu dicek ulang",
      "Ringkasan menyebut kemungkinan salah input, barang terselip, atau perlu recount",
    ],
    rubric: [
      {
        id: "formula",
        name: "Logika hitung stok",
        description:
          "Menghitung stok sistem dari stok awal, barang masuk, dan barang keluar.",
        weight: 35,
        signals: ["130", "50", "175", "stok sistem", "awal"],
      },
      {
        id: "variance",
        name: "Analisis selisih",
        description:
          "Membandingkan stok sistem dengan stok fisik dan menandai anomali.",
        weight: 30,
        signals: ["selisih", "-2", "+2", "kurang 2", "lebih 2"],
      },
      {
        id: "followup",
        name: "Tindak lanjut",
        description:
          "Memberi rekomendasi cek ulang untuk SKU yang tidak cocok.",
        weight: 20,
        signals: ["cek ulang", "recount", "salah input", "barang terselip", "audit"],
      },
      {
        id: "summary",
        name: "Ringkasan supervisor",
        description:
          "Menulis ringkasan yang singkat, jelas, dan bisa ditindaklanjuti.",
        weight: 15,
        signals: ["supervisor", "ringkasan", "a01", "b02", "c03"],
      },
    ],
  },
];

export const practiceBySlug = Object.fromEntries(
  practiceTasks.map((p) => [p.slug, p]),
);

export const assessments: Assessment[] = [
  {
    id: "a-001",
    slug: "excel-dasar",
    title: "Microsoft Excel Dasar",
    durationMinutes: 12,
    questionCount: 10,
    skillId: "excel",
    description:
      "Tes pengetahuan rumus dasar, format data, dan referensi sel di Excel.",
  },
  {
    id: "a-002",
    slug: "komunikasi",
    title: "Komunikasi Profesional",
    durationMinutes: 8,
    questionCount: 8,
    skillId: "komunikasi",
    description:
      "Tes kemampuan menyampaikan informasi dengan jelas dan menanggapi pertanyaan.",
  },
  {
    id: "a-003",
    slug: "problem-solving",
    title: "Problem Solving",
    durationMinutes: 10,
    questionCount: 8,
    skillId: "problem-solving",
    description: "Studi kasus pendek untuk mengukur cara berpikir terstruktur.",
  },
  {
    id: "a-004",
    slug: "sql-dasar",
    title: "SQL Dasar",
    durationMinutes: 15,
    questionCount: 10,
    skillId: "sql",
    description:
      "Tes pengetahuan query SELECT, JOIN sederhana, dan agregasi.",
  },
];

export const assessmentQuestions: Record<string, AssessmentQuestion[]> = {
  "excel-dasar": [
    {
      id: "q1",
      prompt:
        "Rumus apa yang tepat untuk menjumlahkan nilai di kolom A1 sampai A10?",
      options: [
        { id: "a", label: "=ADD(A1:A10)" },
        { id: "b", label: "=SUM(A1:A10)" },
        { id: "c", label: "=TOTAL(A1:A10)" },
        { id: "d", label: "=PLUS(A1:A10)" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q2",
      prompt:
        "Apa fungsi dari tanda dolar ($) di referensi sel, contohnya $A$1?",
      options: [
        { id: "a", label: "Membuat sel itu menjadi mata uang" },
        { id: "b", label: "Mengunci referensi agar tidak berubah saat di-copy" },
        { id: "c", label: "Menandakan nilai negatif" },
        { id: "d", label: "Membuat teks tebal otomatis" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q3",
      prompt:
        "Fitur apa yang tepat untuk mencari dan mencocokkan nilai di tabel referensi?",
      options: [
        { id: "a", label: "FIND" },
        { id: "b", label: "VLOOKUP" },
        { id: "c", label: "MATCHCASE" },
        { id: "d", label: "LOOKUPALL" },
      ],
      correctOptionId: "b",
    },
  ],
  komunikasi: [
    {
      id: "q1",
      prompt:
        "Pelanggan mengeluh dengan nada tinggi. Respon mana yang paling tepat?",
      options: [
        { id: "a", label: "Diam saja sampai pelanggan tenang" },
        {
          id: "b",
          label:
            "Akui kekecewaannya, ulangi inti masalahnya, lalu tawarkan langkah berikutnya",
        },
        { id: "c", label: "Langsung jelaskan kebijakan perusahaan" },
        { id: "d", label: "Alihkan ke supervisor secepatnya" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q2",
      prompt:
        "Saat menjelaskan masalah teknis ke atasan non-teknis, apa yang paling efektif?",
      options: [
        { id: "a", label: "Pakai istilah teknis lengkap untuk akurasi" },
        { id: "b", label: "Mulai dari dampak ke bisnis, baru jelaskan teknisnya" },
        { id: "c", label: "Kirim email panjang dengan detail penuh" },
        { id: "d", label: "Tunda sampai ada waktu untuk meeting penuh" },
      ],
      correctOptionId: "b",
    },
  ],
  "problem-solving": [
    {
      id: "q1",
      prompt:
        "Stok barang tiba-tiba berkurang lebih cepat dari biasanya. Langkah pertama yang paling tepat?",
      options: [
        { id: "a", label: "Langsung pesan stok tambahan" },
        {
          id: "b",
          label:
            "Cek data penjualan, pencatatan masuk-keluar, dan kemungkinan kebocoran",
        },
        { id: "c", label: "Naikkan harga untuk memperlambat penjualan" },
        { id: "d", label: "Lapor ke atasan tanpa cek dulu" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q2",
      prompt:
        "Kamu menemukan dua sumber data dengan angka berbeda untuk hal yang sama. Apa yang dilakukan?",
      options: [
        { id: "a", label: "Pakai yang angkanya lebih besar" },
        { id: "b", label: "Cari sumber asli untuk verifikasi" },
        { id: "c", label: "Rata-ratakan keduanya" },
        { id: "d", label: "Pakai sumber yang lebih baru saja" },
      ],
      correctOptionId: "b",
    },
  ],
  "sql-dasar": [
    {
      id: "q1",
      prompt:
        "Query mana yang menampilkan nama pelanggan dari tabel customers?",
      options: [
        { id: "a", label: "GET name FROM customers" },
        { id: "b", label: "SELECT name FROM customers" },
        { id: "c", label: "SHOW name OF customers" },
        { id: "d", label: "READ name customers" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q2",
      prompt:
        "Apa fungsi GROUP BY di query SQL?",
      options: [
        { id: "a", label: "Mengurutkan baris hasil" },
        { id: "b", label: "Menggabungkan baris berdasarkan nilai kolom tertentu" },
        { id: "c", label: "Memfilter baris" },
        { id: "d", label: "Menghapus duplikat saja" },
      ],
      correctOptionId: "b",
    },
  ],
};

// Single demo candidate for the candidate-side app session
export const me: Candidate = {
  id: "me",
  name: "Rahmat Saputra",
  email: "rahmat.saputra@email.com",
  location: "Bekasi, Jawa Barat",
  experienceYears: 1,
  expectedSalary: 5000000,
  readinessScore: 68,
  bio: "Fresh graduate D3 Logistik dengan 1 tahun pengalaman magang di gudang ritel. Tertarik di bidang logistik dan operasional.",
  skills: [
    { skillId: "excel", level: 2 },
    { skillId: "komunikasi", level: 2 },
    { skillId: "inventory", level: 2 },
    { skillId: "ketelitian", level: 3 },
    { skillId: "problem-solving", level: 2 },
    { skillId: "customer-service", level: 1 },
  ],
};

export const candidates: Candidate[] = [
  {
    ...me,
    status: "ready",
  },
  {
    id: "c-002",
    name: "Siti Nurhaliza",
    email: "siti.nh@email.com",
    location: "Cikarang, Jawa Barat",
    experienceYears: 2,
    expectedSalary: 5500000,
    readinessScore: 74,
    bio: "Pengalaman 2 tahun sebagai admin gudang di perusahaan logistik. Familiar dengan sistem WMS internal.",
    status: "ready",
    skills: [
      { skillId: "excel", level: 3 },
      { skillId: "inventory", level: 3 },
      { skillId: "wms", level: 2 },
      { skillId: "ketelitian", level: 3 },
      { skillId: "komunikasi", level: 2 },
    ],
  },
  {
    id: "c-003",
    name: "Bagas Pratama",
    email: "bagas.p@email.com",
    location: "Bekasi, Jawa Barat",
    experienceYears: 0,
    expectedSalary: 4500000,
    readinessScore: 52,
    bio: "Lulusan SMK Logistik 2025. Magang 6 bulan di ekspedisi.",
    status: "trainable",
    skills: [
      { skillId: "excel", level: 1 },
      { skillId: "ketelitian", level: 2 },
      { skillId: "komunikasi", level: 2 },
      { skillId: "inventory", level: 1 },
    ],
  },
  {
    id: "c-004",
    name: "Mira Anggraini",
    email: "mira.a@email.com",
    location: "Tangerang",
    experienceYears: 3,
    expectedSalary: 7000000,
    readinessScore: 81,
    bio: "Admin gudang senior dengan pengalaman 3 tahun, pernah menangani implementasi WMS baru.",
    status: "ready",
    skills: [
      { skillId: "excel", level: 3 },
      { skillId: "inventory", level: 3 },
      { skillId: "wms", level: 3 },
      { skillId: "problem-solving", level: 2 },
      { skillId: "komunikasi", level: 3 },
    ],
  },
  {
    id: "c-005",
    name: "Joko Hartono",
    email: "joko.h@email.com",
    location: "Jakarta Timur",
    experienceYears: 1,
    expectedSalary: 5000000,
    readinessScore: 60,
    bio: "Fresh graduate, aktif di organisasi kampus dan pernah magang di koperasi.",
    status: "trainable",
    skills: [
      { skillId: "excel", level: 2 },
      { skillId: "komunikasi", level: 2 },
      { skillId: "ketelitian", level: 2 },
    ],
  },
];

// Match score calculation, deterministic and explainable
export function calcMatch(candidate: Candidate, job: Job) {
  const candidateSkillMap = Object.fromEntries(
    candidate.skills.map((s) => [s.skillId, s.level]),
  );
  let totalWeight = 0;
  let scoreSum = 0;
  const breakdown: {
    skillId: string;
    name: string;
    required: number;
    have: number;
    state: SkillStateExt;
    contribution: number;
  }[] = [];

  for (const req of job.requirements) {
    const w = req.weight ?? 1 / job.requirements.length;
    const have: number = candidateSkillMap[req.skillId] ?? 0;
    let pct: number;
    let state: SkillStateExt;
    if (have === 0) {
      pct = 0;
      state = "missing";
    } else if (have >= req.required) {
      pct = 1;
      state = "match";
    } else {
      pct = have / req.required;
      state = "improve";
    }
    scoreSum += w * pct * 100;
    totalWeight += w;
    breakdown.push({
      skillId: req.skillId,
      name: skillById[req.skillId]?.name ?? req.skillId,
      required: req.required,
      have,
      state,
      contribution: Math.round(w * pct * 100),
    });
  }
  const score = Math.round(scoreSum / (totalWeight || 1));

  // Modest experience and salary modifiers, capped
  let adjusted = score;
  if (candidate.experienceYears >= 1) adjusted = Math.min(100, adjusted + 3);
  if (candidate.expectedSalary > job.salaryMax) adjusted = Math.max(0, adjusted - 5);

  return {
    score: adjusted,
    breakdown: breakdown.sort((a, b) => b.contribution - a.contribution),
  };
}

type SkillStateExt = "match" | "improve" | "missing";

export {
  formatIdr,
  levelLabel,
  formatRelativeId,
  formatDateId,
} from "./format";
