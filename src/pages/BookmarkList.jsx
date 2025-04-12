import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function BookmarkList() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const storedBookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    storedBookmarks.sort((a, b) => new Date(b.date) - new Date(a.date));
    setBookmarks(storedBookmarks);
    setLoading(false);
  }, []);

  const removeBookmark = (surahId, ayahNum) => {
    const updated = bookmarks.filter(b => !(b.surah === surahId && b.ayah === ayahNum));
    setBookmarks(updated);
    localStorage.setItem('bookmarks', JSON.stringify(updated));
  };

  const clearAllBookmarks = () => {
    setBookmarks([]);
    localStorage.setItem('bookmarks', JSON.stringify([]));
    setIsDeleteModalOpen(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          <p className="mt-4 text-gray-300">Memuat bookmarks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-serif font-bold text-white">Bookmarks Anda</h1>
            {bookmarks.length > 0 && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-red-900 to-red-800 text-white rounded-lg shadow-lg hover:from-red-800 hover:to-red-700 transition-all duration-300"
              >
                Hapus Semua
              </button>
            )}
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-gray-800 to-transparent rounded"></div>
        </div>

        {bookmarks.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-semibold mb-3">Belum ada bookmark</h2>
            <p className="text-gray-300 mb-6 max-w-md mx-auto">
              Kamu belum menyimpan ayat mana pun. Tandai ayat saat membaca agar mudah ditemukan kembali di sini.
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-lg shadow-lg hover:from-gray-700 hover:to-gray-600 transition-all duration-300"
            >
              Cari Surah
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((bookmark, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
              >
                <div className="p-5 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-in-out"></div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-yellow-400 mr-2 text-xl">★</span>
                        <Link 
                          to={`/surah/${bookmark.surah}`} 
                          className="font-serif text-xl hover:underline transition-colors"
                        >
                          {bookmark.surahName}
                        </Link>
                        <span className="mx-2 text-gray-500">•</span>
                        <span className="text-gray-300">Ayat {bookmark.ayah}</span>
                      </div>
                      
                      {bookmark.arabName && (
                        <p className="text-lg text-gray-300 font-arabic">{bookmark.arabName}</p>
                      )}
                      
                      {bookmark.date && (
                        <p className="text-xs text-gray-400 mt-2">
                          Disimpan pada {formatDate(bookmark.date)}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/ayah/${bookmark.surah}/${bookmark.ayah}`}
                        className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg shadow hover:from-gray-600 hover:to-gray-500 transition-all duration-300"
                      >
                        Lihat Ayat
                      </Link>
                      <button
                        onClick={() => removeBookmark(bookmark.surah, bookmark.ayah)}
                        className="p-2 bg-gradient-to-r from-gray-700 to-gray-600 text-gray-300 hover:text-red-400 rounded-lg transition-colors duration-300"
                        aria-label="Hapus bookmark"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl shadow-2xl p-6 max-w-md w-full animate-fadeIn">
            <h3 className="text-xl font-serif mb-4">Konfirmasi Hapus</h3>
            <p className="text-gray-300 mb-6">
              Apakah Anda yakin ingin menghapus semua bookmark? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-500 transition-all duration-300"
              >
                Batal
              </button>
              <button
                onClick={clearAllBookmarks}
                className="px-4 py-2 bg-gradient-to-r from-red-900 to-red-800 text-white rounded-lg hover:from-red-800 hover:to-red-700 transition-all duration-300"
              >
                Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-8 right-8">
        <Link
          to="/"
          className="bg-gradient-to-r from-gray-800 to-gray-700 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:from-gray-700 hover:to-gray-600 flex items-center justify-center"
          aria-label="Kembali ke Beranda"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default BookmarkList;