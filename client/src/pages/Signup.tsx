import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // const apiUrl = import.meta.env.VITE_API_URL || '';
            const apiUrl = 'http://192.168.1.6:3000';
            const res = await fetch(`${apiUrl}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Signup failed');

            login(data.token, data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="w-full max-w-md p-8 bg-card border border-border rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
                {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        Sign Up
                    </button>
                </form>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                    Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
                </div>
            </div>
        </div>
    );
}
