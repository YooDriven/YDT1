import React, { createContext, useContext, ReactNode } from 'react';
import { Friend, Notification, Achievement, AchievementId, SocialContextType } from '../types';
import useAchievements from '../hooks/useAchievements';
import useFriends from '../hooks/useFriends';
import useNotifications from '../hooks/useNotifications';
import { useAuth } from './AuthContext';
import { AppContext } from './AppContext';

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { userProfile, setUserProfile } = useAuth() as any;
    const uiContext = useContext(AppContext);
    if (!uiContext) {
        throw new Error("SocialProvider must be used within an AppUIProvider");
    }
    const { showToast } = uiContext;
    
    // Custom Hooks for social features
    const { friends, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } = useFriends(userProfile?.id, showToast);
    const { notifications, markNotificationAsRead } = useNotifications(userProfile?.id);
    const { achievements, grantAchievement } = useAchievements(userProfile, setUserProfile, showToast);

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