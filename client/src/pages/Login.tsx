import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Login failed');

            login(data.token, data.user);
            toast({
                title: "Welcome back!",
                description: "Logged in successfully",
            });
            navigate('/');
        } catch (err: any) {
            setError(err.message);
            toast({
                title: "Login failed",
                description: err.message,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="w-full max-w-md p-8 bg-card border border-border rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
                {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-3 text-base focus:ring-2 focus:ring-primary outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-3 text-base focus:ring-2 focus:ring-primary outline-none"
                            required
                        />
                    </div>
                    <div className="text-right mb-4">
                        <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot Password?</Link>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity active:scale-95"
                    >
                        Login
                    </button>
                </form>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                    Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
                </div>
            </div>
        </div>
    );
}
