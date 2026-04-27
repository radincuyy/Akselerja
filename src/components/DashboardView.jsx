import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

const reqData = [80, 90, 70, 85, 75, 80];
const baseUserData = [75, 60, 65, 20, 10, 60];
const baseScore = 78;

const simulatorSkills = [
  { id: 'ml', label: 'Machine Learning', boost: 12, dataIndex: 3, targetValue: 75 },
  { id: 'sql', label: 'SQL Tingkat Lanjut', boost: 5, dataIndex: 1, targetValue: 85 },
  { id: 'azure', label: 'Azure Data Services', boost: 8, dataIndex: 4, targetValue: 70 },
];

const recommendations = [
  {
    title: 'Data Scientist',
    company: 'TechNusa Corp',
    location: 'Jakarta',
    baseMatch: 78,
    description: 'Cocok karena fondasi Python, SQL, statistik, dan pengalaman analisis data sudah kuat.',
    matched: ['Python', 'Data Viz', 'Statistik'],
    missing: ['Machine Learning', 'Azure/Cloud', 'Advanced SQL'],
    primary: true,
  },
  {
    title: 'Data Analyst (Senior)',
    company: 'E-Comm Indo',
    location: 'Remote',
    baseMatch: 89,
    description: 'Match tinggi untuk jalur analitik karena kebutuhan BI dan SQL lebih dominan.',
    matched: ['SQL', 'Tableau', 'Komunikasi'],
    missing: ['Experimentation'],
  },
  {
    title: 'Machine Learning Specialist',
    company: 'FinBank ID',
    location: 'Jakarta',
    baseMatch: 62,
    description: 'Potensi transisi ada, tetapi butuh penguatan model training dan deployment.',
    matched: ['Python', 'Statistik'],
    missing: ['ML Ops', 'Model Evaluation', 'Azure ML'],
  },
];

const readinessBreakdown = [
  { label: 'Skill Fit', value: 74 },
  { label: 'Experience Fit', value: 82 },
  { label: 'Learning Momentum', value: 64 },
];

const transferableSkills = [
  {
    from: 'Analisis Statistik',
    to: 'Model Evaluation',
    confidence: 86,
    note: 'Fondasi statistik membantu membaca performa model dan validasi hipotesis.',
  },
  {
    from: 'Tableau & Data Viz',
    to: 'Insight Storytelling',
    confidence: 91,
    note: 'Kebiasaan membuat dashboard bisa ditransfer ke komunikasi insight bisnis.',
  },
  {
    from: 'SQL Dasar',
    to: 'Feature Exploration',
    confidence: 78,
    note: 'Kemampuan query menjadi pijakan untuk eksplorasi data training.',
  },
];

const upskillingRoadmap = [
  { week: 'Minggu 1', skillId: 'sql', title: 'Advanced SQL Sprint', outcome: 'Query kompleks, CTE, window function', score: '+5%' },
  { week: 'Minggu 2', skillId: 'ml', title: 'Machine Learning Foundation', outcome: 'Training model, evaluasi, dan eksperimen', score: '+12%' },
  { week: 'Minggu 3', skillId: 'azure', title: 'Azure Data Services', outcome: 'Konsep data cloud dan pipeline sederhana', score: '+8%' },
  { week: 'Minggu 4', skillId: 'portfolio', title: 'Portfolio Proof', outcome: 'Mini project dan cerita interview berbasis hasil', score: '+7%' },
];

