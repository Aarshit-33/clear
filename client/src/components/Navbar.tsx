import { useState } from 'react';
import { Settings as SettingsIcon, LogOut, MessageSquare, LayoutDashboard, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { ModeToggle } from './mode-toggle';
import ConfirmationModal from './ConfirmationModal';

interface NavbarProps {
    onSettingsClick: () => void;
    onHistoryClick: () => void;
    view: 'dump' | 'command';
    setView: (view: 'dump' | 'command') => void;
}

export default function Navbar({ onSettingsClick, onHistoryClick, view, setView }: NavbarProps) {
    const { logout, user } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold tracking-tight text-xl">Clear</span>
                    </div>

                    {/* Center: View Switcher (Desktop) */}
                    <div className="hidden md:flex items-center bg-secondary/50 rounded-full p-1 border border-white/5">
                        <button
                            onClick={() => setView('command')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                                view === 'command'
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Focus
                        </button>
                        <button
                            onClick={() => setView('dump')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                                view === 'dump'
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <MessageSquare className="w-4 h-4" />
                            Dump
                        </button>
                    </div>

                    <div className="flex items-center gap-1 md:gap-4">
                        <span className="text-sm text-muted-foreground mr-2 hidden md:inline-block">{user?.email}</span>
                        <button
                            onClick={onHistoryClick}
                            className="p-2 rounded-full hover:bg-secondary text-foreground transition-colors outline-none"
                            title="History"
                        >
                            <History className="w-[1.2rem] h-[1.2rem]" />
                        </button>
                        <ModeToggle />
                        <button
                            onClick={onSettingsClick}
                            className="p-2 rounded-full hover:bg-secondary text-foreground transition-colors outline-none"
                            title="Settings"
                        >
                            <SettingsIcon className="w-[1.2rem] h-[1.2rem]" />
                        </button>
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors outline-none"
                            title="Logout"
                        >
                            <LogOut className="w-[1.2rem] h-[1.2rem]" />
                        </button>
                    </div>
                </div>

            </nav>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-t border-white/5 flex items-center justify-around z-40 px-6">
                <button
                    onClick={() => setView('command')}
                    className={cn(
                        "flex flex-col items-center gap-1",
                        view === 'command' ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-xs font-medium">Focus</span>
                </button>
                <button
                    onClick={() => setView('dump')}
                    className={cn(
                        "flex flex-col items-center gap-1",
                        view === 'command' ? "text-muted-foreground" : "text-primary"
                    )}
                >
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-xs font-medium">Dump</span>
                </button>
            </div>

            <ConfirmationModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={logout}
                title="Log Out"
                description="Are you sure you want to log out?"
                confirmText="Log Out"
                cancelText="Cancel"
            />
        </>
    );
}
