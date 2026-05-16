import type {
  Assessment,
  AssessmentQuestion,
  Candidate,
  Course,
  Job,
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
