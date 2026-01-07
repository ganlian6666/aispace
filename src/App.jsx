import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { I18nProvider } from './contexts/I18nContext';
import Home from './pages/Home';
import News from './pages/News';
import VPN from './pages/VPN';
import Guide from './pages/Guide';

function App() {
  return (
    <I18nProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/vpn" element={<VPN />} />
        <Route path="/guide" element={<Guide />} />
      </Routes>
    </I18nProvider>
  );
}

export default App;
