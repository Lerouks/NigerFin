import { BrowserRouter, Routes, Route } from 'react-router';
import { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BreakingNews } from './components/BreakingNews';
import { SearchOverlay } from './components/SearchOverlay';
import { HomePage } from './pages/HomePage';
import { ArticlePage } from './pages/ArticlePage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { LegalPage } from './pages/LegalPage';
import { ToolPage } from './pages/ToolPage';
import { navigationSections } from '../data/mock-data';
import { isClerkAvailable, isClerkCheckComplete } from '../lib/clerk-probe';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clerkReady, setClerkReady] = useState(false);
  const [useClerk, setUseClerk] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    let checkClerk: number | null = null;

    // Wait for Clerk probe to complete
    checkClerk = window.setInterval(() => {
      if (!mounted) {
        if (checkClerk) clearInterval(checkClerk);
        return;
      }
      
      if (isClerkCheckComplete()) {
        if (checkClerk) clearInterval(checkClerk);
        setClerkReady(true);
        setUseClerk(isClerkAvailable());
      }
    }, 100);

    return () => {
      mounted = false;
      if (checkClerk) clearInterval(checkClerk);
    };
  }, []);

  const handleLogin = () => {
    if (useClerk) {
      console.log('Using Clerk authentication');
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if (useClerk) {
      console.log('Using Clerk sign out');
    }
    setIsAuthenticated(false);
  };

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <BreakingNews />
          <Header
            sections={navigationSections}
            isAuthenticated={isAuthenticated}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onSearchOpen={() => setSearchOpen(true)}
          />
          <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/article/:slug"
                element={
                  <ArticlePage
                    isAuthenticated={isAuthenticated}
                    onLogin={handleLogin}
                  />
                }
              />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/mentions-legales" element={<LegalPage />} />
              <Route path="/confidentialite" element={<LegalPage />} />
              <Route path="/cgu" element={<LegalPage />} />
              <Route path="/cookies" element={<LegalPage />} />
              <Route path="/publicite" element={<LegalPage />} />
              <Route path="/economie" element={<HomePage />} />
              <Route path="/finance" element={<HomePage />} />
              <Route path="/marches" element={<HomePage />} />
              <Route path="/entreprises" element={<HomePage />} />
              <Route path="/education" element={<HomePage />} />
              <Route path="/outils" element={<HomePage />} />
              <Route path="/outil/:toolSlug" element={<ToolPage />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
