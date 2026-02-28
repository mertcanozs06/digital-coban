import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../services/api.js';
import { FaPen, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Dashboard() {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [token] = useState(localStorage.getItem('token'));
  const [animals, setAnimals] = useState([]);
  const [areas, setAreas] = useState([]);
  const [lastDrawnArea, setLastDrawnArea] = useState(null);
  const [scanResult, setScanResult] = useState('');
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
  const scannerRef = useRef(null);
  const markersRef = useRef([]); 
  const drawingMarkersRef = useRef([]);

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  useEffect(() => {
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
    fetchAll();
  }, [token, navigate]);

  // HARİTA YÖNETİMİ
  useEffect(() => {
    if (!mapContainer.current) return;

    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

    if (!map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`,
        center: [32.85, 39.93],
        zoom: 13,
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
          const offset = index * 0.0001;
          const marker = new maplibregl.Marker({ color: '#FF0000' })
            .setLngLat([Number(a.last_lng) + offset, Number(a.last_lat) + offset])
            .setPopup(new maplibregl.Popup().setText(a.name || a.code))
            .addTo(mapInstance);
          markersRef.current.push(marker);
        }
      });

      // Çizim Noktaları (Mavi Daireler)
      drawingMarkersRef.current.forEach(m => m.remove());
      drawingMarkersRef.current = [];
      if (isDrawingArea) {
        currentPolygon.forEach((coord) => {
          const el = document.createElement('div');
          el.style.width = '12px';
          el.style.height = '12px';
          el.style.backgroundColor = '#3b82f6';
          el.style.border = '2px solid white';
          el.style.borderRadius = '50%';
          el.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';

          const dMarker = new maplibregl.Marker({ element: el })
            .setLngLat(coord)
            .addTo(mapInstance);
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
          paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.3 }
        });
        mapInstance.addLayer({
          id: 'area-outline',
          type: 'line',
          source: sourceId,
          paint: { 'line-color': '#16a34a', 'line-width': 3 }
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

  // ÖDEME VE YENİLEME (Hata düzeltilmiş halleri)
  const startPayment = async () => {
    try {
      const response = await api.post('/api/subscriptions/initialize', {});
      const result = response.data || response; 
      if (result?.paymentPageUrl) {
        window.location.href = result.paymentPageUrl;
      } else {
        alert('Ödeme URL\'si alınamadı.');
      }
    } catch (e) { alert('Hata: ' + e.message); }
  };

  const startRenewal = async () => {
    try {
      const response = await api.post('/api/subscriptions/renew', {});
      const result = response.data || response;
      if (result?.paymentPageUrl) {
        window.location.href = result.paymentPageUrl;
      } else {
        alert('Yenileme URL\'si alınamadı.');
      }
    } catch (e) { alert('Hata: ' + e.message); }
  };

  // ALAN İŞLEMLERİ
  const toggleDrawArea = () => {
    setIsDrawingArea(prev => !prev);
    setCurrentPolygon([]);
  };

  const saveArea = async () => {
    if (currentPolygon.length < 3) return alert('En az 3 nokta seçmelisiniz');
    const name = prompt('Alana isim verin:');
    if (!name) return;
    try {
      const polygonWithClosure = [...currentPolygon, currentPolygon[0]];
      await api.post('/api/areas', { name, polygon: polygonWithClosure });
      const updated = await api.get('/api/areas');
      const sorted = updated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setLastDrawnArea(sorted[0]);
      setAreas(updated);
      setIsDrawingArea(false);
      setCurrentPolygon([]);
      alert('Alan kaydedildi!');
    } catch (err) { alert('Hata: ' + err.message); }
  };

  const toggleLocationVisibility = async (code) => {
    try {
      await api.put('/api/animals/toggle-location', { code });
      const updated = await api.get('/api/animals');
      setAnimals(updated || []);
    } catch (err) { alert('Hata: ' + err.message); }
  };

  const renameAnimal = async (code) => {
    const newName = prompt('Yeni isim:');
    if (!newName) return;
    try {
      await api.put('/api/animals/rename', { code, name: newName });
      const updated = await api.get('/api/animals');
      setAnimals(updated || []);
    } catch (err) { alert(err.message); }
  };

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  const openUpdateModal = () => { 
    setUpdateForm({ buyukbas_count: 0, kucukbas_count: 0 }); 
    setShowUpdateModal(true); 
  };

  const handleUpdateChange = (e) => setUpdateForm(p => ({ ...p, [e.target.name]: Number(e.target.value) }));
  
  const handleUpdateSubmit = async (e) => {
    e.preventDefault(); 
    setUpdateLoading(true);
    try {
      const { data } = await api.post('/api/subscriptions/update-animals', updateForm);
      if (data.success) {
        const sub = await api.get('/api/subscriptions/status');
        setSubscriptionInfo(sub); 
        setShowUpdateModal(false);
        alert('Güncellendi!');
      }
    } catch (e) { alert(e.message); } finally { setUpdateLoading(false); }
  };

  // QR Tarama
  useEffect(() => {
    if (!isScanning) return;
    const qr = new Html5Qrcode("qr-reader-container");
    qr.start({ facingMode: "environment" }, { fps: 10, qrbox: 280 }, async (text) => {
      setIsScanning(false); 
      await qr.stop();
      try {
        await api.post('/api/animals', { code: text });
        const up = await api.get('/api/animals'); 
        setAnimals(up || []);
      } catch (e) { alert(e.message); }
    }).catch(console.error);
    return () => qr.stop().catch(() => {});
  }, [isScanning]);

  const remainingDays = (() => {
    if (!subscriptionInfo) return 0;
    const end = new Date(subscriptionInfo.subscription_end || subscriptionInfo.trial_end);
    return Math.max(0, Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24)));
  })();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-bold">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Digital Çoban</h1>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={startPayment} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium">Ödeme Yap</button>
            <button onClick={startRenewal} className="px-4 py-2 bg-green-600 text-white rounded-xl font-medium">Paketi Yenile</button>
            <button onClick={openUpdateModal} className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium">Hayvan Güncelle</button>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium">Çıkış</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div><p className="text-sm text-gray-500">Durum</p><p className="text-xl font-bold">{subscriptionInfo?.status === 'active' ? 'Aktif' : 'Deneme'}</p></div>
          <div><p className="text-sm text-gray-500">Kalan</p><p className="text-xl font-bold text-blue-600">{remainingDays} Gün</p></div>
          <div><p className="text-sm text-gray-500">Bitiş</p><p className="text-lg font-medium">{new Date(subscriptionInfo?.subscription_end || subscriptionInfo?.trial_end).toLocaleDateString('tr-TR')}</p></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border p-6 h-fit">
            <div className="mb-6">
               <button onClick={() => setIsScanning(!isScanning)} className={`w-full py-3 rounded-xl text-white font-bold transition ${isScanning ? 'bg-red-500' : 'bg-blue-600'}`}>
                {isScanning ? 'Kamerayı Kapat' : 'Hayvan Ekle (QR)'}
              </button>
              <div id="qr-reader-container" className={`mt-4 rounded-lg overflow-hidden ${isScanning ? 'block' : 'hidden'}`} />
            </div>

            <h3 className="text-lg font-bold mb-4">Hayvanlarım ({animals.length})</h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {animals.map(a => (
                <div key={a.code} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="font-bold">{a.code}</div>
                  <div className="text-sm text-gray-600 mb-3">{a.name || 'İsimsiz'}</div>
                  <div className="flex gap-2">
                    <button onClick={() => renameAnimal(a.code)} className="flex-1 py-1.5 bg-white border rounded-lg text-xs flex items-center justify-center gap-1"><FaPen /> Düzenle</button>
                    <button 
                      onClick={() => toggleLocationVisibility(a.code)} 
                      className={`flex-1 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 ${a.location_visible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {a.location_visible ? <FaEyeSlash /> : <FaEye />} {a.location_visible ? 'Gizle' : 'Göster'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Sürü Haritası</h3>
              <div className="flex gap-2">
                <button onClick={toggleDrawArea} className={`px-4 py-2 rounded-xl text-white text-sm font-bold ${isDrawingArea ? 'bg-red-500' : 'bg-emerald-600'}`}>
                  {isDrawingArea ? 'İptal Et' : 'Yeni Alan Çiz'}
                </button>
                {isDrawingArea && currentPolygon.length > 0 && (
                  <button onClick={saveArea} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold animate-pulse">
                    Alanı Kaydet ({currentPolygon.length})
                  </button>
                )}
              </div>
            </div>
            
            <div ref={mapContainer} className="w-full rounded-2xl border bg-gray-100 relative overflow-hidden" style={{ height: '600px' }}>
              {mapLoading && <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 font-medium text-gray-500">Harita yükleniyor...</div>}
              {isDrawingArea && (
                <div className="absolute top-4 left-4 z-10 bg-black/70 text-white px-3 py-1.5 rounded-lg text-xs">
                  {currentPolygon.length === 0 ? 'Haritaya tıklayarak ilk noktayı koyun' : `${currentPolygon.length} nokta seçildi.`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Hayvan Sayısını Güncelle</h2>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div><label className="text-sm font-medium">Büyükbaş</label><input name="buyukbas_count" type="number" min="0" value={updateForm.buyukbas_count} onChange={handleUpdateChange} className="w-full p-2 border rounded-lg mt-1" /></div>
              <div><label className="text-sm font-medium">Küçükbaş</label><input name="kucukbas_count" type="number" min="0" value={updateForm.kucukbas_count} onChange={handleUpdateChange} className="w-full p-2 border rounded-lg mt-1" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowUpdateModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-medium">İptal</button>
                <button type="submit" disabled={updateLoading} className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-medium">{updateLoading ? '...' : 'Güncelle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}