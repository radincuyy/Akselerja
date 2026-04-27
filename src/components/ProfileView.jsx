export default function ProfileView({ isActive, onNext }) {
  const inputClass = "w-full px-4 py-3 rounded-xl border border-border-color font-inter text-[15px] outline-none transition-colors duration-200 focus:border-primary";
  const labelClass = "block text-sm font-medium mb-2 text-text-muted";
  
  return (
    <div className={`view ${isActive ? 'active' : ''}`}>
        <div className="mb-8">
            <h2 className="mb-2 font-outfit text-2xl sm:text-[28px]">Profil & Skill Terdeteksi</h2>
            <p className="text-text-muted">Hasil ekstraksi simulatif dari CV Anda. Sesuaikan target karir di bawah.</p>
        </div>

        <div className="mb-6 rounded-[20px] border border-border-color bg-bg-card p-4 shadow-sm sm:p-6">
            <div className="inline-flex items-center gap-1.5 bg-[#E6F1FB] text-[#0C447C] text-xs px-3 py-1.5 rounded-full mb-4 font-medium border border-[#0C447C]/10">
                <i className="ph-fill ph-microsoft-logo text-[#0078D4]"></i> Simulasi Ekstraksi AI
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                <div className="mb-5">
                    <label className={labelClass}>Nama Lengkap</label>
                    <input type="text" className={inputClass} defaultValue="Budi Santoso" />
                </div>
                <div className="mb-5">
                    <label className={labelClass}>Peran Saat Ini / Terakhir</label>
                    <input type="text" className={inputClass} defaultValue="Junior Data Analyst" />
                </div>
            </div>

            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-border-color mb-5">
                <label className="block text-[15px] font-medium mb-2 text-text-dark">Target Posisi Impian</label>
                <select className="w-full px-4 py-3.5 rounded-xl border border-primary font-inter text-base font-medium outline-none transition-colors duration-200 bg-white shadow-sm cursor-pointer" defaultValue="Data Scientist">
                    <option>Data Scientist</option>
                    <option>Machine Learning Engineer</option>
                    <option>Data Engineer</option>
                    <option>AI Specialist</option>
                </select>
                <p className="text-xs text-text-muted mt-2">Ini akan menentukan parameter untuk Pencocokan Kerja Semantik.</p>
            </div>

            <div className="mt-6 mb-5">
                <label className={labelClass}>Skill Terstruktur (Ekstraksi AI)</label>
                <div className="flex flex-wrap gap-2 mt-3">
                    {['Python', 'SQL (Dasar)', 'Visualisasi Data', 'Tableau', 'Analisis Statistik', 'Komunikasi'].map(skill => (
                      <div key={skill} className="px-3.5 py-1.5 bg-primary-light text-primary-dark rounded-full text-[13px] font-medium inline-flex items-center gap-1.5">
                        {skill} <i className="ph ph-x cursor-pointer opacity-70 hover:opacity-100"></i>
                      </div>
                    ))}
                    <div className="px-3.5 py-1.5 bg-white border border-dashed border-slate-300 text-text-muted rounded-full text-[13px] font-medium inline-flex items-center gap-1.5 cursor-pointer hover:border-primary">
                        <i className="ph ph-plus"></i> Tambah Skill
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end sm:mt-10">
                <button className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-primary px-6 py-3 font-inter text-[15px] font-medium text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover sm:w-auto" onClick={onNext}>
                    Lihat Hasil Pencocokan Kerja <i className="ph-bold ph-arrow-right"></i>
                </button>
            </div>
        </div>
    </div>
  );
}
