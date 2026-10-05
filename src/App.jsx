import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import ResultsPage from './pages/ResultsPage';
import DestinationPage from './pages/DestinationPage';
import WeatherCard from './components/WeatherCard';
<WeatherCard lat={-1.268} lon={36.807} />

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/destination" element={<DestinationPage />} />
      </Routes>
    </BrowserRouter>
  );
}