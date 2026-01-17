import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import DumpScreen from './components/DumpScreen';
import CommandCenter from './components/CommandCenter';


const queryClient = new QueryClient();



import { ThemeProvider } from './components/theme-provider';
import DumpHistory from './components/DumpHistory';

import Navbar from './components/Navbar';

import Settings from './components/Settings';

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
}

function Dashboard() {
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [view, setView] = useState<'dump' | 'command'>('command');

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans selection:bg-primary/20">
      <Navbar
        onSettingsClick={() => setShowSettings(true)}
        onHistoryClick={() => setShowHistory(true)}
        view={view}
        setView={setView}
      />

      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        {view === 'command' ? <CommandCenter onNavigateToDump={() => setView('dump')} /> : <DumpScreen />}
      </main>

      <DumpHistory isOpen={showHistory} onClose={() => setShowHistory(false)} />
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="daily-control-room-theme">
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
