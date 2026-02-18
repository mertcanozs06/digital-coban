import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

export default function RenewalCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        alert('Geçersiz yenileme dönüşü');
        navigate('/login');
        return;
      }

      try {
        const result = await api.post('/api/subscriptions/renew/verify', { token });
        if (result.success) {
          alert('Yenileme başarılı! Abonelik 1 yıl uzatıldı.');
          const uuid = localStorage.getItem('uuid') || 'your-uuid';
          navigate(`/dashboard/${uuid}`);
        } else {
          alert('Yenileme doğrulanamadı');
        }
      } catch (err) {
        alert('Yenileme hatası: ' + err.message);
        navigate('/login');
      }
    };

    verify();
  }, [token, navigate]);

  return <div className="min-h-screen flex items-center justify-center">Yenileme doğrulanıyor...</div>;
}
