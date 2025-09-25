import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Page, Theme, AppAssetRecord, AppContextType } from '../types';
import { Toast } from '../components/ui';
import { AuthProvider } from './AuthContext';
import { SocialProvider } from './SocialContext';
import { GameplayProvider } from './GameplayContext';
import { supabase } from '../lib/supabaseClient';

export const AppContext = createContext<AppContextType | undefined>(undefined);

const AppUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

    const handleAssetsUpdate = useCallback(async () => {
        try {
            const { data: assetsData, error: assetsError } = await supabase!.from('app_assets').select('asset_key, asset_value, mime_type');
            if (assetsError) throw assetsError;
            const assetsMap = (assetsData || []).reduce((acc: AppAssetRecord, asset) => {
                acc[asset.asset_key] = { value: asset.asset_value, mimeType: asset.mime_type };
                return acc;
            }, {});
            setAppAssets(assetsMap);
            showToast('Assets updated successfully!');
        } catch (error: any) {
            showToast(`Error reloading assets: ${error.message}`, 'error');
        }
    }, [showToast]);
    
    const value = {
        theme,
        setTheme,
        appAssets,
        setAppAssets, // Pass this down so AuthProvider can set it
        currentPage,
        animationKey,
        navigateTo,
        showToast,
        handleAssetsUpdate
    };

    return (
        <AppContext.Provider value={value as any}>
            {children}
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        </AppContext.Provider>
    );
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <AppUIProvider>
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

// This hook is now for UI-specific context only.
export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) throw new Error('useApp must be used within an AppProvider');
    return context;
};