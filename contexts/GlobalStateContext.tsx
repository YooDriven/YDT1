
import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode, useState } from 'react';
import { GlobalState, GlobalContextType, Page, Session, UserProfile, Friend, Notification, Achievement, Question, TestAttempt, Opponent, TestCardData, LeaderboardEntry, AchievementId, AchievementStatus } from '../types';
import { DAILY_GOAL_TARGET, ACHIEVEMENTS } from '../constants';
import { useApp } from './AppContext';

const GlobalStateContext = createContext<GlobalContextType | undefined>(undefined);

const initialState: GlobalState = {
    loading: true,
    session: null,
    userProfile: null,
    friends: [],
    notifications: [],
    achievements: [],
    testResult: { score: 0, total: 0 },
    reviewData: { questions: [], userAnswers: [] },
    battleResult: { playerScore: 0, opponentScore: 0, total: 0, opponentName: '' },
    customTest: null,
    currentTestId: undefined,
    timeLimit: undefined,
    currentTopic: undefined,
    currentMode: 'test',
    duelOpponent: null,
    currentBattleId: null,
};

type Action =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'INITIAL_LOAD'; payload: { session: Session | null; profile: UserProfile | null; friends: Friend[]; notifications: Notification[] } }
    | { type: 'SET_SESSION'; payload: { session: Session | null; profile: UserProfile | null } }
    | { type: 'UPDATE_USER_PROFILE'; payload: Partial<UserProfile> }
    | { type: 'SET_FRIENDS'; payload: Friend[] }
    | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
    | { type: 'GRANT_ACHIEVEMENT'; payload: AchievementId }
    | { type: 'SET_GAMEPLAY_STATE'; payload: Partial<GlobalState> }
    | { type: 'TEST_COMPLETE'; payload: { score: number; total: number; questions: Question[]; userAnswers: (number | null)[]; updatedProfile: Partial<UserProfile> } }
    | { type: 'BATTLE_COMPLETE'; payload: { playerScore: number; opponentScore: number; total: number; opponentName: string, updatedHistory: any } };

const globalStateReducer = (state: GlobalState, action: Action): GlobalState => {
    switch (action.type) {
        case 'SET_LOADING': return { ...state, loading: action.payload };
        case 'INITIAL_LOAD': return { ...state, loading: false, session: action.payload.session, userProfile: action.payload.profile, friends: action.payload.friends, notifications: action.payload.notifications };
        case 'SET_SESSION': return { ...state, session: action.payload.session, userProfile: action.payload.profile };
        case 'UPDATE_USER_PROFILE': return { ...state, userProfile: state.userProfile ? { ...state.userProfile, ...action.payload } : null };
        case 'SET_FRIENDS': return { ...state, friends: action.payload };
        case 'SET_NOTIFICATIONS': return { ...state, notifications: action.payload };
        case 'GRANT_ACHIEVEMENT':
            if (!state.userProfile || state.userProfile.unlocked_achievements.includes(action.payload)) return state;
            return { ...state, userProfile: { ...state.userProfile, unlocked_achievements: [...state.userProfile.unlocked_achievements, action.payload] } };
        case 'SET_GAMEPLAY_STATE': return { ...state, ...action.payload };
        case 'TEST_COMPLETE': return {
            ...state,
            testResult: { score: action.payload.score, total: action.payload.total },
            reviewData: { questions: action.payload.questions, userAnswers: action.payload.userAnswers },
            userProfile: state.userProfile ? { ...state.userProfile, ...action.payload.updatedProfile } : null
        };
        case 'BATTLE_COMPLETE': return {
            ...state,
            battleResult: { playerScore: action.payload.playerScore, opponentScore: action.payload.opponentScore, total: action.payload.total, opponentName: action.payload.opponentName },
            userProfile: state.userProfile ? { ...state.userProfile, battleHistory: [action.payload.updatedHistory, ...state.userProfile.battleHistory] } : null
        };
        default: return state;
    }
};

