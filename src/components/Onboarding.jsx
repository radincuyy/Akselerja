import { useState } from 'react';
import UploadView from './UploadView';
import ProfileView from './ProfileView';

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-inter animate-fade-in">
      <nav className="border-b border-gray-200 py-4 px-8 flex justify-between items-center bg-white shadow-sm">
        <div className="font-outfit text-2xl font-bold text-blue-600 flex items-center gap-2">
            <i className="ph-fill ph-briefcase"></i> Akselerja
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
            <span className={step >= 1 ? 'text-blue-600 font-semibold' : ''}>1. Unggah CV</span>
            <i className="ph ph-caret-right text-gray-300"></i>
            <span className={step >= 2 ? 'text-blue-600 font-semibold' : ''}>2. Profil & Target</span>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl w-full mx-auto py-12 px-6">
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
