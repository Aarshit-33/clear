import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, RotateCcw, Pencil, Trash2, X, Save } from "lucide-react";
import { cn } from "../lib/utils";

type Task = {
    id: string;
    canonicalText: string;
    status: 'open' | 'done';
};

interface TaskCardProps {
    task: Task;
    index: number;
    onEdit: (id: string, text: string) => void;
    onDelete: (id: string) => void;
    onTouch: (id: string) => void;
    onDone: (id: string) => void;
    onUndo: (id: string) => void;
}

export default function TaskCard({ task, index, onEdit, onDelete, onTouch, onDone, onUndo }: TaskCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.canonicalText);

    const handleSave = () => {
        onEdit(task.id, editText);
        setIsEditing(false);
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't expand if clicking buttons or input
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;

        if (!isEditing && task.status !== 'done') {
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "group relative border border-border bg-card/50 backdrop-blur-sm transition-all overflow-hidden",
                isExpanded ? "border-primary/50 shadow-lg" : "hover:border-primary/50",
                task.status === 'done' && "opacity-50 grayscale"
            )}
            onClick={handleCardClick}
        >
            <div className="p-6">
                <div className="space-y-2 w-full">
                    <span className="text-xs font-mono text-muted-foreground block">PRIORITY 0{index + 1}</span>

                    {isEditing ? (
                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="bg-background border border-primary text-foreground text-xl font-medium w-full px-2 py-1 outline-none rounded-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSave();
                                    if (e.key === 'Escape') setIsEditing(false);
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button onClick={handleSave} className="p-2 text-primary hover:text-primary/80"><Save className="w-5 h-5" /></button>
                            <button onClick={() => setIsEditing(false)} className="p-2 text-destructive hover:text-destructive/80"><X className="w-5 h-5" /></button>
                        </div>
                    ) : (
                        <h3 className={cn(
                            "text-xl font-medium leading-tight break-words",
                            task.status === 'done' && "line-through decoration-primary"
                        )}>
                            {task.canonicalText}
                        </h3>
                    )}
                </div>
            </div>

            {/* Action Bar - Visible when expanded OR hovered on desktop (optional, but keep simple for now: expand for actions) */}
            <AnimatePresence>
                {(isExpanded || task.status === 'done') && !isEditing && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-secondary/20 border-t border-border/50"
                    >
                        <div className="flex items-center justify-end gap-2 p-3 px-6">
                            {task.status !== 'done' ? (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsExpanded(true); }}
                                        className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground flex items-center gap-2"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        <span className="text-xs">EDIT</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                                        className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-destructive flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="text-xs">ARCHIVE</span>
                                    </button>
                                    <div className="w-px h-6 bg-border mx-2" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onTouch(task.id); }}
                                        className="pl-3 pr-4 py-2 bg-secondary/50 hover:bg-secondary rounded-full text-foreground flex items-center gap-2 transition-colors"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        <span className="text-xs font-bold tracking-wider">TOUCH</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDone(task.id); }}
                                        className="p-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-sm"
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUndo(task.id); }}
                                    className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground flex items-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span className="text-sm">UNDO</span>
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hint for interaction (optional) */}
            {!isExpanded && !isEditing && task.status !== 'done' && (
                <div className="absolute right-4 top-6 opacity-0 md:group-hover:opacity-20 transition-opacity">
                    <span className="text-[10px] uppercase tracking-widest">Expand</span>
                </div>
            )}
        </motion.div>
    );
}
