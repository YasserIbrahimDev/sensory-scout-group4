import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import PlaceDetailsPage from './pages/PlaceDetailsPage';
import ComingSoonPage from './pages/ComingSoonPage';
import NotFoundPage from './pages/NotFoundPage';

// The map library is large, so it only downloads when someone opens the Map page.
const MapPage = lazy(() => import('./pages/MapPage'));

const mapFallback = (
  <div className="page">
    <p className="status-message" role="status">Loading map…</p>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="places/:placeId" element={<PlaceDetailsPage />} />
        <Route path="map" element={<Suspense fallback={mapFallback}><MapPage /></Suspense>} />
        <Route path="favorites" element={<ComingSoonPage title="Favorites" />} />
        <Route path="profile" element={<ComingSoonPage title="Profile" />} />
        <Route path="settings" element={<ComingSoonPage title="Settings" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
