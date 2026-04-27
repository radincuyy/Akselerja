import { useRef, useState } from 'react';

const acceptedTypes = '.pdf,.doc,.docx';

export default function UploadView({ isActive, onSimulateComplete }) {
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const pickFile = () => {
    fileInputRef.current?.click();
  };

  const setFile = (file) => {
    if (!file) return;
    setSelectedFile(file);
  };

  const simulateUpload = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSimulateComplete();
    }, 1400);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    setFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className={`view ${isActive ? 'active' : ''}`}>
      <div className="mb-8">
        <h2 className="mb-2 font-outfit text-2xl sm:text-[28px]">Unggah CV</h2>
        <p className="text-text-muted">Upload file PDF/DOCX untuk menjalankan simulasi ekstraksi profil kandidat.</p>
      </div>

      {!isLoading ? (
        <div className="mb-6 rounded-[20px] border border-border-color bg-bg-card p-4 shadow-sm sm:p-6" id="upload-container">
          <div className="inline-flex items-center gap-1.5 bg-[#E6F1FB] text-[#0C447C] text-xs px-3 py-1.5 rounded-full mb-4 font-medium border border-[#0C447C]/10">
            <i className="ph-fill ph-microsoft-logo text-[#0078D4]"></i> Simulasi Azure AI Document Intelligence
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0])}
          />

          <button
            type="button"
            className={`mt-4 w-full cursor-pointer rounded-[20px] border-2 border-dashed px-4 py-10 text-center transition-all duration-200 sm:px-8 sm:py-14 ${
              isDragging ? 'border-primary bg-primary-light' : 'border-slate-300 bg-slate-50 hover:border-primary hover:bg-primary-light'
            }`}
            onClick={pickFile}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <i className="ph ph-cloud-arrow-up mb-4 text-[40px] text-primary sm:text-[48px]"></i>
            <h3 className="mb-2 font-outfit text-lg font-semibold">Drag & drop CV Anda di sini</h3>
            <p className="text-text-muted text-sm mt-2">atau klik untuk memilih file dari komputer Anda</p>
            <span className="mt-6 px-5 py-2 rounded-full font-medium transition-all duration-200 border-none font-inter inline-flex items-center gap-2 bg-primary text-white shadow-lg text-[13px]">
              Pilih File
            </span>
          </button>

          <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="min-h-10">
              {selectedFile ? (
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
                  <i className="ph-fill ph-file-text text-lg"></i>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{selectedFile.name}</p>
                    <p className="text-xs text-green-700">{Math.max(1, Math.round(selectedFile.size / 1024))} KB siap diproses</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-muted">Belum ada file dipilih. Untuk demo cepat, Anda bisa langsung memakai CV contoh.</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:flex">
              <button
                type="button"
                onClick={() => setSelectedFile({ name: 'CV_Budi_Santoso.pdf', size: 284000 })}
                className="min-h-11 rounded-full border border-border-color px-4 py-2 text-sm font-medium text-text-dark hover:border-primary hover:text-primary"
              >
                Pakai CV Contoh
              </button>
              <button
                type="button"
                onClick={simulateUpload}
                disabled={!selectedFile}
                className="min-h-11 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                Proses CV
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="active mb-6 rounded-[20px] border border-border-color bg-bg-card p-6 py-16 text-center shadow-sm sm:py-20" id="loading-container">
          <div className="w-12 h-12 border-4 border-primary-light border-t-primary rounded-full animate-spin-fast mx-auto mb-6"></div>
          <h3 className="mb-3 text-[22px] font-outfit font-semibold">Mengekstrak Data...</h3>
          <p className="text-text-muted text-[15px] max-w-[420px] mx-auto">Prototype sedang mensimulasikan pembacaan struktur CV dan pemetaan skill kandidat.</p>
        </div>
      )}
    </div>
  );
}
