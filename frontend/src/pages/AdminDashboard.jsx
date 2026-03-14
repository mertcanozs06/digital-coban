import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

export default function AdminDashboard() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('applications');
  
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ totalFarmers: 0, activeDealers: 0, activeFactories: 0 });
  const [dealers, setDealers] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState(null);
  const [targetDealerId, setTargetDealerId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apps = await api.get('/api/admin/applications', token);
      setApplications(apps);

      const s = await api.get('/api/admin/stats', token);
      setStats(s);

      const d = await api.get('/api/admin/dealers', token);
      setDealers(d);

      const f = await api.get('/api/admin/farmers', token);
      setFarmers(f);

      const i = await api.get('/api/admin/installations', token);
      setInstallations(i);
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

  const handleApprove = async (appId) => {
    if(window.confirm('Bu kurumu sisteme ONAYLAYARAK giriş bilgilerini mail olarak göndermek istiyor musunuz?')) {
      try {
        const token = localStorage.getItem('token');
        await api.post('/api/auth/approve', { applicationId: appId }, token);
        alert('Sözleşme kabul edildi! Şifre sisteme tanımlandı ve mail gönderildi.');
        fetchData();
      } catch (err) {
        alert('Onay işlemi başarısız: ' + err.message);
      }
    }
  };

  const handleTerminate = async (appId) => {
    if(window.confirm('DİKKAT! Bu kurumun sözleşmesini feshetmek üzeresiniz. Bu işlem kurumun sistemdeki TÜM verilerini (hesap, kurulumlar, stok talepleri vb.) kalıcı olarak silecektir. Emin misiniz?')) {
        try {
            const token = localStorage.getItem('token');
            await api.post('/api/admin/terminate-contract', { applicationId: appId }, token);
            alert('Sözleşme feshedildi ve tüm veriler temizlendi.');
            fetchData();
        } catch (err) {
            alert('Fesih işlemi başarısız: ' + err.message);
        }
    }
  };

  const handleGenerateCode = async (instId) => {
    try {
        const token = localStorage.getItem('token');
        const res = await api.post('/api/admin/generate-code', { installationId: instId }, token);
        alert(`Aktivasyon Kodu Oluşturuldu: ${res.code}\nLütfen bu kodu bayiye iletiniz.`);
        fetchData();
    } catch (err) {
        alert('Kod oluşturma hatası: ' + err.message);
    }
  };

  const handleReassign = async () => {
    if(!targetDealerId) return alert('Lütfen bir bayi seçin.');
    try {
        const token = localStorage.getItem('token');
        await api.post('/api/admin/reassign-installation', { 
            installationId: selectedInstallation.id, 
            newDealerId: targetDealerId 
        }, token);
        alert('Kurulum başarıyla yeni bayiye atandı.');
        setShowReassignModal(false);
        fetchData();
    } catch (err) {
        alert('Atama hatası: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-black text-slate-400 animate-pulse text-2xl uppercase tracking-widest">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-red-200 pb-20">
      {/* Premium Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </div>
            <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none">Digital<span className="text-red-500 font-light lowercase">Çoban</span></h1>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest opacity-70">Admin Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-slate-400">Yönetici Oturumu</p>
                <p className="text-[10px] font-mono text-slate-600 truncate max-w-[150px]">{uuid}</p>
            </div>
            <button onClick={handleLogout} className="flex-1 md:flex-none px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-black shadow-xl shadow-red-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0">Çıkış Yap</button>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 md:px-8 mt-8 md:mt-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10 text-center md:text-left">
          {[
            { label: 'Bekleyen Başvurular', val: applications.filter(a => a.status === 'pending').length, color: 'amber', icon: '📝' },
            { label: 'Aktif Bayiler', val: stats.activeDealers, color: 'purple', icon: '🤝' },
            { label: 'Aktif Fabrikalar', val: stats.activeFactories, color: 'blue', icon: '🏭' },
            { label: 'Toplam Çiftçi', val: stats.totalFarmers, color: 'emerald', icon: '🚜' }
          ].map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group overflow-hidden relative">
              <div className={`absolute top-0 right-0 p-4 text-4xl opacity-10 group-hover:scale-125 transition-transform`}>{s.icon}</div>
              <h3 className="text-slate-400 text-[10px] font-black tracking-widest uppercase mb-1">{s.label}</h3>
              <p className={`text-3xl md:text-4xl font-black text-slate-900 group-hover:text-${s.color}-600 transition-colors`}>{s.val}</p>
              <div className={`w-12 h-1 bg-${s.color}-500 mt-4 rounded-full`}></div>
            </div>
          ))}
        </div>

        {/* Global Tab Navigation */}
        <div className="flex bg-slate-200/50 backdrop-blur p-1.5 rounded-3xl mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'applications', label: 'Başvurular', icon: '🏢' },
            { id: 'dealers', label: 'Bayiler', icon: '🤝' },
            { id: 'farmers', label: 'Çiftçiler', icon: '🚜' },
            { id: 'installations', label: 'Kurulumlar & Kodlar', icon: '🛠' }
          ].map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)} 
                className={`flex-none md:flex-1 px-6 py-4 rounded-2xl font-black text-xs md:text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
            >
                <span className="text-lg">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Active Content */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-10 min-h-[500px]">
          
          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-black text-slate-800">Başvurular</h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{applications.length} Kayıt</span>
              </div>
              {applications.length === 0 ? <div className="text-center py-20 text-slate-300 font-bold italic uppercase tracking-widest">Başvuru bulunmamaktadır.</div> : applications.map(app => (
                <div key={app.id} className="group border border-slate-100 hover:border-slate-300 rounded-[2rem] p-6 md:p-8 flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-50/30 hover:bg-white hover:shadow-2xl transition-all">
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-black text-xl text-slate-900">{app.company_name}</h3>
                      <span className={`px-4 py-1 rounded-full text-[10px] text-white font-black tracking-widest shadow-lg ${app.type === 'dealer' ? 'bg-purple-600 shadow-purple-200' : 'bg-blue-600 shadow-blue-200'}`}>{app.type.toUpperCase()}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-medium text-slate-500 mt-4">
                        <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-100">👤 {app.contact_name}</div>
                        <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-100">📞 {app.phone}</div>
                        <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-100">📧 {app.email}</div>
                    </div>
                    <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-xs text-indigo-700 font-black tracking-tight flex items-center gap-2 uppercase">
                            <span className="bg-indigo-600 text-white p-1 rounded-md text-[8px]">IBAN</span> {app.iban_no || 'IBAN BELİRTİLMEMİŞ'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">BAŞVURU: {app.date}</div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    {app.status === 'pending' ? (
                        <button onClick={() => handleApprove(app.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-xl shadow-emerald-200 hover:-translate-y-1">ONAYLA</button>
                    ) : (
                        <div className="flex-1 bg-white text-emerald-600 border-2 border-emerald-100 px-8 py-3 rounded-2xl font-black text-sm text-center flex items-center justify-center gap-2">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> ONAYLANDI
                        </div>
                    )}
                    <button onClick={() => handleTerminate(app.id)} className="flex-1 bg-white text-red-500 border border-red-100 hover:bg-red-50 px-6 py-3 rounded-2xl font-black text-[10px] md:text-xs transition-all uppercase tracking-tighter">Sözleşmeyi Feshet</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dealers Tab */}
          {activeTab === 'dealers' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <div className="flex items-center justify-between mb-8">
                   <h2 className="text-2xl font-black text-slate-800 tracking-tight">Aktif Bayi Ağı</h2>
                   <span className="text-xs font-black text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-widest">{dealers.length} BAYİ</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {dealers.map(d => (
                   <div key={d.id} className="group bg-white rounded-[2.5rem] p-6 border border-slate-100 hover:border-purple-200 hover:shadow-2xl transition-all shadow-lg shadow-slate-100/50 flex flex-col justify-between relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-[1.25rem] flex items-center justify-center text-2xl shadow-sm border border-purple-100 group-hover:scale-110 transition-transform">🤝</div>
                            <div className="bg-slate-100 text-slate-400 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest">ID: {d.id}</div>
                        </div>
                        <h4 className="font-black text-xl text-slate-900 leading-tight mb-4 group-hover:text-purple-600 transition-colors uppercase">{d.company_name}</h4>
                        
                        <div className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-600 flex items-center gap-3"><span className="w-6 h-6 bg-white rounded-md flex items-center justify-center shadow-sm">👤</span> {d.username}</p>
                          <p className="text-xs font-bold text-slate-600 flex items-center gap-3"><span className="w-6 h-6 bg-white rounded-md flex items-center justify-center shadow-sm">📞</span> {d.phone}</p>
                          <p className="text-xs font-bold text-slate-600 flex items-center gap-3 truncate"><span className="w-6 h-6 bg-white rounded-md flex items-center justify-center shadow-sm">📍</span> {d.address || 'Girilmemiş'}</p>
                        </div>
                     </div>
                     <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kayıt: {new Date(d.created_at || Date.now()).toLocaleDateString('tr-TR')}</span>
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-200"></div> AKTİF
                        </div>
                     </div>
                   </div>
                 ))}
                 {dealers.length === 0 && <div className="col-span-full text-center py-20 text-slate-300 font-black uppercase tracking-widest">Aktif Bayi Bulunmuyor</div>}
               </div>
            </div>
          )}

          {/* Farmers Tab */}
          {activeTab === 'farmers' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <div className="flex items-center justify-between mb-8">
                   <h2 className="text-2xl font-black text-slate-800 tracking-tight">Kayıtlı Çiftçiler</h2>
                   <span className="text-xs font-black text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-widest">{farmers.length} ÇİFTÇİ</span>
               </div>
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                 {farmers.map(f => (
                   <div key={f.id} className="group bg-white flex flex-col sm:flex-row items-center sm:items-stretch gap-0 rounded-[2.5rem] border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-2xl shadow-lg shadow-slate-100/50 overflow-hidden">
                      <div className="bg-emerald-50 flex items-center justify-center p-8 sm:w-32 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <span className="text-4xl transform group-hover:scale-110 transition-transform">🐄</span>
                      </div>
                      <div className="flex-1 p-6 flex flex-col sm:flex-row justify-between w-full">
                          <div className="text-center sm:text-left mb-6 sm:mb-0">
                            <h4 className="font-black text-xl text-slate-900 group-hover:text-emerald-700 transition-colors uppercase">{f.username}</h4>
                            <p className="text-xs font-bold text-slate-500 mt-2">{f.phone}</p>
                            <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest truncate max-w-[200px]">{f.address || 'Bölge Belirtilmemiş'}</p>
                            
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
                                <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-sm ${f.sub_status === 'active' ? 'bg-emerald-500' : f.sub_status === 'trial' ? 'bg-amber-400' : 'bg-red-400'}`}>
                                    {f.sub_status || 'KAYITSIZ'}
                                </span>
                            </div>
                          </div>
                          <div className="flex gap-2 sm:flex-col sm:justify-center w-full sm:w-auto h-full space-y-0 sm:space-y-2">
                             <div className="flex-1 sm:flex-none bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 text-center flex flex-col items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                                <span className="text-xs bg-white w-6 h-6 rounded-md flex items-center justify-center shadow-sm mb-1">🐂</span>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Büyükbaş</p>
                                <p className="text-xl font-black text-slate-800 leading-none">{f.buyukbas_count || 0}</p>
                             </div>
                             <div className="flex-1 sm:flex-none bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 text-center flex flex-col items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                                <span className="text-xs bg-white w-6 h-6 rounded-md flex items-center justify-center shadow-sm mb-1">🐑</span>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Küçükbaş</p>
                                <p className="text-xl font-black text-slate-800 leading-none">{f.kucukbas_count || 0}</p>
                             </div>
                          </div>
                      </div>
                   </div>
                 ))}
                 {farmers.length === 0 && <div className="col-span-full text-center py-20 text-slate-300 font-black uppercase tracking-widest">Kayıtlı Çiftçi Bulunmuyor</div>}
               </div>
            </div>
          )}

          {/* Installations Tab */}
          {activeTab === 'installations' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-black text-slate-800">Kurulumlar & Bakım İşlemleri</h2>
                <div className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest">Aktivasyon Bekleyenler: {installations.filter(i => !i.activation_code).length}</div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {installations.map(inst => (
                  <div key={inst.id} className="bg-white border-2 border-slate-50 hover:border-blue-100 rounded-[2rem] p-6 flex flex-col lg:flex-row justify-between items-center gap-6 transition-all hover:bg-blue-50/20 group">
                    <div className="flex-1 w-full">
                       <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{inst.farmer_name}</h4>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-white shadow-md ${inst.type === 'maintenance' ? 'bg-amber-500 shadow-amber-100' : 'bg-blue-500 shadow-blue-100'}`}>{inst.type.toUpperCase()}</span>
                          {inst.status === 'verified' && <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm">✓ AKTİF</span>}
                       </div>
                       <div className="flex flex-col md:flex-row gap-4 mb-4">
                          <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Hizmet Alan Bayi</p>
                            <p className="text-xs font-black text-indigo-700">{inst.dealer_name || 'Hizmet Dışı / Admin Control'}</p>
                            <p className="text-[10px] text-slate-500 font-medium">📞 {inst.dealer_phone || '-'}</p>
                          </div>
                          <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Çiftçi İletişim</p>
                            <p className="text-xs font-black text-slate-700">{inst.farmer_phone}</p>
                            <p className="text-[10px] text-slate-500 font-medium truncate">{inst.description || 'Not Girilmemiş'}</p>
                          </div>
                          {inst.hw_mac_address && (
                            <div className="flex-1 bg-slate-900 p-4 rounded-2xl shadow-lg shadow-slate-200">
                                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Donanım Kimliği</p>
                                <p className="text-xs font-mono font-bold text-white tracking-widest">{inst.hw_mac_address}</p>
                            </div>
                          )}
                       </div>
                       {inst.activation_code && (
                         <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-emerald-700">
                            <span className="text-[10px] font-black uppercase tracking-widest">KOD:</span>
                            <span className="text-lg font-black font-mono tracking-[0.2em]">{inst.activation_code}</span>
                         </div>
                       )}
                    </div>
                    
                    <div className="flex flex-col gap-2 w-full lg:w-48">
                        {!inst.activation_code ? (
                            <button onClick={() => handleGenerateCode(inst.id)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 text-xs transition-all uppercase tracking-widest transform hover:-translate-y-1">KOD ÜRET</button>
                        ) : (
                            <div className="w-full bg-emerald-50 text-emerald-600 font-black py-4 rounded-2xl text-xs text-center border border-emerald-100 uppercase tracking-widest">KOD İLETİLDİ</div>
                        )}
                        <button 
                            onClick={() => { setSelectedInstallation(inst); setTargetDealerId(''); setShowReassignModal(true); }}
                            className="w-full bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 font-black py-3 rounded-2xl text-[10px] transition-all uppercase tracking-widest"
                        >
                            Bayi Değiştir
                        </button>
                    </div>
                  </div>
                ))}
                {installations.length === 0 && <div className="text-center py-20 text-slate-300 font-black">İŞLEM KAYDI BULUNMAMAKTADIR</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REASSIGN MODAL */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-8 md:p-12 max-w-lg w-full shadow-2xl relative border border-white/20 transform animate-in zoom-in-95 duration-300">
                <button 
                    onClick={() => setShowReassignModal(false)} 
                    className="absolute top-6 right-6 w-10 h-10 bg-slate-100 text-slate-500 hover:text-red-500 rounded-full flex items-center justify-center transition-all"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm">♻️</div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Bayi Değiştir</h2>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Seçili kuruluma yeni bir sorumlu bayi atayın.</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 text-center md:text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Seçili İşlem</p>
                    <h4 className="font-black text-slate-800 text-lg uppercase">{selectedInstallation?.farmer_name}</h4>
                    <p className="text-xs text-indigo-600 font-bold mt-1">Eski Bayi: {selectedInstallation?.dealer_name || 'ATANMAMIŞ'}</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Yeni Sorumlu Bayi Seçin</label>
                        <select 
                            value={targetDealerId}
                            onChange={(e) => setTargetDealerId(e.target.value)}
                            className="w-full bg-slate-100 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white text-slate-800 rounded-2xl p-4 font-black outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="">-- BAYİ SEÇİN --</option>
                            {dealers.map(d => <option key={d.id} value={d.id}>{d.company_name} ({d.username})</option>)}
                        </select>
                    </div>
                    
                    <button 
                        onClick={handleReassign}
                        className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                    >
                        Değişikliği Onayla
                    </button>
                    <p className="text-center text-[10px] text-slate-400 font-bold">Bu işlemden sonra tüm komisyon ve bakım bildirimleri yeni bayiye iletilecektir.</p>
                </div>
            </div>
        </div>
      )}

      {/* Global Style Injector for No-Scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
