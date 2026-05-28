import LegalLayout from "@/components/LegalLayout";

export const metadata = {
  title: "Syarat Layanan · Akselerja",
  description: "Syarat dan ketentuan menggunakan layanan Akselerja.",
};

export default function SyaratPage() {
  return (
    <LegalLayout
      eyebrow="Hukum"
      title="Syarat Layanan"
      effectiveDate="15 Mei 2026"
    >
      <p>
        Dokumen ini menjelaskan syarat dan ketentuan saat kamu memakai
        Akselerja. Dengan mendaftar dan memakai layanan kami, kamu setuju
        dengan poin-poin di bawah. Kami tulis sederhana, kalau ada yang
        kurang jelas, kontak kami.
      </p>

      <h2>1. Tentang Akselerja</h2>
      <p>
        Akselerja adalah platform AI job matching dan rekomendasi pelatihan
        untuk tenaga kerja Indonesia. Layanan ini ditujukan untuk pencari
        kerja.
      </p>

      <h2>2. Akun dan kelayakan pengguna</h2>
      <p>
        Untuk mendaftar kamu harus berusia minimal 18 tahun atau sudah lulus
        pendidikan menengah atas. Kamu bertanggung jawab menjaga keamanan
        akun dan memastikan informasi yang kamu berikan akurat.
      </p>

      <h2>3. Cara kami menggunakan datamu</h2>
      <p>
        Profil, latihan, dan riwayat lamaranmu kami gunakan untuk menghitung
        match score dan menampilkan rekomendasi. Detail bagaimana data
        dikelola ada di Kebijakan Privasi dan Kebijakan Data.
      </p>

      <h2>4. Kewajiban pengguna</h2>
      <ul>
        <li>
          Tulis informasi yang benar tentang dirimu, termasuk skill dan
          pengalaman.
        </li>
        <li>
          Jangan mengunggah konten yang melanggar hukum, hak orang lain,
          atau melecehkan pihak lain.
        </li>
        <li>
          Untuk perusahaan: lowongan harus mewakili posisi nyata, dengan
          deskripsi dan kompensasi yang sesuai praktik wajar.
        </li>
      </ul>

      <h2>5. Konten dari pihak ketiga</h2>
      <p>
        Akselerja dapat menampilkan rekomendasi kursus dari penyedia
        pelatihan eksternal. Harga, durasi, dan ketersediaan ditentukan
        penyedia tersebut. Kami tidak menjamin hasil belajar dari kursus
        pihak ketiga.
      </p>

      <h2>6. Layanan AI dan keterbatasan</h2>
      <p>
        Match score dan rekomendasi belajar dihasilkan otomatis dengan
        bantuan AI. Skor adalah panduan, bukan keputusan final. Keputusan
        rekrutmen tetap dibuat oleh perusahaan dengan mempertimbangkan
        konteks yang lebih luas.
      </p>

      <h2>7. Penangguhan dan penghentian akun</h2>
      <p>
        Kami dapat menangguhkan atau menutup akun yang melanggar syarat ini,
        atau yang dilaporkan menyalahgunakan layanan. Kamu juga dapat
        menutup akunmu kapan saja dari halaman pengaturan.
      </p>

      <h2>8. Perubahan syarat</h2>
      <p>
        Kami dapat memperbarui syarat ini dari waktu ke waktu. Perubahan
        material akan kami beritahukan lewat email atau di aplikasi
        sebelum berlaku.
      </p>

      <h2>9. Hubungi kami</h2>
      <p>
        Pertanyaan, keluhan, atau permintaan terkait syarat ini dapat
        dikirim ke <a href="mailto:halo@akselerja.id">halo@akselerja.id</a>.
      </p>
    </LegalLayout>
  );
}
