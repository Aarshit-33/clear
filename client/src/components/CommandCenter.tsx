import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

type Task = {
    id: string;
    canonicalText: string;
    status: 'open' | 'done';
};

type DailyFocus = {
    date: string;
    dailyDirective: string;
    topTask1: Task | null;
    topTask2: Task | null;
    topTask3: Task | null;
    avoidedTask: Task | null;
};

export default function CommandCenter() {
    const queryClient = useQueryClient();

    const { data: focus, isLoading } = useQuery<DailyFocus>({
        queryKey: ['daily-focus'],
        queryFn: async () => {
            const res = await fetch('http://localhost:3000/api/daily-focus');
            if (!res.ok) throw new Error('Failed to fetch focus');
            return res.json();
        },
    });

    const activityMutation = useMutation({
        mutationFn: async ({ taskId, type }: { taskId: string; type: 'touched' | 'done' }) => {
            const res = await fetch(`http://localhost:3000/api/task/${taskId}/activity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            });
            if (!res.ok) throw new Error('Failed to update activity');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-focus'] });
        },
    });

    if (isLoading) return <div className="text-muted-foreground animate-pulse">Loading Clear...</div>;

    if (!focus || !focus.date) {
        return (
            <div className="text-center space-y-4">
                <h2 className="text-2xl font-light">No Orders for Today</h2>
                <p className="text-muted-foreground">The system is calibrating. Dump your mind to begin.</p>
            </div>
        );
    }

    const tasks = [focus.topTask1, focus.topTask2, focus.topTask3].filter(Boolean) as Task[];

    return (
        <div className="w-full max-w-3xl p-6 space-y-12">
            {/* Header */}
            <header className="text-center space-y-2">
                <h1 className="text-sm uppercase tracking-[0.3em] text-muted-foreground">{focus.date}</h1>
                <p className="text-2xl md:text-3xl font-serif italic text-primary">"{focus.dailyDirective}"</p>
            </header>

            {/* Top 3 Tasks */}
            <div className="space-y-6">
                {tasks.map((task, index) => (
                    <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                            "group relative p-6 border border-border bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50",
                            task.status === 'done' && "opacity-50 grayscale"
                        )}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <span className="text-xs font-mono text-muted-foreground">PRIORITY 0{index + 1}</span>
                                <h3 className={cn("text-xl font-medium", task.status === 'done' && "line-through decoration-primary")}>
                                    {task.canonicalText}
                                </h3>
                            </div>

                            {task.status !== 'done' && (
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => activityMutation.mutate({ taskId: task.id, type: 'touched' })}
                                        className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground"
                                        title="Touched (In Progress)"
                                    >
                                        <span className="text-xs font-bold">TOUCH</span>
                                    </button>
                                    <button
                                        onClick={() => activityMutation.mutate({ taskId: task.id, type: 'done' })}
                                        className="p-2 hover:bg-primary hover:text-primary-foreground rounded-full transition-colors"
                                        title="Done"
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Avoided Task */}
            {focus.avoidedTask && focus.avoidedTask.status !== 'done' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="border-t border-destructive/20 pt-8 mt-12"
                >
                    <div className="flex items-center gap-3 text-destructive/80 mb-4">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-widest">Neglected Item</span>
                    </div>
                    <p className="text-lg text-muted-foreground line-clamp-1">{focus.avoidedTask.canonicalText}</p>
                </motion.div>
            )}
        </div>
    );
}