export default function DashboardView({ isActive, onToLearning }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [activeSims, setActiveSims] = useState({ ml: false, sql: false, azure: false });

  const currentSimBoost = simulatorSkills.reduce((total, skill) => (
    activeSims[skill.id] ? total + skill.boost : total
  ), 0);
  const totalScore = Math.min(100, baseScore + currentSimBoost);
  const isHighMatch = totalScore >= 85;
  const roadmapProjectedScore = Math.min(100, baseScore + 32);

  useEffect(() => {
    if (!isActive || !chartRef.current) return undefined;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    Chart.defaults.font.family = "'Inter', sans-serif";

    const currentData = [...baseUserData];
    simulatorSkills.forEach((skill) => {
      if (activeSims[skill.id]) currentData[skill.dataIndex] = skill.targetValue;
    });

    chartInstance.current = new Chart(chartRef.current, {
      type: 'radar',
      data: {
        labels: ['Python', 'SQL', 'Data Viz', 'Machine Learning', 'Azure/Cloud', 'Statistik'],
        datasets: [
          {
            label: 'Kebutuhan Posisi',
            data: reqData,
            backgroundColor: 'rgba(100, 116, 139, 0.08)',
            borderColor: '#94a3b8',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
          },
          {
            label: 'Skill Anda',
            data: currentData,
            backgroundColor: 'rgba(127, 119, 221, 0.25)',
            borderColor: '#7F77DD',
            pointBackgroundColor: '#7F77DD',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { display: false },
            grid: { color: '#e2e8f0' },
            angleLines: { color: '#e2e8f0' },
            pointLabels: { font: { size: 11, weight: '600' }, color: '#475569' },
          },
        },
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 20 } },
          tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, cornerRadius: 8 },
        },
      },
    });

    return () => {
      chartInstance.current?.destroy();
      chartInstance.current = null;
    };
  }, [isActive, activeSims]);

  const toggleSim = (skill) => {
    setActiveSims((prev) => ({ ...prev, [skill]: !prev[skill] }));
  };

  return (
    <div className={`view ${isActive ? 'active' : ''}`}>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="mb-2 font-outfit text-2xl sm:text-[28px]">Kesesuaian Kerja & Gap Skill</h2>
          <p className="text-text-muted">Target: <strong>Data Scientist</strong>. Skor dan analisis memakai data demo prototype.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-1.5 bg-[#E6F1FB] text-[#0C447C] text-xs px-3 py-1.5 rounded-full font-medium border border-[#0C447C]/10 m-0">
          <i className="ph-fill ph-microsoft-logo text-[#0078D4]"></i> Simulasi Azure AI Search
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['1', 'Profil terbaca', 'Python, SQL, Data Viz'],
          ['2', 'Match dihitung', '3 lowongan relevan'],
          ['3', 'Gap ditemukan', 'ML, Azure, SQL lanjut'],
          ['4', 'Roadmap dibuat', '4 minggu upskilling'],
        ].map(([number, title, detail]) => (
          <div key={title} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{number}</span>
              <span className="text-sm font-semibold text-text-dark">{title}</span>
            </div>
            <p className="text-xs text-text-muted">{detail}</p>
          </div>
        ))}
      </div>

      <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(280px,320px)_1fr]">
        <div className="rounded-[20px] border border-primary/20 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Career Readiness</p>
              <h3 className="mt-2 font-outfit text-4xl font-bold text-text-dark">{totalScore}<span className="text-lg text-text-muted">/100</span></h3>
            </div>
            <div className={`rounded-full px-3 py-1.5 text-xs font-bold ${isHighMatch ? 'bg-accent-light text-accent-dark' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
              {isHighMatch ? 'Siap Melamar' : 'Butuh Sprint'}
            </div>
          </div>
          <div className="mt-5 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${totalScore}%` }}></div>
          </div>
          <div className="mt-5 space-y-3">
            {readinessBreakdown.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-semibold text-text-muted">{item.label}</span>
                  <span className="font-bold text-text-dark">{item.value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-accent" style={{ width: `${item.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-text-muted">
            Jika roadmap 4 minggu selesai, skor diproyeksikan naik ke <strong className="text-text-dark">{roadmapProjectedScore}/100</strong>.
          </p>
        </div>

        <div className="rounded-[20px] border border-border-color bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-dark">Transferable Skill Detector</p>
              <h3 className="mt-1 font-outfit text-xl font-semibold text-text-dark">Skill lama yang bisa dijembatani ke Data Scientist</h3>
            </div>
            <span className="w-fit rounded-full bg-accent-light px-3 py-1.5 text-xs font-bold text-accent-dark">AI Skill Bridge</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {transferableSkills.map((skill) => (
              <article key={skill.from} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-text-muted">{skill.confidence}% confidence</span>
                  <i className="ph-fill ph-path text-accent"></i>
                </div>
                <p className="text-sm font-semibold text-text-dark">{skill.from}</p>
                <p className="my-2 text-xs font-bold text-primary">menjadi {skill.to}</p>
                <p className="text-xs leading-relaxed text-text-muted">{skill.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(320px,380px)]">
        <div>
          <h3 className="text-base mb-4 flex items-center gap-2 text-text-dark font-outfit font-semibold">
            <i className="ph-fill ph-briefcase text-primary"></i> Rekomendasi Lowongan
          </h3>

          {recommendations.map((job) => {
            const score = job.primary ? totalScore : job.baseMatch;
            const high = score >= 85;
            return (
              <article
                key={`${job.company}-${job.title}`}
                className={`bg-bg-card rounded-xl p-5 border shadow-sm mb-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  job.primary ? 'border-primary' : 'border-border-color hover:border-primary'
                } ${job.primary && isHighMatch ? 'ring-2 ring-accent/30' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                  <div>
                    <div className="font-semibold text-lg mb-1 text-text-dark">{job.title}</div>
                    <div className="text-text-muted text-sm flex items-center gap-1.5">
                      <i className="ph-fill ph-buildings"></i> {job.company} - {job.location}
                    </div>
                  </div>
                  <div className={`w-fit font-semibold px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-all duration-300 ${high ? 'bg-accent-light text-accent-dark' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
                    <i className="ph-fill ph-lightning"></i> <span>{score}% Cocok</span>
                  </div>
                </div>
                <p className="text-[13px] text-text-muted leading-relaxed mb-4">{job.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-dark mb-2">Skill cocok</p>
                    <div className="flex flex-wrap gap-2">
                      {job.matched.map((skill) => (
                        <span key={skill} className="rounded-full bg-accent-light px-2.5 py-1 text-xs font-medium text-accent-dark">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#92400E] mb-2">Perlu ditingkatkan</p>
                    <div className="flex flex-wrap gap-2">
                      {job.missing.map((skill) => (
                        <span key={skill} className="rounded-full bg-[#FEF3C7] px-2.5 py-1 text-xs font-medium text-[#92400E]">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {job.primary && (
                  <button
                    className="w-full justify-center px-4 py-2.5 text-[13px] rounded-full font-medium cursor-pointer transition-all duration-200 border-[1.5px] border-primary font-inter inline-flex items-center gap-2 bg-transparent text-primary hover:bg-primary-light"
                    onClick={onToLearning}
                  >
                    Lihat Rekomendasi Belajar
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <aside className="bg-bg-card rounded-[20px] p-6 shadow-sm border border-border-color mb-0 h-fit">
          <h3 className="text-base mb-2 text-center font-outfit font-semibold">Analisis Gap Skill</h3>
          <p className="text-xs text-text-muted text-center mb-4">Anda vs kebutuhan TechNusa Corp</p>

          <div className="relative mt-4 h-[260px] w-full sm:h-[300px]">
            <canvas ref={chartRef}></canvas>
          </div>

          <div className="mt-6 pt-6 border-t border-border-color">
            <div className="text-[15px] font-semibold mb-4 flex items-center gap-2">
              <i className="ph-fill ph-magic-wand text-[#a855f7] text-lg"></i> Simulator Gap Skill
            </div>
            <p className="text-[13px] text-text-muted mb-4 leading-relaxed">Pilih skill yang akan dipelajari untuk melihat proyeksi kenaikan skor:</p>

            {simulatorSkills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl mb-2 cursor-pointer border transition-all duration-200 hover:border-border-color ${
                  activeSims[skill.id] ? 'bg-primary-light border-primary' : 'bg-bg-main border-transparent'
                }`}
                onClick={() => toggleSim(skill.id)}
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <span className={`w-[18px] h-[18px] border-2 rounded-[4px] flex items-center justify-center ${activeSims[skill.id] ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                    {activeSims[skill.id] && <i className="ph-bold ph-check text-white text-[12px]"></i>}
                  </span>
                  {skill.label}
                </span>
                <span className="text-accent font-semibold text-[13px]">+{skill.boost}%</span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <section className="mt-6 rounded-[20px] border border-border-color bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">4-Week Upskilling Roadmap</p>
            <h3 className="mt-1 font-outfit text-xl font-semibold text-text-dark">Rencana belajar paling cepat untuk menutup gap prioritas</h3>
          </div>
          <button
            type="button"
            onClick={onToLearning}
            className="min-h-11 w-full rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-light sm:w-fit"
          >
            Buka Jalur Belajar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {upskillingRoadmap.map((item) => {
            const isSelected = item.skillId !== 'portfolio' && activeSims[item.skillId];
            return (
              <button
                key={item.week}
                type="button"
                onClick={() => item.skillId !== 'portfolio' && toggleSim(item.skillId)}
                className={`text-left rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
                  isSelected ? 'border-primary bg-primary-light' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-text-dark border border-slate-100">{item.week}</span>
                  <span className="text-sm font-bold text-accent">{item.score}</span>
                </div>
                <h4 className="font-outfit text-base font-semibold text-text-dark">{item.title}</h4>
                <p className="mt-2 text-xs leading-relaxed text-text-muted">{item.outcome}</p>
                {item.skillId !== 'portfolio' && (
                  <p className="mt-4 text-xs font-semibold text-primary">{isSelected ? 'Masuk simulasi skor' : 'Klik untuk simulasi'}</p>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
