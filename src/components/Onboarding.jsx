import { useState } from 'react';
import { Link } from 'react-router-dom';
import UploadView from './UploadView';
import ProfileView from './ProfileView';

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gray-50 font-inter animate-fade-in">
      <nav className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link to="/" className="flex min-h-11 w-fit items-center gap-2 font-outfit text-xl font-bold text-blue-600 sm:text-2xl">
            <i className="ph-fill ph-briefcase"></i> Akselerja
        </Link>
        <div className="flex w-full items-center gap-3 overflow-x-auto whitespace-nowrap text-xs font-medium text-gray-500 sm:w-auto sm:gap-4 sm:text-sm">
            <span className={step >= 1 ? 'text-blue-600 font-semibold' : ''}>1. Unggah CV</span>
            <i className="ph ph-caret-right text-gray-300"></i>
            <span className={step >= 2 ? 'text-blue-600 font-semibold' : ''}>2. Profil & Target</span>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {step === 1 && (
            <UploadView isActive={true} onSimulateComplete={() => setStep(2)} />
        )}
        {step === 2 && (
            <ProfileView isActive={true} onNext={onComplete} />
        )}
      </main>
    </div>
  );
}
