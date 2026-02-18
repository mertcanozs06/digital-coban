import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../services/api.js';

export default function Dashboard() {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [token] = useState(localStorage.getItem('token'));
  const [animals, setAnimals] = useState([]);
  const [areas, setAreas] = useState([]);
  const [scanResult, setScanResult] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Hayvan güncelleme modalı
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    buyukbas_count: 0,
    kucukbas_count: 0
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  const mapContainer = useRef(null);
  const map = useRef(null);
  const scannerRef = useRef(null);

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
      } catch (err) {
        setError(err.message || 'Veri alınamadı');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token, navigate]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
      center: [32.85, 39.93],
      zoom: 13,
      attributionControl: false
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) map.current.remove();
    };
  }, []);

  useEffect(() => {
    if (!isScanning) return;

    const qr = new Html5Qrcode("qr-reader-container");
    scannerRef.current = qr;

    qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 280 },
      async (decodedText) => {
        setScanResult(decodedText);
        setIsScanning(false);
        await qr.stop();

        try {
          await api.post('/api/animals', { code: decodedText });
          const updated = await api.get('/api/animals');
          setAnimals(updated || []);
          alert("Hayvan başarıyla eklendi!");
        } catch (err) {
          alert("Hayvan eklenemedi");
        }
      }
    ).catch(console.error);

    return () => qr.stop().catch(() => {});
  }, [isScanning]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // ESKİ: Aylık otomatik abonelik başlat
  const startPayment = async () => {
    try {
      const data = await api.post('/api/subscriptions/initialize', {});
      if (data.success && data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl;
      } else {
        alert('Ödeme başlatılamadı');
      }
    } catch (err) {
      alert('Ödeme hatası: ' + err.message);
    }
  };

  // Paketi Yenile (1 yıl uzatma)
  const startRenewal = async () => {
    try {
      const data = await api.post('/api/subscriptions/renew', {});
      if (data.success && data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl;
      } else {
        alert('Yenileme başlatılamadı');
      }
    } catch (err) {
      alert('Yenileme hatası: ' + err.message);
    }
  };

  // Hayvan Sayısı Güncelleme Modal
  const openUpdateModal = () => {
    setUpdateForm({
      buyukbas_count: 0,
      kucukbas_count: 0
    });
    setShowUpdateModal(true);
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm({ ...updateForm, [name]: Number(value) });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      const data = await api.post('/api/subscriptions/update-animals', updateForm);
      if (data.success) {
        alert('Hayvan sayısı güncellendi! Yeni aylık ücret: ' + data.new_monthly_price + ' TL');
        // Subscription bilgisini yeniden çek
        const sub = await api.get('/api/subscriptions/status');
        setSubscriptionInfo(sub);
        setShowUpdateModal(false);
      } else {
        alert('Güncelleme başarısız');
      }
    } catch (err) {
      alert('Güncelleme hatası: ' + err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const getRemainingDays = () => {
    if (!subscriptionInfo) return 0;
    const end = new Date(subscriptionInfo.subscription_end || subscriptionInfo.trial_end);
    const now = new Date();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const remainingDays = getRemainingDays();
  const statusText = subscriptionInfo?.status === 'active' ? 'Aktif Abonelik' : 'Deneme Süresi';
  const endDate = subscriptionInfo?.subscription_end || subscriptionInfo?.trial_end;
  const endDateStr = endDate ? new Date(endDate).toLocaleString('tr-TR') : 'Hesaplanamadı';

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 ">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Digital Çoban</h1>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 ">
            <button
              onClick={startPayment}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm sm:text-base transition"
            >
              Ödeme Yap
            </button>

            <button
              onClick={startRenewal}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm sm:text-base transition"
            >
              Paketi Yenile
            </button>

            <button
              onClick={openUpdateModal}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-sm sm:text-base transition"
            >
              Hayvan Sayısını Güncelle
            </button>

            <button
              onClick={handleLogout}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm sm:text-base transition"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      {/* ABONELİK BİLGİ KUTUSU */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 mb-8 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center sm:text-left">
            <div>
              <p className="text-sm text-gray-600">Durum</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{statusText}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Kalan Süre</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">
                {remainingDays} gün
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bitiş Tarihi</p>
              <p className="text-lg font-medium text-gray-700">{endDateStr}</p>
            </div>
          </div>
        </div>

        {/* ANA İÇERİK */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* SOL KISIM */}
          <div className="space-y-6 lg:space-y-8">
            {/* QR KAMERA */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4">Hayvan Ekle (QR Okut)</h3>
              
              <button
                onClick={() => setIsScanning(!isScanning)}
                className={`w-full py-4 rounded-xl text-white font-medium text-lg transition ${
                  isScanning ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isScanning ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
              </button>

              <div
                id="qr-reader-container"
                className={`w-full rounded-xl overflow-hidden border border-gray-300 ${isScanning ? 'block mt-4' : 'hidden'}`}
                style={{ minHeight: '320px' }}
              />

              {scanResult && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                  Okunan kod: <strong className="font-mono">{scanResult}</strong>
                </div>
              )}
            </div>

            {/* Hayvan Listesi */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4">
                Hayvanlarım ({animals.length})
              </h3>

              {animals.length === 0 ? (
                <p className="text-gray-500 py-10 text-center">Henüz hayvan eklenmemiş.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {animals.map(a => (
                    <div key={a.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-300 transition">
                      <div className="font-mono font-bold text-lg mb-1">{a.code}</div>
                      <div className="text-sm text-gray-600">
                        {a.name && <span className="font-medium">{a.name} • </span>}
                        {a.last_lat ? `${a.last_lat.toFixed(4)}, ${a.last_lng.toFixed(4)}` : 'Konum yok'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* HARİTA */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-right lg:text-left">Sürü Haritası</h3>
            
            <div ref={mapContainer} className="w-full rounded-xl overflow-hidden border border-gray-300" style={{ height: '420px' }} />
          </div>
        </div>
      </div>

      {/* Hayvan Sayısı Güncelleme Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-center">Hayvan Sayısını Güncelle</h2>

            <form onSubmit={handleUpdateSubmit}>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Büyükbaş Sayısı</label>
                <input
                  name="buyukbas_count"
                  type="number"
                  min="0"
                  value={updateForm.buyukbas_count}
                  onChange={handleUpdateChange}
                  className="w-full p-3 border rounded"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Küçükbaş Sayısı</label>
                <input
                  name="kucukbas_count"
                  type="number"
                  min="0"
                  value={updateForm.kucukbas_count}
                  onChange={handleUpdateChange}
                  className="w-full p-3 border rounded"
                />
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded border">
                <p className="text-lg">Yeni Toplam Aylık Ücret: <strong>{updateForm.buyukbas_count * 1200 + updateForm.kucukbas_count * 700} TL</strong></p>
                <p className="text-sm text-gray-600 mt-2">Bu değişiklik o ayki ve sonraki ayların ödemesini etkiler.</p>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50"
                >
                  {updateLoading ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
