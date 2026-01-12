import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Settings({ onClose }: { onClose: () => void }) {
    const [dailyFocusCount, setDailyFocusCount] = useState('3');
    const [originalFocusCount, setOriginalFocusCount] = useState('3');
    const [dailyDirective, setDailyDirective] = useState('');
    const [originalDirective, setOriginalDirective] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        fetch(`${apiUrl}/api/settings`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch settings');
                return res.json();
            })
            .then(data => {
                const count = data.daily_focus_count || '3';
                const directive = data.daily_directive || 'Focus on what matters. Ignore the noise.';
                setDailyFocusCount(count);
                setOriginalFocusCount(count);
                setDailyDirective(directive);
                setOriginalDirective(directive);
            })
            .catch(err => {
                console.error("Error loading settings:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const apiUrl = import.meta.env.VITE_API_URL || '';
        try {
            await fetch(`${apiUrl}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'daily_focus_count', value: dailyFocusCount }),
            });
            await fetch(`${apiUrl}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'daily_directive', value: dailyDirective }),
            });

            // Auto-regenerate if count or directive changed
            if (dailyFocusCount !== originalFocusCount || dailyDirective !== originalDirective) {
                await fetch(`${apiUrl}/api/daily-focus/refocus`, { method: 'POST' });
                window.location.reload(); // Reload to show new layout
            } else {
                onClose();
            }

        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerate = async () => {
        if (!confirm('This will wipe the current "Daily Focus" and generate a new one based on the current open tasks. Are you sure?')) return;

        setRegenerating(true);
        const apiUrl = import.meta.env.VITE_API_URL || '';
        try {
            await fetch(`${apiUrl}/api/daily-focus/refocus`, { method: 'POST' });
            onClose();
            window.location.reload(); // Quick refresh to show new state
        } catch (error) {
            console.error('Failed to regenerate:', error);
        } finally {
            setRegenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
            >
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Settings</h2>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
                    </div>

                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading settings...</div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Daily Focus Count</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={dailyFocusCount}
                                    onChange={(e) => setDailyFocusCount(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                                <p className="text-xs text-muted-foreground">How many top tasks to select for the day.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Daily Directive</label>
                                <textarea
                                    value={dailyDirective}
                                    onChange={(e) => setDailyDirective(e.target.value)}
                                    rows={3}
                                    className="w-full bg-background border border-border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                                />
                                <p className="text-xs text-muted-foreground">Your daily motivational text.</p>
                            </div>

                            <div className="pt-4 border-t border-border">
                                <h3 className="text-sm font-medium text-destructive mb-3">Danger Zone</h3>
                                <button
                                    onClick={handleRegenerate}
                                    disabled={regenerating}
                                    className="w-full py-2 px-4 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {regenerating ? 'Regenerating...' : 'Force Regenerate Day'}
                                </button>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Resets today's focus and re-runs the selection algorithm.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-muted/50 border-t border-border flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
