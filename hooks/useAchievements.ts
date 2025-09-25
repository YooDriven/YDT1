import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile, Achievement, AchievementId } from '../types';
import { ACHIEVEMENTS } from '../constants';

const useAchievements = (
    userProfile: UserProfile | null, 
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
    showToast: (message: string, type?: 'success' | 'error') => void
) => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);

    useEffect(() => {
        if (userProfile) {
            const unlockedSet = new Set(userProfile.unlocked_achievements || []);
            const allAchievements = ACHIEVEMENTS.map(ach => ({
                ...ach,
                status: unlockedSet.has(ach.id) ? 'unlocked' : 'locked',
            }));
            setAchievements(allAchievements);
        }
    }, [userProfile]);

    const grantAchievement = useCallback(async (achievementId: AchievementId) => {
        if (!userProfile || userProfile.unlocked_achievements?.includes(achievementId)) {
            return;
        }

        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return;

        const updatedAchievements = [...(userProfile.unlocked_achievements || []), achievementId];
        
        // Optimistic update
        setUserProfile(prev => prev ? { ...prev, unlocked_achievements: updatedAchievements } : null);
        showToast(`Achievement Unlocked: ${achievement.name}!`);

        const { error } = await supabase!
            .from('profiles')
            .update({ unlocked_achievements: updatedAchievements })
            .eq('id', userProfile.id);

        if (error) {
            showToast('Failed to save achievement.', 'error');
            // Revert on failure
            setUserProfile(prev => prev ? { ...prev, unlocked_achievements: userProfile.unlocked_achievements } : null);
        }
    }, [userProfile, setUserProfile, showToast]);

    return { achievements, grantAchievement };
};

export default useAchievements;