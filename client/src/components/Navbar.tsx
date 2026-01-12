import { Clock, Settings as SettingsIcon } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { cn } from "../lib/utils";

interface NavbarProps {
    view: 'dump' | 'command';
    setView: (view: 'dump' | 'command') => void;
    onHistoryClick: () => void;
    onSettingsClick: () => void;
}

export default function Navbar({ view, setView, onHistoryClick, onSettingsClick }: NavbarProps) {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/40 bg-background/80 backdrop-blur-md px-4 flex items-center justify-between">
            {/* Left: Controls */}
            <div className="flex items-center gap-2">
                <ModeToggle />
                <button
                    onClick={onHistoryClick}
                    className="p-2 rounded-full hover:bg-secondary text-foreground transition-colors outline-none"
                    title="View History"
                >
                    <Clock className="w-[1.2rem] h-[1.2rem]" />
                </button>
                <button
                    onClick={onSettingsClick}
                    className="p-2 rounded-full hover:bg-secondary text-foreground transition-colors outline-none"
                    title="Settings"
                >
                    <SettingsIcon className="w-[1.2rem] h-[1.2rem]" />
                </button>
            </div>

            {/* Center: Logo */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <h1 className="text-xl font-serif font-medium tracking-[0.2em] text-foreground">CLEAR</h1>
            </div>

            {/* Right: Switcher */}
            <div className="flex items-center gap-4 text-xs font-medium tracking-widest">
                <button
                    onClick={() => setView('dump')}
                    className={cn(
                        "transition-colors uppercase",
                        view === 'dump' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Dump
                </button>
                <button
                    onClick={() => setView('command')}
                    className={cn(
                        "transition-colors uppercase",
                        view === 'command' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Focus
                </button>
            </div>
        </nav>
    );
}
