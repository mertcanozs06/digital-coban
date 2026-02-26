import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

export default function RenewalCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Geçersiz yenileme dönüşü");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      try {
        const response = await api.post(
          "/api/subscriptions/renew/verify",
          { token }
        );

        if (response.data.success) {
          setStatus("success");
          setMessage("Yenileme başarılı! Aboneliğiniz 1 yıl uzatıldı.");

          const uuid = localStorage.getItem("uuid");
          setTimeout(() => {
            navigate(`/dashboard/${uuid}`);
          }, 2500);
        } else {
          setStatus("error");
          setMessage(response.data.message || "Yenileme doğrulanamadı");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Yenileme hatası oluştu");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl p-8 rounded-xl text-center">
        {status === "loading" && <h2>Yenileme doğrulanıyor...</h2>}
        {status === "success" && (
          <>
            <h2 className="text-green-600 font-bold text-xl">Başarılı</h2>
            <p>{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <h2 className="text-red-600 font-bold text-xl">Hata</h2>
            <p>{message}</p>
          </>
        )}
      </div>
    </div>
  );
}