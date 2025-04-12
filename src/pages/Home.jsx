import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaInstagram } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';

function Home() {
  const [activeTab, setActiveTab] = useState('surah');
  const [surahs, setSurahs] = useState([]);
  const [juz, setJuz] = useState([]);
  const [pages, setPages] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWithRetry = async (url, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error ${res.status} for ${url}`);
        return await res.json();
      } catch (err) {
        console.error(`Attempt ${i + 1} failed for ${url}:`, err);
        if (i === retries - 1) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const surahData = await fetchWithRetry('http://api.alquran.cloud/v1/surah');
        const surahList = surahData.data.map((s) => ({
          nomor: s.number,
          nama: s.name,
          namaLatin: s.englishName,
          arti: s.englishNameTranslation,
          tempatTurun: s.revelationType,
          jumlahAyat: s.numberOfAyahs,
        }));
        setSurahs(surahList);

        const juzPromises = [];
        for (let i = 1; i <= 30; i++) {
          juzPromises.push(fetchWithRetry(`http://api.alquran.cloud/v1/juz/${i}/quran-uthmani`));
        }
        const juzData = await Promise.all(juzPromises);
        const juzList = juzData.map((data, index) => {
          if (!data.data?.ayahs) {
            console.error(`Invalid Juz ${index + 1} data:`, data);
            return null;
          }
          return {
            number: index + 1,
            ayahs: data.data.ayahs,
            surahName: data.data.ayahs[0]?.surah?.englishName || 'Unknown',
            surahArabic: data.data.ayahs[0]?.surah?.name || 'غير معروف',
            totalAyahs: data.data.ayahs.length,
          };
        }).filter((j) => j !== null);
        setJuz(juzList);

        const pagePromises = [];
        for (let i = 1; i <= 12; i++) {
          pagePromises.push(fetchWithRetry(`http://api.alquran.cloud/v1/page/${i}/quran-uthmani`));
        }
        const pageData = await Promise.all(pagePromises);
        const pageList = pageData.map((data, index) => {
          if (!data.data?.ayahs) {
            console.error(`Invalid Page ${index + 1} data:`, data);
            return null;
          }
          return {
            number: index + 1,
            ayahs: data.data.ayahs,
            surahName: data.data.ayahs[0]?.surah?.englishName || 'Unknown',
            surahArabic: data.data.ayahs[0]?.surah?.name || 'غير معروف',
            ayahNumber: data.data.ayahs[0]?.numberInSurah || 1,
          };
        }).filter((p) => p !== null);
        setPages(pageList);

        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Gagal memuat data: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredSurahs = surahs.filter(
    (s) =>
      s.namaLatin.toLowerCase().includes(search.toLowerCase()) ||
      s.nama.includes(search)
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-serif font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
            Al-Kalam
          </h1>
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-gray-500 to-gray-300 mb-4"></div>
          <p className="text-lg italic text-gray-300 max-w-2xl mx-auto font-light">
            "Bacalah Al-Quran karena ia akan datang sebagai pemberi syafaat bagi para penghafalnya pada hari kiamat."
            <span className="text-sm text-gray-400 mt-2 block font-light">— H.R. Muslim</span>
          </p>
        </div>

        <div className="flex justify-center mb-6">
          {['surah', 'juz', 'page'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 mx-2 text-sm rounded-full transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-white text-black font-semibold'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'surah' && (
          <div className="relative mb-10">
            <div className="flex absolute inset-y-0 left-0 items-center pl-4 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari surah berdasarkan nama..."
              className="w-full p-4 pl-12 rounded-lg border border-gray-700 bg-gray-900 text-white shadow-md focus:ring-2 focus:ring-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
            <p className="mt-4 text-gray-300 font-light">Loading {activeTab}...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <>
            {activeTab === 'surah' && (
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSurahs.length > 0 ? (
                  filteredSurahs.map((surah) => (
                    <li key={surah.nomor}>
                      <Link to={`/surah/${surah.nomor}`} className="block group">
                        <div className="rounded-xl bg-gradient-to-br from-gray-800 to-gray-700 p-5 shadow-lg group-hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-in-out"></div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="w-10 h-10 flex items-center justify-center bg-black bg-opacity-40 text-white rounded-full font-medium">
                              {surah.nomor}
                            </span>
                            <span className="font-arabic text-2xl text-gray-200">{surah.nama}</span>
                          </div>
                          <h2 className="font-serif font-semibold text-xl text-white">{surah.namaLatin}</h2>
                          <div className="flex justify-between items-center mt-3">
                            <p className="text-sm text-gray-300 font-light">{surah.arti}</p>
                            <span className="text-xs text-gray-400 bg-black bg-opacity-30 px-2 py-1 rounded-full">
                              {surah.tempatTurun}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))
                ) : (
                  <p className="text-center text-gray-400 col-span-3">Tidak ada surah yang ditemukan.</p>
                )}
              </ul>
            )}

            {activeTab === 'juz' && (
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {juz.length > 0 ? (
                  juz.map((j) => (
                    <li key={j.number}>
                      <Link to={`/juz/${j.number}`} className="block group">
                        <div className="rounded-xl bg-gradient-to-br from-gray-800 to-gray-700 p-5 shadow-lg hover:shadow-2xl transition-all duration-300">
                          <div className="flex justify-between items-center mb-3">
                            <span className="w-10 h-10 flex items-center justify-center bg-black bg-opacity-40 text-white rounded-full font-medium">
                              {j.number}
                            </span>
                            <span className="font-arabic text-2xl text-gray-200">{j.surahArabic}</span>
                          </div>
                          <h2 className="font-semibold text-xl text-white">Juz {j.number}</h2>
                          <div className="flex justify-between items-center mt-3">
                            <p className="text-sm text-gray-300 font-light">Awal: {j.surahName}</p>
                            <span className="text-xs text-gray-400 bg-black bg-opacity-30 px-2 py-1 rounded-full">
                              {j.totalAyahs} Ayat
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))
                ) : (
                  <p className="text-center text-gray-400 col-span-3">Tidak ada Juz yang ditemukan.</p>
                )}
              </ul>
            )}

            {activeTab === 'page' && (
              <div>
                <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pages.length > 0 ? (
                    pages.map((p) => (
                      <li key={p.number}>
                        <Link to={`/page/${p.number}`} className="block group">
                          <div className="rounded-xl bg-gradient-to-br from-gray-800 to-gray-700 p-5 shadow-lg hover:shadow-2xl transition-all duration-300">
                            <div className="flex justify-between items-center mb-3">
                              <span className="w-10 h-10 flex items-center justify-center bg-black bg-opacity-40 text-white rounded-full font-medium">
                                {p.number}
                              </span>
                              <span className="font-arabic text-2xl text-gray-200">{p.surahArabic}</span>
                            </div>
                            <h2 className="font-semibold text-xl text-white">Halaman {p.number}</h2>
                            <div className="flex justify-between items-center mt-3">
                              <p className="text-sm text-gray-300 font-light">
                                Awal: {p.surahName} ({p.ayahNumber})
                              </p>
                              <span className="text-xs text-gray-400 bg-black bg-opacity-30 px-2 py-1 rounded-full">
                                Surah
                              </span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))
                  ) : (
                    <p className="text-center text-gray-400 col-span-3">Tidak ada halaman yang ditemukan.</p>
                  )}
                </ul>
                <div className="text-center mt-8">
                  <Link
                    to="/page"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-full hover:from-gray-600 hover:to-gray-500 transition-all shadow-lg font-medium"
                  >
                    Lihat Semua Halaman
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

        <footer className="text-center py-10 mt-16 border-t border-gray-800 text-sm text-gray-400">
          <div className="flex justify-center space-x-6 mb-4">
            <a
              href="https://github.com/cintaaprilianti"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-110 transition-transform duration-300"
            >
              <FaGithub className="text-2xl hover:text-white" />
            </a>
            <a
              href="https://instagram.com/cfnta"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-110 transition-transform duration-300"
            >
              <FaInstagram className="text-2xl hover:text-pink-400" />
            </a>
            <a
              href="mailto:cintaapriliantii@gmail.com"
              className="hover:scale-110 transition-transform duration-300"
            >
              <MdEmail className="text-2xl hover:text-gray-200" />
            </a>
          </div>
          <p>© 2025 Al-Kalam. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default Home;