import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GoogleMap,
  LoadScript,
  Marker,
  Polygon,
  DrawingManager
} from '@react-google-maps/api';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../services/api.js';

const mapContainerStyle = { width: '100%', height: '400px' }; // mobil için küçülttüm
const defaultCenter = { lat: 39.93, lng: 32.85 };

export default function Dashboard() {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [token] = useState(localStorage.getItem('token'));
  const [animals, setAnimals] = useState([]);
  const [areas, setAreas] = useState([]);
  const [scanResult, setScanResult] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  const scannerRef = useRef(null);

  // Token yoksa login'e yönlendir (ek güvenlik)
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  // Veri yükleme + abonelik kontrolü
  useEffect(() => {
    const fetchData = async () => {
      try {
        const sub = await api.get('/api/subscriptions/status', token);

        if (sub.status !== 'active' && new Date() > new Date(sub.trial_end)) {
          setIsLocked(true);
          setMonthlyPrice(sub.monthly_price || 0);
          return;
        }

        const animalData = await api.get('/api/animals', token);
        setAnimals(animalData || []);

        const areaData = await api.get('/api/areas', token);
        setAreas(areaData || []);
      } catch (err) {
        setError('Veri çekilemedi veya erişim kısıtlandı: ' + err.message);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  // QR tarama (manuel başlatma)
  useEffect(() => {
    if (!isScanning) return;

    const qr = new Html5Qrcode("qr-reader-container");
    scannerRef.current = qr;

    const startScanner = async () => {
      try {
        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            setScanResult(decodedText);
            setIsScanning(false);
            await qr.stop();
            await qr.clear();

            try {
              await api.post('/api/animals', { code: decodedText }, token);
              const updated = await api.get('/api/animals', token);
              setAnimals(updated || []);
              alert("Hayvan eklendi!");
            } catch (err) {
              alert("Hayvan eklenemedi");
            }
          }
        );
      } catch (err) {
        console.error("QR başlatılamadı:", err);
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      qr.stop().catch(() => {});
    };
  }, [isScanning, token]);

  // Polygon çizme
  const handlePolygonComplete = async (polygon) => {
    if (isLocked) return;

    const path = polygon.getPath().getArray().map(p => ({
      lat: p.lat(),
      lng: p.lng()
    }));

    try {
      await api.post('/api/areas', { polygon: path, name: 'Yeni Mera' }, token);
      const updated = await api.get('/api/areas', token);
      setAreas(updated || []);
      alert('Alan kaydedildi!');
    } catch {
      alert('Alan kaydedilemedi');
    }

    polygon.setMap(null);
  };

  // Ödeme başlatma fonksiyonu
  const startPayment = async () => {
    try {
      const data = await api.post('/api/subscriptions/initialize', {}, token);
      if (data.success && data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl;
      } else {
        alert('Ödeme başlatılamadı');
      }
    } catch (err) {
      alert('Ödeme hatası: ' + err.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Yükleniyor...</div>;
  }

  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl text-center w-full max-w-md">
          <h1 className="text-3xl md:text-4xl font-bold text-red-600 mb-6">Erişim Kısıtlandı</h1>
          <p className="text-lg md:text-xl mb-6">
            Deneme süreniz sona ermiştir.
          </p>
          <p className="text-2xl font-semibold mb-8">
            Aylık ücret: <span className="text-blue-600">{monthlyPrice} TL</span>
          </p>
          <button
            onClick={startPayment}
            className="w-full bg-blue-600 text-white py-4 px-8 rounded-xl text-lg md:text-xl font-bold hover:bg-blue-700 transition"
          >
            Şimdi Ödeme Yap
          </button>
          <p className="mt-6 text-gray-500 text-sm">
            Ödeme sonrası otomatik olarak dashboard’a döneceksiniz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
          Dashboard – {uuid}
        </h1>

        {error && <p className="text-red-600 mb-6 text-center font-medium">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

          {/* SOL KISIM */}
          <div className="space-y-6 md:space-y-8">

            {/* QR Bölümü */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl md:text-2xl font-semibold mb-4">QR ile Hayvan Ekle</h2>

              {!isScanning && (
                <button
                  onClick={() => setIsScanning(true)}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition text-lg"
                >
                  Kamerayı Aç
                </button>
              )}

              <div
                id="qr-reader-container"
                className="w-full mt-4 rounded-lg overflow-hidden border border-gray-300"
                style={{ minHeight: '300px' }}
              />

              {scanResult && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  Okunan kod: <strong>{scanResult}</strong>
                </div>
              )}
            </div>

            {/* Hayvan Listesi */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl md:text-2xl font-semibold mb-4">
                Hayvanlar ({animals.length})
              </h2>

              {animals.length === 0 ? (
                <p className="text-gray-500">Henüz hayvan eklenmemiş.</p>
              ) : (
                <ul className="space-y-3">
                  {animals.map(a => (
                    <li key={a.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="font-medium text-lg">{a.code}</div>
                      <div className="text-sm text-gray-600">
                        Konum: {a.last_lat?.toFixed(4) || '-'}, {a.last_lng?.toFixed(4) || '-'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Ödeme Butonu */}
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <h2 className="text-xl md:text-2xl font-semibold mb-4">Abonelik Durumu</h2>
              <button
                onClick={startPayment}
                className="w-full bg-green-600 text-white py-4 px-8 rounded-xl text-lg md:text-xl font-bold hover:bg-green-700 transition"
              >
                Aboneliği Yenile / Ödeme Yap
              </button>
              <p className="mt-4 text-sm text-gray-500">
                Aylık ücret: {monthlyPrice} TL
              </p>
            </div>

          </div>

          {/* HARİTA */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">Sürü Haritası</h2>

            <LoadScript
              googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
              libraries={['drawing']}
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={13}
              >
                {animals.map(a =>
                  a.last_lat && a.last_lng && (
                    <Marker
                      key={a.id}
                      position={{ lat: a.last_lat, lng: a.last_lng }}
                      title={a.code}
                    />
                  )
                )}

                {areas.map(area =>
                  area.polygon && (
                    <Polygon
                      key={area.id}
                      paths={area.polygon}
                      options={{
                        fillColor: '#00ff0044',
                        fillOpacity: 0.4,
                        strokeColor: '#00aa00',
                        strokeWeight: 2
                      }}
                    />
                  )
                )}

                <DrawingManager
                  drawingMode="polygon"
                  onPolygonComplete={handlePolygonComplete}
                  options={{
                    drawingControl: true,
                    drawingControlOptions: {
                      position: 2, // Google Maps constant: TOP_CENTER
                      drawingModes: ['polygon']
                    },
                    polygonOptions: {
                      editable: true,
                      draggable: true
                    }
                  }}
                />
              </GoogleMap>
            </LoadScript>
          </div>
        </div>
      </div>
    </div>
  );
}