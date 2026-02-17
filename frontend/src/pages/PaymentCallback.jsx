import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenParam = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      if (!tokenParam) {
        alert('Geçersiz ödeme dönüşü');
        navigate('/login');
        return;
      }

      try {
        const result = await api.post('/api/subscriptions/retrieve', { token: tokenParam });

        if (result.success) {
          alert('Ödeme başarılı! Abonelik aktif edildi.');
          // uuid'yi localStorage'dan al (login'de kaydetmiş olman lazım)
          const uuid = localStorage.getItem('uuid') || 'your-uuid-here';
          navigate(`/dashboard/${uuid}`);
        } else {
          alert('Ödeme doğrulanamadı: ' + (result.message || 'Bilinmeyen hata'));
          navigate('/login');
        }
      } catch (err) {
        console.error('Doğrulama hatası:', err);
        alert('Ödeme doğrulama hatası: ' + err.message);
        navigate('/login');
      }
    };

    verify();
  }, [tokenParam, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-12 rounded-2xl shadow-2xl text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Ödeme Doğrulanıyor...</h1>
        <p className="text-lg text-gray-700">Lütfen bekleyin, işlem tamamlanıyor.</p>
      </div>
    </div>
  );
}
