import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api.js';

export default function DealerDashboard() {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const [activeTab, setActiveTab] = useState('inventory');
  
  const [factories, setFactories] = useState([]);
  const [requests, setRequests] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [allFarmers, setAllFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [requestForm, setRequestForm] = useState({ factoryId: '', count: '', message: '' });
  const [activationForm, setActivationForm] = useState({ farmerId: '', code: '' });
  const [showActivationModal, setShowActivationModal] = useState(false);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmForm, setConfirmForm] = useState({ message: '', receivedCount: '' });

  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installForm, setInstallForm] = useState({ farmerId: '', hwMacAddress: '', type: 'installation', description: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const factoriesData = await api.get('/api/dealer/factories', token);
      setFactories(factoriesData);

      const requestsData = await api.get('/api/dealer/stock-requests', token);
      setRequests(requestsData);

      const instData = await api.get('/api/dealer/installations', token);
      setInstallations(instData);

      const famData = await api.get('/api/dealer/farmers', token);
      setAllFarmers(famData);

    } catch (error) {
      console.error('Data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if(!requestForm.count || !requestForm.factoryId) return alert("Lütfen miktar ve fabrika seçin.");
    
    try {
        const token = localStorage.getItem('token');
        await api.post('/api/dealer/stock-request', requestForm, token);
        alert('Fabrikaya tasma üretim/gönderim talebi iletildi.');
        setRequestForm({ factoryId: '', count: '', message: '' });
        fetchData();
    } catch (err) {
        alert('Talep hatası: ' + err.message);
    }
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    try {
        const token = localStorage.getItem('token');
        const res = await api.post('/api/dealer/confirm-stock', {
            requestId: selectedRequest.id,
            ...confirmForm
        }, token);
        alert(res.message || 'Stok durumu güncellendi.');
        setShowConfirmModal(false);
        fetchData();
    } catch (err) {
        alert('Hata: ' + err.message);
    }
  };

  const handleActivationSubmit = async () => {
    try {
        const token = localStorage.getItem('token');
        await api.post('/api/dealer/activate', {
            installationId: activationForm.farmerId,
            code: activationForm.code
        }, token);
        alert('Sistem başarıyla aktif edildi!');
        setShowActivationModal(false);
        fetchData();
    } catch (err) {
        alert('Doğrulama hatası: ' + err.message);
    }
  };

  const handleInstallSubmit = async (e) => {
    e.preventDefault();
    try {
        const token = localStorage.getItem('token');
        await api.post('/api/dealer/create-installation', installForm, token);
        alert('Kurulum/Bakım isteği oluşturuldu. Admin kodu üretildikten sonra panelinize yansıyacaktır.');
        setShowInstallModal(false);
        setInstallForm({ farmerId: '', hwMacAddress: '', type: 'installation', description: '' });
        fetchData();
    } catch (err) {
        alert('Hata: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-black text-slate-400 animate-pulse text-2xl uppercase tracking-widest">Veriler Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans selection:bg-emerald-200 pb-20">
      {/* Dynamic Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none">Digital<span className="text-emerald-400 font-light lowercase">Çoban</span></h1>
                <p className="text-[10px] md:text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest opacity-70">Bayi Operasyon Paneli</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden lg:flex flex-col items-end">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Yürütücü Kimliği</p>
                <p className="text-[10px] font-mono text-emerald-400 uppercase">{uuid.slice(0, 8)}...</p>
            </span>
            <button onClick={handleLogout} className="px-6 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-xl text-xs font-black shadow-xl shadow-red-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">Çıkış Yap</button>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 md:px-8 mt-8 md:mt-12">
        {/* Navigation Tabs */}
        <div className="flex bg-white/50 backdrop-blur p-1.5 rounded-3xl mb-10 shadow-sm border border-white">
          <button 
            onClick={() => setActiveTab('inventory')} 
            className={`flex-1 px-6 py-4 rounded-2xl font-black text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'inventory' ? 'bg-white text-emerald-600 shadow-xl scale-[1.01]' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <span className="text-lg">🏭</span> FABRİKA & STOK
          </button>
          <button 
            onClick={() => setActiveTab('farmers')} 
            className={`flex-1 px-6 py-4 rounded-2xl font-black text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'farmers' ? 'bg-white text-blue-600 shadow-xl scale-[1.01]' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <span className="text-lg">🚜</span> KURULUMLARIM
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Request Form Sidebar */}
            <div className="xl:col-span-4">
              <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white p-8 md:p-10 sticky top-28">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">📦</div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tasma İste</h2>
                </div>
                <form onSubmit={handleRequestSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Fabrika Seçimi</label>
                    <select 
                      required value={requestForm.factoryId}
                      onChange={e => setRequestForm({...requestForm, factoryId: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-emerald-500 rounded-2xl p-4 outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">-- FABRİKA SEÇİN --</option>
                      {factories.map(f => <option key={f.id} value={f.id}>{f.company_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Ürün Miktarı (Tasma)</label>
                    <div className="relative">
                        <input 
                            type="number" min="1" required value={requestForm.count}
                            onChange={e => setRequestForm({...requestForm, count: e.target.value})}
                            className="w-full bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-emerald-500 rounded-2xl p-4 outline-none font-black text-slate-700 transition-all" 
                            placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300">ADET</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Talep Notu (Opsiyonel)</label>
                    <textarea 
                      value={requestForm.message}
                      onChange={e => setRequestForm({...requestForm, message: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-emerald-500 rounded-2xl p-4 outline-none font-medium text-slate-600 transition-all h-28 resize-none" 
                      placeholder="Aciliyet veya detay belirtin..."
                    ></textarea>
                  </div>
                  <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-2xl shadow-emerald-200 transition-all active:scale-95 uppercase tracking-[0.2em] text-xs">Talebi Gönder</button>
                </form>
              </div>
            </div>
            
            {/* Stock Requests List */}
            <div className="xl:col-span-8">
              <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white p-6 md:p-10">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Mevcut Taleplerim</h2>
                    <span className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">{requests.length} TALEP</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {requests.map(req => (
                        <div key={req.id} className="group border border-slate-100 hover:border-emerald-200 rounded-[2rem] p-6 bg-slate-50/50 hover:bg-white transition-all hover:shadow-2xl">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Kaynak Fabrika</p>
                                    <h3 className="font-black text-lg text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors uppercase">{req.factory_name}</h3>
                                </div>
                                <span className={`text-[9px] px-3 py-1.5 rounded-xl font-black text-white uppercase tracking-tighter ${req.status === 'pending' ? 'bg-amber-400 shadow-amber-100' : req.status === 'shipped' ? 'bg-blue-400 shadow-blue-100' : req.status === 'cancelled' ? 'bg-red-400 shadow-red-100' : 'bg-emerald-500 shadow-emerald-100'}`}>{req.status}</span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
                                    <p className="text-[7px] font-black text-slate-400 uppercase mb-1">Talep</p>
                                    <p className="font-black text-slate-800">{req.requested_count}</p>
                                </div>
                                <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
                                    <p className="text-[7px] font-black text-emerald-400 uppercase mb-1">Onaylanan</p>
                                    <p className="font-black text-emerald-600">{req.arrived_count || 0}</p>
                                </div>
                                <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
                                    <p className="text-[7px] font-black text-blue-400 uppercase mb-1">Yoldaki</p>
                                    <p className="font-black text-blue-600">{req.shipped_count || 0}</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                {req.dealer_message && (
                                    <div className="flex-1 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Sizin Notunuz:</p>
                                        <p className="text-[10px] text-slate-600 font-medium italic">"{req.dealer_message}"</p>
                                    </div>
                                )}
                                {req.factory_message && (
                                    <div className="flex-1 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Fabrika Notu:</p>
                                        <p className="text-[10px] text-slate-600 font-medium italic">"{req.factory_message}"</p>
                                    </div>
                                )}
                            </div>

                            {req.shipped_count > 0 && (
                                <button 
                                    onClick={() => { setSelectedRequest(req); setConfirmForm({ message: '', receivedCount: req.shipped_count }); setShowConfirmModal(true); }}
                                    className="w-full bg-emerald-600 text-white py-4 rounded-xl text-xs font-black hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-100 uppercase tracking-widest"
                                >
                                    Gelenleri Onayla ({req.shipped_count} Adet)
                                </button>
                            )}
                        </div>
                    ))}
                    {requests.length === 0 && (
                        <div className="col-span-full py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 gap-4">
                            <span className="text-5xl">📄</span>
                            <p className="font-black uppercase tracking-widest text-xs">Aktif talep bulunmuyor</p>
                        </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'farmers' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Kurulum Havuzu</h2>
                    <p className="text-slate-400 text-sm font-medium mt-1">Sorumlu olduğunuz tüm çiftlik kurulum ve bakım kayıtları.</p>
                </div>
                <button 
                    onClick={() => setShowInstallModal(true)}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                >
                    <span className="text-xl">+</span> YENİ İŞLEM BAŞLAT
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {installations.map(inst => (
                    <div key={inst.id} className="group bg-slate-50/50 border border-slate-100 hover:border-blue-100 hover:bg-white rounded-[2.5rem] p-8 transition-all hover:shadow-2xl">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight group-hover:text-blue-600 transition-colors">{inst.farmer_name}</h3>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className={`text-[8px] px-3 py-1 rounded-full font-black text-white shadow-sm tracking-widest ${inst.type === 'maintenance' ? 'bg-amber-500' : 'bg-blue-600'}`}>
                                        {inst.type === 'maintenance' ? 'BAKIM TALEBİ' : 'YENİ KURULUM'}
                                    </span>
                                    {inst.description && <span className="text-[10px] text-slate-400 font-bold italic truncate max-w-[150px]">"{inst.description}"</span>}
                                </div>
                            </div>
                            <div className={`w-3 h-3 rounded-full shadow-lg ${inst.status === 'verified' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-orange-500 shadow-orange-200 animate-pulse'}`}></div>
                        </div>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                <span className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400">📍</span>
                                {inst.address || 'Bölge Bilgisi Yok'}
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                <span className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400">📞</span>
                                {inst.farmer_phone}
                            </div>
                            <div className="flex gap-2 pt-2">
                                <span className="bg-white border border-slate-100 text-[10px] font-black px-4 py-2 rounded-xl text-slate-600 shadow-sm flex items-center gap-2">🐄 {inst.buyukbas_count} <span className="opacity-30">|</span> 🐑 {inst.kucukbas_count}</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            {inst.status === 'verified' ? (
                                <div className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> SİSTEM AKTİF
                                </div>
                            ) : inst.activation_code ? (
                                <button 
                                    onClick={() => { setActivationForm({ ...activationForm, farmerId: inst.id }); setShowActivationModal(true); }}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black text-xs shadow-xl shadow-indigo-100 uppercase tracking-widest transition-all"
                                >
                                    ONAY KODUNU GİR
                                </button>
                            ) : (
                                <div className="flex items-center justify-center gap-2 bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200">
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> ADMİN ONAYI BEKLENİYOR
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {installations.length === 0 && (
                    <div className="col-span-full py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 gap-4">
                        <span className="text-6xl">🚜</span>
                        <p className="font-black uppercase tracking-widest text-xs">Atanmış kurulum bulunmuyor</p>
                    </div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* REUSABLE MODAL CONTAINER */}
      {(showInstallModal || showConfirmModal || showActivationModal) && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 max-w-lg w-full shadow-2xl relative border border-white/20 transform animate-in zoom-in-95 duration-300">
            
            <button 
                onClick={() => { setShowInstallModal(false); setShowConfirmModal(false); setShowActivationModal(false); }} 
                className="absolute top-6 right-6 w-10 h-10 bg-slate-100 text-slate-500 hover:text-red-500 rounded-full flex items-center justify-center transition-all z-10"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {/* MODAL 1: INSTALL/MAINTENANCE */}
            {showInstallModal && (
                <>
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">YENİ İŞLEM</h2>
                        <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">Çiftlik Operasyonu Başlat</p>
                    </div>
                    <form onSubmit={handleInstallSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                type="button"
                                onClick={() => setInstallForm({...installForm, type: 'installation'})}
                                className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${installForm.type === 'installation' ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-slate-50 border-slate-50 text-slate-400'}`}
                            >
                                Yeni Kurulum
                            </button>
                            <button 
                                type="button"
                                onClick={() => setInstallForm({...installForm, type: 'maintenance'})}
                                className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${installForm.type === 'maintenance' ? 'bg-amber-500 border-amber-500 text-white shadow-xl shadow-amber-200' : 'bg-slate-50 border-slate-50 text-slate-400'}`}
                            >
                                Bakım / Arıza
                            </button>
                        </div>
                        <div>
                            <select 
                                required value={installForm.farmerId}
                                onChange={e => setInstallForm({...installForm, farmerId: e.target.value})}
                                className="w-full bg-slate-100 border-2 border-slate-100 focus:bg-white focus:border-blue-600 rounded-2xl p-4 outline-none font-black text-slate-700 transition-all appearance-none cursor-pointer" 
                            >
                                <option value="">-- ÇİFTÇİ SEÇİN --</option>
                                {allFarmers.map(f => <option key={f.id} value={f.id}>{f.username} ({f.phone})</option>)}
                            </select>
                        </div>
                        <input 
                            type="text" placeholder="GÖNDERİLECEK MAC ADRESİ"
                            value={installForm.hwMacAddress}
                            onChange={e => setInstallForm({...installForm, hwMacAddress: e.target.value})}
                            className="w-full bg-slate-100 border-2 border-slate-100 focus:bg-white focus:border-blue-600 rounded-2xl p-4 outline-none font-mono text-center font-bold text-slate-800"
                        />
                        <textarea 
                            value={installForm.description}
                            onChange={e => setInstallForm({...installForm, description: e.target.value})}
                            className="w-full bg-slate-100 border-2 border-slate-100 focus:bg-white focus:border-blue-600 rounded-2xl p-4 outline-none font-medium text-slate-600 h-24 resize-none"
                            placeholder="İşlem detaylarını buraya ekleyin..."
                        ></textarea>
                        <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-2xl active:scale-95 transition-all uppercase tracking-[0.2em] text-xs">Talebi Oluştur</button>
                    </form>
                </>
            )}

            {/* MODAL 2: CONFIRM STOCK */}
            {showConfirmModal && (
                <>
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">STOK ONAYI</h2>
                        <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">Gelen Teslimatı Doğrulayın</p>
                    </div>
                    <form onSubmit={handleConfirmSubmit} className="space-y-6">
                        <div className="p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] text-center shadow-inner">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Fabrikanın Gönderdiği</p>
                            <p className="text-5xl font-black text-emerald-600 tracking-tighter">{selectedRequest?.shipped_count}</p>
                            <p className="text-xs font-bold text-emerald-800/60 mt-4 uppercase">Adet Yolda Görünüyor</p>
                        </div>
                        
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Fiilen Teslim Alınan Miktar</label>
                            <div className="relative">
                                <input 
                                    type="number" required max={selectedRequest?.shipped_count} 
                                    value={confirmForm.receivedCount}
                                    onChange={e => setConfirmForm({...confirmForm, receivedCount: e.target.value})}
                                    className="w-full bg-slate-100 border-2 border-slate-100 focus:bg-white focus:border-emerald-600 rounded-2xl p-5 text-center text-3xl font-black text-slate-800 outline-none transition-all"
                                    placeholder="0"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300">ADET</span>
                            </div>
                            <p className="mt-2 text-[10px] text-slate-400 font-bold text-center italic">Eksik ürün geldiyse lütfen fiili miktarı giriniz.</p>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Teslimat Notu</label>
                            <textarea 
                                value={confirmForm.message}
                                onChange={e => setConfirmForm({...confirmForm, message: e.target.value})}
                                className="w-full bg-slate-100 border-2 border-slate-100 focus:bg-white focus:border-emerald-600 rounded-2xl p-4 outline-none font-medium text-slate-600 h-28 resize-none"
                                placeholder="Eksik ürünle ilgili notunuz veya kurye notu..."
                            ></textarea>
                        </div>
                        <button type="submit" className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-2xl shadow-emerald-200 active:scale-95 transition-all uppercase tracking-[0.2em] text-xs">STOĞA EKLE</button>
                    </form>
                </>
            )}

            {/* MODAL 3: ACTIVATION */}
            {showActivationModal && (
                <>
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">DOĞRULAMA</h2>
                        <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">ADMIN KODUNU GİRİNİZ</p>
                    </div>
                    <div className="space-y-8">
                        <div className="relative">
                            <input 
                                type="text" value={activationForm.code}
                                onChange={(e) => setActivationForm({...activationForm, code: e.target.value.toUpperCase()})}
                                className="w-full bg-slate-100 border-2 border-slate-100 focus:bg-white focus:border-indigo-600 rounded-[2rem] py-8 text-center text-4xl font-mono font-black text-slate-900 focus:shadow-2xl focus:shadow-indigo-100 outline-none transition-all uppercase tracking-[0.2em]" 
                                placeholder="XXXX-XXXX" maxLength={9}
                            />
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[8px] font-black tracking-widest uppercase shadow-lg shadow-indigo-200">9 HANELİ KOD</div>
                        </div>
                        <button onClick={handleActivationSubmit} className="w-full bg-indigo-600 hover:bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-200 transition-all hover:-translate-y-1 active:scale-95">SİSTEMİ KİLİTLEYEREK AKTİF ET</button>
                    </div>
                </>
            )}
          </div>
        </div>
      )}
      {/* Global CSS Injector */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
