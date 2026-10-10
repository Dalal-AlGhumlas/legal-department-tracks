import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { ProgramStoreProvider } from './services/programStore';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { DiscoverPage } from './pages/DiscoverPage';
import { TrackDetailPage } from './pages/TrackDetailPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';

export function App() {
  return (
    <LanguageProvider>
      <ProgramStoreProvider>
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/tracks/:slug" element={<TrackDetailPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </ProgramStoreProvider>
    </LanguageProvider>
  );
}

export default App;
