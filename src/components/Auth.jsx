import { useState } from 'react';

const demoAccounts = {
  seeker: {
    label: 'Demo Kandidat',
    email: 'demo@akselerja.id',
    password: 'demo123',
    name: 'Budi Santoso',
  },
  company: {
    label: 'Demo Perusahaan',
    email: 'company@akselerja.id',
    password: 'demo123',
    name: 'TechNusa Corp',
  },
};

export default function Auth({ role, onBack, onComplete }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState(demoAccounts[role].name);
  const [email, setEmail] = useState(demoAccounts[role].email);
  const [password, setPassword] = useState(demoAccounts[role].password);

  const demo = demoAccounts[role];

  const useDemoAccount = () => {
    setName(demo.name);
    setEmail(demo.email);
    setPassword(demo.password);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onComplete(isLogin ? 'login' : 'register', role);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-inter animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button className="mx-auto flex justify-center mb-6 cursor-pointer" onClick={onBack}>
          <div className="font-outfit text-3xl font-bold text-blue-600 flex items-center gap-2">
            <i className="ph-fill ph-briefcase"></i> Akselerja
          </div>
        </button>
        <h2 className="text-center text-3xl font-bold text-gray-900 font-outfit">
          {isLogin ? 'Masuk ke akun Anda' : 'Buat akun baru'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Atau{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
            {isLogin ? 'daftar sebagai pengguna baru' : 'masuk ke akun yang sudah ada'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          <div className="mb-6 bg-gray-100 p-1 rounded-md flex">
            <div className="flex-1 py-2 text-center text-sm font-medium rounded-md bg-white shadow-sm text-blue-600 border border-gray-200">
              Peran {role === 'seeker' ? 'Kandidat' : 'Perusahaan'}
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-blue-900">{demo.label}</p>
                <p className="mt-1 text-xs text-blue-700">{demo.email} / {demo.password}</p>
              </div>
              <button
                type="button"
                onClick={useDemoAccount}
                className="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200 hover:border-blue-400"
              >
                Isi Otomatis
              </button>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Nama Lengkap / Nama Perusahaan</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ph ph-user text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    required
                    className="pl-10 block w-full sm:text-sm border-gray-300 rounded-md py-2.5 border outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Budi Santoso"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Alamat Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ph ph-envelope text-gray-400"></i>
                </div>
                <input
                  type="email"
                  required
                  className="pl-10 block w-full sm:text-sm border-gray-300 rounded-md py-2.5 border outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="nama@contoh.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Kata Sandi</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ph ph-lock text-gray-400"></i>
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="pl-10 block w-full sm:text-sm border-gray-300 rounded-md py-2.5 border outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Password demo"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center text-sm text-gray-900">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                  <span className="ml-2">Ingat saya</span>
                </label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">Lupa kata sandi?</a>
              </div>
            )}

            <button
              type="submit"
              className="cursor-pointer w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              {isLogin ? 'Masuk' : 'Buat Akun'} <i className="ph-bold ph-arrow-right ml-2 mt-0.5"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
