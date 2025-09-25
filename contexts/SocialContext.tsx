import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { Friend, Notification, Achievement, AchievementId, SocialContextType, Page } from '../types';
import useAchievements from '../hooks/useAchievements';
import useFriends from '../hooks/useFriends';
import useNotifications from '../hooks/useNotifications';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { userProfile, setUserProfile } = useAuth();
    const { showToast, navigateTo, supabase } = useApp();
    
    // Custom Hooks for social features
    const { friends, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } = useFriends(userProfile?.id, showToast);
    const { notifications, markNotificationAsRead } = useNotifications(userProfile?.id);
    const { achievements, grantAchievement } = useAchievements(userProfile, setUserProfile, showToast);
    
    const sendChallenge = useCallback(async (friendId: string) => {
        if (!userProfile) return;
        const { data, error } = await supabase.from('notifications').insert({
            user_id: friendId,
            from_user_id: userProfile.id,
            from_user_name: userProfile.name,
            from_user_avatar_url: userProfile.avatarUrl,
            type: 'challenge',
        }).select().single();
        if (error) {
            showToast('Failed to send challenge.', 'error');
        } else {
            showToast('Challenge sent!');
        }
    }, [userProfile, showToast, supabase]);

    const acceptChallenge = useCallback(async (notification: Notification) => {
        // Here you would typically navigate both users to the same battle instance.
        // For simplicity, we'll just navigate the current user.
        // A more robust system would use the notification metadata to join a specific battle room.
        const battleId = `battle-${[notification.from_user_id, userProfile!.id].sort().join('-')}`;
        // You would also need to signal the other player that the challenge was accepted.
        // This could be done via another notification or a direct broadcast on a user channel.
        
        // For now, let's just mark the notification as read and navigate.
        await markNotificationAsRead(notification.id);
        
        // TODO: Properly implement match setup here.
        // The handleMatchFound function expects an opponent object, which we don't fully have here.
        // This part needs to be connected to the GameplayContext.
        // For now, it will just navigate to matchmaking as a placeholder.
        showToast('Challenge accepted! (Placeholder: navigating to matchmaking)', 'success');
        navigateTo(Page.Matchmaking);

    }, [userProfile, markNotificationAsRead, navigateTo, showToast]);


    const value = {
        friends,
        notifications,
        achievements,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        markNotificationAsRead,
        grantAchievement,
        sendChallenge,
        acceptChallenge,
    };

    return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
};

export const useSocial = () => {
    const context = useContext(SocialContext);
    if (context === undefined) {
        throw new Error('useSocial must be used within a SocialProvider');
    }
    return context;
};