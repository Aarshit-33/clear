import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { apiFetch } from '../lib/api';

type DumpEntry = {
    id: string;
    content: string;
    createdAt: string;
    processed: boolean;
};

type DumpHistoryProps = {
    isOpen: boolean;
    onClose: () => void;
};

export default function DumpHistory({ isOpen, onClose }: DumpHistoryProps) {
    const { data: dumps, isLoading } = useQuery<DumpEntry[]>({
        queryKey: ['dumps'],
        queryFn: async () => {
            const res = await apiFetch('/api/dumps');
            if (!res.ok) throw new Error('Failed to fetch dumps');
            return res.json();
        },
        enabled: isOpen, // Only fetch when open
    });

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="fixed inset-y-0 right-0 z-[100] w-full max-w-md bg-card border-l border-border shadow-2xl p-6 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-muted-foreground" />
                                Dump History
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-secondary rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {isLoading ? (
                                <div className="text-center py-10 text-muted-foreground">Loading history...</div>
                            ) : dumps?.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">No dumps recorded yet.</div>
                            ) : (
                                dumps?.map((dump) => (
                                    <div key={dump.id} className="p-4 rounded-lg bg-secondary/30 border border-border/50 text-sm space-y-2">
                                        <p className="text-foreground/90 whitespace-pre-wrap">{dump.content}</p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{formatDistanceToNow(new Date(dump.createdAt))} ago</span>
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider",
                                                dump.processed ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                            )}>
                                                {dump.processed ? "Processed" : "Pending"}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
