import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { uuid } = useParams();
  
  const [activeTab, setActiveTab] = useState('applications');

  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    activeDealers: 0,
    activeFactories: 0,
    totalFarmers: 0
  });
  
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Statikleri çek
      const statsData = await api.get('/api/admin/stats', token);
      setStats(statsData);
      
      // Başvuruları çek
      const appsData = await api.get('/api/admin/applications', token);
      setApplications(appsData);
    } catch (error) {
      console.error('Data fetch error:', error);
      alert('Veriler çekilirken hata oluştu: ' + error.message);
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
        
        // UI'da durumu anında güncelle
        setApplications(applications.map(app => app.id === appId ? { ...app, status: 'approved' } : app));
      } catch (err) {
        alert('Onay işlemi başarısız: ' + err.message);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans selection:bg-purple-300 pb-12">
      {/* HEADER */}
      <header className="bg-red-900 border-b border-red-800 text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-widest uppercase">Digital<span className="text-red-400 font-light lowercase">Çoban</span> <span className="opacity-50">/</span> <span className="text-white">Admin Paneli</span></h1>
            <p className="text-xs md:text-sm text-red-200 mt-1">Sistem Yöneticisi: {uuid}</p>
          </div>
          <button onClick={handleLogout} className="px-5 py-2.5 bg-red-800 hover:bg-red-700 rounded-xl text-sm font-bold shadow-sm transition-all border border-red-800/50">Çıkış Yap</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-10">
        {/* ÖZET KARTLARI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-slate-400 text-[10px] md:text-xs font-black tracking-widest uppercase">Bekleyen Başvurular</h3>
            <p className="text-2xl md:text-4xl font-black text-amber-500 mt-2">{applications.filter(a => a.status === 'pending').length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-slate-400 text-[10px] md:text-xs font-black tracking-widest uppercase">Toplam Bayi (Aktif)</h3>
            <p className="text-2xl md:text-4xl font-black text-slate-800 mt-2">{stats.activeDealers}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-slate-400 text-[10px] md:text-xs font-black tracking-widest uppercase">Toplam Fabrika (Aktif)</h3>
            <p className="text-2xl md:text-4xl font-black text-slate-800 mt-2">{stats.activeFactories}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-slate-400 text-[10px] md:text-xs font-black tracking-widest uppercase">Toplam Çiftçi</h3>
            <p className="text-2xl md:text-4xl font-black text-slate-800 mt-2">{stats.totalFarmers}</p>
          </div>
        </div>

        {/* SEKME MENÜSÜ */}
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6 flex-wrap md:flex-nowrap">
          <button onClick={() => setActiveTab('applications')} className={`flex-1 px-4 py-3 md:py-4 rounded-lg font-bold text-xs md:text-sm tracking-wide transition-all ${activeTab === 'applications' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            🏢 Kurumsal Başvurular (Bayi/Fabrika)
          </button>
          <button onClick={() => setActiveTab('system')} className={`flex-1 px-4 py-3 md:py-4 rounded-lg font-bold text-xs md:text-sm tracking-wide transition-all ${activeTab === 'system' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            ⚙️ Sistem İstatistikleri (Yakında)
          </button>
        </div>

        {/* BAŞVURULAR SEKME İÇERİĞİ */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-5 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg md:text-xl font-bold text-slate-800">Gelen Kurumsal Başvurular</h2>
                </div>
                <div className="space-y-4">
                  {applications.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-medium">Şu an bekleyen herhangi bir başvuru bulunmamaktadır.</div>
                  ) : (
                    applications.map(app => (
                      <div key={app.id} className="border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition bg-slate-50/50">
                        <div className="flex-1 w-full flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-slate-800">{app.company_name}</h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest text-white shadow-sm ${app.type === 'dealer' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                              {app.type === 'dealer' ? 'BAYİ' : 'FABRİKA'}
                            </span>
                             <span className="text-[10px] uppercase font-black text-slate-400 ml-2">{app.date}</span>
                          </div>
                          <div className="text-sm font-medium text-slate-600 flex flex-wrap gap-4">
                            <span>👤 {app.contact_name}</span>
                            <span>📞 {app.phone}</span>
                            <span>📧 {app.email}</span>
                          </div>
                        </div>
                        
                        <div className="w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-slate-200">
                          {app.status === 'pending' ? (
                            <button 
                              onClick={() => handleApprove(app.id)}
                              className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-sm transition-all shadow-green-200 uppercase tracking-widest"
                            >
                              Sisteme Onayla
                            </button>
                          ) : (
                            <div className="bg-slate-100 text-slate-500 px-6 py-3 rounded-xl text-sm font-bold border border-slate-200 text-center uppercase tracking-widest shadow-inner">
                              ✔ Onaylandı
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-12 text-center text-slate-400 font-bold uppercase tracking-widest">
            Sistem İstatistikleri yapım aşamasındadır.
          </div>
        )}

      </div>
    </div>
  );
}
