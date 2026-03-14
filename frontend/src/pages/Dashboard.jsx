import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../services/api.js';
import { FaPen, FaEye, FaEyeSlash, FaCrosshairs, FaMapMarkedAlt, FaPlus, FaSignOutAlt, FaSyncAlt, FaCreditCard, FaEdit } from 'react-icons/fa';

export default function Dashboard() {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [token] = useState(localStorage.getItem('token'));
  const [animals, setAnimals] = useState([]);
  const [areas, setAreas] = useState([]);
  const [lastDrawnArea, setLastDrawnArea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    buyukbas_count: 0,
    kucukbas_count: 0
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  const [isDrawingArea, setIsDrawingArea] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState([]);

  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]); 
  const drawingMarkersRef = useRef([]);

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

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

  // Admin kontrolü
  useEffect(() => {
    const checkRole = async () => {
      try {
        const token = localStorage.getItem('token');
        const data = await api.get('/api/auth/me', token);
        if (data.role === 'admin') {
          navigate(`/admin/dashboard/${data.uuid}`);
        } else if (data.role === 'dealer') {
            navigate(`/dealer/dashboard/${data.uuid}`);
        } else if (data.role === 'factory') {
            navigate(`/factory/dashboard/${data.uuid}`);
        }
      } catch (err) {
        console.error('Rol kontrolü hatası:', err);
      }
    };
    checkRole();
  }, []);

  const fetchAll = async () => {
    try {
      const sub = await api.get('/api/subscriptions/status');
      setSubscriptionInfo(sub);
      const [animalData, areaData] = await Promise.all([
        api.get('/api/animals'),
        api.get('/api/areas')
      ]);
      setAnimals(animalData || []);
      setAreas(areaData || []);
      if (areaData && areaData.length > 0) {
        const sorted = areaData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setLastDrawnArea(sorted[0]);
      }
    } catch (err) {
      setError(err.message || 'Veri alınamadı');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [token, navigate]);

  // HARİTA YÖNETİMİ
  useEffect(() => {
    if (!mapContainer.current) return;

    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

    if (!map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/satellite/style.json?key=${apiKey}`,
        center: [32.85, 39.93],
        zoom: 16,
        attributionControl: false
      });
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.current.on('load', () => setMapLoading(false));
    }

    const mapInstance = map.current;

    const updateMapElements = () => {
      if (!mapInstance.isStyleLoaded()) return;

      // Hayvan Markerları
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      animals.forEach((a, index) => {
        if (a.last_lat && a.last_lng && a.location_visible !== false) {
          const el = document.createElement('div');
          el.className = 'w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-2xl border-2 border-red-500 transform hover:scale-125 transition-transform cursor-pointer';
          el.innerHTML = `<span class="text-xl">🐄</span>`;
          
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([Number(a.last_lng), Number(a.last_lat)])
            .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`
                <div class="p-3 font-sans">
                    <p class="font-black text-slate-800 text-sm uppercase">${a.name || a.code}</p>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">SİNYAL: AKTİF</p>
                </div>
            `))
            .addTo(mapInstance);
          markersRef.current.push(marker);
        }
      });

      // Çizim Noktaları
      drawingMarkersRef.current.forEach(m => m.remove());
      drawingMarkersRef.current = [];
      if (isDrawingArea) {
        currentPolygon.forEach((coord) => {
          const el = document.createElement('div');
          el.className = 'w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg';
          const dMarker = new maplibregl.Marker({ element: el }).setLngLat(coord).addTo(mapInstance);
          drawingMarkersRef.current.push(dMarker);
        });
      }

      // GeoJSON Katmanı
      const sourceId = 'dynamic-area-source';
      const data = { type: 'FeatureCollection', features: [] };

      if (isDrawingArea && currentPolygon.length > 0) {
        data.features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: currentPolygon }
        });
        if (currentPolygon.length >= 3) {
          data.features.push({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[...currentPolygon, currentPolygon[0]]] }
          });
        }
      } else if (lastDrawnArea?.polygon) {
        data.features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [lastDrawnArea.polygon] }
        });
      }

      if (mapInstance.getSource(sourceId)) {
        mapInstance.getSource(sourceId).setData(data);
      } else {
        mapInstance.addSource(sourceId, { type: 'geojson', data });
        mapInstance.addLayer({
          id: 'area-fill',
          type: 'fill',
          source: sourceId,
          paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.2 }
        });
        mapInstance.addLayer({
          id: 'area-outline',
          type: 'line',
          source: sourceId,
          paint: { 'line-color': '#22c55e', 'line-width': 4, 'line-dasharray': [2, 1] }
        });
      }
    };

    if (mapInstance.isStyleLoaded()) {
      updateMapElements();
    } else {
      mapInstance.once('styledata', updateMapElements);
    }

    const handleMapClick = (e) => {
      if (isDrawingArea) {
        setCurrentPolygon(prev => [...prev, [e.lngLat.lng, e.lngLat.lat]]);
      }
    };

    mapInstance.on('click', handleMapClick);
    return () => mapInstance.off('click', handleMapClick);
  }, [animals, lastDrawnArea, isDrawingArea, currentPolygon]);

  const startPayment = async () => {
    try {
      const response = await api.post('/api/subscriptions/initialize', {});
      if (response?.paymentPageUrl) window.location.href = response.paymentPageUrl;
    } catch (e) { alert('Hata: ' + e.message); }
  };

  const startRenewal = async () => {
    try {
      const response = await api.post('/api/subscriptions/renew', {});
      if (response?.paymentPageUrl) window.location.href = response.paymentPageUrl;
    } catch (e) { alert('Hata: ' + e.message); }
  };

  const toggleDrawArea = () => { setIsDrawingArea(prev => !prev); setCurrentPolygon([]); };

  const saveArea = async () => {
    if (currentPolygon.length < 3) return alert('En az 3 nokta seçmelisiniz');
    const name = prompt('Alana isim verin:');
    if (!name) return;
    try {
      const polygonWithClosure = [...currentPolygon, currentPolygon[0]];
      await api.post('/api/areas', { name, polygon: polygonWithClosure });
      fetchAll();
      setIsDrawingArea(false);
      setCurrentPolygon([]);
      alert('Güvenli alan kaydedildi!');
    } catch (err) { alert('Hata: ' + err.message); }
  };

  const toggleLocationVisibility = async (code) => {
    try {
      await api.put('/api/animals/toggle-location', { code });
      fetchAll();
    } catch (err) { alert('Hata: ' + err.message); }
  };

  const renameAnimal = async (code) => {
    const newName = prompt('Yeni isim:');
    if (!newName) return;
    try {
      await api.put('/api/animals/rename', { code, name: newName });
      fetchAll();
    } catch (err) { alert(err.message); }
  };

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  const openUpdateModal = () => { setShowUpdateModal(true); };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault(); 
    setUpdateLoading(true);
    try {
      await api.post('/api/subscriptions/update-animals', updateForm);
      fetchAll();
      setShowUpdateModal(false);
      alert('Sürü kapasitesi güncellendi!');
    } catch (e) { alert(e.message); } finally { setUpdateLoading(false); }
  };

  // QR Tarama
  useEffect(() => {
    if (!isScanning) return;
    const qr = new Html5Qrcode("qr-reader");
    qr.start({ facingMode: "environment" }, { fps: 15, qrbox: 250 }, async (text) => {
      setIsScanning(false); 
      await qr.stop();
      try {
        await api.post('/api/animals', { code: text });
        fetchAll();
        alert('Hayvan başarıyla eklendi!');
      } catch (e) { alert(e.message); }
    }).catch(console.error);
    return () => qr.stop().catch(() => {});
  }, [isScanning]);

  const remainingDays = (() => {
    if (!subscriptionInfo) return 0;
    const end = new Date(subscriptionInfo.subscription_end || subscriptionInfo.trial_end);
    return Math.max(0, Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24)));
  })();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 font-black text-white text-3xl italic animate-pulse tracking-tighter uppercase">Digital<span className="text-emerald-500 font-light">Çoban</span></div>;

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans selection:bg-emerald-200">
      
      {/* Premium Navigation */}
      <nav className="bg-slate-900 border-b border-slate-800 text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 21l-8-4.5v-9L12 3l8 4.5v9l-8 4.5z" /></svg>
            </div>
            <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none">Digital<span className="text-emerald-500 font-light lowercase">Çoban</span></h1>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest opacity-70">Akıllı Sürü Yönetim Sistemi</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={openUpdateModal} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 transition-all"><FaSyncAlt className="text-emerald-500" /> Kapasite</button>
            <button onClick={startPayment} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-xl shadow-emerald-500/20 transition-all"><FaCreditCard /> Ödeme Yap</button>
            <button onClick={startRenewal} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-xl shadow-indigo-500/20 transition-all">🔄 Yenile</button>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 transition-all"><FaSignOutAlt /> Çıkış</button>
          </div>
        </div>
      </nav>

      <div className="max-w-full mx-auto px-4 md:px-8 py-8">
        
        {/* Top Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white flex justify-between items-center overflow-hidden relative group transition-all hover:scale-[1.02]">
                <div className="z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Abonelik Durumu</p>
                    <p className="text-2xl font-black text-slate-900 uppercase">{subscriptionInfo?.status === 'active' ? 'Aktif Üye' : 'Deneme Sürümü'}</p>
                </div>
                <div className="text-5xl opacity-10 group-hover:scale-125 transition-transform">💎</div>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white flex justify-between items-center overflow-hidden relative group transition-all hover:scale-[1.02]">
                <div className="z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kalan Kullanım</p>
                    <p className="text-3xl font-black text-emerald-600">{remainingDays} GÜN</p>
                </div>
                <div className="text-5xl opacity-10 group-hover:scale-125 transition-transform">⏳</div>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white flex justify-between items-center overflow-hidden relative group transition-all hover:scale-[1.02]">
                <div className="z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Paket Bitiş Tarihi</p>
                    <p className="text-xl font-black text-slate-900">{new Date(subscriptionInfo?.subscription_end || subscriptionInfo?.trial_end).toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="text-5xl opacity-10 group-hover:scale-125 transition-transform">🗓️</div>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar: Animal List & Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white p-8">
                <button 
                  onClick={() => setIsScanning(!isScanning)} 
                  className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 ${isScanning ? 'bg-red-500 text-white shadow-red-200' : 'bg-slate-900 text-white shadow-slate-300'}`}
                >
                  {isScanning ? <FaSignOutAlt className="rotate-180" /> : <FaPlus />} {isScanning ? 'Taramayı Durdur' : 'Yeni Hayvan Ekle'}
                </button>
                <div id="qr-reader" className={`mt-6 rounded-3xl overflow-hidden shadow-inner border-4 border-slate-100 ${isScanning ? 'block' : 'hidden'}`} />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Sürüm ({animals.length})</h3>
                    <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-black text-slate-400 shadow-inner">{animals.length}</div>
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3 no-scrollbar">
                  {animals.map((a, i) => (
                    <div key={a.code} className="group p-5 bg-slate-50 hover:bg-white rounded-3xl border border-slate-50 hover:border-emerald-100 transition-all hover:shadow-xl">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:bg-emerald-50 transition-colors">🐂</div>
                        <div>
                            <div className="font-black text-slate-800 uppercase leading-none">{a.name || 'İsimsiz Sığır'}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{a.code}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => renameAnimal(a.code)} className="flex-1 py-3 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-500 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2"><FaEdit /> Adlandır</button>
                        <button 
                          onClick={() => toggleLocationVisibility(a.code)} 
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 border-2 ${a.location_visible ? 'bg-emerald-50 border-emerald-50 text-emerald-600' : 'bg-red-50 border-red-50 text-red-600'}`}
                        >
                          {a.location_visible ? <FaEye /> : <FaEyeSlash />} {a.location_visible ? 'Yayında' : 'Gizli'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {animals.length === 0 && <div className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-xs italic">Sürüde hayvan bulunamadı.</div>}
                </div>
            </div>
          </div>

          {/* Main Map View */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300/50 border border-white p-6 relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-sm"><FaMapMarkedAlt /></div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Uydu Takibi</h3>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={toggleDrawArea} 
                        className={`flex-1 md:flex-none px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 ${isDrawingArea ? 'bg-red-600 text-white shadow-red-200' : 'bg-emerald-600 text-white shadow-emerald-200 hover:-translate-y-1'}`}
                    >
                      {isDrawingArea ? <FaSignOutAlt /> : <FaPlus />} {isDrawingArea ? 'Çizimi İptal Et' : 'Yeni Güvenli Alan'}
                    </button>
                    {isDrawingArea && currentPolygon.length > 0 && (
                      <button onClick={saveArea} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl animate-pulse">
                        Kaydet ({currentPolygon.length} Nokta)
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="relative group">
                    <div ref={mapContainer} className="w-full rounded-[2rem] border-4 border-slate-50 shadow-inner bg-slate-100 relative overflow-hidden" style={{ height: '700px' }}>
                    {mapLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-md z-10 font-black text-white text-xl uppercase tracking-widest animate-pulse">
                            Harita Verileri Yükleniyor...
                        </div>
                    )}
                    {isDrawingArea && (
                        <div className="absolute top-8 left-8 z-10 bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-black/50 border border-white/20 animate-in fade-in slide-in-from-left-4 duration-300">
                        {currentPolygon.length === 0 ? 'Haritada Köşe Noktalarını Belirleyin' : `${currentPolygon.length} Köşe İşaretlendi.`}
                        </div>
                    )}
                    </div>
                    {/* Map Overlays */}
                    <div className="absolute bottom-5 right-5 md:bottom-10 md:right-10 flex flex-col gap-3">
                        <button onClick={() => map.current?.flyTo({zoom: 18})} className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl shadow-2xl text-slate-600 hover:text-emerald-500 transition-all flex items-center justify-center text-lg border border-slate-100"><FaCrosshairs /></button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full border border-white/30 transform animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter text-center uppercase">Sürü Kapasitesi</h2>
            <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mb-10">Tasma ve Altyapı Talebi</p>
            <form onSubmit={handleUpdateSubmit} className="space-y-6">
              <div className="space-y-4">
                  <div className="relative group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4 block">Büyükbaş Hayvan Sayısı</label>
                      <input name="buyukbas_count" type="number" min="0" value={updateForm.buyukbas_count} onChange={(e) => setUpdateForm(p => ({ ...p, [e.target.name]: Number(e.target.value) }))} className="w-full p-5 bg-slate-100 border-2 border-slate-100 focus:bg-white focus:border-indigo-600 rounded-[2rem] outline-none font-black text-2xl text-center transition-all" />
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-focus-within:opacity-100 transition-opacity">🐂</div>
                  </div>
                  <div className="relative group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4 block">Küçükbaş Hayvan Sayısı</label>
                      <input name="kucukbas_count" type="number" min="0" value={updateForm.kucukbas_count} onChange={(e) => setUpdateForm(p => ({ ...p, [e.target.name]: Number(e.target.value) }))} className="w-full p-5 bg-slate-100 border-2 border-slate-100 focus:bg-white focus:border-indigo-600 rounded-[2rem] outline-none font-black text-2xl text-center transition-all" />
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-focus-within:opacity-100 transition-opacity">🐑</div>
                  </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowUpdateModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">Vazgeç</button>
                <button type="submit" disabled={updateLoading} className="flex-[2] py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:shadow-indigo-200 transition-all active:scale-95">{updateLoading ? 'GÜNCELLENİYOR...' : 'TALEBİ ONAYLA'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global CSS Injector */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .mapboxgl-popup-content { border-radius: 20px !important; padding: 0 !important; box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; border: 1px solid #f1f5f9 !important; }
        .mapboxgl-popup-tip { border-top-color: #fff !important; }
      `}</style>

    </div>
  );
}