import { useMemo, useState } from 'react';

const learningPaths = [
  {
    topic: 'Machine Learning',
    title: 'Buat model machine learning dengan Azure Machine Learning',
    description: 'Pelajari dasar eksperimen, training model, dan deployment model pada lingkungan Azure.',
    duration: '4 jam 12 menit',
    modules: 8,
    boost: '+12%',
    priority: 'Prioritas 1',
    image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  },
  {
    topic: 'SQL Tingkat Lanjut',
    title: 'Query data dengan Transact-SQL tingkat lanjut',
    description: 'Perkuat kemampuan query, agregasi, window function, dan optimasi analisis data.',
    duration: '2 jam 45 menit',
    modules: 5,
    boost: '+5%',
    priority: 'Prioritas 2',
    image: 'https://images.unsplash.com/photo-1544383333-53c25442821e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  },
  {
    topic: 'Azure Data',
    title: 'Dasar-dasar Data Azure: Jelajahi konsep data inti',
    description: 'Pahami konsep database, analitik, dan layanan data cloud yang sering muncul pada lowongan.',
    duration: '1 jam 30 menit',
    modules: 3,
    boost: '+8%',
    priority: 'Prioritas 3',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  },
];

export default function LearningView({ isActive }) {
  const [completedTopics, setCompletedTopics] = useState([]);
  const progress = useMemo(() => Math.round((completedTopics.length / learningPaths.length) * 100), [completedTopics]);

  const toggleCompleted = (topic) => {
    setCompletedTopics((current) => (
      current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]
    ));
  };

  return (
    <div className={`view ${isActive ? 'active' : ''}`}>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-8">
        <div>
          <h2 className="text-[28px] mb-2 font-outfit">Jalur Belajar Terpersonalisasi</h2>
          <p className="text-text-muted">Rekomendasi modul contoh untuk menutup gap skill menuju posisi <strong>Data Scientist</strong>.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-1.5 bg-[#E6F1FB] text-[#0C447C] text-xs px-3 py-1.5 rounded-full font-medium border border-[#0C447C]/10 m-0">
          <i className="ph-fill ph-microsoft-logo text-[#0078D4]"></i> Microsoft Learn Example
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
          <i className="ph-fill ph-info text-xl text-blue-600"></i>
          <p className="text-sm leading-relaxed text-blue-800">
            Pada prototype saat ini, kartu belajar ditampilkan sebagai data statis yang merepresentasikan integrasi Microsoft Learn. Integrasi API live dapat ditambahkan pada tahap berikutnya.
          </p>
          </div>
          <div className="min-w-[220px]">
            <div className="mb-2 flex justify-between text-xs font-semibold text-blue-900">
              <span>Progress belajar</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/80">
              <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
        {learningPaths.map((path) => (
          <article key={path.title} className={`bg-bg-card border rounded-[20px] overflow-hidden transition-all duration-200 flex flex-col h-full hover:-translate-y-1 hover:shadow-md hover:border-primary ${completedTopics.includes(path.topic) ? 'border-green-200 ring-2 ring-green-100' : 'border-border-color'}`}>
            <div className="h-[160px] relative">
              <img src={path.image} alt={path.topic} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent"></div>
              <div className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 text-[#333]">
                <i className="ph-fill ph-microsoft-logo text-[#0078D4]"></i> MS Learn
              </div>
              <div className="absolute top-3 right-3 bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold">
                {path.boost}
              </div>
              <div className="absolute bottom-3 left-3 text-white">
                <div className="text-xs font-semibold opacity-80">{path.priority}</div>
                <div className="font-bold text-sm">{path.topic}</div>
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-2 block">{path.topic}</span>
              <h3 className="text-[17px] font-semibold mb-3 leading-snug font-outfit">{path.title}</h3>
              <p className="text-[13px] text-text-muted leading-relaxed mb-4">{path.description}</p>
              <div className="flex items-center gap-4 text-text-muted text-[13px] mt-auto pt-4 border-t border-border-color">
                <span className="flex items-center gap-1.5"><i className="ph ph-clock"></i> {path.duration}</span>
                <span className="flex items-center gap-1.5"><i className="ph ph-book-open"></i> {path.modules} Modul</span>
              </div>
              <button
                type="button"
                onClick={() => toggleCompleted(path.topic)}
                className={`mt-5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  completedTopics.includes(path.topic)
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-primary text-primary hover:bg-primary-light'
                }`}
              >
                {completedTopics.includes(path.topic) ? 'Selesai Dipelajari' : 'Tandai Dipelajari'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
