import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

function Juz() {
  const { id } = useParams();
  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarks, setBookmarks] = useState(() => JSON.parse(localStorage.getItem('bookmarks')) || []);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [translations, setTranslations] = useState({});
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const navigate = useNavigate();
  const ayahRefs = useRef({});

  const availableLanguages = [
    { code: 'ar', name: 'Arab', edition: 'quran-uthmani' },
    { code: 'id', name: 'Indonesia', edition: 'id.indonesian' },
    { code: 'en', name: 'English', edition: 'en.sahih' },
    { code: 'fr', name: 'Français', edition: 'fr.hamidullah' },
    { code: 'tr', name: 'Türkçe', edition: 'tr.ates' },
    { code: 'ur', name: 'اردو', edition: 'ur.jalandhry' },
  ];

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
    const fetchJuz = async () => {
      const juzId = parseInt(id);
      if (isNaN(juzId) || juzId < 1 || juzId > 30) {
        setError('ID Juz tidak valid');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetchWithRetry(`http://api.alquran.cloud/v1/juz/${juzId}/quran-uthmani`);
        if (!res.data?.ayahs) throw new Error('Data Juz tidak valid');

        const juzAyahs = res.data.ayahs;
        const ayahData = juzAyahs.map((a) => ({
          arab: a.text,
          number: a.numberInSurah,
          globalAyahNumber: a.number,
          surahNumber: a.surah.number,
          surahName: a.surah.englishName,
          surahArabic: a.surah.name,
        }));

        setAyahs(ayahData);
        setLoading(false);
      } catch (err) {
        console.error('Error mengambil Juz:', err);
        setError(`Gagal memuat Juz ${juzId}: ${err.message}`);
        setLoading(false);
      }
    };

    fetchJuz();
  }, [id]);

  const fetchTranslation = async (languageCode) => {
    try {
      setLoadingTranslation(true);
      if (translations[languageCode]) {
        setSelectedLanguage(languageCode);
        setLoadingTranslation(false);
        return;
      }

      const language = availableLanguages.find((lang) => lang.code === languageCode);
      if (!language) throw new Error('Bahasa tidak tersedia');

      const res = await fetchWithRetry(`http://api.alquran.cloud/v1/juz/${id}/${language.edition}`);
      if (!res.data?.ayahs) throw new Error(`Gagal mengambil terjemahan ${language.name}`);

      const translationData = res.data.ayahs.reduce((acc, ayah, index) => {
        acc[index] = ayah.text;
        return acc;
      }, {});

      setTranslations((prev) => ({
        ...prev,
        [languageCode]: translationData,
      }));
      setSelectedLanguage(languageCode);
      setLoadingTranslation(false);
    } catch (err) {
      console.error('Error mengambil terjemahan:', err);
      setLoadingTranslation(false);
    }
  };

  const toggleBookmark = (ayahIndex) => {
    const ayah = ayahs[ayahIndex];
    let updated = [...bookmarks];
    const exists = updated.find(
      (b) => b.juz === id && b.globalAyahNumber === ayah.globalAyahNumber
    );

    if (exists) {
      updated = updated.filter(
        (b) => !(b.juz === id && b.globalAyahNumber === ayah.globalAyahNumber)
      );
    } else {
      updated.push({
        juz: id,
        globalAyahNumber: ayah.globalAyahNumber,
        surahNumber: ayah.surahNumber,
        surahName: ayah.surahName,
        surahArabic: ayah.surahArabic,
        ayahNumber: ayah.number,
        date: new Date().toISOString(),
      });
    }

    setBookmarks(updated);
    localStorage.setItem('bookmarks', JSON.stringify(updated));
  };

  const togglePlayAll = () => {
    if (isPlaying) {
      setCurrentIndex(null);
      setIsPlaying(false);
    } else {
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    let audio;
    if (currentIndex !== null && ayahs[currentIndex]) {
      if (ayahRefs.current[ayahs[currentIndex].globalAyahNumber]) {
        ayahRefs.current[ayahs[currentIndex].globalAyahNumber].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }

      audio = new Audio(
        `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahs[currentIndex].globalAyahNumber}.mp3`
      );

      audio.play().catch((e) => {
        console.warn('Error pemutaran audio:', e);
        setIsPlaying(false);
      });

      audio.onended = () => {
        if (currentIndex + 1 < ayahs.length) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setIsPlaying(false);
          setCurrentIndex(null);
        }
      };
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.onended = null;
      }
    };
  }, [currentIndex, ayahs]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          <p className="mt-4 text-gray-300 font-light">Memuat Juz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/juz')}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
          >
            Kembali ke Daftar Juz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400 font-light px-3 py-1 bg-black bg-opacity-30 rounded-full">
              Juz {id} • {ayahs.length} Ayat
            </span>
            <button
              onClick={() => navigate('/juz')}
              className="text-gray-300 hover:text-white hover:underline transition-colors text-sm flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Kembali ke Daftar Juz
            </button>
          </div>
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-serif font-bold mb-4 text-white">Juz {id}</h1>
            <div className="h-0.5 w-24 bg-gradient-to-r from-gray-500 to-gray-300 mb-6"></div>
            <button
              onClick={togglePlayAll}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-full hover:from-gray-600 hover:to-gray-500 transition-all shadow-lg"
            >
              {isPlaying ? (
                <>
                  <span className="mr-2 text-lg">■</span>
                  <span>Berhenti</span>
                </>
              ) : (
                <>
                  <span className="mr-2 text-lg">▶</span>
                  <span>Putar Semua Ayat</span>
                </>
              )}
            </button>
            {isPlaying && currentIndex !== null && (
              <div className="mt-4 text-center text-sm text-gray-400">
                Sedang memutar ayat {currentIndex + 1} dari {ayahs.length}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-5 mb-8">
          <h3 className="text-lg font-medium mb-4 text-center text-gray-300">Pilih Bahasa</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setSelectedLanguage(null)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                selectedLanguage === null
                  ? 'bg-white text-black font-medium shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Hanya Arab
            </button>
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => fetchTranslation(lang.code)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  selectedLanguage === lang.code
                    ? 'bg-white text-black font-medium shadow-lg'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
          {loadingTranslation && (
            <div className="flex justify-center mt-4">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span className="ml-2 text-sm text-gray-400">Memuat terjemahan...</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {ayahs.map((ayah, index) => {
            const isBookmarked = bookmarks.find(
              (b) => b.juz === id && b.globalAyahNumber === ayah.globalAyahNumber
            );
            const isCurrentlyPlaying = currentIndex === index && isPlaying;
            const translationText =
              selectedLanguage && translations[selectedLanguage]
                ? translations[selectedLanguage][index]
                : null;

            return (
              <div
                key={ayah.globalAyahNumber}
                ref={(el) => (ayahRefs.current[ayah.globalAyahNumber] = el)}
                className={`bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl shadow-lg overflow-hidden relative group transition-all ${
                  isCurrentlyPlaying ? 'ring-2 ring-white ring-opacity-50' : ''
                }`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-in-out"></div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center">
                      <span
                        className={`w-10 h-10 flex items-center justify-center ${
                          isCurrentlyPlaying
                            ? 'bg-white text-black'
                            : 'bg-black bg-opacity-40 text-gray-300'
                        } rounded-full font-medium text-sm transition-colors`}
                      >
                        {ayah.number}
                      </span>
                      <button
                        onClick={() => {
                          if (isCurrentlyPlaying) {
                            setIsPlaying(false);
                            setCurrentIndex(null);
                          } else {
                            setCurrentIndex(index);
                            setIsPlaying(true);
                          }
                        }}
                        className={`ml-3 p-2 rounded-full ${
                          isCurrentlyPlaying
                            ? 'bg-white text-black'
                            : 'bg-gray-900 text-gray-400 hover:text-white'
                        }`}
                      >
                        {isCurrentlyPlaying ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => toggleBookmark(index)}
                      className={`text-2xl ${
                        isBookmarked ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'
                      } transition-colors`}
                    >
                      {isBookmarked ? '★' : '☆'}
                    </button>
                  </div>
                  <p className="text-right text-2xl leading-loose font-arabic mb-6 text-gray-200">
                    {ayah.arab}
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    Surah {ayah.surahName} ({ayah.surahArabic}) - Ayat {ayah.number}
                  </p>
                  {translationText && (
                    <div className="text-gray-300 border-t border-gray-700 pt-4 leading-relaxed">
                      {translationText}
                    </div>
                  )}
                  <div className="mt-6 pt-3 border-t border-gray-700 flex justify-between items-center">
                    <button
                      onClick={() => {
                        if (selectedLanguage) {
                          setSelectedLanguage(null);
                        } else {
                          fetchTranslation('id');
                        }
                      }}
                      className="text-gray-400 hover:text-white transition-colors text-sm flex items-center"
                    >
                      {selectedLanguage ? (
                        <span>Sembunyikan terjemahan</span>
                      ) : (
                        <span>Tampilkan terjemahan</span>
                      )}
                    </button>
                    <Link
                      to={`/surah/${ayah.surahNumber}`}
                      className="flex items-center text-gray-400 hover:text-white transition-colors text-sm group"
                    >
                      <span>Lihat Surah</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-between items-center">
          <Link
            to={`/juz/${Math.max(1, parseInt(id) - 1)}`}
            className={`px-4 py-2 rounded-lg bg-gradient-to-br from-gray-800 to-gray-700 text-gray-300 hover:text-white transition-colors shadow-md flex items-center ${
              parseInt(id) <= 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={(e) => parseInt(id) <= 1 && e.preventDefault()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Juz Sebelumnya
          </Link>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-2 rounded-full bg-gradient-to-br from-gray-800 to-gray-700 text-gray-300 hover:text-white transition-colors shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <Link
            to={`/juz/${Math.min(30, parseInt(id) + 1)}`}
            className={`px-4 py-2 rounded-lg bg-gradient-to-br from-gray-800 to-gray-700 text-gray-300 hover:text-white transition-colors shadow-md flex items-center ${
              parseInt(id) >= 30 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={(e) => parseInt(id) >= 30 && e.preventDefault()}
          >
            Juz Selanjutnya
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Juz;