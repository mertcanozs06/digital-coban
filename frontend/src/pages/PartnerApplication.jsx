import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

export default function PartnerApplication() {
  const navigate = useNavigate();

  // TAILWIND CSS V4
  useEffect(() => {
    let tailwindScript = document.getElementById('tailwind-cdn');
    if (!tailwindScript) {
      tailwindScript = document.createElement('script');
      tailwindScript.id = 'tailwind-cdn';
      tailwindScript.src = 'https://unpkg.com/@tailwindcss/browser@4';
      document.head.appendChild(tailwindScript);
    }
  }, []);

  const [form, setForm] = useState({
    role: 'dealer',
    company_name: '',
    tax_number: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    iban_no: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/auth/apply', form);
      alert('Başvurunuz başarıyla alındı! İnceleme sonrası tarafınıza dönüş yapılacaktır.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Başvuru sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 py-16 font-sans selection:bg-purple-500 selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-purple-600/20 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-blue-600/20 blur-[100px] rounded-full"></div>
      </div>

      <div className="w-full max-w-full relative z-10 animate-in fade-in zoom-in-95 duration-700 md:px-8">
        <div className="bg-white/5 backdrop-blur-2xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/10 grid grid-cols-1 lg:grid-cols-12">
            
            {/* Left Column: Visual/Marketing */}
            <div className="lg:col-span-5 p-12 bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex flex-col justify-between">
                <div>
                   <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-xl mb-12">🏢</div>
                   <h1 className="text-4xl font-black tracking-tighter leading-tight mb-6">Geleceğin Hayvancılığını <br/><span className="text-white/70">Birlikte İnşa Edelim.</span></h1>
                   <p className="text-white/60 font-medium leading-relaxed mb-10 italic">Digital Çoban ekosistemine katılarak bölgenizdeki modern hayvancılığa öncülük edin ve kazanç ağınızı genişletin.</p>
                   
                   <div className="space-y-6">
                        <div className="bg-white/10 p-5 rounded-3xl border border-white/10 backdrop-blur">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Kurumsal İş Ortaklığı</h4>
                            <p className="text-sm font-bold">Bayilik veya Üretim Çözümleri</p>
                        </div>
                        <div className="bg-white/10 p-5 rounded-3xl border border-white/10 backdrop-blur">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Hızlı Onay Süreci</h4>
                            <p className="text-sm font-bold">48 Saat İçinde Değerlendirme</p>
                        </div>
                   </div>
                </div>
                
                <div className="mt-12">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Partnerlik Ağı</p>
                    <div className="flex gap-2">
                        {[1,2,3,4,5].map(i => <div key={i} className="w-2 h-2 bg-white/20 rounded-full"></div>)}
                    </div>
                </div>
            </div>

            {/* Right Column: Application Form */}
            <div className="lg:col-span-7 p-10 md:p-14 bg-white">
                <div className="mb-10 text-center lg:text-left">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2 leading-none">KURUMSAL BAŞVURU</h2>
                    <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">Partnerlik ve İş Birliği Formu</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Selection */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <button 
                            type="button" 
                            onClick={() => setForm({...form, role:'dealer'})}
                            className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex flex-col items-center justify-center gap-2 ${form.role === 'dealer' ? 'bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-200' : 'bg-slate-50 border-slate-50 text-slate-400'}`}
                        >
                            <span className="text-2xl">🤝</span> BAYİ BAŞVURUSU
                        </button>
                        <button 
                            type="button"
                            onClick={() => setForm({...form, role:'factory'})}
                            className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex flex-col items-center justify-center gap-2 ${form.role === 'factory' ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-slate-50 border-slate-50 text-slate-400'}`}
                        >
                            <span className="text-2xl">🏭</span> FABRİKA BAŞVURUSU
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Şirket Ünvanı</label>
                            <input name="company_name" placeholder="Örn: Fabrika A.Ş" onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:bg-white outline-none font-bold text-slate-800 transition-all" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Vergi Levha / MERSİS</label>
                            <input name="tax_number" placeholder="000000000" onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:bg-white outline-none font-bold text-slate-800 transition-all" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Yetkili Ad Soyad</label>
                            <input name="contact_name" placeholder="Örn: Mehmet Yıldız" onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:bg-white outline-none font-bold text-slate-800 transition-all" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">İletişim Kanalı (Tel)</label>
                            <input name="phone" placeholder="05XX XXX XX XX" onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:bg-white outline-none font-bold text-slate-800 transition-all" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Kurumsal E-Posta</label>
                            <input name="email" type="email" placeholder="info@holding.com" onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:bg-white outline-none font-bold text-slate-800 transition-all" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">IBAN No (TR...)</label>
                            <input name="iban_no" placeholder="TR00 0000 0000 0000 0000 0000 00" onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:bg-white outline-none font-mono font-bold text-slate-800 transition-all" maxLength={34} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Operasyon Adresi</label>
                        <input name="address" placeholder="Bölge veya Açık Adres" onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:bg-white outline-none font-bold text-slate-800 transition-all" required />
                    </div>

                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black text-center border border-red-100 uppercase tracking-widest animate-pulse">{error}</div>}

                    <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all transform hover:-translate-y-1 mt-6">
                        {loading ? 'Başvuru İletiliyor...' : 'Sisteme Başvuruyu Gönder'}
                    </button>

                    <div className="pt-8 text-center">
                        <a href="/login" className="text-[10px] font-black text-slate-400 hover:text-purple-600 transition-all uppercase tracking-widest">Giriş Paneline Geri Dön</a>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
}
