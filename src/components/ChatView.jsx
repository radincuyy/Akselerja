import { useState, useRef, useEffect } from 'react';

export default function ChatView({ isActive }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Halo Budi! Saya AI Career Advisor Akselerja. Berdasarkan analisis CV Anda, Anda sudah memiliki fondasi <strong>Python</strong> dan <strong>SQL</strong> yang kuat dari peran Junior Data Analyst.<br><br>Untuk transisi ke <strong>Data Scientist</strong> di TechNusa Corp, prioritas belajar Anda sebaiknya adalah <strong>Machine Learning</strong> dan pengenalan ke ekosistem cloud seperti <strong>Azure Data Services</strong>.<br><br>Ada yang ingin didiskusikan terkait strategi karir, persiapan interview, atau materi belajar?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const msg = inputValue.trim();
    if (!msg) return;

    setMessages(prev => [...prev, { sender: 'user', text: msg }]);
    setInputValue('');

    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Pertanyaan yang bagus! Untuk posisi Data Scientist di TechNusa Corp, mereka sangat menghargai sertifikasi spesifik. <br><br>Mengingat Anda sudah mumpuni di Python, saya sangat menyarankan Anda menyelesaikan modul <strong>"Buat model machine learning dengan Azure Machine Learning"</strong> yang ada di tab Jalur Belajar. Ini akan meningkatkan skor kecocokan Anda secara signifikan (+12%).<br><br>Apakah Anda mau saya buatkan simulasi pertanyaan interview teknikal untuk materi tersebut?'
      }]);
    }, 1200);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className={`view ${isActive ? 'active' : ''}`}>
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h2 className="mb-2 font-outfit text-2xl sm:text-[28px]">Advisor Karir AI</h2>
                <p className="text-text-muted">Chat simulatif yang mengikuti profil demo dan target karir Anda.</p>
            </div>
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#0C447C]/10 bg-[#E6F1FB] px-3 py-1.5 text-xs font-medium text-[#0C447C]">
                <i className="ph-fill ph-microsoft-logo text-[#0078D4]"></i> Simulasi Azure OpenAI
            </div>
        </div>

        <div className="flex h-[clamp(460px,calc(100dvh-250px),720px)] flex-col overflow-hidden rounded-[20px] border border-border-color bg-bg-card shadow-sm lg:h-[calc(100dvh-200px)]">
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:gap-5 sm:p-6" ref={chatMessagesRef}>
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex max-w-[92%] gap-3 sm:max-w-[85%] sm:gap-4 ${m.sender === 'bot' ? 'self-start animate-fade-in' : 'self-end flex-row-reverse'}`}>
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${m.sender === 'bot' ? 'bg-primary-light text-primary-dark' : 'bg-slate-200 text-slate-500'}`}>
                        <i className={m.sender === 'bot' ? 'ph-fill ph-robot' : 'ph-fill ph-user'}></i>
                      </div>
                      <div className={`py-3.5 px-4 rounded-2xl text-[14.5px] leading-relaxed ${m.sender === 'bot' ? 'bg-slate-50 border border-border-color rounded-tl-sm text-text-dark' : 'bg-primary text-white rounded-tr-sm'}`} dangerouslySetInnerHTML={{ __html: m.text }}></div>
                  </div>
                ))}
            </div>
            
            <div className="flex gap-2 border-t border-border-color bg-bg-card p-3 sm:gap-3 sm:p-5">
                <input 
                  type="text" 
                  className="min-w-0 flex-1 rounded-full border border-border-color px-4 py-3.5 font-inter text-[15px] outline-none transition-colors duration-200 focus:border-primary sm:px-5" 
                  placeholder="Tanya tentang tips interview, perbaikan CV, dll..." 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <button className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-primary text-xl text-white transition-all duration-200 hover:scale-105 hover:bg-primary-hover" onClick={handleSend}><i className="ph-fill ph-paper-plane-right"></i></button>
            </div>
        </div>
    </div>
  );
}
