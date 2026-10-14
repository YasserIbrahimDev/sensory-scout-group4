import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import PlaceDetailsPage from './pages/PlaceDetailsPage';
import ComingSoonPage from './pages/ComingSoonPage';
import NotFoundPage from './pages/NotFoundPage';
import MapPage from './pages/MapPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="places/:placeId" element={<PlaceDetailsPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="favorites" element={<ComingSoonPage title="Favorites" />} />
        <Route path="profile" element={<ComingSoonPage title="Profile" />} />
        <Route path="settings" element={<ComingSoonPage title="Settings" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
