import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');  // iyzico callback'te gelebilir

  useEffect(() => {
    const verifyPayment = async () => {
      if (!token) {
        alert('Geçersiz dönüş');
        navigate('/dashboard/your-uuid');
        return;
      }

      try {
        const result = await api.post('/api/subscriptions/retrieve', { token });
        if (result.success) {
          alert('Ödeme başarılı! Aboneliğiniz aktif.');
        } else {
          alert('Ödeme başarısız veya beklemede.');
        }
      } catch (err) {
        alert('Doğrulama hatası');
      } finally {
        navigate('/dashboard/your-uuid');  // veya dinamik uuid
      }
    };

    verifyPayment();
  }, [token, navigate]);

  return <div className="p-10 text-center">Ödeme işlemi kontrol ediliyor...</div>;
}
