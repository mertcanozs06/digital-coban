import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function DealerDashboard() {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Örnek Dummy Datalar (Backend bağlanana kadar görsel amaçlı)
  const [factories, setFactories] = useState([
    { id: 101, name: 'Kayseri Merkez Fabrika 1' },
    { id: 102, name: 'Kayseri Organize Sanayi Fabrika 2' },
    { id: 103, name: 'Kayseri Doğu Fabrikası' }
  ]);

  const [requests, setRequests] = useState([
    { id: 1, count: 50, factory: 'Kayseri Merkez Fabrika 1', status: 'pending', date: '2026-03-05', factory_message: '' },
    { id: 2, count: 100, factory: 'Kayseri Merkez Fabrika 1', status: 'partial', date: '2026-03-01', arrived: 80, factory_message: 'Kalan 20 üretimde.' },
    { id: 3, count: 200, factory: 'Kayseri Organize Sanayi Fabrika 2', status: 'completed', date: '2026-02-15', arrived: 200, factory_message: 'Teslim edildi.' }
  ]);

  const [installations, setInstallations] = useState([
    { id: 1, farmer_name: 'Ahmet Yılmaz', farmer_phone: '0555 123 4567', buyukbas: 100, kucukbas: 20, address: 'Melikgazi, Kayseri', status: 'verified', sub_status: 'active', commission_owed: '240.00' },
    { id: 2, farmer_name: 'Mehmet Demir', farmer_phone: '0532 987 6543', buyukbas: 10, kucukbas: 40, address: 'Kocasinan, Kayseri', status: 'waiting_activation', sub_status: 'trial', commission_owed: '0.00' },
    { id: 3, farmer_name: 'Veli Çelik', farmer_phone: '0544 111 2233', buyukbas: 200, kucukbas: 0, address: 'Talas, Kayseri', status: 'verified', sub_status: 'expired', commission_owed: '0.00' }
  ]);

  const activeInstallations = installations.filter(inst => inst.sub_status === 'active' || inst.sub_status === 'trial');

  const [requestForm, setRequestForm] = useState({ factoryId: '', count: '', message: '' });
  const [activationForm, setActivationForm] = useState({ farmerId: '', code: '' });
  const [showActivationModal, setShowActivationModal] = useState(false);

  // TAILWIND & CSS OVERRIDE ( index.css flex sorununu bu sayfa için çözüyoruz )
  useEffect(() => {
    let tailwindScript = document.getElementById('tailwind-cdn');
    if (!tailwindScript) {
      tailwindScript = document.createElement('script');
      tailwindScript.id = 'tailwind-cdn';
      tailwindScript.src = 'https://unpkg.com/@tailwindcss/browser@4';
      document.head.appendChild(tailwindScript);
    }
    const prevDisplay = document.body.style.display;
    const prevWidth = document.body.style.width;
    document.body.style.setProperty('display', 'block', 'important');
    document.body.style.setProperty('width', '100%', 'important');
    
    const rootEl = document.getElementById('root');
    let prevRootWidth = '', prevRootMax = '';
    if (rootEl) {
      prevRootWidth = rootEl.style.width; prevRootMax = rootEl.style.maxWidth;
      rootEl.style.setProperty('width', '100%', 'important');
      rootEl.style.setProperty('max-width', '100%', 'important');
    }
    return () => {
      document.body.style.display = prevDisplay; document.body.style.width = prevWidth;
      if (rootEl) { rootEl.style.width = prevRootWidth; rootEl.style.maxWidth = prevRootMax; }
    };
  }, []);

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if(!requestForm.count || !requestForm.factoryId) return alert("Lütfen miktar ve fabrika seçin.");
    
    const selectedFactory = factories.find(f => f.id === Number(requestForm.factoryId));
    
    const newReq = {
      id: Date.now(),
      count: Number(requestForm.count),
      factory: selectedFactory ? selectedFactory.name : 'Bilinmeyen Fabrika',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      dealer_message: requestForm.message
    };
    setRequests([newReq, ...requests]);
    setRequestForm({ factoryId: '', count: '', message: '' });
    alert('Fabrikaya tasma üretim/gönderim talebi iletildi.');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans selection:bg-purple-300 pb-12">
      {/* HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-xl md:text-2xl font-black tracking-widest uppercase">Digital<span className="text-purple-400 font-light lowercase">Çoban</span> <span className="opacity-50">/</span> <span className="text-emerald-400">Bayi Paneli</span></h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">Hoş geldin, kurulumları ve stokları buradan yönetebilirsin.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            <span className="px-3 py-2 bg-slate-800 rounded-xl text-[10px] md:text-xs font-mono text-slate-400 border border-slate-700 flex items-center shadow-inner hidden md:flex">UUID: {uuid || 'TANIMSIZ'}</span>
            <button onClick={() => navigate('/dealer/profile')} className="px-5 py-2 md:py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all border border-slate-700 hover:border-slate-500">Profilim</button>
            <button onClick={handleLogout} className="px-5 py-2 md:py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all border border-red-500/20">Sistemden Çık</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-10">
        {/* ÖZET KARTLARI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h3 className="text-slate-400 text-[10px] md:text-xs font-black tracking-widest uppercase">Aylık Tahmini Komisyon</h3>
            <p className="text-2xl md:text-4xl font-black text-purple-600 mt-2">₺3,450</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h3 className="text-slate-400 text-[10px] md:text-xs font-black tracking-widest uppercase">Aktif Çiftlik</h3>
            <p className="text-2xl md:text-4xl font-black text-slate-800 mt-2">14</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h3 className="text-slate-400 text-[10px] md:text-xs font-black tracking-widest uppercase">Kurulan Tasma</h3>
            <p className="text-2xl md:text-4xl font-black text-slate-800 mt-2">1,725</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h3 className="text-slate-400 text-[10px] md:text-xs font-black tracking-widest uppercase">Bekleyen Stok</h3>
            <p className="text-2xl md:text-4xl font-black text-orange-500 mt-2">150</p>
          </div>
        </div>

        {/* SEKME MENÜSÜ */}
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6 flex-wrap md:flex-nowrap">
          <button onClick={() => setActiveTab('inventory')} className={`flex-1 px-4 py-3 md:py-4 rounded-lg font-bold text-xs md:text-sm tracking-wide transition-all ${activeTab === 'inventory' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            🏭 Fabrika & Stok Talepleri
          </button>
          <button onClick={() => setActiveTab('farmers')} className={`flex-1 px-4 py-3 md:py-4 rounded-lg font-bold text-xs md:text-sm tracking-wide transition-all ${activeTab === 'farmers' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            🚜 Sorumlu Olduğum Çiftlikler
          </button>
        </div>

        {/* STOK TALEPLERİ */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
            <div className="xl:col-span-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-purple-100 p-3 rounded-xl text-purple-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-800">Yeni Tasma İste</h2>
                </div>
                <form onSubmit={handleRequestSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bölgendeki Fabrikayı Seç</label>
                    <select 
                      required
                      value={requestForm.factoryId}
                      onChange={e => setRequestForm({...requestForm, factoryId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3.5 focus:ring-2 focus:ring-purple-500 outline-none transition font-medium text-sm appearance-none cursor-pointer"
                    >
                      <option value="" disabled>-- Fabrika Seçin --</option>
                      {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Talep Edilen Miktar</label>
                    <input 
                      type="number" min="1" required
                      value={requestForm.count}
                      onChange={e => setRequestForm({...requestForm, count: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3.5 focus:ring-2 focus:ring-purple-500 outline-none transition font-medium text-sm" 
                      placeholder="Örn: 200" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fabrikaya Not (Opsiyonel)</label>
                    <textarea 
                      value={requestForm.message}
                      onChange={e => setRequestForm({...requestForm, message: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3.5 focus:ring-2 focus:ring-purple-500 outline-none transition font-medium text-sm h-28 resize-none" 
                      placeholder="Acil kurulum var..." 
                    ></textarea>
                  </div>
                  <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black tracking-widest uppercase text-sm py-4 rounded-xl shadow-lg shadow-purple-200 transition-all transform hover:-translate-y-0.5">Talebi Oluştur</button>
                </form>
              </div>
            </div>
            
            <div className="xl:col-span-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
                <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-800">Geçmiş Fabrika Taleplerim</h2>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">Son 30 Gün</span>
                </div>
                <div className="overflow-x-auto flex-1 p-2 md:p-6">
                  {requests.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 font-medium">Henüz bir talebiniz bulunmuyor.</div>
                  ) : (
                    <div className="space-y-3">
                      {requests.map(req => (
                        <div key={req.id} className="border border-slate-100 hover:border-purple-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 transition">
                          <div className="w-full md:w-1/3">
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">{req.date}</span>
                            <h3 className="font-bold text-slate-800 text-sm truncate">{req.factory}</h3>
                            <p className="text-xs font-bold mt-1 text-slate-500">Talep: <span className="text-black text-sm">{req.count} Adet Tasma</span></p>
                          </div>
                          
                          <div className="w-full md:w-1/3">
                            {req.status === 'pending' && <span className="inline-block bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-200 shadow-sm w-fit">Fabrika Bekliyor</span>}
                            {req.status === 'partial' && <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200 shadow-sm w-fit">Kısmi Ulaştı ({req.arrived})</span>}
                            {req.status === 'completed' && <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200 shadow-sm w-fit">Tamamı Teslim Edildi</span>}
                            {req.factory_message && (
                              <p className="text-[10px] text-slate-500 mt-2 bg-white border p-1.5 rounded italic">Not: {req.factory_message}</p>
                            )}
                          </div>

                          <div className="w-full md:w-1/3 text-left md:text-right">
                            {req.status !== 'completed' ? (
                              <button className="text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-lg transition">İtiraz Et / Gelen Onayla</button>
                            ) : (
                              <span className="text-xs font-bold text-slate-300">İşlem Kapalı</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ÇİFTLİKLER SEKME İÇERİĞİ */}
        {activeTab === 'farmers' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-5 md:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <h2 className="text-lg md:text-xl font-bold text-slate-800">Bölgemdeki Aktif Müşterilerim</h2>
                  <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm">{activeInstallations.length} Çiftlik Pasif Gelir Sağlıyor</span>
                </div>
                <div className="space-y-5">
                  {activeInstallations.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed">Aktif veya deneme sürümünde olan bir çiftçi bulunmuyor.<br/>Sisteme yeni çiftçiler dahil ederek komisyon kazanmaya başla!</div>
                  ) : (
                    activeInstallations.map(inst => (
                      <div key={inst.id} className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 hover:shadow-lg transition">
                        <div className="flex-1 w-full">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="font-black text-xl text-slate-800">{inst.farmer_name}</h3>
                            <span className={`px-3 py-1 rounded-lg text-[10px] uppercase font-bold border shadow-sm ${inst.sub_status === 'active' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-amber-400 text-amber-900 border-amber-500'}`}>
                              {inst.sub_status === 'active' ? '✓ Aktif Abone' : '⏳ Deneme Sürümü'}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-500 mb-4 flex flex-wrap gap-4">
                            <span className="flex items-center gap-1"><svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{inst.address}</span>
                            <span className="flex items-center gap-1"><svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>{inst.farmer_phone}</span>
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                            <span className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">🐄 Büyükbaş: <span className="text-black text-sm">{inst.buyukbas}</span></span>
                            <span className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">🐑 Küçükbaş: <span className="text-black text-sm">{inst.kucukbas}</span></span>
                            <span className="bg-purple-100 border border-purple-200 text-purple-800 px-3 py-1.5 rounded-lg flex items-center gap-2">📊 Toplam: <span className="text-black text-sm">{inst.buyukbas + inst.kucukbas}</span> Tasma</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto pt-6 xl:pt-0 border-t xl:border-0 border-slate-100">
                          <div className="w-full sm:w-auto bg-slate-50 rounded-xl p-4 border border-slate-200 text-center sm:text-right flex-shrink-0">
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Aylık Pasif Kazanç</p>
                            <p className="font-black text-emerald-500 text-2xl">₺{inst.commission_owed}</p>
                          </div>
                          <div className="w-full sm:w-48 flex-shrink-0">
                            {inst.status === 'verified' ? (
                              <div className="bg-emerald-50 text-emerald-700 px-4 py-4 rounded-xl text-xs md:text-sm font-bold text-center border border-emerald-200 shadow-sm flex flex-col items-center justify-center h-full gap-1">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Sistem Devrede
                              </div>
                            ) : (
                              <button 
                                onClick={() => { setActivationForm({ ...activationForm, farmerId: inst.id }); setShowActivationModal(true); }}
                                className="w-full bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-4 rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-purple-200 transition-all transform hover:-translate-y-0.5 border border-purple-500 flex flex-col items-center justify-center gap-1"
                              >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                Onay Kodu Gir
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
             </div>
          </div>
        )}

        {/* AKTİVASYON MODALI */}
        {showActivationModal && (
          <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-[100] backdrop-blur-md">
            <div className="bg-white rounded-3xl p-6 md:p-10 max-w-md w-full shadow-2xl relative border-4 border-purple-100">
              <button onClick={() => setShowActivationModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6 mx-auto"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
              <h2 className="text-2xl font-black text-slate-800 mb-2 text-center uppercase tracking-wide">Kurulum Onayı</h2>
              <p className="text-sm text-slate-500 mb-8 text-center bg-slate-50 p-3 rounded-lg border border-slate-100">ESP32 & Raspberry Zero 2W donanımlarını dijital olarak yetkilendirmek için <strong className="text-black">ADMIN</strong> tarafından size iletilen benzersiz <strong className="text-black">9 Haneli aktivasyon</strong> kodunu giriniz.</p>
              
              <div className="space-y-6">
                <div>
                  <input 
                    type="text" 
                    value={activationForm.code}
                    onChange={(e) => setActivationForm({...activationForm, code: e.target.value.toUpperCase()})}
                    className="w-full border-2 border-slate-200 bg-slate-50 rounded-2xl p-4 text-center text-3xl font-mono tracking-[0.2em] focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none uppercase transition-all placeholder:text-slate-300" 
                    placeholder="XXXX-XXXX" 
                    maxLength={9}
                  />
                </div>
                <button 
                  onClick={() => {
                    alert('DOĞRULANIYOR... Kod doğrulandı! Sistem aktif hale getiriliyor. Orijinallik kontrolü backendde yapılıyor...');
                    setShowActivationModal(false);
                  }} 
                  className="w-full block py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-200 transform hover:-translate-y-1"
                >
                  Sistemi Etkinleştir
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
