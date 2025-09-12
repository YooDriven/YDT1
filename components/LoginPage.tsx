import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { YooDriveLogo } from './icons';

// Google SVG icon for the button
const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C43.021,36.251,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleEmailAuth = async (isSignUp: boolean) => {
        setLoading(true);
        setError(null);
        setMessage(null);
        
        const authMethod = isSignUp 
            ? supabase!.auth.signUp 
            : supabase!.auth.signInWithPassword;
            
        const { error } = await authMethod({ email, password });

        if (error) {
            setError(error.message);
        } else if (isSignUp) {
            setMessage('Check your email for the confirmation link!');
        }
        // On successful login, the onAuthStateChange in App.tsx will take over.
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        const { error } = await supabase!.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-8 space-y-6">
                <div className="text-center">
                    <YooDriveLogo className="h-10 w-auto mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Sign in to continue your journey</p>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center py-3 px-4 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                    <GoogleIcon />
                    Continue with Google
                </button>

                <div className="flex items-center">
                    <hr className="flex-grow border-gray-300 dark:border-slate-600" />
                    <span className="mx-4 text-xs font-medium text-gray-500 dark:text-gray-400">OR</span>
                    <hr className="flex-grow border-gray-300 dark:border-slate-600" />
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
