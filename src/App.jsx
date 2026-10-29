import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TripProvider } from './context/TripContext';
import SearchPage from './pages/SearchPage';
import ResultsPage from './pages/ResultsPage';
import DestinationPage from './pages/DestinationPage';
import SavedPage from './pages/SavedPage';
import TripsPage from './pages/TripsPage';
import CreateTripPage from './pages/CreateTripPage';
import TripPage from './pages/TripPage';
import Login from './pages/Login';
import Signup from './pages/Signup';

export default function App() {
  return (
    <TripProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/destination" element={<DestinationPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/new" element={<CreateTripPage />} />
          <Route path="/trip/:id" element={<TripPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </BrowserRouter>
    </TripProvider>
  );
}