import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function Ayah() {
  const { surahId, ayahNum } = useParams();
  const [ayahData, setAyahData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarks, setBookmarks] = useState(() => JSON.parse(localStorage.getItem('bookmarks')) || []);
  const navigate = useNavigate();
  const [scrollVisible, setScrollVisible] = useState(false);

  useEffect(() => {
    const fetchAyah = async () => {
      try {
        setLoading(true);

        const editions = 'quran-uthmani,id.indonesian';
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/editions/${editions}`);

        if (!res.ok) throw new Error('Failed to fetch data');

        const data = await res.json();
        const arabicVerses = data.data[0].ayahs;
        const indoVerses = data.data[1].ayahs;

        const ayahIndex = parseInt(ayahNum, 10) - 1;
        if (ayahIndex < 0 || ayahIndex >= arabicVerses.length) {
          throw new Error('Invalid ayah number');
        }

        const arabic = arabicVerses[ayahIndex];
        const indo = indoVerses[ayahIndex];

        const processedData = {
          surahName: data.data[0].englishName,
          surahArabicName: data.data[0].name,
          ayahNumber: arabic.numberInSurah,
          totalAyahs: arabicVerses.length,
          globalAyahNumber: arabic.number,
          arabic: arabic.text,
          translations: [
            { language: 'Indonesian', text: indo.text }
          ]
        };

        setAyahData(processedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching ayah:', err);
        setError('Gagal memuat data ayat. Silakan coba lagi nanti.');
        setLoading(false);
      }
    };

    fetchAyah();
  }, [surahId, ayahNum]);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const handleScroll = () => {
      if (window.pageYOffset > 300) {
        setScrollVisible(true);
      } else {
        setScrollVisible(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [surahId, ayahNum]);

  const isBookmarked = bookmarks.some(b => b.surah === surahId && b.ayah === ayahNum);

  const toggleBookmark = () => {
    let updated = [...bookmarks];
    if (isBookmarked) {
      updated = updated.filter(b => !(b.surah === surahId && b.ayah === ayahNum));
    } else {
      updated.push({ 
        surah: surahId, 
        ayah: ayahNum,
        surahName: ayahData.surahName,
        arabName: ayahData.surahArabicName,
        date: new Date().toISOString()
      });
    }
    setBookmarks(updated);
    localStorage.setItem('bookmarks', JSON.stringify(updated));
  };

  const navigateToPrevAyah = () => {
    if (ayahData.ayahNumber > 1) {
      navigate(`/ayah/${surahId}/${ayahData.ayahNumber - 1}`);
    } else if (parseInt(surahId) > 1) {
      navigate(`/surah/${parseInt(surahId) - 1}`);
    }
  };

  const navigateToNextAyah = () => {
    if (ayahData.ayahNumber < ayahData.totalAyahs) {
      navigate(`/ayah/${surahId}/${ayahData.ayahNumber + 1}`);
    } else if (parseInt(surahId) < 114) {
      navigate(`/surah/${parseInt(surahId) + 1}`);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          <p className="mt-4 text-gray-300">Memuat ayat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center bg-black text-white min-h-screen">
        <p className="text-red-400 mb-4">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded hover:from-gray-700 hover:to-gray-600 shadow-lg transition-all duration-300"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link 
            to={`/surah/${surahId}`}
            className="text-gray-300 hover:text-white inline-flex items-center transition-colors duration-300 mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Kembali ke Surah</span>
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold mb-1">{ayahData.surahName}</h1>
            <h2 className="text-2xl font-arabic mb-2">{ayahData.surahArabicName}</h2>
            <div className="inline-block px-4 py-1 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full text-sm">
              Ayat {ayahData.ayahNumber} dari {ayahData.totalAyahs}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl shadow-xl overflow-hidden mb-6 transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-1 group">
          <div className="flex justify-between items-center p-4 border-b border-gray-600">
            <div className="text-sm text-gray-300">#{ayahData.globalAyahNumber}</div>
            <button
              onClick={toggleBookmark}
              className={`text-2xl transition-all duration-300 transform hover:scale-110 ${isBookmarked ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-300'}`}
            >
              {isBookmarked ? '★' : '☆'}
            </button>
          </div>

          <div className="p-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-in-out"></div>
            <p className="text-right text-3xl leading-loose font-arabic">{ayahData.arabic}</p>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-800">
            <audio 
              controls 
              className="w-full h-12 rounded overflow-hidden"
              src={`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahData.globalAyahNumber}.mp3`}
            >
              Browser Anda tidak mendukung elemen audio.
            </audio>
          </div>

          <div className="p-6 bg-gradient-to-r from-gray-700 to-gray-800 border-t border-gray-600">
            <h3 className="uppercase tracking-wider text-xs font-bold text-gray-400 mb-3">Terjemahan</h3>
            {ayahData.translations.map((translation, index) => (
              <div key={index} className="mb-4">
                <div className="inline-block bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full mb-2">
                  {translation.language}
                </div>
                <p className="text-gray-100 text-lg leading-relaxed whitespace-pre-line">
                  {translation.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between space-x-4 mb-8">
          <button
            onClick={navigateToPrevAyah}
            disabled={ayahData.ayahNumber === 1 && surahId === '1'}
            className={`px-4 py-3 rounded-lg flex items-center flex-1 justify-center transition-all duration-300 ${
              ayahData.ayahNumber === 1 && surahId === '1'
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-gray-800 to-gray-700 text-white hover:from-gray-700 hover:to-gray-600 shadow-lg hover:shadow-xl'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Ayat Sebelumnya
          </button>
          <button
            onClick={navigateToNextAyah}
            disabled={ayahData.ayahNumber === ayahData.totalAyahs && surahId === '114'}
            className={`px-4 py-3 rounded-lg flex items-center flex-1 justify-center transition-all duration-300 ${
              ayahData.ayahNumber === ayahData.totalAyahs && surahId === '114'
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-gray-800 to-gray-700 text-white hover:from-gray-700 hover:to-gray-600 shadow-lg hover:shadow-xl'
            }`}
          >
            Ayat Selanjutnya
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Link 
            to={parseInt(surahId) > 1 ? `/surah/${parseInt(surahId) - 1}` : '#'}
            className={`p-4 text-center rounded-lg transition-all duration-300 ${
              parseInt(surahId) > 1
                ? 'bg-gradient-to-br from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 shadow-md'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            <div className="text-sm text-gray-400">Surah Sebelumnya</div>
            {parseInt(surahId) > 1 ? (
              <div className="text-lg font-serif">{parseInt(surahId) - 1}</div>
            ) : (
              <div className="text-lg">-</div>
            )}
          </Link>
          
          <Link 
            to={parseInt(surahId) < 114 ? `/surah/${parseInt(surahId) + 1}` : '#'}
            className={`p-4 text-center rounded-lg transition-all duration-300 ${
              parseInt(surahId) < 114
                ? 'bg-gradient-to-br from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 shadow-md'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            <div className="text-sm text-gray-400">Surah Selanjutnya</div>
            {parseInt(surahId) < 114 ? (
              <div className="text-lg font-serif">{parseInt(surahId) + 1}</div>
            ) : (
              <div className="text-lg">-</div>
            )}
          </Link>
        </div>
      </div>

      {scrollVisible && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-gray-800 to-gray-700 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:from-gray-700 hover:to-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Ayah;