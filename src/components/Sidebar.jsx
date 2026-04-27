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
    <nav className="sticky top-0 z-40 flex w-full shrink-0 flex-col border-b border-gray-200 bg-white p-3 shadow-sm sm:p-4 lg:h-[100dvh] lg:w-[260px] lg:border-b-0 lg:border-r lg:p-6">
      <button
        type="button"
        onClick={() => onViewChange('landing')}
        className="mb-3 flex min-h-11 w-fit cursor-pointer items-center gap-2 text-left font-outfit text-xl font-bold text-blue-600 transition-transform hover:scale-105 sm:text-2xl lg:mb-8"
      >
          <i className="ph-fill ph-briefcase"></i> Akselerja
      </button>
      <div className="-mx-1 flex flex-row gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {navItems.map(item => (
          <button
            type="button"
            key={item.id}
            className={`flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium whitespace-nowrap text-gray-500 no-underline transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 sm:gap-3 sm:px-4 sm:py-3 ${currentView === item.id ? 'bg-blue-50 !text-blue-600' : ''}`}
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
