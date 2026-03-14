import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

export default function FactoryDashboard() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form, setForm] = useState({ status: 'shipped', sentCount: 0, message: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const data = await api.get('/api/factory/stock-requests', token);
      setRequests(data);
    } catch (err) {
      console.error(err);
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

  const openUpdate = (req) => {
    setSelectedRequest(req);
    setForm({ 
        status: 'shipped', 
        sentCount: req.requested_count - (req.arrived_count + req.shipped_count), 
        message: '' 
    });
    setShowModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/factory/update-stock-request', {
        requestId: selectedRequest.id,
        ...form
      }, token);
      alert('İşlem başarıyla tamamlandı.');
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-black text-slate-400 animate-pulse text-2xl uppercase tracking-widest">Sistem Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-blue-200 pb-20">
      {/* Dynamic Factory Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none">Digital<span className="text-blue-500 font-light lowercase">Çoban</span></h1>
                <p className="text-[10px] md:text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest opacity-70">Merkezi Üretim & Lojistik Paneli</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden lg:flex flex-col items-end mr-4">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Terminal ID</p>
                <p className="text-[10px] font-mono text-blue-400 uppercase tracking-tighter">{uuid}</p>
             </div>
             <button onClick={handleLogout} className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black shadow-xl shadow-red-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">Güvenli Çıkış</button>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 md:px-8 mt-8 md:mt-12">
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-10 mb-10 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">Gelen Siparişler & Sevkiyat Yönetimi</h2>
                   <p className="text-slate-400 font-medium text-sm mt-1">Bayilerden gelen tüm üretim ve gönderi taleplerini buradan yönetin.</p>
                </div>
                <div className="flex gap-4">
                   <div className="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 text-center">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Bekleyen İşlem</p>
                        <p className="text-2xl font-black text-blue-700">{requests.filter(r => r.status === 'pending' || r.status === 'shipped').length}</p>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {requests.length === 0 ? (
                    <div className="py-32 text-center text-slate-300 flex flex-col items-center gap-4">
                        <span className="text-6xl">📦</span>
                        <p className="font-black uppercase tracking-widest text-xs">Şu an aktif bir sipariş bulunmuyor</p>
                    </div>
                ) : requests.map(req => (
                    <div key={req.id} className="group flex flex-col lg:flex-row items-center gap-8 bg-slate-50/50 hover:bg-white border-2 border-transparent hover:border-blue-100 p-8 rounded-[2.5rem] transition-all hover:shadow-2xl">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">🤝</div>
                        <div className="flex-1 w-full">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-blue-600 transition-colors uppercase">{req.dealer_name}</h3>
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest text-white shadow-lg ${req.status === 'pending' ? 'bg-amber-400' : req.status === 'shipped' ? 'bg-indigo-500' : req.status === 'cancelled' ? 'bg-red-400' : 'bg-emerald-500'}`}>{req.status.toUpperCase()}</span>
                                <span className="text-xs font-bold text-slate-400 ml-auto">Talep Tarihi: {new Date(req.request_date).toLocaleDateString()}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all group-hover:border-blue-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Toplam Talep</p>
                                    <p className="text-lg font-black text-slate-800">{req.requested_count}</p>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all group-hover:border-emerald-100">
                                    <p className="text-[8px] font-black text-emerald-500 uppercase mb-1">Bayi Onayladığı</p>
                                    <p className="text-lg font-black text-emerald-600">{req.arrived_count || 0}</p>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all group-hover:border-indigo-100">
                                    <p className="text-[8px] font-black text-indigo-400 uppercase mb-1">Yoldaki (Bekleyen)</p>
                                    <p className="text-lg font-black text-indigo-600">{req.shipped_count || 0}</p>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all group-hover:border-red-100">
                                    <p className="text-[8px] font-black text-red-400 uppercase mb-1">Kalan İmalat</p>
                                    <p className="text-lg font-black text-red-600">{(req.requested_count - (req.arrived_count + req.shipped_count)) > 0 ? (req.requested_count - (req.arrived_count + req.shipped_count)) : 0}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {req.dealer_message && (
                                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Bayi Notu:</p>
                                        <p className="text-xs text-slate-600 font-medium italic">"{req.dealer_message}"</p>
                                    </div>
                                )}
                                {req.factory_message && (
                                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                        <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Sizin Notunuz:</p>
                                        <p className="text-xs text-slate-600 font-medium italic">"{req.factory_message}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="w-full lg:w-auto">
                            <button 
                                onClick={() => openUpdate(req)}
                                className="w-full lg:w-48 bg-slate-900 border-2 border-slate-900 hover:bg-blue-600 hover:border-blue-600 text-white font-black py-4 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs active:scale-95"
                            >
                                SEVK İŞLEMİ
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Shipment Update Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl relative border border-slate-200/50 transform animate-in zoom-in-95 duration-300 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header Sticky Area */}
            <div className="p-8 md:px-12 md:pt-10 pb-4 border-b border-slate-50 relative shrink-0">
                <button 
                    onClick={() => setShowModal(false)} 
                    className="absolute top-6 right-6 w-10 h-10 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full flex items-center justify-center transition-all z-10"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl shadow-blue-500/20 tracking-tighter transform -rotate-3 group-hover:rotate-0 transition-transform">🚚</div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">LOJİSTİK YÖNETİMİ</h2>
                    <p className="text-slate-400 font-bold text-[10px] tracking-[0.2em] uppercase">Sevkiyat & Sipariş Güncelleme</p>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-8 md:px-12 py-6 no-scrollbar">
                <div className="bg-slate-50 rounded-[2rem] p-6 mb-8 border border-slate-200/50 flex items-center justify-between shadow-inner">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teslimat Adresi / Bayi</p>
                       <h4 className="font-black text-lg text-slate-800 uppercase leading-none mt-1">{selectedRequest?.dealer_name}</h4>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Kalan Adet</p>
                        <p className="text-2xl font-black text-blue-600">{selectedRequest?.requested_count - (selectedRequest?.arrived_count + selectedRequest?.shipped_count)}</p>
                    </div>
                </div>

                <form onSubmit={handleUpdateSubmit} className="space-y-8 pb-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">İşlem Kararı</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button"
                                onClick={() => setForm({ ...form, status: 'shipped' })}
                                className={`flex flex-col items-center gap-2 py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest border-2 transition-all group ${form.status === 'shipped' ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'}`}
                            >
                                <span className={`text-xl ${form.status === 'shipped' ? 'opacity-100' : 'opacity-40 group-hover:opacity-100 transition-opacity'}`}>📦</span>
                                SEVKİYAT BAŞLAT
                            </button>
                            <button 
                                type="button"
                                onClick={() => setForm({ ...form, status: 'cancelled' })}
                                className={`flex flex-col items-center gap-2 py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest border-2 transition-all group ${form.status === 'cancelled' ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-500/20' : 'bg-white border-slate-100 text-slate-400 hover:border-red-200'}`}
                            >
                                <span className={`text-xl ${form.status === 'cancelled' ? 'opacity-100' : 'opacity-40 group-hover:opacity-100 transition-opacity'}`}>🚫</span>
                                SİPARİŞİ İPTAL ET
                            </button>
                        </div>
                    </div>

                    {form.status === 'shipped' && (
                        <div className="animate-in slide-in-from-top-4 duration-300">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">Gönderilen Ürün Miktarı (Adet)</label>
                            <div className="relative group">
                                <input 
                                    type="number"
                                    value={form.sentCount}
                                    onChange={(e) => setForm({ ...form, sentCount: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-blue-600 rounded-3xl p-6 text-center text-4xl font-black text-slate-800 outline-none transition-all shadow-inner group-hover:shadow-md"
                                    placeholder="0"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">ADET TASMA</div>
                            </div>
                            <p className="mt-3 text-[10px] text-slate-400 font-bold text-center italic">* Kalan bakiyeden fazla gönderim yapamazsınız.</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">Sevkiyat Notu / Takip No</label>
                        <textarea 
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                            className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-blue-600 rounded-3xl p-6 outline-none font-medium text-slate-600 h-32 resize-none shadow-inner transition-all"
                            placeholder="Kargo takip numarasını veya bayi için özel notunuzu buraya ekleyebilirsiniz..."
                        ></textarea>
                    </div>
                </form>
            </div>

            {/* Footer Sticky Area */}
            <div className="p-8 md:px-12 md:pb-10 pt-4 bg-slate-50/50 border-t border-slate-100 shrink-0">
                <div className="flex gap-4">
                    <button 
                        type="button" 
                        onClick={() => setShowModal(false)} 
                        className="flex-1 bg-white border border-slate-200 text-slate-500 py-5 rounded-3xl font-black uppercase tracking-widest text-[11px] transition-all hover:bg-slate-50 hover:text-slate-700"
                    >
                        VAZGEÇ
                    </button>
                    <button 
                        onClick={handleUpdateSubmit}
                        type="submit" 
                        className="flex-[2] bg-slate-900 hover:bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-blue-500/10 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                    >
                        SİSTEMİ GÜNCELLE
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
