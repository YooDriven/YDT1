import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Page, Theme, AppAssetRecord, AppContextType } from '../types';
import { Toast } from '../components/ui';
import type { SupabaseClient } from '@supabase/supabase-js';

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
    supabaseClient: SupabaseClient;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, supabaseClient }) => {
    const [theme, setThemeState] = useState<Theme>(() => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'));
    const [appAssets, setAppAssets] = useState<AppAssetRecord>({});
    const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
    const [animationKey, setAnimationKey] = useState<number>(0);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [assetsLoading, setAssetsLoading] = useState(true);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', newTheme);
    };

    const navigateTo = useCallback((page: Page) => {
        setAnimationKey(prev => prev + 1);
        setCurrentPage(page);
    }, []);
    
    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
    }, []);

    const loadAssets = useCallback(async () => {
        setAssetsLoading(true);
        try {
            const { data: assetsData, error: assetsError } = await supabaseClient.from('app_assets').select('asset_key, asset_value, mime_type');
            if (assetsError) throw assetsError;
            const assetsMap = (assetsData || []).reduce((acc: AppAssetRecord, asset) => {
                acc[asset.asset_key] = { value: asset.asset_value, mimeType: asset.mime_type };
                return acc;
            }, {});
            setAppAssets(assetsMap);
        } catch (error: any) {
            showToast(`Error loading assets: ${error.message}`, 'error');
        } finally {
            setAssetsLoading(false);
        }
    }, [supabaseClient, showToast]);
    
    const value = {
        supabase: supabaseClient,
        theme,
        setTheme,
        appAssets,
        currentPage,
        animationKey,
        navigateTo,
        showToast,
        loadAssets,
        assetsLoading,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) throw new Error('useApp must be used within an AppProvider');
    return context;
};