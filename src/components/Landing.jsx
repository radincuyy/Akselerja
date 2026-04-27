import { useNavigate, Link } from 'react-router-dom';

const featuredJobs = [
  { title: 'Data Scientist', company: 'TechNusa Corp', match: 78, salary: 'Rp 28jt - 42jt', tags: ['Python', 'SQL', 'ML'] },
  { title: 'Data Analyst', company: 'E-Comm Indo', match: 89, salary: 'Rp 18jt - 30jt', tags: ['SQL', 'Tableau', 'BI'] },
  { title: 'Machine Learning Specialist', company: 'FinBank ID', match: 62, salary: 'Rp 35jt - 55jt', tags: ['Python', 'TensorFlow', 'Azure'] },
];

const analysisStats = [
  {
    icon: 'ph-briefcase',
    count: '9',
    unit: 'lowongan',
    label: 'Lowongan Dianalisis',
    desc: 'pekerjaan contoh yang dibandingkan dengan profil kandidat.',
  },
  {
    icon: 'ph-target',
    count: '78',
    unit: '/100',
    label: 'Skor Kesiapan Kerja',
    desc: 'nilai kecocokan CV terhadap target posisi.',
  },
  {
    icon: 'ph-path',
    count: '3',
    unit: 'skill',
    label: 'Skill Transfer',
    desc: 'kemampuan lama yang masih relevan untuk posisi target.',
  },
  {
    icon: 'ph-graduation-cap',
    count: '4',
    unit: 'minggu',
    label: 'Roadmap Belajar',
    desc: 'durasi upskilling dari gap skill terbesar.',
  },
];

const getRoleLabel = (role) => (role === 'company' ? 'Perusahaan' : 'Kandidat');
const getDashboardPath = (role) => (role === 'company' ? 'company' : 'dashboard');
const getAvatarInitials = (role) => (role === 'company' ? 'TC' : 'BS');

export const NavBar = ({ onNavigate, isAuthenticated = false, role = 'seeker', onLogout }) => (
  <nav className="border-b border-gray-200 py-4 px-5 lg:px-8 flex justify-between items-center bg-white sticky top-0 z-50">
    <button
      type="button"
      className="font-outfit text-2xl font-bold text-blue-600 flex items-center gap-2 cursor-pointer"
      onClick={() => onNavigate('landing')}
    >
      <i className="ph-fill ph-briefcase"></i> Akselerja
    </button>
    <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-600">
      <Link to="/jobs" className="hover:text-blue-600">Lowongan</Link>
      <Link to="/dashboard" className="hover:text-blue-600">Demo Dashboard</Link>
      <Link to="/company" className="hover:text-blue-600">Demo Perusahaan</Link>
    </div>
    <div className="flex items-center gap-2 sm:gap-3">
      {isAuthenticated ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            title={`Buka dashboard ${getRoleLabel(role)}`}
            onClick={() => onNavigate(getDashboardPath(role))}
            className="relative h-10 w-10 rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm ring-4 ring-blue-50 hover:bg-blue-700"
          >
            {getAvatarInitials(role)}
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
          </button>
          <button
            type="button"
            title="Keluar"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            onClick={onLogout}
          >
            <i className="ph ph-sign-out"></i>
          </button>
        </div>
      ) : (
        <>
          <button className="text-blue-600 font-medium px-3 sm:px-4 py-2 hover:bg-blue-50 rounded-md transition-colors" onClick={() => onNavigate('auth', 'seeker')}>Masuk Kandidat</button>
          <button className="bg-blue-600 text-white font-medium px-4 sm:px-6 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm" onClick={() => onNavigate('auth', 'company')}>Demo Perusahaan</button>
        </>
      )}
    </div>
  </nav>
);

