import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import DumpScreen from './components/DumpScreen';
import CommandCenter from './components/CommandCenter';
import { motion, AnimatePresence } from 'framer-motion';

const queryClient = new QueryClient();

interface MainProps {
  view: 'dump' | 'command';
}

function Main({ view }: MainProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 pt-20 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'dump' ? (
          <motion.div
            key="dump"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full flex justify-center"
          >
            <DumpScreen />
          </motion.div>
        ) : (
          <motion.div
            key="command"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full flex justify-center"
          >
            <CommandCenter />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { ThemeProvider } from './components/theme-provider';
import DumpHistory from './components/DumpHistory';
import Navbar from './components/Navbar';

function App() {
  const [showHistory, setShowHistory] = useState(false);
  const [view, setView] = useState<'dump' | 'command'>('command');

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="daily-control-room-theme">
        <Navbar
          view={view}
          setView={setView}
          onHistoryClick={() => setShowHistory(true)}
        />

        <DumpHistory isOpen={showHistory} onClose={() => setShowHistory(false)} />
        <Main view={view} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
