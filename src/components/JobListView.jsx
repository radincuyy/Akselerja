import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobs } from '../data/jobs';

const jobTypes = ['Semua', 'FULL-TIME', 'REMOTE', 'PART-TIME', 'INTERNSHIP'];

function getMatchStyle(match) {
  if (match >= 80) return 'bg-green-100 text-green-700';
  if (match >= 65) return 'bg-blue-100 text-blue-700';
  return 'bg-yellow-100 text-yellow-700';
}

export default function JobListView({ isActive, onSelectJob }) {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Semua');
  const [minMatch, setMinMatch] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const filteredJobs = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    const loc = location.trim().toLowerCase();

    return jobs.filter((job) => {
      const keywordMatch = !key || [job.title, job.company, ...job.tags].join(' ').toLowerCase().includes(key);
      const locationMatch = !loc || job.location.toLowerCase().includes(loc);
      const typeMatch = type === 'Semua' || job.type === type;
      const scoreMatch = job.match >= minMatch;
      return keywordMatch && locationMatch && typeMatch && scoreMatch;
    });
  }, [keyword, location, type, minMatch]);

  const resetFilters = () => {
    setKeyword('');
    setLocation('');
    setType('Semua');
    setMinMatch(0);
  };

  return (
    <div className={`view ${isActive ? 'active' : ''} max-w-7xl mx-auto`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-[32px] font-outfit font-bold text-gray-900 leading-tight">Telusuri Lowongan</h2>
          <p className="text-text-muted mt-1">Cari lowongan demo dan lihat skor kecocokan terhadap profil kandidat.</p>
        </div>
        <div className="text-sm text-text-muted flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <i className="ph ph-caret-right text-[10px]"></i>
          <span className="text-gray-900 font-semibold uppercase tracking-wider text-[11px]">Cari Kerja</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-border-color mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 border border-gray-100">
            <i className="ph ph-magnifying-glass text-blue-500"></i>
            <input
              type="text"
              placeholder="Judul, perusahaan, atau skill..."
              className="w-full bg-transparent outline-none text-sm"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 border border-gray-100">
            <i className="ph ph-map-pin text-blue-500"></i>
            <input
              type="text"
              placeholder="Kota atau remote"
              className="w-full bg-transparent outline-none text-sm"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <i className="ph ph-sliders"></i> Filter
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Reset
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4 border-t border-gray-100 pt-4">
            <div className="flex flex-wrap gap-2">
              {jobTypes.map((jobType) => (
                <button
                  key={jobType}
                  type="button"
                  onClick={() => setType(jobType)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    type === jobType ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {jobType}
                </button>
              ))}
            </div>
            <label className="text-xs font-semibold text-gray-600">
              Minimal match: {minMatch}%
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={minMatch}
                onChange={(event) => setMinMatch(Number(event.target.value))}
                className="mt-2 w-full accent-blue-600"
              />
            </label>
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center justify-between text-sm text-text-muted">
        <span>{filteredJobs.length} dari {jobs.length} lowongan demo ditampilkan</span>
        <span>Data statis prototype</span>
      </div>

      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <button
              type="button"
              key={job.id}
              className={`text-left bg-white p-6 rounded-xl border transition-all hover:shadow-md cursor-pointer ${job.featured ? 'border-blue-500 ring-1 ring-blue-500/10' : 'border-border-color hover:border-blue-300'}`}
              onClick={() => onSelectJob(job)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                  <i className={`ph-fill ${job.logo} text-2xl text-blue-600`}></i>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getMatchStyle(job.match)}`}>
                  {job.match}% cocok
                </span>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${job.type === 'FULL-TIME' ? 'bg-green-100 text-green-700' : job.type === 'PART-TIME' ? 'bg-blue-100 text-blue-700' : job.type === 'REMOTE' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                    {job.type}
                  </span>
                  <span className="text-xs text-text-muted">Gaji: {job.salary}</span>
                </div>
                <h3 className="font-semibold text-lg text-text-dark">{job.title}</h3>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
                <i className="ph ph-buildings"></i>
                <span>{job.company}</span>
                <span>-</span>
                <i className="ph ph-map-pin"></i>
                <span>{job.location}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">{tag}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <i className="ph ph-magnifying-glass text-4xl text-gray-300"></i>
          <h3 className="mt-4 font-outfit text-lg font-semibold text-gray-900">Tidak ada lowongan yang cocok</h3>
          <p className="mt-2 text-sm text-text-muted">Coba kurangi filter atau gunakan kata kunci yang lebih umum.</p>
          <button type="button" onClick={resetFilters} className="mt-5 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
}
