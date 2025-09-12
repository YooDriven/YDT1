import React, { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { Page, Question, TestCardData, UserProfile, Theme, LeaderboardEntry, TestAttempt } from './types';
import Dashboard from './components/Dashboard';
import TestPage from './components/TestPage';
import ResultsPage from './components/ResultsPage';
import MatchmakingPage from './components/MatchmakingPage';
import BattleGroundPage from './components/BattleGroundPage';
import BattleResultsPage from './components/BattleResultsPage';
import HazardPerceptionPage from './components/HazardPerceptionPage';
import HazardPerceptionResultsPage from './components/HazardPerceptionResultsPage';
import ReviewPage from './components/ReviewPage';
import RoadSignsPage from './components/RoadSignsPage';
import StudyHubPage from './components/StudyHubPage';
import TopicSelectionPage from './components/TopicSelectionPage';
import StudyPage from './components/StudyPage';
import BookmarkedQuestionsPage from './components/BookmarkedQuestionsPage';
import HighwayCodePage from './components/HighwayCodePage';
import CaseStudySelectionPage from './components/CaseStudySelectionPage';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import { TOTAL_QUESTIONS, MOCK_HAZARD_CLIPS, DAILY_GOAL_TARGET, MOCK_QUESTIONS } from './constants';
import { getDailyChallengeQuestions } from './utils';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { isGeminiConfigured } from './lib/gemini';

const ConfigurationError = ({ missingKeys }: { missingKeys: string[] }) => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-gray-300">
    <div className="max-w-2xl w-full bg-slate-800 border border-red-500/50 rounded-2xl p-8 shadow-2xl shadow-red-500/10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-400 mb-4">Application Configuration Error</h1>
        <p className="text-lg text-slate-400 mb-6">
          The application is missing essential configuration details required to connect to backend services.
        </p>
        <p className="text-slate-400 mb-8">
          Please ensure the following environment variables are correctly set in your project's secrets or configuration settings:
        </p>
        <div className="flex flex-col items-center space-y-2">
            {missingKeys.map(key => (
                <code key={key} className="bg-slate-700 text-amber-400 font-mono p-2 rounded">{key}</code>
            ))}
        </div>
      </div>
      <p className="text-center mt-8 text-sm text-slate-500">
        The application cannot start until these values are provided.
      </p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  );
  const [session, setSession] = useState<Session | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [testResult, setTestResult] = useState<{ score: number, total: number }>({ score: 0, total: 0 });
  const [reviewData, setReviewData] = useState<{ questions: Question[], userAnswers: (number | null)[] }>({ questions: [], userAnswers: [] });
  const [battleResult, setBattleResult] = useState<{ playerScore: number, opponentScore: number, total: number, opponentName: string }>({ playerScore: 0, opponentScore: 0, total: 0, opponentName: '' });
  const [hazardPerceptionResult, setHazardPerceptionResult] = useState<{ scores: number[], totalScore: number, maxScore: number }>({ scores: [], totalScore: 0, maxScore: 0 });
  const [customTest, setCustomTest] = useState<Question[] | null>(null);
  const [timeLimit, setTimeLimit] = useState<number | undefined>();
  const [currentTopic, setCurrentTopic] = useState<string | undefined>();
  const [currentMode, setCurrentMode] = useState<'test' | 'study'>('test');
  const [duelOpponent, setDuelOpponent] = useState<LeaderboardEntry | null>(null);

  if (!isSupabaseConfigured || !isGeminiConfigured) {
    const missingKeys: string[] = [];
    if (!isSupabaseConfigured) {
        missingKeys.push('VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY');
    }
    if (!isGeminiConfigured) {
        missingKeys.push('VITE_GEMINI_API_KEY');
    }
    return <ConfigurationError missingKeys={missingKeys} />;
  }

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    supabase!.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_OUT') {
        setUserProfile(null);
        setCurrentPage(Page.Dashboard);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchDataAndProfile = async () => {
      try {
        if (!session) {
          return;
        }
        setLoading(true);

        const { data: { user } } = await supabase!.auth.getUser();
        if (!user) { return; }

        let { data: profileData } = await supabase!.from('profiles').select('*').eq('id', user.id).single();
        
        if (!profileData) {
          const newUserProfileData = {
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User',
            avatarUrl: user.user_metadata?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${user.email}`,
            avgScore: 0,
            testsTaken: 0,
            timeSpent: '0m',
            streak: 0,
            freezes: 0,
            badges: [],
            testHistory: [],
            dailyGoalProgress: 0,
            dailyGoalTarget: DAILY_GOAL_TARGET,
            lastDailyChallengeDate: null,
            bookmarked_questions: [],
          };
          const { data: newProfile, error } = await supabase!
            .from('profiles')
            .insert({ id: user.id, ...newUserProfileData })
            .select()
            .single();
          if (error) {
            console.error('Error creating profile:', error);
            throw error;
          }
          profileData = newProfile;
        }

        if (profileData) {
            const { data: testHistoryData, error: testHistoryError } = await supabase!
                .from('test_attempts')
                .select('*')
                .eq('user_id', user.id);

            if (testHistoryError) {
                console.error("Error fetching test history:", testHistoryError);
                profileData.testHistory = [];
            } else {
                profileData.testHistory = testHistoryData.map((attempt: any): TestAttempt => ({
                    userId: attempt.user_id,
                    topic: attempt.topic,
                    score: attempt.score,
                    total: attempt.total,
                    questionIds: attempt.question_ids,
                    userAnswers: attempt.user_answers,
                }));
            }
            profileData.bookmarkedQuestions = profileData.bookmarked_questions || [];
        } else {
           throw new Error("User profile could not be fetched or created.");
        }
        
        setUserProfile(profileData);

        const { data: questionsData, error: questionsError } = await supabase!.from('questions').select('*');
        if (questionsError) {
          console.error('Error fetching questions:', questionsError);
          setAllQuestions(MOCK_QUESTIONS);
        } else {
          setAllQuestions(questionsData && questionsData.length > 0 ? questionsData : MOCK_QUESTIONS);
        }

      } catch (error) {
        console.error("Failed to load application data:", error);
        // An error here might mean the user needs to log in again.
        // Clearing the session or showing an error message could be options.
        // For now, we'll just log it and stop loading, which will likely show the login page.
      } finally {
        setLoading(false);
      }
    };

    fetchDataAndProfile();
  }, [session]);

  const navigateTo = useCallback((page: Page) => {
    if (page === Page.Dashboard) {
      setCustomTest(null);
      setTimeLimit(undefined);
      setCurrentTopic(undefined);
      setDuelOpponent(null);
    }
    setCurrentPage(page);
    setAnimationKey(prevKey => prevKey + 1);
  }, []);
  
  const handleCardClick = useCallback((card: TestCardData) => {
    if (card.id === 'daily-challenge') {
        const dailyQuestions = getDailyChallengeQuestions(allQuestions, 10);
        setCustomTest(dailyQuestions);
    } else {
        setCustomTest(null);
    }
    if (card.mode) {
      setCurrentMode(card.mode);
    }
    setCurrentTopic(card.topic);
    setTimeLimit(card.timeLimit);
    navigateTo(card.page);
  }, [navigateTo, allQuestions]);

  const handleTopicSelect = useCallback((topic: string) => {
      setCurrentTopic(topic);
      if (currentMode === 'test') {
        navigateTo(Page.Test);
      } else {
        navigateTo(Page.Study);
      }
  }, [navigateTo, currentMode]);

  const handleTestComplete = useCallback(async (score: number, questions: Question[], userAnswers: (number | null)[], topic?: string, testId?: string) => {
    if (!userProfile) return;

    const isDailyChallenge = testId === 'daily-challenge';
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Persist test attempt to Supabase
    const { error } = await supabase!.from('test_attempts').insert({
        user_id: userProfile.id,
        topic: topic || (testId === 'daily-challenge' ? 'Daily Challenge' : 'Mock Test'),
        score: score,
        total: questions.length,
        question_ids: questions.map(q => q.id),
        user_answers: userAnswers,
    });
    if (error) console.error('Error saving test attempt:', error);
    
    // Update profile stats in Supabase
    const { error: profileUpdateError } = await supabase!
        .from('profiles')
        .update({ 
            testsTaken: userProfile.testsTaken + 1,
            dailyGoalProgress: userProfile.dailyGoalProgress + score,
            lastDailyChallengeDate: isDailyChallenge ? todayStr : userProfile.lastDailyChallengeDate,
        })
        .eq('id', userProfile.id);

    if(profileUpdateError) console.error("Error updating profile stats:", profileUpdateError);
    
    // Optimistically update local state. A more robust solution would handle DB errors in the UI.
    const newAttempt: TestAttempt = {
      userId: userProfile.id,
      topic: topic || (testId === 'daily-challenge' ? 'Daily Challenge' : 'Mock Test'),
      score: score,
      total: questions.length,
      questionIds: questions.map(q => q.id),
      userAnswers: userAnswers,
    };
    
    setUserProfile(prev => {
        if (!prev) return null;
        return {
            ...prev,
            testsTaken: prev.testsTaken + 1,
            dailyGoalProgress: prev.dailyGoalProgress + score,
            lastDailyChallengeDate: isDailyChallenge ? todayStr : prev.lastDailyChallengeDate,
            testHistory: [...prev.testHistory, newAttempt],
        }
    });
    
    setTestResult({ score, total: questions.length });
    setReviewData({ questions, userAnswers });
    navigateTo(Page.Results);
  }, [navigateTo, userProfile]);

  const handleBattleComplete = useCallback((playerScore: number, opponentScore: number, total: number, opponentName: string) => {
    setUserProfile(prev => prev ? ({
        ...prev,
        testsTaken: prev.testsTaken + 1,
        dailyGoalProgress: prev.dailyGoalProgress + playerScore,
    }) : null);
    setBattleResult({ playerScore, opponentScore, total, opponentName });
    navigateTo(Page.BattleResults);
  }, [navigateTo]);

  const handleHazardPerceptionComplete = useCallback((scores: number[]) => {
    const totalScore = scores.reduce((acc, s) => acc + s, 0);
    const maxScore = MOCK_HAZARD_CLIPS.length * 5;
    setHazardPerceptionResult({ scores, totalScore, maxScore });
    navigateTo(Page.HazardPerceptionResults);
  }, [navigateTo]);

  const handleDuel = (opponent: LeaderboardEntry) => {
    setDuelOpponent(opponent);
    navigateTo(Page.BattleGround);
  };

  const handleToggleBookmark = async (questionId: string) => {
    if (!userProfile) return;

    const currentBookmarks = userProfile.bookmarkedQuestions || [];
    const isBookmarked = currentBookmarks.includes(questionId);
    const newBookmarks = isBookmarked
        ? currentBookmarks.filter(id => id !== questionId)
        : [...currentBookmarks, questionId];

    // Optimistically update local state
    setUserProfile(prev => prev ? { ...prev, bookmarkedQuestions: newBookmarks } : null);

    // Update database
    const { error } = await supabase!
        .from('profiles')
        .update({ bookmarked_questions: newBookmarks })
        .eq('id', userProfile.id);

    if (error) {
        console.error('Error updating bookmarks:', error);
        // Revert optimistic update on error
        setUserProfile(prev => prev ? { ...prev, bookmarkedQuestions: currentBookmarks } : null);
    }
  };


  const renderCurrentPage = () => {
    switch (currentPage) {
      case Page.Test:
        return <TestPage navigateTo={navigateTo} onTestComplete={handleTestComplete} totalQuestions={TOTAL_QUESTIONS} allQuestions={allQuestions} customQuestions={customTest} testId={customTest ? 'daily-challenge' : undefined} timeLimit={timeLimit} topic={currentTopic} bookmarkedQuestions={userProfile?.bookmarkedQuestions || []} onToggleBookmark={handleToggleBookmark} />;
      case Page.Results:
        return <ResultsPage navigateTo={navigateTo} score={testResult.score} totalQuestions={testResult.total} />;
      case Page.Review:
        return <ReviewPage navigateTo={navigateTo} reviewData={reviewData} />;
      case Page.RoadSigns:
        return <RoadSignsPage navigateTo={navigateTo} />;
      case Page.Matchmaking:
        return <MatchmakingPage navigateTo={navigateTo} />;
      case Page.BattleGround:
        return <BattleGroundPage navigateTo={navigateTo} onBattleComplete={handleBattleComplete} opponent={duelOpponent} allQuestions={allQuestions} />;
      case Page.BattleResults:
        return <BattleResultsPage navigateTo={navigateTo} {...battleResult} />;
      case Page.HazardPerception:
        return <HazardPerceptionPage navigateTo={navigateTo} onTestComplete={handleHazardPerceptionComplete} />;
      case Page.HazardPerceptionResults:
        return <HazardPerceptionResultsPage navigateTo={navigateTo} {...hazardPerceptionResult} />;
      case Page.StudyHub:
        return <StudyHubPage navigateTo={navigateTo} onCardClick={handleCardClick} />;
      case Page.TopicSelection:
        return <TopicSelectionPage navigateTo={navigateTo} onTopicSelect={handleTopicSelect} mode={currentMode} allQuestions={allQuestions} />;
      case Page.Study:
        return <StudyPage navigateTo={navigateTo} topic={currentTopic || ''} allQuestions={allQuestions} />;
      case Page.BookmarkedQuestions:
        return <BookmarkedQuestionsPage navigateTo={navigateTo} allQuestions={allQuestions} bookmarkedQuestions={userProfile?.bookmarkedQuestions || []} onToggleBookmark={handleToggleBookmark} />;
      case Page.HighwayCode:
        return <HighwayCodePage navigateTo={navigateTo} />;
      case Page.CaseStudySelection:
        return <CaseStudySelectionPage navigateTo={navigateTo} />;
      case Page.Dashboard:
      default:
        return <Dashboard onCardClick={handleCardClick} userProfile={userProfile!} navigateTo={navigateTo} handleDuel={handleDuel} />;
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <p className="text-gray-400">Loading application...</p>
      </div>
    );
  }

  if (!session || !userProfile) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] dark:bg-slate-900">
      <Header user={userProfile} navigateTo={navigateTo} theme={theme} setTheme={setTheme} />
      <main key={animationKey} className="animate-fadeInUp">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default App;