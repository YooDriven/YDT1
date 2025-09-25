import React, { useState } from 'react';
import DynamicAsset from './DynamicAsset';
import { Button, Input } from './ui';
import { AppAssetRecord } from '../types';
import { useApp } from '../contexts/AppContext';

interface LoginPageProps {
    appAssets: AppAssetRecord;
}

const LoginPage: React.FC<LoginPageProps> = ({ appAssets }) => {
    const { supabase } = useApp();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const validateForm = () => {
        let isValid = true;
        if (!email) {
            setEmailError("Email cannot be empty.");
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError("Please enter a valid email address.");
            isValid = false;
        } else {
            setEmailError(null);
        }

        if (!password) {
            setPasswordError("Password cannot be empty.");
            isValid = false;
        } else if (password.length < 6) {
            setPasswordError("Password must be at least 6 characters long.");
            isValid = false;
        } else {
            setPasswordError(null);
        }
        return isValid;
    };

    const handleEmailAuth = async (isSignUp: boolean) => {
        if (!validateForm()) return;

        setLoading(true);
        setFormError(null);
        setMessage(null);

        if (isSignUp) {
            const { data, error } = await supabase.auth.signUp({ email, password });

            if (error) {
                setFormError(error.message);
            } else if (data.user && data.user.identities && data.user.identities.length === 0) {
                setFormError("User with this email already exists. Please sign in.");
            } else if (data.session) {
                setMessage("Sign up successful! Redirecting...");
            } else {
                setMessage('Account created! Please check your email to verify your account. For a smoother development experience, you can disable "Confirm email" in your Supabase project\'s Auth settings.');
            }
        } else { // Sign in logic
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setFormError(error.message);
            }
        }

        setLoading(false);
    };

    const handleOneClickLogin = async (role: 'user' | 'admin') => {
        setLoading(true);
        setFormError(null);
        setMessage(null);

        const loginEmail = role === 'admin' ? 'admin@example.com' : 'user@example.com';
        const loginPassword = 'password123';

        // 1. Try to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: loginPassword
        });

        if (signInError) {
            // 2. If sign-in fails, check if it's because the user doesn't exist
            if (signInError.message === 'Invalid login credentials') {
                setMessage(`Developer account not found. Attempting to create it...`);
                // 3. Try to sign up the user instead
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: loginEmail,
                    password: loginPassword,
                    options: {
                        data: {
                            // This data goes into the auth.users.user_metadata column
                            role: role,
                            full_name: role === 'admin' ? 'Admin' : 'Test User'
                        }
                    }
                });

                if (signUpError) {
                    // If sign-up also fails (e.g., password policy), show that error
                    setFormError(`Failed to create developer account for ${role}: ${signUpError.message}`);
                    setMessage(null);
                } else {
                    // Sign up successful. onAuthStateChange will handle the login.
                    if (signUpData.session) {
                        setMessage("Developer account created and logged in successfully!");
                    } else {
                        // This case happens if email verification is ON
                        setMessage(`Developer account for '${role}' created. Please check for a verification email.`);
                    }
                }
            } else {
                // For other sign-in errors (network, etc.), just show them.
                setFormError(`Login failed: ${signInError.message}`);
            }
        }
        // If signInError is null, the user is logged in automatically by the onAuthStateChange listener.

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8 space-y-6 animate-fadeInUp">
                <div className="text-center">
                    <div className="h-10 w-auto mx-auto mb-4 flex justify-center">
                        <DynamicAsset asset={appAssets['logo_yoodrive']} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Get Started</h2>
                    <p className="mt-2 text-base text-gray-600 dark:text-gray-400">Sign in or create an account to begin</p>
                </div>

                <div className="space-y-4">
                    <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={validateForm}
                        error={emailError || undefined}
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={validateForm}
                        error={passwordError || undefined}
                    />
                </div>

                {formError && <p className="text-sm text-red-500 text-center">{formError}</p>}
                {message && <p className="text-sm text-gray-600 dark:text-gray-400 text-center">{message}</p>}

                <div className="flex flex-col sm:flex-row gap-3">
                     <Button
                        onClick={() => handleEmailAuth(false)}
                        disabled={loading}
                        variant="primary"
                        className="w-full !py-3"
                    >
                        Sign In
                    </Button>
                    <Button
                        onClick={() => handleEmailAuth(true)}
                        disabled={loading}
                        variant="secondary"
                        className="w-full !py-3"
                    >
                        Sign Up
                    </Button>
                </div>

                <div className="relative pt-4">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300 dark:border-slate-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                            For Testing
                        </span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={() => handleOneClickLogin('user')}
                        disabled={loading}
                        variant="outline"
                        className="w-full !py-3"
                    >
                        Login as User
                    </Button>
                    <Button
                        onClick={() => handleOneClickLogin('admin')}
                        disabled={loading}
                        variant="outline"
                        className="w-full !py-3"
                    >
                        Login as Admin
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default LoginPage;