import LegalLayout from "@/components/LegalLayout";

export const metadata = {
  title: "Kebijakan Data · Akselerja",
  description: "Bagaimana data pengguna dipakai untuk match score, AI, dan riset internal.",
};

export default function KebijakanDataPage() {
  return (
    <LegalLayout
      eyebrow="Hukum"
      title="Kebijakan Data"
      effectiveDate="15 Mei 2026"
    >
      <p>
        Kebijakan ini menjelaskan secara teknis bagaimana Akselerja
        menggunakan data untuk menghitung match score, mempribadikan
        rekomendasi, dan riset agregat. Untuk pertanyaan privasi
        umum, lihat <a href="/privasi">Kebijakan Privasi</a>.
      </p>

      <h2>1. Sumber data</h2>
      <ul>
        <li>Data yang kamu masukkan langsung di profil dan onboarding.</li>
        <li>File CV yang kamu unggah, dikonversi ke teks untuk diparsing.</li>
        <li>
          Aksi di aplikasi seperti melamar, menyimpan lowongan, dan menilai
          rekomendasi.
        </li>
      </ul>

      <h2>2. Cara match score dihitung</h2>
      <p>
        Match score adalah angka 0 sampai 100 yang menggabungkan beberapa
        komponen dengan bobot yang dapat diaudit:
      </p>
      <ul>
        <li>Skill match terhadap requirement lowongan.</li>
        <li>Relevansi pengalaman dan industri.</li>
        <li>Kesesuaian lokasi dan ekspektasi gaji.</li>
        <li>Potensi belajar berdasarkan kursus yang sudah diselesaikan.</li>
      </ul>
      <p>
        Penjelasan kontribusi tiap komponen ditampilkan di halaman detail
        lowongan, sehingga kamu dan perusahaan bisa membaca alasan skor,
        bukan hanya angkanya.
      </p>

      <h2>3. Pemakaian AI generatif</h2>
      <p>
        Akselerja memakai model bahasa untuk tiga hal: parsing CV menjadi
        struktur profil, penjelasan singkat di balik match score, dan career
        coach. Pesan coach melewati filter keamanan konten sebelum diproses.
        Kami tidak memakai isi CV atau percakapanmu untuk melatih model publik
        di luar Akselerja.
      </p>

      <h2>4. Fairness dan pengawasan</h2>
      <p>
        Kami secara berkala menguji apakah skor menghasilkan bias terhadap
        kelompok tertentu. Bila ditemukan ketimpangan signifikan, kami akan
        memperbaiki bobot komponen dan menjelaskan perubahan tersebut di
        catatan rilis.
      </p>

      <h2>5. Data agregat untuk riset</h2>
      <p>
        Kami dapat mempublikasikan laporan tren tenaga kerja yang berbasis
        data agregat dan dianonimkan, misalnya distribusi skill terbanyak
        di sektor logistik. Tidak ada profil individu yang dapat
        diidentifikasi dari laporan tersebut.
      </p>

      <h2>6. Retensi</h2>
      <ul>
        <li>Profil aktif: disimpan selama akun aktif.</li>
        <li>
          Akun nonaktif &gt; 24 bulan: kami beritahu via email lalu
          menghapus profil otomatis bila tidak ada respons.
        </li>
        <li>
          Riwayat lamaran: disimpan minimal 12 bulan untuk audit dan dapat
          diakses kandidat dan perusahaan terkait.
        </li>
      </ul>

      <h2>7. Permintaan ekspor dan penghapusan</h2>
      <p>
        Kirim permintaan ke{" "}
        <a href="mailto:data@akselerja.id">data@akselerja.id</a>. Kami
        merespons dalam 14 hari kerja.
      </p>
    </LegalLayout>
  );
}
