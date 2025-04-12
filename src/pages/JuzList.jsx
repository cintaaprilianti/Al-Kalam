import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function JuzList() {
  const [juzList, setJuzList] = useState([]);
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

  useEffect(() => {
    const fetchAllJuz = async () => {
      setLoading(true);
      try {
        const juzPromises = [];
        for (let i = 1; i <= 30; i++) {
          juzPromises.push(fetchWithRetry(`https://api.alquran.cloud/v1/juz/${i}/quran-uthmani`));
        }

        const juzData = await Promise.all(juzPromises);
        const allJuz = juzData.map((juzData, index) => {
          if (!juzData.data?.ayahs) {
            console.error(`Data Juz ${index + 1} tidak valid:`, juzData);
            return null;
          }
          return {
            juz: index + 1,
            surahName: juzData.data.ayahs[0]?.surah?.englishName || 'Tidak Diketahui',
            surahArabic: juzData.data.ayahs[0]?.surah?.name || 'غير معروف',
            totalAyahs: juzData.data.ayahs.length,
          };
        }).filter((j) => j !== null);

        setJuzList(allJuz);
        setLoading(false);
      } catch (err) {
        console.error('Error mengambil Juz:', err);
        setError(`Gagal memuat daftar Juz: ${err.message}`);
        setLoading(false);
      }
    };

    fetchAllJuz();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-center text-4xl font-bold font-serif mb-10 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
          Daftar Juz
        </h1>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
            <p className="mt-4 text-gray-300 font-light">Memuat daftar Juz...</p>
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
            {juzList.map((j) => (
              <li key={j.juz} className="group">
                <Link to={`/juz/${j.juz}`} className="block">
                  <div className="rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 relative">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-in-out"></div>
                    <div className="p-5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="w-10 h-10 flex items-center justify-center bg-black bg-opacity-40 text-white rounded-full font-medium">
                          {j.juz}
                        </span>
                        <span className="font-arabic text-2xl text-gray-200">{j.surahArabic}</span>
                      </div>
                      <h2 className="font-serif font-semibold text-xl text-white">Juz {j.juz}</h2>
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-sm text-gray-300 font-light">Awal: {j.surahName}</p>
                        <span className="text-xs text-gray-400 bg-black bg-opacity-30 px-2 py-1 rounded-full">
                          {j.totalAyahs} Ayat
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

export default JuzList;