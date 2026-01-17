import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            const res = await apiFetch('/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setMessage('Password reset successful. Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (!token) return <div className="text-center p-10">Invalid or missing token.</div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="w-full max-w-md p-8 bg-card border border-border rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center">New Password</h1>
                {message && <div className="mb-4 p-3 bg-green-500/10 text-green-500 rounded-lg text-sm">{message}</div>}
                {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                            required
                            minLength={6}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        Reset Password
                    </button>
                </form>
            </div>
        </div>
    );
}
