import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Page, Theme, AppAssetRecord, AppContextType } from '../types';
import { Toast } from '../components/ui';
import { AuthProvider, useAuth } from './AuthContext';
import { SocialProvider, useSocial } from './SocialContext';
import { GameplayProvider, useGameplay } from './GameplayContext';

// FIX: Export AppContext so it can be used by other providers within the composition root.
export const AppContext = createContext<AppContextType | undefined>(undefined);

const AppUIProvider: React.FC<{
    children: ReactNode;
    setAppState: (state: string) => void;
    setErrorMessage: (msg: string) => void;
}> = ({ children, setAppState, setErrorMessage }) => {
    const [theme, setThemeState] = useState<Theme>(() => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'));
    const [appAssets, setAppAssets] = useState<AppAssetRecord>({});
    const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
    const [animationKey, setAnimationKey] = useState<number>(0);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', newTheme);
    };

    const navigateTo = (page: Page) => {
        setAnimationKey(prev => prev + 1);
        setCurrentPage(page);
    };
    
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
    };
    
    const value = {
        theme,
        setTheme,
        appAssets,
        setAppAssets, // Pass this down so AuthProvider can set it
        currentPage,
        animationKey,
        navigateTo,
        showToast,
        setAppState, // Pass this down for AuthProvider
        setErrorMessage,
    };

    return (
        <AppContext.Provider value={value as any}>
            {children}
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        </AppContext.Provider>
    );
};

export const AppProvider: React.FC<{ 
    children: ReactNode;
    setAppState: (state: string) => void,
    setErrorMessage: (msg: string) => void 
}> = ({ children, setAppState, setErrorMessage }) => {
    return (
        <AppUIProvider setAppState={setAppState} setErrorMessage={setErrorMessage}>
            <AuthProvider>
                <SocialProvider>
                    <GameplayProvider>
                        {children}
                    </GameplayProvider>
                </SocialProvider>
            </AuthProvider>
        </AppUIProvider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
    
    // This hook will now be a composition of all hooks
    // For simplicity and to avoid breaking existing components immediately,
    // let's provide a composite object.
    // A better long-term solution is to refactor components to use specific hooks.
    const auth = useAuth();
    const social = useSocial();
    const gameplay = useGameplay();
    
    return {
        ...context,
        ...auth,
        ...social,
        ...gameplay,
    };
};
