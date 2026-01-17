import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

export default function DumpScreen() {
    const [text, setText] = useState('');
    const [isFlushing, setIsFlushing] = useState(false);

    const mutation = useMutation({
        mutationFn: async (content: string) => {
            const res = await apiFetch('/api/dump', {
                method: 'POST',
                body: JSON.stringify({ content }),
            });
            if (!res.ok) throw new Error('Failed to dump');
            return res.json();
        },
        onSuccess: () => {
            setIsFlushing(true);
            setTimeout(() => {
                setText('');
                setIsFlushing(false);
            }, 500); // Wait for animation
        },
    });

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            mutation.mutate(text);
        }
    };

    return (
        <div className="w-full max-w-2xl relative">
            <AnimatePresence>
                {!isFlushing && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Dump your mind here..."
                            className={cn(
                                "w-full h-64 bg-transparent text-2xl md:text-4xl font-light text-foreground placeholder:text-muted-foreground/20 resize-none focus:outline-none p-4",
                                "caret-primary"
                            )}
                            autoFocus
                        />
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => mutation.mutate(text)}
                                disabled={!text.trim() || mutation.isPending}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                            >
                                {mutation.isPending ? 'Flushing...' : 'Cmd+Enter to Clear'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isFlushing && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <span className="text-muted-foreground text-sm tracking-widest uppercase">Mind Clear</span>
                </motion.div>
            )}
        </div>
    );
}
