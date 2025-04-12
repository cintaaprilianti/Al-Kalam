import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Surah from './pages/Surah';
import Juz from './pages/Juz';
import JuzList from './pages/JuzList';
import Page from './pages/Page';
import PageList from './pages/PageList';
import Ayah from './pages/Ayah';
import Navbar from './components/NavBar';
import BookmarkList from './pages/BookmarkList';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-800 transition-colors duration-200">
      <Navbar />
      <div className="container mx-auto pb-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/surah/:id" element={<Surah />} />
          <Route path="/juz" element={<JuzList />} />
          <Route path="/juz/:id" element={<Juz />} />
          <Route path="/page" element={<PageList />} />
          <Route path="/page/:id" element={<Page />} />
          <Route path="/ayah/:surahId/:ayahNum" element={<Ayah />} />
          <Route path="/bookmarks" element={<BookmarkList />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;