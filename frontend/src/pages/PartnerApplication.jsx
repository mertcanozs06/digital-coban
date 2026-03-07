import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

export default function PartnerApplication() {
  const [role, setRole] = useState('dealer'); // dealer veya factory
  
  const [form, setForm] = useState({
    company_name: '',
    tax_number: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // TAILWIND CSS V4 CDN Injector
  useEffect(() => {
    let tailwindScript = document.getElementById('tailwind-cdn');
    if (!tailwindScript) {
      tailwindScript = document.createElement('script');
      tailwindScript.id = 'tailwind-cdn';
      tailwindScript.src = 'https://unpkg.com/@tailwindcss/browser@4';
      document.head.appendChild(tailwindScript);
    }
    document.body.style.setProperty('display', 'block', 'important');
    document.body.style.setProperty('width', '100%', 'important');
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // API çağrısı: backend'e başvuru bilgilerini iletiyoruz
      await api.post('/api/auth/apply', { role, ...form });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Başvuru sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] p-4 text-center font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full border-t-8 border-purple-500">
          <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Başvurunuz Alındı!</h2>
          <p className="text-slate-500 mb-8 font-medium">
            Kurumsal ({role === 'dealer' ? 'Bayilik' : 'Fabrika'}) başvurunuz başarıyla sistemimize iletildi. 
            Yönetim ekibimiz başvurunuzu değerlendirip sizinle girdiğiniz iletişim bilgileri üzerinden irtibata geçecektir.
            <br/><br/>
            Onay süreci tamamlandığında ve sözleşmeler imzalandığında, <strong>giriş şifreniz E-Posta adresinize gönderilecektir.</strong>
          </p>
          <a href="/" className="inline-block bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700 transition">Ana Sayfaya Dön</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3f4f6] font-sans p-4 py-12">
      <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Üst Kısım */}
        <div className="bg-slate-900 text-white p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500"></div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">Digital<span className="text-purple-400 font-light lowercase">Çoban</span> <span className="opacity-50">/</span> İş Ortağı</h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto font-medium">
            Tarım ve hayvancılığın geleceğini birlikte inşa edelim. Sistemimizde yerinizi almak için kurum başvurunuzu yapın. 
            Bilgileriniz incelendikten sonra tarafınıza dönüş sağlanacaktır.
          </p>
        </div>

        {/* Form Alanı */}
        <div className="p-8 md:p-12">
          
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-10 max-w-md mx-auto relative z-10">
            <button 
              type="button" 
              onClick={() => setRole('dealer')}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest rounded-xl transition-all ${role === 'dealer' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Bayilik Başvurusu
            </button>
            <button 
              type="button" 
              onClick={() => setRole('factory')}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest rounded-xl transition-all ${role === 'factory' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Fabrika Başvurusu
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Şirket / Kurum Adı</label>
                <input name="company_name" onChange={handleChange} placeholder="Örn: ABC Tarım Teknolojileri A.Ş." className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-purple-500 outline-none font-medium transition" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vergi Numarası</label>
                <input name="tax_number" onChange={handleChange} placeholder="Vergi No / TC Kimlik" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-purple-500 outline-none font-medium transition" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">İletişim Kurulacak Kişi (Yetkili)</label>
                <input name="contact_name" onChange={handleChange} placeholder="Örn: Ahmet Yılmaz" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-purple-500 outline-none font-medium transition" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Telefon Numarası</label>
                <input name="phone" onChange={handleChange} placeholder="Örn: 0555 123 4567" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-purple-500 outline-none font-medium transition" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kurumsal E-Posta Adresi (Zorunlu)</label>
                <input name="email" type="email" onChange={handleChange} placeholder="sirket@ornek.com" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-purple-500 outline-none font-medium transition" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Açık Adres</label>
                <input name="address" onChange={handleChange} placeholder="Firma açık adresi (İlçe, İl)" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-purple-500 outline-none font-medium transition" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Eklemek İstediğiniz Mesaj/Not (Opsiyonel)</label>
              <textarea name="message" onChange={handleChange} placeholder="Başvurunuzla ilgili iletmek istedikleriniz..." className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-purple-500 outline-none font-medium transition h-24 resize-none"></textarea>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-bold text-sm text-center">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-black uppercase tracking-widest py-4 md:py-5 rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 ${role === 'dealer' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-200' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-200'}`}
            >
              {loading ? 'Gönderiliyor...' : (role === 'dealer' ? 'Bayilik Başvurusunu Tamamla' : 'Fabrika Başvurusunu Tamamla')}
            </button>

            <p className="text-center text-sm font-medium text-slate-500 mt-6 pb-2">
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs tracking-wider mr-2 uppercase font-bold">Önemli Not</span>
              Başvuru sonrası uygun görülürse sözleşme aşamasına geçilecektir.
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}