function Hero({ onNavigate }) {
  const navigate = useNavigate();

  return (
    <section className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-10 items-center">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
            <i className="ph-fill ph-lightning"></i> Job matching + workforce upskilling
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5 font-outfit">
            Dari skill gap ke peluang kerja yang lebih jelas.
          </h1>
          <p className="text-gray-500 mb-8 text-lg leading-relaxed max-w-2xl">
            Akselerja membantu kandidat melihat kecocokan kerja, skill yang kurang, dan roadmap belajar 4 minggu untuk meningkatkan kesiapan melamar.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <button
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              onClick={() => onNavigate('auth', 'seeker')}
            >
              Mulai Demo Kandidat <i className="ph-bold ph-arrow-right"></i>
            </button>
            <button
              className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold border border-blue-100 hover:border-blue-500 transition-colors flex items-center justify-center gap-2"
              onClick={() => navigate('/dashboard')}
            >
              Lihat Demo Dashboard <i className="ph ph-target"></i>
            </button>
          </div>

        </div>

        <div className="rounded-[20px] border border-gray-100 bg-white p-5 shadow-xl shadow-blue-100/40">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Contoh Hasil Analisis</p>
              <h2 className="font-outfit text-xl font-bold text-gray-900">Budi Santoso</h2>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">78% Cocok</span>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-gray-500">
            Contoh tampilan setelah kandidat mengunggah CV: sistem menilai kesiapan kerja dan menyarankan skill prioritas.
          </p>

          <div className="mb-4 grid grid-cols-2 gap-3">
            {analysisStats.map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <i className={`ph ${item.icon} text-lg`}></i>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-gray-900">{item.count}</span>
                  <span className="text-[11px] font-semibold text-gray-400">{item.unit}</span>
                </div>
                <div className="mt-1 text-xs font-bold text-gray-800">{item.label}</div>
                <div className="mt-1 text-[11px] leading-snug text-gray-500">{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-semibold text-gray-700">Skor Kesiapan Kerja</span>
              <span className="font-bold text-blue-600">78/100</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200">
              <div className="h-2 w-[78%] rounded-full bg-blue-600"></div>
            </div>
          </div>
          <div className="mt-4 mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Prioritas belajar</p>
            <p className="text-xs text-gray-400">estimasi dampak skor</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              ['Machine Learning', '+12%'],
              ['Azure Data Services', '+8%'],
              ['SQL Tingkat Lanjut', '+5%'],
            ].map(([skill, boost]) => (
              <div key={skill} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                <span className="text-sm font-medium text-gray-700">{skill}</span>
                <span className="ml-auto mr-3 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">{boost}</span>
                <i className="ph ph-arrow-circle-up-right text-green-600"></i>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: 'ph-upload-simple', title: 'Upload CV', desc: 'Profil dan skill demo terbaca dari CV contoh.' },
    { icon: 'ph-target', title: 'Lihat Match', desc: 'Kandidat mendapat skor kecocokan dan gap skill.' },
    { icon: 'ph-path', title: 'Bridge Skill', desc: 'Skill lama dipetakan ke skill target pekerjaan.' },
    { icon: 'ph-graduation-cap', title: 'Ikuti Roadmap', desc: 'Roadmap 4 minggu membantu prioritas belajar.' },
  ];

  return (
    <section className="py-16 px-5 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-blue-600">Alur Produk</p>
          <h2 className="text-3xl font-bold font-outfit text-gray-900">Mudah dipahami dalam satu demo</h2>
        </div>
        <Link to="/onboarding" className="w-fit rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">Coba upload CV</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
                <i className={`ph ${step.icon}`}></i>
              </div>
              <span className="text-xs font-bold text-gray-300">0{index + 1}</span>
            </div>
            <h3 className="font-outfit text-lg font-bold text-gray-900">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedJobs() {
  const navigate = useNavigate();

  return (
    <section className="py-16 px-5 lg:px-8 max-w-7xl mx-auto border-t border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-sm font-semibold text-blue-600">Lowongan Demo</p>
          <h2 className="text-3xl font-bold font-outfit text-gray-900">Rekomendasi yang relevan</h2>
        </div>
        <button onClick={() => navigate('/jobs')} className="text-blue-600 font-semibold hover:underline flex items-center gap-1">Lihat Semua <i className="ph-bold ph-arrow-right"></i></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredJobs.map((job) => (
          <button key={job.title} className="text-left border border-gray-200 rounded-xl p-6 hover:border-blue-600 transition-colors shadow-sm bg-white" onClick={() => navigate('/jobs')}>
            <div className="mb-5 flex items-start justify-between">
              <div className="bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">{job.match}% cocok</div>
              <i className="ph ph-bookmark-simple text-gray-400 text-xl"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{job.company} - {job.salary}</p>
            <div className="flex flex-wrap gap-2">
              {job.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{tag}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function CtaBanners({ onNavigate }) {
  return (
    <section className="py-12 px-5 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-100 rounded-2xl p-8 lg:p-10 overflow-hidden relative">
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 font-outfit">Demo Kandidat</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">Mulai dari CV contoh, lihat skor kesiapan, lalu ikuti roadmap belajar.</p>
          <button className="bg-white text-blue-600 px-6 py-2.5 rounded-md font-semibold border border-gray-200 hover:border-blue-600 transition-colors shadow-sm" onClick={() => onNavigate('auth', 'seeker')}>
            Masuk Sebagai Kandidat <i className="ph-bold ph-arrow-right ml-1"></i>
          </button>
        </div>
      </div>

      <div className="bg-blue-600 rounded-2xl p-8 lg:p-10 overflow-hidden relative text-white">
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold mb-4 font-outfit">Demo Perusahaan</h2>
          <p className="text-blue-100 mb-6 text-sm leading-relaxed">Lihat talent pool, distribusi skill, dan flow pasang lowongan berbasis target skill.</p>
          <button className="bg-white text-blue-600 px-6 py-2.5 rounded-md font-semibold hover:bg-gray-50 transition-colors shadow-sm" onClick={() => onNavigate('auth', 'company')}>
            Masuk Sebagai Perusahaan <i className="ph-bold ph-arrow-right ml-1"></i>
          </button>
        </div>
      </div>
    </section>
  );
}

export const Footer = () => (
  <footer className="bg-[#18191C] text-gray-300 pt-12 pb-8 px-5 lg:px-8 border-t border-gray-800">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8 mb-10">
      <div>
        <div className="font-outfit text-2xl font-bold text-white flex items-center gap-2 mb-4">
          <i className="ph-fill ph-briefcase"></i> Akselerja
        </div>
        <p className="text-sm text-gray-400 max-w-md">Prototype job matching dan workforce upskilling untuk membantu kandidat memahami gap skill dan peluang kerja.</p>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link to="/jobs" className="hover:text-white">Lowongan</Link>
        <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
        <Link to="/learning" className="hover:text-white">Learning</Link>
        <Link to="/company" className="hover:text-white">Perusahaan</Link>
      </div>
    </div>
    <div className="max-w-7xl mx-auto border-t border-gray-800 pt-6 text-sm text-gray-500">
      <p>&copy; 2026 Akselerja - Prototype Hackathon.</p>
    </div>
  </footer>
);

export default function Landing({ onNavigate, isAuthenticated, role, onLogout }) {
  return (
    <div className="min-h-screen bg-white font-inter">
      <NavBar onNavigate={onNavigate} isAuthenticated={isAuthenticated} role={role} onLogout={onLogout} />
      <Hero onNavigate={onNavigate} />
      <HowItWorks />
      <FeaturedJobs />
      <CtaBanners onNavigate={onNavigate} />
      <Footer />
    </div>
  );
}
