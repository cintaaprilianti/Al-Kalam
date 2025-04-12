import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function PageList() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWithRetry = async (url, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error ${res.status} untuk ${url}`);
        return await res.json();
      } catch (err) {
        console.error(`Percobaan ${i + 1} gagal untuk ${url}:`, err);
        if (i === retries - 1) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    const fetchAllPages = async () => {
      setLoading(true);
      try {
        const totalPages = 604;
        const batchSize = 50;
        const allPages = [];

        for (let start = 1; start <= totalPages; start += batchSize) {
          const end = Math.min(start + batchSize - 1, totalPages);
          const pagePromises = [];
          for (let i = start; i <= end; i++) {
            pagePromises.push(fetchWithRetry(`https://api.alquran.cloud/v1/page/${i}/quran-uthmani`));
          }

          const batchData = await Promise.all(pagePromises);
          const batchPages = batchData.map((pageData, index) => {
            if (!pageData.data?.ayahs) {
              console.error(`Data Halaman ${start + index} tidak valid:`, pageData);
              return null;
            }
            return {
              page: start + index,
              surahName: pageData.data.ayahs[0]?.surah?.englishName || 'Tidak Diketahui',
              surahArabic: pageData.data.ayahs[0]?.surah?.name || 'غير معروف',
              ayahNumber: pageData.data.ayahs[0]?.numberInSurah || 1,
            };
          }).filter((p) => p !== null);

          allPages.push(...batchPages);

          if (end < totalPages) {
            await delay(1000);
          }
        }

        setPages(allPages);
        setLoading(false);
      } catch (err) {
        console.error('Error mengambil halaman:', err);
        setError(`Gagal memuat daftar halaman: ${err.message}`);
        setLoading(false);
      }
    };

    fetchAllPages();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-center text-4xl font-bold font-serif mb-10 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
          Halaman Al-Qur'an
        </h1>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
            <p className="mt-4 text-gray-300 font-light">Memuat daftar halaman...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((p) => (
              <li key={p.page} className="group">
                <Link to={`/page/${p.page}`} className="block">
                  <div className="rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 relative">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-in-out"></div>
                    <div className="p-5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="w-10 h-10 flex items-center justify-center bg-black bg-opacity-40 text-white rounded-full font-medium">
                          {p.page}
                        </span>
                        <span className="font-arabic text-2xl text-gray-200">{p.surahArabic}</span>
                      </div>
                      <h2 className="font-serif font-semibold text-xl text-white">Halaman {p.page}</h2>
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-sm text-gray-300 font-light">
                          Awal: {p.surahName} ({p.ayahNumber})
                        </p>
                        <span className="text-xs text-gray-400 bg-black bg-opacity-30 px-2 py-1 rounded-full">
                          Surah
                        </span>
                      </div>
                    </div>
                    <div className="h-1 w-full bg-gradient-to-r from-gray-600 to-gray-400"></div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default PageList;