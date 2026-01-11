import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import DumpScreen from './components/DumpScreen';
import CommandCenter from './components/CommandCenter';
import { motion, AnimatePresence } from 'framer-motion';

const queryClient = new QueryClient();

function Main() {
  const [view, setView] = useState<'dump' | 'command'>('command');

  // Check if we have a focus for today to decide default view?
  // For now, let's just provide a toggle or logic.
  // Logic: If daily focus exists, show Command Center. Else show Dump (or empty state).
  // But user might want to dump anytime.

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* View Switcher (Subtle) */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setView('dump')}
          className={`px-3 py-1 text-xs uppercase tracking-widest transition-colors ${view === 'dump' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Dump
        </button>
        <button
          onClick={() => setView('command')}
          className={`px-3 py-1 text-xs uppercase tracking-widest transition-colors ${view === 'command' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Focus
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === 'dump' ? (
          <motion.div
            key="dump"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
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
import { ModeToggle } from './components/mode-toggle';
import DumpHistory from './components/DumpHistory';
import { Clock } from 'lucide-react';

function App() {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="daily-control-room-theme">
        <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
          <ModeToggle />
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 rounded-full hover:bg-secondary text-foreground transition-colors outline-none"
            title="View History"
          >
            <Clock className="w-[1.2rem] h-[1.2rem]" />
          </button>
        </div>

        <DumpHistory isOpen={showHistory} onClose={() => setShowHistory(false)} />
        <Main />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
