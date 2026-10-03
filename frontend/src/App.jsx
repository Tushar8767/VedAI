import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { HomePage } from './pages/HomePage';
import { ReflectPage } from './pages/ReflectPage';
import { GitaPage } from './pages/GitaPage';
import { PracticePage } from './pages/PracticePage';
import { JournalPage } from './pages/JournalPage';
import { NotesPage } from './pages/NotesPage';
import { JourneyPage } from './pages/JourneyPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { SettingsPage } from './pages/SettingsPage';
import { GamesHomePage } from './features/games/GamesHomePage';

function AppContent() {
  const [currentTab, setTab] = useState('home');
  const [initialPrompt, setInitialPrompt] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('SIGN_IN');
  const [authInitialToken, setAuthInitialToken] = useState('');

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const isResetPath = window.location.pathname.includes('reset-password');
      if (token || isResetPath) {
        if (token) {
          setAuthInitialToken(token);
        }
        setAuthInitialMode('RESET_PASSWORD');
        setAuthModalOpen(true);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  const handleCloseAuth = () => {
    setAuthModalOpen(false);
    setAuthInitialMode('SIGN_IN');
    setAuthInitialToken('');
    // Clean up reset token from browser URL without reloading
    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF8F5]">
      <div>
        <Navbar
          currentTab={currentTab}
          setTab={setTab}
          onOpenAuth={() => setAuthModalOpen(true)}
        />

        <main className="transition-all duration-300">
          {currentTab === 'home' && (
            <HomePage
              setTab={setTab}
              setInitialPrompt={setInitialPrompt}
            />
          )}

          {currentTab === 'reflect' && (
            <ReflectPage
              initialPrompt={initialPrompt}
              setTab={setTab}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          )}

          {currentTab === 'gita' && <GitaPage />}

          {currentTab === 'practice' && (
            <PracticePage onOpenAuth={() => setAuthModalOpen(true)} />
          )}

          {currentTab === 'games' && <GamesHomePage />}

          {currentTab === 'journal' && (
            <JournalPage onOpenAuth={() => setAuthModalOpen(true)} />
          )}

          {currentTab === 'notes' && (
            <NotesPage onOpenAuth={() => setAuthModalOpen(true)} />
          )}

          {currentTab === 'journey' && (
            <JourneyPage onOpenAuth={() => setAuthModalOpen(true)} />
          )}

          {currentTab === 'resources' && <ResourcesPage />}

          {currentTab === 'settings' && (
            <SettingsPage onOpenAuth={() => setAuthModalOpen(true)} />
          )}
        </main>
      </div>

      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        onClose={handleCloseAuth}
        initialMode={authInitialMode}
        initialToken={authInitialToken}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
