export default function JobDetailView({ isActive, job, onBack }) {

  const displayJob = job || {
    title: 'Data Scientist',
    company: 'TechNusa Corp',
    location: 'Jakarta, Indonesia',
    salary: 'Rp 28jt - 42jt',
    type: 'FULL-TIME',
    logo: 'ph-brain',
    match: 78,
    tags: ['Python', 'SQL', 'Machine Learning']
  };
  const tags = displayJob.tags || ['Komunikasi', 'Analisis', 'Kolaborasi'];
  const typeLabel = displayJob.type === 'FULL-TIME' ? 'Waktu Penuh' : displayJob.type;

  return (
    <div className={`view ${isActive ? 'active' : ''} max-w-7xl mx-auto`}>
      {/* Breadcrumbs */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-[28px] font-outfit font-bold text-gray-900">Detail Pekerjaan</h2>
        <div className="text-sm text-text-muted flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
          <button onClick={onBack} className="hover:text-blue-600 transition-colors">Home</button> 
          <i className="ph ph-caret-right text-[10px]"></i>
          <button onClick={onBack} className="hover:text-blue-600 transition-colors">Cari Kerja</button> 
          <i className="ph ph-caret-right text-[10px]"></i>
          <span className="text-gray-900 font-semibold uppercase tracking-wider text-[11px]">Detail Pekerjaan</span>
        </div>
      </div>

      {/* Header Section - Removed Card Styling */}
      <div className="flex flex-col md:flex-row items-center justify-between py-10 border-b border-gray-200 mb-10">
        <div className="flex items-center gap-6 mb-6 md:mb-0">
          <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <i className={`ph-fill ${displayJob.logo} text-5xl`}></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-dark mb-2 font-outfit">{displayJob.title}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-text-muted font-medium">di {displayJob.company}</span>
              <span className="bg-green-100 text-green-700 text-[11px] font-bold px-3 py-1 rounded-sm">{typeLabel}</span>
              <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-sm">{displayJob.match || 72}% Cocok</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all active:scale-95 border border-blue-100">
            <i className="ph ph-bookmark text-2xl"></i>
          </button>
          <button className="flex-1 md:flex-none bg-blue-600 text-white px-10 py-4 rounded-sm font-bold hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg">
            Lamar Sekarang <i className="ph ph-arrow-right"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Main Content */}
        {/* Main Content - Removed Card Styling */}
        <div className="py-4">
          <div className="space-y-10">
            <section>
              <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                Deskripsi Pekerjaan
              </h3>
              <div className="text-text-muted leading-relaxed space-y-4 text-[15px]">
                <p>Kami mencari {displayJob.title} untuk bergabung dengan {displayJob.company}. Kandidat akan membantu tim memahami kebutuhan bisnis, mengolah data atau requirement pekerjaan, dan menghasilkan solusi yang berdampak.</p>
                <p>Anda akan bekerja sama dengan tim lintas fungsi, termasuk product, engineering, dan business stakeholder untuk menyusun prioritas kerja serta memastikan hasil pekerjaan mudah digunakan oleh pengguna akhir.</p>
                <p>Lowongan ini adalah data demo pada prototype Akselerja. Skor kecocokan, skill, dan rekomendasi masih disimulasikan agar alur produk dapat diuji oleh juri atau pengguna.</p>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                Persyaratan Utama
              </h3>
              <ul className="grid grid-cols-1 gap-4 text-text-muted text-[15px]">
                {[
                  `Memiliki pengalaman atau proyek yang relevan dengan posisi ${displayJob.title}.`,
                  `Menguasai skill utama: ${tags.join(', ')}.`,
                  'Mampu menjelaskan proses kerja dan mengambil keputusan berbasis data atau kebutuhan pengguna.',
                  'Nyaman bekerja dengan target, prioritas, dan kolaborasi lintas fungsi.',
                  'Memiliki komunikasi yang baik dan kemauan untuk terus meningkatkan skill.'
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <i className="ph ph-check-circle text-blue-600 text-xl shrink-0 mt-0.5"></i>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                Fasilitas & Keuntungan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: 'ph-first-aid', label: 'Asuransi Kesehatan' },
                  { icon: 'ph-graduation-cap', label: 'Pelatihan Profesional' },
                  { icon: 'ph-clock', label: 'Waktu Kerja Fleksibel' },
                  { icon: 'ph-buildings', label: 'Kantor Modern' },
                  { icon: 'ph-money', label: 'Bonus Performa' },
                  { icon: 'ph-airplane-tilt', label: 'Cuti Tahunan' }
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <i className={`ph ${benefit.icon} text-blue-600 text-xl`}></i>
                    <span className="text-sm font-semibold text-gray-700">{benefit.label}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-100 text-center shadow-sm">
              <div className="text-[10px] text-text-muted mb-2 uppercase tracking-widest font-bold">Gaji Bulanan</div>
              <div className="text-accent font-bold text-xl">{displayJob.salary}</div>
              <div className="text-[10px] text-text-muted mt-1">Estimasi IDR</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 text-center shadow-sm flex flex-col items-center justify-center">
              <i className="ph ph-map-trifold text-3xl text-blue-500 mb-2"></i>
              <div className="text-xs font-bold text-text-dark">Lokasi Kerja</div>
              <div className="text-[10px] text-text-muted">Jakarta, Indonesia</div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="font-bold mb-8 pb-4 border-b border-gray-100 text-lg font-outfit">Ringkasan Pekerjaan</h4>
            <div className="space-y-6">
              {[
                { icon: 'ph-calendar-blank', label: 'Diposting', value: '27 Apr, 2026' },
                { icon: 'ph-hourglass', label: 'Berakhir', value: '27 Mei, 2026' },
                { icon: 'ph-chart-line-up', label: 'Tingkat', value: 'Senior Level' },
                { icon: 'ph-briefcase-metal', label: 'Pengalaman', value: '2+ Tahun' },
                { icon: 'ph-student', label: 'Pendidikan', value: 'S1 / Sarjana' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <i className={`ph ${item.icon} text-xl`}></i>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-text-muted font-bold tracking-wider">{item.label}</div>
                    <div className="text-sm font-bold text-gray-800">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="font-bold mb-4 text-sm">Bagikan Lowongan Ini:</h4>
            <div className="flex flex-col gap-3">
              <button className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm font-bold">
                <i className="ph ph-link"></i> Salin Link Lowongan
              </button>
              <div className="flex gap-2">
                {[
                  { icon: 'ph-facebook-logo', color: 'bg-[#1877F2]' },
                  { icon: 'ph-twitter-logo', color: 'bg-[#1DA1F2]' },
                  { icon: 'ph-linkedin-logo', color: 'bg-[#0A66C2]' },
                  { icon: 'ph-envelope', color: 'bg-gray-700' }
                ].map((social, i) => (
                  <button key={i} className={`flex-1 h-12 rounded-xl ${social.color} text-white flex items-center justify-center hover:opacity-90 transition-opacity`}>
                    <i className={`ph ${social.icon} text-xl`}></i>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Jobs */}
      <div className="mt-20">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-2xl font-bold font-outfit text-gray-900">Pekerjaan Terkait</h3>
          <button onClick={onBack} className="text-blue-600 font-bold hover:underline flex items-center gap-2">
            Lihat Semua <i className="ph ph-arrow-right"></i>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Product Designer', company: 'Google Inc.', salary: 'Rp 25jt - 40jt', type: 'FULL-TIME' },
            { title: 'Visual UI Designer', company: 'Airbnb', salary: 'Rp 28jt - 35jt', type: 'REMOTE' },
            { title: 'UX Researcher', company: 'Gojek', salary: 'Rp 20jt - 30jt', type: 'PART-TIME' }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-xl border border-gray-100 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100 transition-all cursor-pointer group">
              <div className="flex justify-between mb-6">
                <div className="flex items-center gap-2">
                   <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${item.type === 'FULL-TIME' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{item.type}</span>
                   <span className="text-[11px] text-text-muted font-medium">Gaji: {item.salary}</span>
                </div>
                <i className="ph ph-bookmark text-gray-300 group-hover:text-blue-500 transition-colors text-xl"></i>
              </div>
              <h4 className="font-bold text-lg mb-4 group-hover:text-blue-600 transition-colors font-outfit">{item.title}</h4>
              <div className="flex items-center gap-3 text-sm text-text-muted">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                   <i className="ph-fill ph-buildings text-blue-600"></i>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-700 leading-none mb-1">{item.company}</span>
                  <div className="flex items-center gap-1 text-[11px]">
                    <i className="ph ph-map-pin"></i> Jakarta, Indonesia
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
