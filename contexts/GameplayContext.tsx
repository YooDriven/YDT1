
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Page, Question, CaseStudy, Opponent, LeaderboardEntry, TestAttempt, Friend, GameplayContextType, TestCardData } from '../types';
import { DAILY_GOAL_TARGET, MAX_SCORE_PER_CLIP } from '../constants';
import { useAuth } from './AuthContext';
import { useSocial } from './SocialContext';
import { useApp } from './AppContext';

const GameplayContext = createContext<GameplayContextType | undefined>(undefined);

export const GameplayProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { userProfile, setUserProfile } = useAuth();
    const { grantAchievement } = useSocial();
    const { supabase, navigateTo, showToast } = useApp();

    // Gameplay State
    const [testResult, setTestResult] = useState<{ score: number, total: number }>({ score: 0, total: 0 });
    const [reviewData, setReviewData] = useState<{ questions: Question[], userAnswers: (number | null)[] }>({ questions: [], userAnswers: [] });
    const [battleResult, setBattleResult] = useState<{ playerScore: number, opponentScore: number, total: number, opponentName: string }>({ playerScore: 0, opponentScore: 0, total: 0, opponentName: '' });
    const [hazardPerceptionResult, setHazardPerceptionResult] = useState<{ scores: number[], totalScore: number, maxScore: number }>({ scores: [], totalScore: 0, maxScore: 0 });
    const [customTest, setCustomTest] = useState<Question[] | null>(null);
    const [currentTestId, setCurrentTestId] = useState<string | undefined>();
    const [timeLimit, setTimeLimit] = useState<number | undefined>();
    const [currentTopic, setCurrentTopic] = useState<string | undefined>();
    const [currentMode, setCurrentMode] = useState<'test' | 'study'>('test');
    const [duelOpponent, setDuelOpponent] = useState<Opponent | null>(null);
    const [currentBattleId, setCurrentBattleId] = useState<string | null>(null);
    const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
    const [lastOpponent, setLastOpponent] = useState<Opponent | null>(null);

    // Gameplay Actions
    const handleCardClick = (card: TestCardData) => {
        if (card.id === 'battle-ground') setDuelOpponent(null);
        if (card.page === Page.Test) {
            setCustomTest(null);
            setCurrentTestId(card.id);
            setTimeLimit(card.timeLimit);
            setCurrentTopic(undefined);
        } else if (card.page === Page.TopicSelection) {
            setCurrentMode(card.mode || 'test');
        }
        navigateTo(card.page);
    };

    const handleDuel = (opponent: LeaderboardEntry | Friend) => {
        const opponentData: Opponent = { ...opponent, isBot: false };
        const battleId = `battle-duel-${userProfile!.id}-${opponent.id}-${Date.now()}`;
        setCurrentBattleId(battleId);
        setDuelOpponent(opponentData);
        navigateTo(Page.BattleGround);
    };

    const handleMatchFound = (battleId: string, opponent: Opponent) => {
        setCurrentBattleId(battleId);
        setDuelOpponent(opponent);
        navigateTo(Page.BattleGround);
    };

    const handleTestComplete = async (score: number, questions: Question[], userAnswers: (number | null)[], topic?: string, testId?: string) => {
        setTestResult({ score: score, total: questions.length });
        setReviewData({ questions, userAnswers });

        if (userProfile) {
            const attempt = { user_id: userProfile.id, topic: topic || testId || 'Mock Test', score, total: questions.length, question_ids: questions.map(q => q.id), user_answers: userAnswers };
            const { error } = await supabase.from('test_attempts').insert(attempt);
            if (error) {
                showToast('Error saving test attempt.', 'error');
            } else {
                setUserProfile(prev => {
                    if (!prev) return null;
                    const updatedHistory: TestAttempt[] = [...(prev.testHistory || []), { ...attempt, userId: attempt.user_id, questionIds: attempt.question_ids, userAnswers: attempt.user_answers }];
                    const newTestsTaken = updatedHistory.length;
                    const newAvgScore = Math.round(updatedHistory.reduce((acc, t) => acc + (t.score / t.total), 0) / newTestsTaken * 100);
                    const isDaily = testId === 'daily-challenge';
                    const todayStr = new Date().toISOString().split('T')[0];
                    const updatedProfile = { ...prev, testHistory: updatedHistory, testsTaken: newTestsTaken, avgScore: isNaN(newAvgScore) ? 0 : newAvgScore, lastDailyChallengeDate: isDaily ? todayStr : prev.lastDailyChallengeDate, dailyGoalProgress: isDaily ? DAILY_GOAL_TARGET : Math.min(DAILY_GOAL_TARGET, prev.dailyGoalProgress + questions.length) };
                    supabase.from('profiles').update({ testsTaken: updatedProfile.testsTaken, avgScore: updatedProfile.avgScore, lastDailyChallengeDate: updatedProfile.lastDailyChallengeDate, dailyGoalProgress: updatedProfile.dailyGoalProgress }).eq('id', userProfile.id).then(({error}) => { if (error) console.error(error); });
                    if ((score / questions.length) === 1) grantAchievement('perfect_score');
                    if (topic && (score / questions.length) > 0.9) {
                        if (topic === 'Alertness') grantAchievement('topic_master_alertness');
                        if (topic === 'Attitude') grantAchievement('topic_master_attitude');
                        if (topic === 'Road and Traffic Signs') grantAchievement('topic_master_signs');
                    }
                    return updatedProfile;
                });
            }
        }
        navigateTo(Page.Results);
    };

    const handleBattleComplete = async (playerScore: number, opponentScore: number, total: number, opponent: Opponent) => {
        setBattleResult({ playerScore, opponentScore, total, opponentName: opponent.name });
        setLastOpponent(opponent);
        if (userProfile) {
            const newHistoryEntry = { user_id: userProfile.id, opponent_name: opponent.name, opponent_avatar_url: opponent.avatarUrl, user_score: playerScore, opponent_score: opponentScore, total_questions: total };
            const { data, error } = await supabase.from('battle_history').insert(newHistoryEntry).select().single();
            if (error) {
                showToast('Error saving battle history.', 'error');
            } else {
                setUserProfile(prev => prev ? { ...prev, battleHistory: [data, ...(prev.battleHistory || [])] } : null);
                if (playerScore > opponentScore) grantAchievement('first_win');
            }
        }
        navigateTo(Page.BattleResults);
    };

    const handleRematch = () => {
        if (lastOpponent && !lastOpponent.isBot && lastOpponent.id) {
            handleDuel(lastOpponent as Friend);
        } else {
            setDuelOpponent(null);
            navigateTo(Page.Matchmaking);
        }
    };

    const handleHazardPerceptionComplete = (scores: number[], totalClips: number) => {
        const totalScore = scores.reduce((sum, s) => sum + s, 0);
        const maxScore = totalClips * MAX_SCORE_PER_CLIP;
        setHazardPerceptionResult({ scores, totalScore, maxScore });
        navigateTo(Page.HazardPerceptionResults);
    };

    const handleTopicSelect = (topic: string) => {
        setCurrentTopic(topic);
        navigateTo(currentMode === 'test' ? Page.Test : Page.Study);
    };

    const handleCaseStudySelect = (caseStudy: CaseStudy) => {
        setSelectedCaseStudy(caseStudy);
        navigateTo(Page.CaseStudy);
    };

    const handleToggleBookmark = async (questionId: string) => {
        if (!userProfile) return;
        const isBookmarked = userProfile.bookmarkedQuestions.includes(questionId);
        const updatedBookmarks = isBookmarked ? userProfile.bookmarkedQuestions.filter(id => id !== questionId) : [...userProfile.bookmarkedQuestions, questionId];
        setUserProfile({ ...userProfile, bookmarkedQuestions: updatedBookmarks });
        const { error } = await supabase.from('profiles').update({ bookmarked_questions: updatedBookmarks }).eq('id', userProfile.id);
        if (error) {
            showToast('Error updating bookmarks.', 'error');
            setUserProfile({ ...userProfile, bookmarkedQuestions: userProfile.bookmarkedQuestions });
        }
    };

    const value: GameplayContextType = {
        testResult, reviewData, battleResult, hazardPerceptionResult, customTest, currentTestId, timeLimit, currentTopic, currentMode, duelOpponent, currentBattleId, selectedCaseStudy,
        handleCardClick, handleDuel, handleMatchFound, handleTestComplete, handleBattleComplete, handleRematch, handleHazardPerceptionComplete, handleTopicSelect, handleCaseStudySelect, handleToggleBookmark
    };

    return <GameplayContext.Provider value={value}>{children}</GameplayContext.Provider>;
};

export const useGameplay = () => {
    const context = useContext(GameplayContext);
    if (context === undefined) {
        throw new Error('useGameplay must be used within a GameplayProvider');
    }
    return context;
};