export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(globalStateReducer, initialState);
    const { supabase, navigateTo, showToast } = useApp();
    const [lastOpponent, setLastOpponent] = useState<Opponent | null>(null);

    // Initial load and auth subscription
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                dispatch({ type: 'SET_LOADING', payload: true });
                try {
                    // Fetch profile, friends, notifications in parallel
                    const profilePromise = supabase.from('profiles').select('*, test_attempts(*), battle_history(*)').eq('id', session.user.id).single();
                    const friendsPromise = supabase.rpc('get_friends_status', { p_user_id: session.user.id });
                    const notifsPromise = supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });

                    let [{ data: profileData, error: profileError }, { data: friendsData, error: friendsError }, { data: notifsData, error: notifsError }] = await Promise.all([profilePromise, friendsPromise, notifsPromise]);

                    if (profileError && profileError.code !== 'PGRST116') throw profileError;
                    if (friendsError) throw friendsError;
                    if (notifsError) throw notifsError;

                    if (!profileData) {
                        // Create profile if it doesn't exist
                        const newUserProfileData = {
                            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'New User',
                            avatarUrl: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${session.user.email}`,
                            streak: 1, last_login_date: new Date().toISOString().split('T')[0],
                            role: session.user.user_metadata?.role === 'admin' ? 'admin' : 'user',
                        };
                        const { data: newProfile, error } = await supabase.from('profiles').insert({ id: session.user.id, ...newUserProfileData }).select('*, test_attempts(*), battle_history(*)').single();
                        if (error) throw error;
                        profileData = newProfile;
                    } else {
                        // Check streak
                        const today = new Date().toISOString().split('T')[0];
                        if (profileData.last_login_date !== today) {
                            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                            const newStreak = profileData.last_login_date === yesterday ? profileData.streak + 1 : 1;
                            const { data: updatedProfile } = await supabase.from('profiles').update({ streak: newStreak, last_login_date: today }).eq('id', session.user.id).select().single();
                            if (updatedProfile) profileData = { ...profileData, ...updatedProfile };
                        }
                    }
                    
                    const finalProfile = {
                        ...profileData,
                        testHistory: (profileData.test_attempts || []).map((a: any) => ({...a, userId: a.user_id, questionIds: a.question_ids, userAnswers: a.user_answers })),
                        battleHistory: profileData.battle_history || [],
                        bookmarkedQuestions: profileData.bookmarked_questions || [],
                    };
                    
                    dispatch({ type: 'INITIAL_LOAD', payload: { session, profile: finalProfile as UserProfile, friends: (friendsData as Friend[]) || [], notifications: (notifsData as Notification[]) || [] } });

                } catch (error: any) {
                    showToast(`Error loading profile: ${error.message}`, 'error');
                    dispatch({ type: 'SET_SESSION', payload: { session, profile: null } });
                    dispatch({ type: 'SET_LOADING', payload: false });
                }
            } else {
                dispatch({ type: 'SET_SESSION', payload: { session: null, profile: null } });
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase, showToast]);
    
    // Realtime subscriptions
    useEffect(() => {
        if (!state.userProfile?.id) return;
        const userId = state.userProfile.id;

        const friendsChannel = supabase.channel(`friends-rt-${userId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'friends', filter: `user1_id=eq.${userId}` }, fetchFriends)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'friends', filter: `user2_id=eq.${userId}` }, fetchFriends)
            .subscribe();

        const notifsChannel = supabase.channel(`notifications-rt-${userId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}`}, fetchNotifications)
            .subscribe();
        
        return () => {
            supabase.removeChannel(friendsChannel);
            supabase.removeChannel(notifsChannel);
        };

    }, [state.userProfile?.id, supabase]);
    
     useEffect(() => {
        if (state.userProfile) {
            const unlockedSet = new Set(state.userProfile.unlocked_achievements || []);
            const allAchievements: Achievement[] = ACHIEVEMENTS.map(ach => ({
                ...ach,
                status: (unlockedSet.has(ach.id) ? 'unlocked' : 'locked') as AchievementStatus,
            }));
            dispatch({ type: 'SET_GAMEPLAY_STATE', payload: { achievements: allAchievements }});
        }
    }, [state.userProfile?.unlocked_achievements]);


    // --- ACTIONS ---

    const grantAchievement = useCallback(async (achievementId: AchievementId) => {
        if (!state.userProfile || state.userProfile.unlocked_achievements?.includes(achievementId)) return;
        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return;

        dispatch({ type: 'GRANT_ACHIEVEMENT', payload: achievementId });
        showToast(`Achievement Unlocked: ${achievement.name}!`);

        const { error } = await supabase.from('profiles').update({ unlocked_achievements: [...state.userProfile.unlocked_achievements, achievementId] }).eq('id', state.userProfile.id);
        if (error) showToast('Failed to save achievement.', 'error'); // No revert needed for this UI
    }, [state.userProfile, supabase, showToast]);

    const handleTestComplete = useCallback(async (score: number, questions: Question[], userAnswers: (number | null)[], topic?: string, testId?: string) => {
        if (!state.userProfile) return;
        const attempt = { user_id: state.userProfile.id, topic: topic || testId || 'Mock Test', score, total: questions.length, question_ids: questions.map(q => q.id), user_answers: userAnswers };
        const { error } = await supabase.from('test_attempts').insert(attempt);
        
        if (error) {
            showToast('Error saving test attempt.', 'error');
        } else {
            const updatedHistory: TestAttempt[] = [...(state.userProfile.testHistory || []), { ...attempt, userId: attempt.user_id, questionIds: attempt.question_ids, userAnswers: attempt.user_answers }];
            const newTestsTaken = updatedHistory.length;
            const newAvgScore = Math.round(updatedHistory.reduce((acc, t) => acc + (t.score / t.total), 0) / newTestsTaken * 100);
            const isDaily = testId === 'daily-challenge';
            const todayStr = new Date().toISOString().split('T')[0];

            const updatedProfile = {
                testHistory: updatedHistory,
                testsTaken: newTestsTaken,
                avgScore: isNaN(newAvgScore) ? 0 : newAvgScore,
                lastDailyChallengeDate: isDaily ? todayStr : state.userProfile.lastDailyChallengeDate,
                dailyGoalProgress: isDaily ? DAILY_GOAL_TARGET : Math.min(DAILY_GOAL_TARGET, state.userProfile.dailyGoalProgress + questions.length)
            };
            
            supabase.from('profiles').update({ testsTaken: updatedProfile.testsTaken, avgScore: updatedProfile.avgScore, lastDailyChallengeDate: updatedProfile.lastDailyChallengeDate, dailyGoalProgress: updatedProfile.dailyGoalProgress }).eq('id', state.userProfile.id).then(({error}) => { if (error) console.error(error); });
            if ((score / questions.length) === 1) grantAchievement('perfect_score');
            if (topic && (score / questions.length) > 0.9) {
                if (topic === 'Alertness') grantAchievement('topic_master_alertness');
                if (topic === 'Attitude') grantAchievement('topic_master_attitude');
                if (topic === 'Road and Traffic Signs') grantAchievement('topic_master_signs');
            }
            dispatch({ type: 'TEST_COMPLETE', payload: { score, total: questions.length, questions, userAnswers, updatedProfile }});
        }
        navigateTo(Page.Results);
    }, [state.userProfile, supabase, showToast, navigateTo, grantAchievement]);
    
    const handleCardClick = useCallback((card: TestCardData) => {
        const payload: Partial<GlobalState> = {};
        if (card.id === 'battle-ground') payload.duelOpponent = null;
        if (card.page === Page.Test) {
            payload.customTest = null;
            payload.currentTestId = card.id;
            payload.timeLimit = card.timeLimit;
            payload.currentTopic = undefined;
        } else if (card.page === Page.TopicSelection) {
            payload.currentMode = card.mode || 'test';
        }
        dispatch({ type: 'SET_GAMEPLAY_STATE', payload });
        navigateTo(card.page);
    }, [navigateTo]);

    const handleTopicSelect = useCallback((topic: string) => {
        dispatch({ type: 'SET_GAMEPLAY_STATE', payload: { currentTopic: topic }});
        navigateTo(state.currentMode === 'test' ? Page.Test : Page.Study);
    }, [state.currentMode, navigateTo]);

    // --- Other actions ---
    const handleProfileUpdate = (name: string) => dispatch({ type: 'UPDATE_USER_PROFILE', payload: { name }});
    const markOnboardingComplete = async () => {
        if (!state.userProfile) return;
        dispatch({ type: 'UPDATE_USER_PROFILE', payload: { onboarding_completed: true } });
        const { error } = await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', state.userProfile.id);
        if (error) {
            showToast('Error saving progress.', 'error');
            dispatch({ type: 'UPDATE_USER_PROFILE', payload: { onboarding_completed: false } });
        }
    };
    const handleDuel = (opponent: LeaderboardEntry | Friend) => {
        const opponentData: Opponent = { ...opponent, isBot: false };
        const battleId = `battle-duel-${state.userProfile!.id}-${opponent.id}-${Date.now()}`;
        dispatch({ type: 'SET_GAMEPLAY_STATE', payload: { currentBattleId: battleId, duelOpponent: opponentData }});
        navigateTo(Page.BattleGround);
    };
    const handleMatchFound = (battleId: string, opponent: Opponent) => {
        dispatch({ type: 'SET_GAMEPLAY_STATE', payload: { currentBattleId: battleId, duelOpponent: opponent }});
        navigateTo(Page.BattleGround);
    };
    const handleBattleComplete = async (playerScore: number, opponentScore: number, total: number, opponent: Opponent) => {
        setLastOpponent(opponent);
        if (!state.userProfile) return;
        const newHistoryEntry = { user_id: state.userProfile.id, opponent_name: opponent.name, opponent_avatar_url: opponent.avatarUrl, user_score: playerScore, opponent_score: opponentScore, total_questions: total };
        const { data, error } = await supabase.from('battle_history').insert(newHistoryEntry).select().single();
        if (error) {
            showToast('Error saving battle history.', 'error');
        } else {
            if (playerScore > opponentScore) grantAchievement('first_win');
            dispatch({ type: 'BATTLE_COMPLETE', payload: { playerScore, opponentScore, total, opponentName: opponent.name, updatedHistory: data } });
        }
        navigateTo(Page.BattleResults);
    };
    const handleRematch = () => {
        if (lastOpponent && !lastOpponent.isBot && lastOpponent.id) {
            handleDuel(lastOpponent as Friend);
        } else {
            dispatch({ type: 'SET_GAMEPLAY_STATE', payload: { duelOpponent: null }});
            navigateTo(Page.Matchmaking);
        }
    };
    const handleToggleBookmark = async (questionId: string) => {
        if (!state.userProfile) return;
        const isBookmarked = state.userProfile.bookmarkedQuestions.includes(questionId);
        const updatedBookmarks = isBookmarked ? state.userProfile.bookmarkedQuestions.filter(id => id !== questionId) : [...state.userProfile.bookmarkedQuestions, questionId];
        dispatch({ type: 'UPDATE_USER_PROFILE', payload: { bookmarkedQuestions: updatedBookmarks } });
        const { error } = await supabase.from('profiles').update({ bookmarked_questions: updatedBookmarks }).eq('id', state.userProfile.id);
        if (error) {
            showToast('Error updating bookmarks.', 'error');
            dispatch({ type: 'UPDATE_USER_PROFILE', payload: { bookmarkedQuestions: state.userProfile.bookmarkedQuestions } });
        }
    };
    
    // Social actions
    const fetchFriends = useCallback(async () => {
        if (!state.userProfile?.id) return;
        const { data, error } = await supabase.rpc('get_friends_status', { p_user_id: state.userProfile.id });
        if (!error) dispatch({ type: 'SET_FRIENDS', payload: data as Friend[] });
    }, [state.userProfile?.id, supabase]);

    const fetchNotifications = useCallback(async () => {
        if (!state.userProfile?.id) return;
        const { data, error } = await supabase.from('notifications').select('*').eq('user_id', state.userProfile.id).order('created_at', { ascending: false });
        if (!error) dispatch({ type: 'SET_NOTIFICATIONS', payload: data as Notification[] });
    }, [state.userProfile?.id, supabase]);

    const sendFriendRequest = async (friendId: string) => {
        if (!state.userProfile) return;
        const { error } = await supabase.from('friends').insert({ user1_id: state.userProfile.id, user2_id: friendId, status: 'pending' });
        if (error) { showToast('Failed to send friend request.', 'error'); } 
        else { showToast('Friend request sent!'); fetchFriends(); }
    };
    const acceptFriendRequest = async (friendId: string) => {
        if (!state.userProfile) return;
        const { error } = await supabase.from('friends').update({ status: 'friends' }).match({ user1_id: friendId, user2_id: state.userProfile.id });
        if (error) { showToast('Failed to accept friend request.', 'error'); } 
        else { showToast('Friend request accepted!'); fetchFriends(); }
    };
    const declineFriendRequest = async (friendId: string) => {
        if (!state.userProfile) return;
        const { error } = await supabase.from('friends').delete().match({ user1_id: friendId, user2_id: state.userProfile.id });
        if (error) { showToast('Failed to decline friend request.', 'error'); } 
        else { showToast('Friend request declined.'); fetchFriends(); }
    };
    const removeFriend = async (friendId: string) => {
        if (!state.userProfile) return;
        const { error } = await supabase.rpc('remove_friend', { p_user_id: state.userProfile.id, p_friend_id: friendId });
        if (error) { showToast('Failed to remove friend.', 'error'); } 
        else { showToast('Friend removed.'); fetchFriends(); }
    };
    const markNotificationAsRead = async (notificationId: string) => {
        await supabase.from('notifications').delete().eq('id', notificationId);
    };
    const sendChallenge = async (friendId: string) => {
        if (!state.userProfile) return;
        await supabase.from('notifications').insert({ user_id: friendId, from_user_id: state.userProfile.id, from_user_name: state.userProfile.name, from_user_avatar_url: state.userProfile.avatarUrl, type: 'challenge' });
        showToast('Challenge sent!');
    };
    const acceptChallenge = async (notification: Notification) => {
        await markNotificationAsRead(notification.id);
        showToast('Challenge accepted! (Placeholder: navigating to matchmaking)', 'success');
        navigateTo(Page.Matchmaking);
    };
    
    const contextValue: GlobalContextType = {
        ...state,
        handleCardClick, handleDuel, handleMatchFound, handleTestComplete, handleBattleComplete, handleRematch, handleTopicSelect, handleToggleBookmark,
        markOnboardingComplete, handleProfileUpdate,
        sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, markNotificationAsRead, sendChallenge, acceptChallenge,
    };
    
    return <GlobalStateContext.Provider value={contextValue}>{children}</GlobalStateContext.Provider>
}

export const useGlobalState = () => {
    const context = useContext(GlobalStateContext);
    if (context === undefined) {
        throw new Error('useGlobalState must be used within a GlobalStateProvider');
    }
    return context;
}
