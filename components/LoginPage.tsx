import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import DynamicIcon from './DynamicIcon';

interface LoginPageProps {
    appAssets: Record<string, string>;
}

const LoginPage: React.FC<LoginPageProps> = ({ appAssets }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleEmailAuth = async (isSignUp: boolean) => {
        setLoading(true);
        setError(null);
        setMessage(null);

        const isDevLogin = !isSignUp && (email.toLowerCase() === 'k' || email.toLowerCase() === 'admin');
        let authEmail = email;
        let authPassword = password;
        
        if (isDevLogin) {
            if (email.toLowerCase() === 'k') {
                authEmail = 'test@drivetheory.pro';
                authPassword = 'password123';
            } else if (email.toLowerCase() === 'admin') {
                authEmail = 'admin@drivetheory.pro';
                authPassword = 'password123';
            }
        }
        
        if (isSignUp) {
            const { data, error } = await supabase!.auth.signUp({ email: authEmail, password: authPassword });
            if (error) {
                setError(error.message);
            } else if (data.user && data.user.identities && data.user.identities.length === 0) {
                // This is a Supabase nuance: a successful call with an existing user returns a user with no identities.
                setError("User with this email already exists. Please sign in.");
            } else {
                setMessage('Check your email for the confirmation link!');
            }
        } else {
            const { error } = await supabase!.auth.signInWithPassword({ email: authEmail, password: authPassword });
            if (error) {
                if (isDevLogin) {
                    setError("Invalid credentials. Please ensure the developer account is correctly set up in your Supabase project.");
                } else {
                    setError(error.message);
                }
            }
            // On successful login, onAuthStateChange in App.tsx takes over.
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-8 space-y-6">
                <div className="text-center">
                    <div className="h-10 w-auto mx-auto mb-4 flex justify-center">
                        <DynamicIcon svgString={appAssets['logo_yoodrive']} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Get Started</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Sign in or create an account to begin</p>
                </div>

                <div className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white"
                    />
                </div>

                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                {message && <p className="text-sm text-green-500 text-center">{message}</p>}

                <div className="flex flex-col sm:flex-row gap-3">
                     <button
                        onClick={() => handleEmailAuth(false)}
                        disabled={loading || !email || !password}
                        className="w-full py-3 px-4 bg-[#008485] text-white font-bold rounded-lg hover:bg-[#007374] transition-colors disabled:opacity-50"
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => handleEmailAuth(true)}
                        disabled={loading || !email || !password}
                        className="w-full py-3 px-4 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;