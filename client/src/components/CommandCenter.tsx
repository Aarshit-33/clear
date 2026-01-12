import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import TaskCard from './TaskCard';

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
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

    const { data: focus, isLoading } = useQuery<DailyFocus>({
        queryKey: ['daily-focus'],
        queryFn: async () => {
            const res = await fetch('/api/daily-focus');
            if (!res.ok) throw new Error('Failed to fetch focus');
            return res.json();
        },
    });

    const activityMutation = useMutation({
        mutationFn: async ({ taskId, type }: { taskId: string; type: 'touched' | 'done' | 'undo' }) => {
            const res = await fetch(`/api/task/${taskId}/activity`, {
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

    const refocusMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/daily-focus/refocus', {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to refocus');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-focus'] });
        },
    });

    const editTaskMutation = useMutation({
        mutationFn: async ({ taskId, text }: { taskId: string; text: string }) => {
            const res = await fetch(`/api/task/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ canonicalText: text }),
            });
            if (!res.ok) throw new Error('Failed to update task');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-focus'] });
        },
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async (taskId: string) => {
            const res = await fetch(`/api/task/${taskId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete task');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-focus'] });
            setDeletingTaskId(null);
        },
    });

    if (isLoading) return <div className="text-muted-foreground animate-pulse">Loading Clear...</div>;

    if (!focus || !focus.date) {
        return (
            <div className="text-center space-y-4">
                <h2 className="text-2xl font-light">No Orders for Today</h2>
                <p className="text-muted-foreground">The system is calibrating. Dump your mind to begin.</p>
                <button
                    onClick={() => refocusMutation.mutate()}
                    disabled={refocusMutation.isPending}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {refocusMutation.isPending ? 'CALIBRATING...' : 'ESTABLISH FOCUS'}
                </button>
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
                        className="border-t border-destructive/20 pt-8 mt-12"
                    >
                        <div className="flex items-center gap-3 text-destructive/80 mb-4">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-widest">Neglected Item</span>
                        </div>
                        <p className="text-lg text-muted-foreground line-clamp-1">{focus.avoidedTask.canonicalText}</p>
                    </motion.div>
                )
            }
            {/* Recalibrate Button */}
            <div className="text-center pt-8">
                <button
                    onClick={() => refocusMutation.mutate()}
                    disabled={refocusMutation.isPending}
                    className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
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
        </div >
    );
}
