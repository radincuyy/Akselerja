export default function Sidebar({ currentView, onViewChange, role }) {
  const seekerNavItems = [
    { id: 'dashboard', icon: 'ph-target', label: 'Match & Gap Kerja' },
    { id: 'onboarding', icon: 'ph-upload-simple', label: 'Ganti CV' },
    { id: 'jobs', icon: 'ph-briefcase', label: 'Cari Kerja' },
    { id: 'learning', icon: 'ph-graduation-cap', label: 'Jalur Belajar' },
    { id: 'chat', icon: 'ph-chat-teardrop-dots', label: 'Advisor AI' },
  ];

  const companyNavItems = [
    { id: 'talent-pool', icon: 'ph-users', label: 'Pool Talenta' },
    { id: 'post-job', icon: 'ph-briefcase', label: 'Pasang Lowongan' },
  ];

  const navItems = role === 'company' ? companyNavItems : seekerNavItems;

  return (
    <nav className="w-full lg:w-[260px] bg-white border-b lg:border-b-0 lg:border-r border-gray-200 p-4 lg:p-6 flex flex-col lg:h-screen lg:sticky top-0 shrink-0 shadow-sm z-40">
      <button
        type="button"
        onClick={() => onViewChange('landing')}
        className="font-outfit text-2xl font-bold text-blue-600 flex items-center gap-2 mb-4 lg:mb-8 cursor-pointer transition-transform hover:scale-105 text-left"
      >
          <i className="ph-fill ph-briefcase"></i> Akselerja
      </button>
      <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0">
        {navItems.map(item => (
          <button
            type="button"
            key={item.id}
            className={`shrink-0 px-4 py-3 rounded-md text-gray-500 no-underline flex items-center gap-3 font-medium cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 ${currentView === item.id ? 'bg-blue-50 !text-blue-600' : ''}`}
            onClick={() => onViewChange(item.id)}
          >
            <i className={`ph ${item.icon} text-lg`}></i> {item.label}
          </button>
        ))}
      </div>
      <div className="hidden lg:block mt-auto pt-6 border-t border-gray-200">
          <div className="mb-4 rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">
              {role === 'seeker' ? 'Alur demo: CV -> Match -> Roadmap -> Learning.' : 'Alur demo: Talent Pool -> Skill Distribution -> Post Job.'}
          </div>
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {role === 'seeker' ? 'BS' : 'TC'}
              </div>
              <div>
                  <div className="text-sm font-semibold text-gray-900">{role === 'seeker' ? 'Budi Santoso' : 'TechNusa Corp'}</div>
                  <div className="text-xs text-gray-500">{role === 'seeker' ? 'Pencari Kerja' : 'Perusahaan'}</div>
              </div>
          </div>
      </div>
    </nav>
  );
}
