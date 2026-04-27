import { useState } from 'react';

export default function PostJobView({ onBack }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    company: 'Akselerja Tech',
    location: '',
    type: 'Full-time',
    salaryMin: '',
    salaryMax: '',
    description: '',
    requirements: '',
    skills: []
  });

  const [newSkill, setNewSkill] = useState('');
  const [published, setPublished] = useState(false);

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skillToRemove) });
  };

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);
  const generateDescription = () => {
    const title = formData.title || 'Data Scientist';
    setFormData((prev) => ({
      ...prev,
      title,
      description: `Kami mencari ${title} yang mampu mengolah data bisnis, membangun insight, dan berkolaborasi dengan tim produk untuk menghasilkan keputusan berbasis data. Kandidat ideal memiliki kemampuan analisis, komunikasi, dan pemahaman tools data modern.`,
      requirements: 'Pengalaman mengolah data, memahami SQL/Python, mampu membuat visualisasi, dan nyaman bekerja dalam lingkungan kolaboratif.',
      skills: prev.skills.length ? prev.skills : ['Python', 'SQL', 'Data Visualization', 'Machine Learning'],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in">
      {/* Breadcrumbs */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-outfit">Pasang Lowongan Baru</h1>
          <p className="text-text-muted mt-2">Gunakan AI untuk menjangkau kandidat yang paling tepat.</p>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`w-10 h-1.5 rounded-full transition-all duration-500 ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`}
            ></div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-blue-50/50 overflow-hidden">
        {/* Step 1: Info Dasar */}
        {step === 1 && (
          <div className="p-10 space-y-8 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Judul Pekerjaan</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Senior Fullstack Developer" 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Tipe Pekerjaan</label>
                <select 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                  <option>Remote</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Lokasi</label>
                <div className="relative">
                  <i className="ph ph-map-pin absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></i>
                  <input 
                    type="text" 
                    placeholder="Jakarta, Indonesia" 
                    className="w-full p-4 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Kisaran Gaji (Opsional)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={formData.salaryMin}
                    onChange={(e) => setFormData({...formData, salaryMin: e.target.value})}
                  />
                  <span className="text-gray-400">-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={formData.salaryMax}
                    onChange={(e) => setFormData({...formData, salaryMax: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Deskripsi & AI */}
        {step === 2 && (
          <div className="p-10 space-y-8 animate-slide-up">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Deskripsi Pekerjaan</label>
                <button
                  type="button"
                  onClick={generateDescription}
                  className="flex items-center gap-2 text-blue-600 text-sm font-bold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                >
                  <i className="ph ph-sparkle text-lg"></i> Generate dengan AI
                </button>
              </div>
              <textarea 
                rows="8" 
                placeholder="Jelaskan peran, tanggung jawab, dan misi tim Anda..." 
                className="w-full p-6 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Persyaratan (Opsional)</label>
              <textarea 
                rows="4" 
                placeholder="Contoh: Pengalaman 3+ tahun dalam React, Fasih berbahasa Inggris..." 
                className="w-full p-6 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                value={formData.requirements}
                onChange={(e) => setFormData({...formData, requirements: e.target.value})}
              ></textarea>
            </div>
          </div>
        )}

        {/* Step 3: Skills & Matching */}
        {step === 3 && (
          <div className="p-10 space-y-8 animate-slide-up">
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                <i className="ph ph-brain text-2xl"></i>
              </div>
              <div>
                <h4 className="font-bold text-blue-900">Penting: Penentuan Skill</h4>
                <p className="text-sm text-blue-700 mt-1">Akselerja menggunakan skill ini untuk melakukan <strong>Semantic Matching</strong>. Semakin akurat skill yang Anda masukkan, semakin tepat kandidat yang kami temukan.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Target Skill Kandidat</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Contoh: React.js, UI/UX Design, Project Management" 
                  className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <button 
                  onClick={addSkill}
                  className="bg-blue-600 text-white px-8 rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
                >
                  Tambah
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.skills.map(skill => (
                  <span key={skill} className="bg-white border border-blue-200 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm animate-pop-in">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors">
                      <i className="ph ph-x-circle text-lg"></i>
                    </button>
                  </span>
                ))}
                {formData.skills.length === 0 && <span className="text-gray-400 text-sm italic">Belum ada skill yang ditambahkan.</span>}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100 text-green-700 text-sm">
                <i className="ph-fill ph-check-circle text-xl"></i>
                <p>Prototype akan memprioritaskan kandidat demo yang memiliki minimal <strong>70% kecocokan</strong> dengan skill di atas.</p>
              </div>
            </div>
            {published && (
              <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
                Lowongan demo berhasil dibuat dan Anda akan kembali ke Talent Pool.
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-gray-50 p-8 flex justify-between items-center border-t border-gray-100">
          <button 
            onClick={step === 1 ? onBack : handlePrev}
            className="px-8 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-all"
          >
            {step === 1 ? 'Batalkan' : 'Sebelumnya'}
          </button>
          
          {step < 3 ? (
            <button 
              onClick={handleNext}
              className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-blue-200"
            >
              Lanjutkan <i className="ph ph-arrow-right"></i>
            </button>
          ) : (
            <button 
              onClick={() => {
                setPublished(true);
                setTimeout(onBack, 700);
              }}
              className="bg-green-600 text-white px-12 py-4 rounded-xl font-bold hover:bg-green-700 transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-green-200"
            >
              Selesaikan & Tayangkan <i className="ph ph-rocket-launch"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
