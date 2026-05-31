import LegalLayout from "@/components/layout/LegalLayout";

export const metadata = {
  title: "Kebijakan Privasi · Akselerja",
  description: "Bagaimana Akselerja mengumpulkan, memakai, dan melindungi data pribadi pengguna.",
};

export default function PrivasiPage() {
  return (
    <LegalLayout
      eyebrow="Hukum"
      title="Kebijakan Privasi"
      effectiveDate="15 Mei 2026"
    >
      <p>
        Akselerja menghormati privasi setiap pengguna. Halaman ini
        menjelaskan data apa yang kami kumpulkan, untuk apa, dan kontrol
        yang kamu miliki atas data tersebut.
      </p>

      <h2>1. Data yang kami kumpulkan</h2>
      <ul>
        <li>
          <strong>Informasi profil.</strong> Nama, email, lokasi, ringkasan
          tentang dirimu, ekspektasi gaji, foto profil bila diunggah.
        </li>
        <li>
          <strong>Riwayat dan kompetensi.</strong> Pendidikan, pengalaman
          kerja, daftar skill, dan latihan yang kamu kerjakan.
        </li>
        <li>
          <strong>CV.</strong> File CV yang kamu unggah dan teks yang kami
          ekstrak darinya untuk mengisi profil.
        </li>
        <li>
          <strong>Aktivitas di aplikasi.</strong> Lowongan yang kamu lihat,
          lamaran yang kamu kirim, percakapan dengan career coach, dan
          status lamaran.
        </li>
        <li>
          <strong>Data perangkat.</strong> Tipe perangkat, browser, dan
          alamat IP, untuk keamanan dan pencegahan penyalahgunaan.
        </li>
      </ul>

      <h2>2. Cara kami memakainya</h2>
      <ul>
        <li>Menghitung match score antara profilmu dan lowongan.</li>
        <li>Menampilkan rekomendasi pelatihan untuk skill gap.</li>
        <li>
          Memberi konteks ke career coach AI agar jawabannya relevan dengan
          profilmu.
        </li>
        <li>
          Menyajikan profil ringkas ke perusahaan yang kamu lamar atau yang
          kamu izinkan melihat profilmu.
        </li>
        <li>
          Menjaga keamanan layanan dan mendeteksi aktivitas mencurigakan.
        </li>
      </ul>

      <h2>3. Kapan profilmu dilihat perusahaan</h2>
      <p>
        Default-nya, profilmu hanya terlihat oleh perusahaan saat kamu
        mengirim lamaran ke lowongan mereka. Kamu bisa mengubah pengaturan
        ini di <a href="/app/pengaturan">pengaturan akun</a>, dengan opsi
        membuka profil ke semua perusahaan yang berlangganan akses talent
        pool kami.
      </p>

      <h2>4. Hak kamu atas data</h2>
      <ul>
        <li>Akses dan unduh data profilmu.</li>
        <li>Memperbaiki data yang tidak akurat.</li>
        <li>
          Menghapus akun dan seluruh datanya dari pengaturan akun. Beberapa
          data anonim mungkin tetap ada untuk laporan agregat.
        </li>
        <li>Menarik persetujuan tertentu kapan saja.</li>
      </ul>

      <h2>5. Penyimpanan dan keamanan</h2>
      <p>
        Data disimpan di pusat data Microsoft Azure region Asia. Kami pakai
        enkripsi saat transit dan saat disimpan. Akses internal dibatasi
        sesuai kebutuhan operasional.
      </p>

      <h2>6. Layanan pihak ketiga</h2>
      <p>
        Kami memakai Microsoft Azure (hosting dan AI), penyedia email
        transaksional, dan layanan analitik produk. Pihak ketiga ini
        terikat kontrak privasi yang sejalan dengan kebijakan ini.
      </p>

      <h2>7. Anak di bawah umur</h2>
      <p>
        Akselerja tidak ditujukan untuk pengguna di bawah 18 tahun.
        Kalau kamu menemukan akun yang dimiliki anak di bawah umur, beritahu
        kami untuk kami tinjau.
      </p>

      <h2>8. Perubahan kebijakan</h2>
      <p>
        Perubahan material akan kami umumkan minimal 14 hari sebelum
        berlaku. Versi terbaru selalu tersedia di halaman ini.
      </p>

      <h2>9. Kontak</h2>
      <p>
        Permintaan terkait privasi:{" "}
        <a href="mailto:privasi@akselerja.id">privasi@akselerja.id</a>.
      </p>
    </LegalLayout>
  );
}
