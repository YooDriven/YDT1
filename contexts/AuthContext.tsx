import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session } from 'https://esm.sh/@supabase/supabase-js@2';
import { UserProfile, AuthContextType } from '../types';
import { DAILY_GOAL_TARGET } from '../constants';
import { useApp } from './AppContext';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    
    const { supabase, showToast } = useApp();

    const loadUserProfile = useCallback(async (currentSession: Session) => {
        try {
            let { data: profileData, error: profileError } = await supabase.from('profiles').select('*, test_attempts(*), battle_history(*)').eq('id', currentSession.user.id).single();
            
            if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
            if (!profileData) {
                const newUserProfileData = {
                    name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || 'New User',
                    avatarUrl: currentSession.user.user_metadata?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${currentSession.user.email}`,
                    avgScore: 0,
                    testsTaken: 0,
                    timeSpent: '0m',
                    streak: 1,
                    freezes: 0,
                    badges: [],
                    dailyGoalProgress: 0,
                    dailyGoalTarget: DAILY_GOAL_TARGET,
                    lastDailyChallengeDate: null,
                    bookmarked_questions: [],
                    role: currentSession.user.user_metadata?.role === 'admin' ? 'admin' : 'user',
                    unlocked_achievements: [],
                    onboarding_completed: false,
                    last_login_date: new Date().toISOString().split('T')[0],
                };
                const { data: newProfile, error } = await supabase.from('profiles').insert({ id: currentSession.user.id, ...newUserProfileData }).select('*, test_attempts(*), battle_history(*)').single();
                if (error) throw error;
                profileData = newProfile;
            } else {
                 // Check for daily login streak
                const today = new Date().toISOString().split('T')[0];
                const lastLogin = profileData.last_login_date;
                if (lastLogin !== today) {
                    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                    const newStreak = lastLogin === yesterday ? profileData.streak + 1 : 1;
                    const { data: updatedProfile, error } = await supabase.from('profiles').update({ streak: newStreak, last_login_date: today }).eq('id', currentSession.user.id).select().single();
                    if (error) {
                        console.error('Error updating streak:', error);
                    } else if (updatedProfile) {
                        profileData = { ...profileData, ...updatedProfile };
                    }
                }
            }

            profileData.testHistory = (profileData.test_attempts || []).map((a: any) => ({...a, userId: a.user_id, questionIds: a.question_ids, userAnswers: a.user_answers }));
            profileData.battleHistory = profileData.battle_history || [];
            profileData.bookmarkedQuestions = profileData.bookmarked_questions || [];
            setUserProfile(profileData as UserProfile);

        } catch (error: any) {
            console.error("Error loading user profile:", error);
            showToast(`Error loading profile: ${error.message}`, 'error');
        }
    }, [supabase, showToast]);

    useEffect(() => {
        setLoading(true);
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session) {
                await loadUserProfile(session);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase, loadUserProfile]);
    
    const handleProfileUpdate = (name: string) => {
        if (userProfile) setUserProfile({ ...userProfile, name });
    };

    const markOnboardingComplete = async () => {
        if (userProfile) {
            setUserProfile({ ...userProfile, onboarding_completed: true });
            const { error } = await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', userProfile.id);
            if (error) {
                showToast('Error saving progress.', 'error');
                setUserProfile({ ...userProfile, onboarding_completed: false }); // Revert on failure
            }
        }
    };

    const value = {
        session,
        userProfile,
        setUserProfile,
        handleProfileUpdate,
        markOnboardingComplete,
        loading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};