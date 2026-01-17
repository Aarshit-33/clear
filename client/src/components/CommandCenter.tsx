import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import TaskCard from './TaskCard';
import { apiFetch } from '../lib/api';
import { useToast } from '../context/ToastContext';

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
    topTask4: Task | null;
    topTask5: Task | null;
    avoidedTask: Task | null;
};

export default function CommandCenter({ onNavigateToDump }: { onNavigateToDump: () => void }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

    const { data: focus, isLoading } = useQuery<DailyFocus>({
        queryKey: ['daily-focus'],
        queryFn: async () => {
            const res = await apiFetch('/api/daily-focus');
            if (!res.ok) throw new Error('Failed to fetch focus');
            return res.json();
        },
    });

    const activityMutation = useMutation({
        mutationFn: async ({ taskId, type }: { taskId: string; type: 'touched' | 'done' | 'undo' }) => {
            const res = await apiFetch(`/api/task/${taskId}/activity`, {
                method: 'POST',
                body: JSON.stringify({ type }),
            });
            if (!res.ok) throw new Error('Failed to update activity');
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['daily-focus'] });
            if (variables.type === 'done') {
                toast({ title: 'Task Complete', description: 'Good job.', variant: 'success' });
            } else if (variables.type === 'undo') {
                toast({ title: 'Undone', description: 'Task reopened.', variant: 'default' });
            }
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
        }
    });

    const refocusMutation = useMutation({
        mutationFn: async () => {
            const res = await apiFetch('/api/daily-focus/refocus', {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to refocus');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-focus'] });
            toast({ title: 'Recalibrated', description: 'Focus map updated.', variant: 'default' });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to recalibrate', variant: 'destructive' });
        }
    });

    const editTaskMutation = useMutation({
        mutationFn: async ({ taskId, text }: { taskId: string; text: string }) => {
            const res = await apiFetch(`/api/task/${taskId}`, {
                method: 'PATCH',
                body: JSON.stringify({ canonicalText: text }),
            });
            if (!res.ok) throw new Error('Failed to update task');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-focus'] });
            toast({ title: 'Updated', description: 'Task text saved.', variant: 'success' });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to save edits', variant: 'destructive' });
        }
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async (taskId: string) => {
            const res = await apiFetch(`/api/task/${taskId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete task');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-focus'] });
            setDeletingTaskId(null);
            toast({ title: 'Archived', description: 'Task removed from focus.', variant: 'default' });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to archive task', variant: 'destructive' });
        }
    });

    if (isLoading) return <div className="text-muted-foreground animate-pulse">Loading Clear...</div>;

    if (!focus || !focus.date) {
        return (
            <div className="flex flex-col items-center justify-center p-4 md:p-8 max-w-lg mx-auto text-center space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-[60vh]">
                <div className="space-y-4">
                    <h2 className="text-3xl md:text-4xl font-light tracking-tight text-primary">Welcome to Clear</h2>
                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed px-4">
                        A workspace for your mind. <br />
                        <span className="text-foreground font-medium">Dump</span> everything. <span className="text-foreground font-medium">Focus</span> on what matters.
                    </p>
                </div>

                <div className="grid gap-4 w-full max-w-xs">
                    <button
                        onClick={onNavigateToDump}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl shadow-lg hover:shadow-primary/20 hover:-translate-y-1 transition-all font-medium text-lg flex items-center justify-center gap-2 active:scale-95"
                    >
                        <span>Start Brain Dump</span>
                        <span className="opacity-70">→</span>
                    </button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
                    </div>

                    <button
                        onClick={() => refocusMutation.mutate()}
                        disabled={refocusMutation.isPending}
                        className="w-full py-3 bg-secondary/50 text-secondary-foreground rounded-lg hover:bg-secondary transition-colors text-sm font-medium active:scale-95"
                    >
                        {refocusMutation.isPending ? 'Generating Protocol...' : 'I have tasks, Establish Focus'}
                    </button>
                </div>

                <p className="text-xs text-muted-foreground max-w-xs mx-auto pt-4 border-t border-border/50">
                    Your daily focus is generated from your brain dump. New day, new focus.
                </p>
            </div>
        );
    }

    const tasks = [focus.topTask1, focus.topTask2, focus.topTask3, focus.topTask4, focus.topTask5].filter(Boolean) as Task[];

    return (
        <div className="w-full max-w-3xl p-4 md:p-6 space-y-8 md:space-y-12">
            {/* Header */}
            <header className="text-center space-y-2">
                <h1 className="text-xs md:text-sm uppercase tracking-[0.3em] text-muted-foreground">{focus.date}</h1>
                <p className="text-xl md:text-3xl font-serif italic text-primary px-2">"{focus.dailyDirective}"</p>
            </header>

            {/* Top 3 Tasks */}
            <div className="space-y-4 md:space-y-6">
                {tasks.map((task, index) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onEdit={(id, text) => editTaskMutation.mutate({ taskId: id, text })}
                        onDelete={(id) => setDeletingTaskId(id)}
                        onTouch={(id) => activityMutation.mutate({ taskId: id, type: 'touched' })}
                        onDone={(id) => activityMutation.mutate({ taskId: id, type: 'done' })}
                        onUndo={(id) => activityMutation.mutate({ taskId: id, type: 'undo' })}
                    />
                ))}
            </div>

            {/* Avoided Task */}
            {
                focus.avoidedTask && focus.avoidedTask.status !== 'done' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="border-t border-destructive/20 pt-6 md:pt-8 mt-8 md:mt-12"
                    >
                        <div className="flex items-center gap-3 text-destructive/80 mb-4">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-widest">Neglected Item</span>
                        </div>
                        <p className="text-base md:text-lg text-muted-foreground line-clamp-2 md:line-clamp-1">{focus.avoidedTask.canonicalText}</p>
                    </motion.div>
                )
            }
            {/* Recalibrate Button */}
            <div className="text-center pt-4 md:pt-8 pb-16 md:pb-0">
                <button
                    onClick={() => refocusMutation.mutate()}
                    disabled={refocusMutation.isPending}
                    className="py-3 px-6 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 active:bg-secondary/50 rounded-lg"
                >
                    {refocusMutation.isPending ? 'RECALIBRATING...' : 'RECALIBRATE PROTOCOL'}
                </button>
            </div>

            <ConfirmationModal
                isOpen={!!deletingTaskId}
                onClose={() => setDeletingTaskId(null)}
                onConfirm={() => deletingTaskId && deleteTaskMutation.mutate(deletingTaskId)}
                title="Archive Task"
                description="Are you sure you want to archive this task? It will be removed from your daily focus."
                confirmText="Archive"
            />
        </div>
    );
}
