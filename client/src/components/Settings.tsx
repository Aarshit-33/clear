import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '../lib/api';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';

export default function Settings({ onClose }: { onClose: () => void }) {
    const [dailyFocusCount, setDailyFocusCount] = useState('3');
    const [originalFocusCount, setOriginalFocusCount] = useState('3');
    const [dailyDirective, setDailyDirective] = useState('');
    const [originalDirective, setOriginalDirective] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [countError, setCountError] = useState('');
    const { toast } = useToast();

    // Profile Management State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Delete Account State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');

    const handleCountChange = (value: string) => {
        setDailyFocusCount(value);
        if (value === '') {
            setCountError('Value is required');
            return;
        }
        const num = parseInt(value);
        if (isNaN(num) || num < 1 || num > 5) {
            setCountError('Must be between 1 and 5');
        } else {
            setCountError('');
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            toast({ title: 'Error', description: 'Both fields required', variant: 'destructive' });
            return;
        }
        if (newPassword.length < 6) {
            toast({ title: 'Error', description: 'New password too short (min 6 chars)', variant: 'destructive' });
            return;
        }

        try {
            const res = await apiFetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast({ title: 'Success', description: 'Password updated successfully', variant: 'success' });
            setCurrentPassword('');
            setNewPassword('');
        } catch (e: any) {
            toast({ title: 'Failed', description: e.message, variant: 'destructive' });
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteError('');
        if (!deletePassword) {
            setDeleteError('Password required');
            return;
        }

        if (!confirm('FINAL WARNING: This will permanently delete your account and all data. This cannot be undone.')) return;

        try {
            const res = await apiFetch('/api/account', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: deletePassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast({ title: 'Account Deleted', description: 'Goodbye friend.', variant: 'default' });

            // Force logout and reload
            localStorage.removeItem('token');
            window.location.href = '/login';
        } catch (e: any) {
            setDeleteError(e.message);
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await apiFetch('/api/settings');
                if (!res.ok) throw new Error('Failed to fetch settings');

                const data = await res.json();

                const count = data.daily_focus_count || '3';
                const directive = data.daily_directive || 'Focus on what matters. Ignore the noise.';
                setDailyFocusCount(count);
                setOriginalFocusCount(count);
                setDailyDirective(directive);
                setOriginalDirective(directive);
            } catch (error) {
                console.error("Error loading settings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async () => {
        if (countError) return;
        setSaving(true);
        try {
            await apiFetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'daily_focus_count', value: dailyFocusCount }),
            });
            await apiFetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'daily_directive', value: dailyDirective }),
            });

            // Auto-regenerate if count or directive changed
            if (dailyFocusCount !== originalFocusCount || dailyDirective !== originalDirective) {
                setRegenerating(true);
                toast({ title: 'Settings Saved', description: 'Regenerating daily focus...', variant: 'default' });
                await apiFetch('/api/daily-focus/refocus', { method: 'POST' });
                window.location.reload(); // Reload to show new layout
            } else {
                toast({ title: 'Settings Saved', description: 'Your preferences have been updated.', variant: 'success' });
                onClose();
            }

        } catch (error: any) {
            console.error('Failed to save settings:', error);
            toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerate = async () => {
        if (!confirm('Are you sure? This will delete existing daily focus and re-score tasks.')) return;

        setRegenerating(true);
        try {
            await apiFetch('/api/daily-focus/refocus', { method: 'POST' });
            toast({ title: 'Regenerated', description: 'Daily focus has been reset.', variant: 'success' });
            onClose();
            window.location.reload(); // Quick refresh to show new state
        } catch (error) {
            console.error('Failed to regenerate:', error);
            toast({ title: 'Error', description: 'Failed to regenerate focus', variant: 'destructive' });
            setRegenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full md:h-auto md:max-w-md bg-card border-0 md:border border-border rounded-none md:rounded-xl shadow-2xl my-0 md:my-8 flex flex-col"
            >
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Settings</h2>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2">✕</button>
                    </div>

                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading settings...</div>
                    ) : (
                        <div className="space-y-8 pb-8">
                            {/* General Settings */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">General</h3>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Daily Focus Count</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={dailyFocusCount}
                                        onChange={(e) => handleCountChange(e.target.value)}
                                        className={cn(
                                            "w-full bg-background border rounded-lg p-3 text-base focus:ring-2 focus:ring-primary focus:outline-none",
                                            countError ? "border-destructive focus:ring-destructive" : "border-border"
                                        )}
                                    />
                                    {countError && <p className="text-xs text-destructive">{countError}</p>}
                                    <p className="text-xs text-muted-foreground">How many top tasks to select for the day.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Daily Directive</label>
                                    <textarea
                                        value={dailyDirective}
                                        onChange={(e) => setDailyDirective(e.target.value)}
                                        rows={3}
                                        className="w-full bg-background border border-border rounded-lg p-3 text-base focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground">Your daily motivational text.</p>
                                </div>
                            </div>

                            {/* ... (rest of the content handled by existing code structure, just wrapping the container) ... */}
                            {/* Account Security */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Security</h3>
                                <div className="space-y-3">
                                    <input
                                        type="password"
                                        placeholder="Current Password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg p-3 text-base focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                    <input
                                        type="password"
                                        placeholder="New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg p-3 text-base focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                    <button
                                        onClick={handleChangePassword}
                                        className="w-full py-3 bg-secondary text-secondary-foreground rounded-lg text-base font-medium hover:bg-secondary/80 transition-colors"
                                    >
                                        Update Password
                                    </button>
                                </div>
                            </div>

                            {/* Privacy & Data */}
                            <div className="pt-4 border-t border-border">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Privacy & Data</h3>
                                <div className="space-y-3 mt-4">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const res = await apiFetch('/api/export');
                                                if (!res.ok) throw new Error('Failed to export data');
                                                const blob = await res.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `clear-data-${new Date().toISOString().split('T')[0]}.json`;
                                                document.body.appendChild(a);
                                                a.click();
                                                window.URL.revokeObjectURL(url);
                                                document.body.removeChild(a);
                                                toast({ title: 'Export Complete', description: 'Your data has been downloaded.', variant: 'success' });
                                            } catch (e) {
                                                console.error(e);
                                                toast({ title: 'Export Failed', description: 'Could not download data.', variant: 'destructive' });
                                            }
                                        }}
                                        className="w-full py-3 px-4 bg-secondary/50 text-foreground hover:bg-secondary rounded-lg text-base font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>Download My Data</span>
                                        <span className="text-xs opacity-50">(JSON)</span>
                                    </button>
                                    <p className="text-xs text-muted-foreground">
                                        Download a copy of all your dumps, tasks, and settings.
                                    </p>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="pt-4 border-t border-border">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-destructive mb-3">Danger Zone</h3>
                                <div className="space-y-4">
                                    <div>
                                        <button
                                            onClick={handleRegenerate}
                                            disabled={regenerating}
                                            className="w-full py-3 px-4 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 rounded-lg text-base font-medium transition-colors"
                                        >
                                            {regenerating ? 'Regenerating...' : 'Force Regenerate Day'}
                                        </button>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Resets today's focus and re-runs the selection algorithm.
                                        </p>
                                    </div>

                                    <div>
                                        {!showDeleteConfirm ? (
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="w-full py-3 px-4 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg text-base font-medium transition-colors"
                                            >
                                                Delete Account
                                            </button>
                                        ) : (
                                            <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5 space-y-3">
                                                <p className="text-xs font-bold text-destructive">Enter password to confirm deletion:</p>
                                                <input
                                                    type="password"
                                                    placeholder="Password"
                                                    value={deletePassword}
                                                    onChange={(e) => setDeletePassword(e.target.value)}
                                                    className="w-full bg-background border border-destructive/30 rounded p-3 text-base"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(false)}
                                                        className="flex-1 py-2 bg-background border border-border rounded text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleDeleteAccount}
                                                        className="flex-1 py-2 bg-destructive text-destructive-foreground rounded text-sm font-bold"
                                                    >
                                                        Confirm Delete
                                                    </button>
                                                </div>
                                                {deleteError && <p className="text-xs text-destructive font-bold">{deleteError}</p>}
                                            </div>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Permanently delete your account and all data.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-muted/50 border-t border-border flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-base font-medium hover:opacity-90 transition-opacity"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
