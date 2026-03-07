import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function Landing() {
  
  // TAILWIND CSS V4 CDN Injector
  useEffect(() => {
    let tailwindScript = document.getElementById('tailwind-cdn');
    if (!tailwindScript) {
      tailwindScript = document.createElement('script');
      tailwindScript.id = 'tailwind-cdn';
      tailwindScript.src = 'https://unpkg.com/@tailwindcss/browser@4';
      document.head.appendChild(tailwindScript);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-purple-300">
      {/* HEADER NAVBAR */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-black tracking-widest uppercase">Digital<span className="text-purple-600 font-light lowercase">Çoban</span></h1>
          <Link to="/login" className="font-bold text-sm uppercase tracking-wide px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all shadow-sm">Giriş Yap</Link>
        </div>
      </header>

      {/* HERO BÖLÜMÜ */}
      <div className="pt-32 pb-20 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-block bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-6 border border-emerald-200 shadow-sm animate-pulse">Sürünüz Artık Gözünüzün Önünde</div>
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-800 leading-tight mb-6">
          Tarım ve Hayvancılığın <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-emerald-500">Dijital Geleceği</span>
        </h2>
        <p className="text-lg md:text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
          Akıllı Tasmalar sayesinde sürünüzü harita üzerinden canlı takip edin, sanal çitler kurun ve sürünüz kontrolünüzden çıktığında anında bildirim alın.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-widest uppercase px-8 py-4 rounded-2xl shadow-xl shadow-emerald-200 transition-all transform hover:-translate-y-1 text-sm md:text-base flex items-center justify-center gap-2 border border-emerald-500">
            <span className="text-xl">🚜</span> Çiftçi Üyeliği Oluştur
          </Link>
          <Link to="/partner-application" className="bg-white hover:bg-purple-50 text-purple-700 font-black tracking-widest uppercase px-8 py-4 rounded-2xl shadow-lg border-2 border-purple-200 hover:border-purple-400 transition-all transform hover:-translate-y-1 text-sm md:text-base flex items-center justify-center gap-2">
            <span className="text-xl">🤝</span> Bayi veya Fabrika Ol
          </Link>
        </div>
      </div>

      {/* NASIL ÇALIŞIR? */}
      <div className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-4">Sistem Nasıl Çalışır?</h3>
            <p className="text-slate-500 font-medium max-w-xl mx-auto">Hayvanlarınızı kolayca sisteme dahil edip sadece dakikalar içinde korumaya başlayabilirsiniz.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#f8fafc] p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 text-2xl font-black">1</div>
              <h4 className="text-xl font-black text-slate-800 mb-3">Tasmaları Takın</h4>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">Donanım destekli, uzun ömürlü ve QR kod ile saniyeler içinde hayvanınıza entegre edilebilen akıllı tasmaları bağlayın.</p>
            </div>
            <div className="bg-[#f8fafc] p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 text-2xl font-black">2</div>
              <h4 className="text-xl font-black text-slate-800 mb-3">Sanal Çit Çizin</h4>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">Mobil veya web paneli üzerinden hayvanların otlayabileceği ve çıkmaması gereken alanları polygon halinde işaretleyin.</p>
            </div>
            <div className="bg-[#f8fafc] p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 text-2xl font-black">3</div>
              <h4 className="text-xl font-black text-slate-800 mb-3">Bildirimleri Alın</h4>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">İşaretlediğiniz alanın dışına çıkan, hareketsiz kalan veya sağlık durumu riskli seviyeye gelen hayvanı mesajla öğrenin.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FİYATLANDIRMA */}
      <div className="py-20 px-6 max-w-5xl mx-auto relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-purple-600/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>
        <div className="text-center mb-16 relative z-10">
           <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-4">Abonelik / Fiyatlandırma</h3>
           <p className="text-slate-500 font-medium">Hayvan başına aylık cüzi rakamlarla sürünüzü güvence altına alın.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 relative z-10">
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 bg-purple-900 rounded-bl-full text-white text-6xl group-hover:opacity-10 transition duration-500">🐄</div>
            <h4 className="text-xl font-bold uppercase tracking-widest text-slate-400 mb-2">Büyükbaş</h4>
            <div className="text-5xl font-black text-slate-800 mb-6">1.200 ₺ <span className="text-lg font-bold text-slate-400">/ ay</span></div>
            <ul className="space-y-4 mb-8 text-sm font-medium text-slate-600">
               <li className="flex items-center gap-3"><span className="text-emerald-500">✔</span> Canlı Konum Takibi</li>
               <li className="flex items-center gap-3"><span className="text-emerald-500">✔</span> Sınır İhlali Uyarıları</li>
               <li className="flex items-center gap-3"><span className="text-emerald-500">✔</span> Gelişmiş Harita Görüntüsü</li>
            </ul>
            <Link to="/register" className="block text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-widest p-4 rounded-xl transition">Hemen Üye Ol</Link>
          </div>

          <div className="bg-slate-900 p-8 md:p-10 rounded-3xl shadow-2xl shadow-purple-900/30 border border-slate-800 relative overflow-hidden group">
            <div className="absolute -top-6 right-6 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-b-xl text-[10px] font-black tracking-widest uppercase shadow-md shadow-purple-500/50">En Çok Tercih Edilen</div>
            <div className="absolute top-0 right-0 p-4 opacity-10 bg-white rounded-bl-full text-white text-6xl group-hover:opacity-20 transition duration-500">🐑</div>
            <h4 className="text-xl font-bold uppercase tracking-widest text-slate-400 mb-2">Küçükbaş</h4>
            <div className="text-5xl font-black text-white mb-6">700 ₺ <span className="text-lg font-bold text-slate-400">/ ay</span></div>
            <ul className="space-y-4 mb-8 text-sm font-medium text-slate-300">
               <li className="flex items-center gap-3"><span className="text-emerald-400">✔</span> Grup / Sürü Halinde Konum Takibi</li>
               <li className="flex items-center gap-3"><span className="text-emerald-400">✔</span> Sınır İhlali Uyarıları</li>
               <li className="flex items-center gap-3"><span className="text-emerald-400">✔</span> Çoban Sesli Uyarı İletimi</li>
            </ul>
            <Link to="/register" className="block text-center bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-widest p-4 rounded-xl transition shadow-lg shadow-purple-500/30">Hemen Üye Ol</Link>
          </div>
        </div>

        <div className="mt-12 text-center relative z-10 bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl mx-auto max-w-2xl font-bold">
           🎁 Sistemi dilediğinizce test edebilmeniz için ilk üyeliklerde <strong>90 Gün Tamamen Ücretsiz!</strong> (Deneme süresi boyunca kredi kartı istenmez.)
        </div>
      </div>
      
    </div>
  );
}
