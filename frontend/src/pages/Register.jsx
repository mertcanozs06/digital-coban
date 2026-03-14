import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

export default function Register() {
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
    username: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    buyukbas_count: 0,
    kucukbas_count: 0,
    contract_accepted: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buyukbasPrice = 1200;
  const kucukbasPrice = 700;
  const totalMonthly = (form.buyukbas_count * buyukbasPrice) + (form.kucukbas_count * kucukbasPrice);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm({ ...form, [name]: checked });
    } else if (name.includes('count')) {
      setForm({ ...form, [name]: Math.max(0, Number(value)) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!form.contract_accepted) {
      setError('Lütfen sözleşmeyi onaylayın.');
      setLoading(false);
      return;
    }

    if (form.buyukbas_count === 0 && form.kucukbas_count === 0) {
      setError('Lütfen en az bir hayvan sayısı girin.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/api/auth/register', { ...form, role: 'farmer', total_monthly: totalMonthly });
      alert('Kayıt Başarılı! Sisteme giriş yapabilirsiniz.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Kayıt sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 py-16 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Left Side: Info & Promo */}
        <div className="lg:col-span-5 bg-slate-900 p-10 md:p-14 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,#10b981_0,transparent_50%)] opacity-20"></div>
            <div className="z-10">
                <div className="flex items-center gap-3 mb-12">
                   <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                       <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <h2 className="text-xl font-black text-white tracking-tighter uppercase">Digital<span className="text-emerald-500 font-light lowercase">Çoban</span></h2>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight mb-6">Sürünüzü <br/><span className="text-emerald-400">Dijitalleştirin.</span></h1>
                <p className="text-slate-400 font-medium mb-10 leading-relaxed">7/24 uydu takibi, sağlık analizleri ve yapay zeka destekli yönetim ile hayvancılıkta verimliliği artırın.</p>
                
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <span className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-xl">🛰️</span>
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Canlı Uydu Takibi</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-xl">🛡️</span>
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Hırsızlık & Kayıp Koruması</p>
                    </div>
                </div>
            </div>
            
            <div className="z-10 mt-12 p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 text-center">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Lansman Özel</p>
                <p className="text-sm font-bold text-white uppercase">İlk 3 Ay Bizden!</p>
            </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-7 p-10 md:p-14 bg-white">
            <div className="mb-10">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Yeni Çiftçi Kaydı</h3>
                <p className="text-slate-400 text-sm font-medium">Lütfen çiftlik bilgilerinizi eksiksiz doldurun.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Adı Soyadı</label>
                        <input name="username" placeholder="Örn: Ahmet Türk" onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-800 transition-all shadow-sm" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">E-Posta</label>
                        <input name="email" type="email" placeholder="mail@adres.com" onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-800 transition-all shadow-sm" required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Giriş Şifresi</label>
                        <input name="password" type="password" placeholder="••••••••" onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-800 transition-all shadow-sm" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">GSM Numarası</label>
                        <input name="phone" placeholder="05XX XXX XX XX" onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-800 transition-all shadow-sm" required />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Adres (İlçe, Şehir)</label>
                    <input name="address" placeholder="Konyaaltı, Antalya" onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-800 transition-all shadow-sm" required />
                </div>

                {/* Animals Count */}
                <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100/50">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4 text-center">Sürü Kapasite Seçimi</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative group">
                            <label className="text-[8px] font-black text-emerald-800/40 uppercase tracking-widest absolute top-2 left-4">Büyükbaş</label>
                            <input name="buyukbas_count" type="number" min="0" value={form.buyukbas_count} onChange={handleChange} className="w-full pt-6 pb-2 px-4 bg-white border border-emerald-100 rounded-2xl text-xl font-black text-emerald-900 outline-none text-center shadow-inner" />
                        </div>
                        <div className="relative group">
                            <label className="text-[8px] font-black text-emerald-800/40 uppercase tracking-widest absolute top-2 left-4">Küçükbaş</label>
                            <input name="kucukbas_count" type="number" min="0" value={form.kucukbas_count} onChange={handleChange} className="w-full pt-6 pb-2 px-4 bg-white border border-emerald-100 rounded-2xl text-xl font-black text-emerald-900 outline-none text-center shadow-inner" />
                        </div>
                    </div>
                    {totalMonthly > 0 && (
                        <div className="mt-4 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Hesaplanan Aylık Sabit Tutar</p>
                            <p className="text-3xl font-black text-emerald-600 tracking-tighter">₺{totalMonthly.toLocaleString('tr-TR')}</p>
                        </div>
                    )}
                </div>

                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-all cursor-pointer">
                    <input id="chk" type="checkbox" name="contract_accepted" checked={form.contract_accepted} onChange={handleChange} className="w-6 h-6 mt-0.5 text-emerald-600 border-slate-300 rounded-lg cursor-pointer" />
                    <label htmlFor="chk" className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed tracking-tight cursor-pointer">
                        <a href="/terms" target="_blank" className="text-emerald-600 underline font-black">Kullanıcı Sözleşmesini</a> ve veri işleme politikalarını okudum, kabul ediyorum.
                    </label>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest animate-pulse border border-red-100">{error}</div>}

                <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all transform hover:-translate-y-1 mt-6">
                    {loading ? 'Kayıt İşleniyor...' : 'Hesabımı Oluştur'}
                </button>

                <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-8">
                    Zaten üye misiniz? <a href="/login" className="text-emerald-600 font-black hover:underline ml-1">Giriş Yap</a>
                </p>
            </form>
        </div>
      </div>
    </div>
  );
}
