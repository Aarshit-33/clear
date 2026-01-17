
import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../lib/utils';

export type ToastVariant = 'default' | 'destructive' | 'success';

interface Toast {
    id: string;
    title?: string;
    description?: string;
    variant: ToastVariant;
}

interface ToastContextType {
    toast: (props: { title?: string; description?: string; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback(({ title, description, variant = 'default' }: { title?: string; description?: string; variant?: ToastVariant }) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: Toast = { id, title, description, variant };

        setToasts((prev) => {
            const updated = [...prev, newToast];
            // Limit to 2 on mobile, 3 on desktop
            const maxToasts = window.innerWidth < 768 ? 2 : 3;
            if (updated.length > maxToasts) {
                return updated.slice(-maxToasts);
            }
            return updated;
        });

        // Auto dismiss
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-0 right-0 z-[100] p-4 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={cn(
                                "pointer-events-auto relative w-full overflow-hidden rounded-lg border p-4 shadow-lg pr-8",
                                t.variant === 'default' && "bg-background border-border text-foreground",
                                t.variant === 'destructive' && "bg-destructive text-destructive-foreground border-destructive",
                                t.variant === 'success' && "bg-green-600 text-white border-green-600"
                            )}
                        >
                            <div className="grid gap-1">
                                {t.title && <div className="text-sm font-semibold">{t.title}</div>}
                                {t.description && <div className="text-sm opacity-90">{t.description}</div>}
                            </div>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="absolute right-2 top-2 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
                            >
                                ✕
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
