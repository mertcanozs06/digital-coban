import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-blue-700 text-white p-6">
        <h1 className="text-4xl font-bold">Digital Çoban</h1>
        <p className="mt-2">Hayvanlarınızı akıllı tasmalarla takip edin, yönlendirin, koruyun.</p>
      </header>

      <main className="max-w-5xl mx-auto p-8">
        <section className="my-12">
          <h2 className="text-3xl font-semibold mb-6">Nasıl Çalışır?</h2>
          <ul className="list-disc pl-6 space-y-3 text-lg">
            <li>QR kodlu tasmalarla hayvan ekleyin</li>
            <li>Haritada alan (polygon) belirleyin</li>
            <li>Hayvan alan dışına çıkarsa sesli uyarı</li>
            <li>Gelecekte: ısı, geviş, adım sensörleri...</li>
          </ul>
        </section>

        <section className="my-12 bg-white p-8 rounded-xl shadow">
          <h2 className="text-3xl font-semibold mb-6">Fiyatlandırma</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border p-6 rounded-lg">
              <h3 className="text-2xl font-bold">Büyükbaş</h3>
              <p className="text-4xl my-4">1.200 TL <span className="text-xl">/ hayvan / ay</span></p>
            </div>
            <div className="border p-6 rounded-lg">
              <h3 className="text-2xl font-bold">Küçükbaş</h3>
              <p className="text-4xl my-4">700 TL <span className="text-xl">/ hayvan / ay</span></p>
            </div>
          </div>
          <p className="mt-6 text-center text-xl font-medium">İlk **90 gün tamamen ücretsiz!**</p>
        </section>

        <div className="text-center my-12">
          <Link to="/register" className="inline-block bg-green-600 text-white px-10 py-4 text-xl rounded-lg hover:bg-green-700">
            Hemen Üye Ol
          </Link>
          <Link to="/login" className="inline-block ml-6 text-blue-700 underline text-xl">
            Giriş Yap
          </Link>
        </div>
      </main>
    </div>
  );
}
