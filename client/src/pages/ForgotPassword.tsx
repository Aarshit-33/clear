import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function ForgotPassword() {
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // For navigation after verification
    const navigate = useNavigate();

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const res = await apiFetch('/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setMessage(data.message || 'OTP sent to your email.');
            setStep('otp');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const res = await apiFetch('/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Navigate to reset password with the token
            navigate(`/reset-password?token=${data.token}`);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="w-full max-w-md p-8 bg-card border border-border rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center">
                    {step === 'email' ? 'Reset Password' : 'Enter OTP'}
                </h1>

                {message && <div className="mb-4 p-3 bg-primary/10 text-primary rounded-lg text-sm">{message}</div>}
                {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

                {step === 'email' ? (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                        <button
                            type="submit"
                            className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            Send OTP
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleOtpSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none tracking-widest text-center text-lg"
                                required
                                placeholder="123456"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            Verify OTP
                        </button>
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setStep('email')}
                                className="text-sm text-muted-foreground hover:text-foreground underline"
                            >
                                Wrong email? Back
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-4 text-center text-sm">
                    <Link to="/login" className="text-muted-foreground hover:text-foreground">Back to Login</Link>
                </div>
            </div>
        </div>
    );
}
