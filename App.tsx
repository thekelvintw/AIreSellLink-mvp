
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ListingContextProvider } from './context/ListingContext';

import UploadPage from './pages/UploadPage';
import DetectPage from './pages/DetectPage';
import CopyPage from './pages/CopyPage';
import PricePage from './pages/PricePage';
import SharePage from './pages/SharePage';
import PublicListingPage from './pages/PublicListingPage';

function App() {
  return (
    <ListingContextProvider>
      <HashRouter>
        <Routes>
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/detect" element={<DetectPage />} />
          <Route path="/copy" element={<CopyPage />} />
          <Route path="/price" element={<PricePage />} />
          <Route path="/share/:slug" element={<SharePage />} />
          <Route path="/p/:slug" element={<PublicListingPage />} />
          <Route path="*" element={<Navigate to="/upload" replace />} />
        </Routes>
      </HashRouter>
    </ListingContextProvider>
  );
}

export default App;
