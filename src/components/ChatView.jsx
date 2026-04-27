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
        <div className="flex justify-between items-end mb-8">
            <div>
                <h2 className="text-[28px] mb-2 font-outfit">Advisor Karir AI</h2>
                <p className="text-text-muted">Chat simulatif yang mengikuti profil demo dan target karir Anda.</p>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-[#E6F1FB] text-[#0C447C] text-xs px-3 py-1.5 rounded-full font-medium border border-[#0C447C]/10 m-0">
                <i className="ph-fill ph-microsoft-logo text-[#0078D4]"></i> Simulasi Azure OpenAI
            </div>
        </div>

        <div className="flex flex-col h-[calc(100vh-200px)] bg-bg-card rounded-[20px] border border-border-color overflow-hidden shadow-sm">
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5" ref={chatMessagesRef}>
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex gap-4 max-w-[85%] ${m.sender === 'bot' ? 'self-start animate-fade-in' : 'self-end flex-row-reverse'}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-lg ${m.sender === 'bot' ? 'bg-primary-light text-primary-dark' : 'bg-slate-200 text-slate-500'}`}>
                        <i className={m.sender === 'bot' ? 'ph-fill ph-robot' : 'ph-fill ph-user'}></i>
                      </div>
                      <div className={`py-3.5 px-4 rounded-2xl text-[14.5px] leading-relaxed ${m.sender === 'bot' ? 'bg-slate-50 border border-border-color rounded-tl-sm text-text-dark' : 'bg-primary text-white rounded-tr-sm'}`} dangerouslySetInnerHTML={{ __html: m.text }}></div>
                  </div>
                ))}
            </div>
            
            <div className="p-5 border-t border-border-color bg-bg-card flex gap-3">
                <input 
                  type="text" 
                  className="flex-1 px-5 py-3.5 rounded-full border border-border-color font-inter text-[15px] outline-none transition-colors duration-200 focus:border-primary" 
                  placeholder="Tanya tentang tips interview, perbaikan CV, dll..." 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <button className="w-12 h-12 rounded-full bg-primary text-white border-none cursor-pointer flex items-center justify-center text-xl transition-all duration-200 hover:bg-primary-hover hover:scale-105" onClick={handleSend}><i className="ph-fill ph-paper-plane-right"></i></button>
            </div>
        </div>
    </div>
  );
}
