const candidates = [
  { name: 'Sarah Wilson', role: 'Machine Learning Eng.', exp: '4 thn peng.', loc: 'Remote', skills: ['Python', 'TensorFlow', 'Azure'], match: 94, img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' },
  { name: 'Budi Santoso', role: 'Data Scientist', exp: '2 thn peng.', loc: 'Jakarta', skills: ['Python', 'SQL', 'Data Viz'], match: 88, img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' },
  { name: 'Michael Chen', role: 'Data Analyst', exp: '1 thn peng.', loc: 'Bandung', skills: ['Excel', 'Tableau', 'SQL'], match: 65, img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' },
];

const skillDistribution = [
  { skill: 'Python', value: 2 },
  { skill: 'SQL', value: 2 },
  { skill: 'Azure', value: 1 },
  { skill: 'Data Viz', value: 1 },
  { skill: 'TensorFlow', value: 1 },
];

function getMatchColor(match) {
  if (match >= 85) return 'text-green-600 bg-green-50 border-green-100';
  if (match >= 70) return 'text-blue-600 bg-blue-50 border-blue-100';
  return 'text-yellow-700 bg-yellow-50 border-yellow-100';
}

export default function CompanyDashboardView({ isActive, onPostJob }) {
  const averageMatch = Math.round(candidates.reduce((total, candidate) => total + candidate.match, 0) / candidates.length);

  return (
    <div className={`view ${isActive ? 'active' : ''}`}>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-8">
        <div>
          <h2 className="text-[28px] mb-2 font-outfit">Pool Talenta</h2>
          <p className="text-text-muted">Kandidat demo yang diurutkan berdasarkan skor kecocokan untuk posisi terbuka.</p>
        </div>
        <button
          type="button"
          onClick={onPostJob}
          className="bg-blue-600 text-white font-medium px-6 py-2.5 rounded-md hover:bg-blue-700 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
        >
          <i className="ph-bold ph-plus"></i> Pasang Lowongan Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Kandidat Demo</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{candidates.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Rata-rata Match</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{averageMatch}%</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Posisi Aktif</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">Data Scientist</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="grid grid-cols-1 gap-4">
          {candidates.map((candidate) => (
            <article key={candidate.name} className="bg-white rounded-xl p-6 border border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-5 hover:border-blue-600 transition-all shadow-sm">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-100 shrink-0">
                  <img src={candidate.img} alt={candidate.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 font-outfit">{candidate.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{candidate.role} - {candidate.exp} - {candidate.loc}</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill) => (
                      <span key={skill} className="bg-gray-100 text-gray-700 border border-gray-200 text-xs px-2.5 py-1 rounded-full font-medium">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="md:text-right">
                <div className={`inline-flex text-sm font-semibold mb-3 items-center gap-1 rounded-full border px-3 py-1.5 ${getMatchColor(candidate.match)}`}>
                  <i className="ph-fill ph-lightning"></i> {candidate.match}% Cocok
                </div>
                <button className="block md:ml-auto px-5 py-2 border-2 border-blue-600 text-blue-600 rounded-md font-medium text-sm hover:bg-blue-50 transition-colors cursor-pointer">
                  Lihat Profil
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="rounded-xl border border-gray-200 bg-white p-6 h-fit">
          <h3 className="font-outfit text-lg font-semibold text-gray-900">Distribusi Skill</h3>
          <p className="mt-1 text-sm text-text-muted">Ringkasan skill yang muncul pada kandidat demo.</p>
          <div className="mt-5 space-y-4">
            {skillDistribution.map((item) => (
              <div key={item.skill}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.skill}</span>
                  <span className="text-gray-500">{item.value} kandidat</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${(item.value / candidates.length) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
