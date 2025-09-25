import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from 'https://esm.sh/@supabase/supabase-js@2';
import { UserProfile, Badge, TestAttempt, BattleHistoryEntry, AuthContextType, AppAssetRecord } from '../types';
import { DAILY_GOAL_TARGET } from '../constants';
// FIX: Import AppContext directly to be used with useContext.
import { AppContext } from './AppContext'; 

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    
    // This is a bit of a prop drill, but it's contained to the context composition root
    const appContext = useContext(AppContext);
    if (!appContext) throw new Error("AuthProvider must be used within AppUIProvider");
    const { setAppState, setErrorMessage, setAppAssets, showToast } = appContext as any;

    useEffect(() => {
        setAppState('AUTH_CHECKING');
        const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (!session) {
                setUserProfile(null);
                setLoading(false);
                setAppState('UNAUTHENTICATED');
            } else {
                await loadInitialData(session);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadInitialData = async (session: Session) => {
        setLoading(true);
        try {
            setAppState('FETCHING_ASSETS');
            const { data: assetsData, error: assetsError } = await supabase!.from('app_assets').select('asset_key, asset_value, mime_type');
            if (assetsError) throw assetsError;
            const assetsMap = (assetsData || []).reduce((acc: AppAssetRecord, asset) => {
                acc[asset.asset_key] = { value: asset.asset_value, mimeType: asset.mime_type };
                return acc;
            }, {});
            setAppAssets(assetsMap);

            setAppState('FETCHING_PROFILE');
            let { data: profileData, error: profileError } = await supabase!.from('profiles').select('*').eq('id', session.user.id).single();

            if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
            if (!profileData) {
                const mockBadges: Badge[] = [];
                const newUserProfileData = { name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'New User', avatarUrl: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${session.user.email}`, avgScore: 0, testsTaken: 0, timeSpent: '0m', streak: 0, freezes: 0, badges: mockBadges, dailyGoalProgress: 0, dailyGoalTarget: DAILY_GOAL_TARGET, lastDailyChallengeDate: null, bookmarked_questions: [], role: session.user.user_metadata?.role === 'admin' ? 'admin' : 'user', unlocked_achievements: [] };
                const { data: newProfile, error } = await supabase!.from('profiles').insert({ id: session.user.id, ...newUserProfileData }).select().single();
                if (error) throw error;
                profileData = newProfile;
            }
            
            const [testHistoryRes, battleHistoryRes] = await Promise.all([
                supabase!.from('test_attempts').select('*').eq('user_id', session.user.id),
                supabase!.from('battle_history').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
            ]);

            if (testHistoryRes.error) throw testHistoryRes.error;
            if (battleHistoryRes.error) throw battleHistoryRes.error;

            profileData.testHistory = (testHistoryRes.data || []).map((a: any) => ({...a, userId: a.user_id, questionIds: a.question_ids, userAnswers: a.user_answers }));
            profileData.battleHistory = battleHistoryRes.data || [];
            profileData.bookmarkedQuestions = profileData.bookmarked_questions || [];
            setUserProfile(profileData as UserProfile);

            setAppState('READY');
        } catch (error: any) {
            console.error("Error during data initialization:", error);
            setErrorMessage(error.message || 'An unknown error occurred during startup.');
            setAppState('ERROR');
        } finally {
            setLoading(false);
        }
    };
    
    const handleProfileUpdate = (name: string) => {
        if (userProfile) setUserProfile({ ...userProfile, name });
    };

    const value = {
        session,
        userProfile,
        setUserProfile,
        handleProfileUpdate,
        loading
    };

    return <AuthContext.Provider value={value as any}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
