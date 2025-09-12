import React, { useState, useEffect, useCallback } from 'react';
import { Session } from 'https://esm.sh/@supabase/supabase-js@2';
import { Page, Question, TestCardData, UserProfile, Theme, LeaderboardEntry, TestAttempt, Badge } from './types';
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
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import AdminPage from './components/AdminPage';
import { TOTAL_QUESTIONS, DAILY_GOAL_TARGET, MOCK_QUESTIONS, MAX_SCORE_PER_CLIP } from './constants';
import { getDailyChallengeQuestions } from './utils';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { isGeminiConfigured } from './lib/gemini';

// Define the states for our application's loading lifecycle
type AppState =
  | 'CONFIG_CHECKING'
  | 'CONFIG_ERROR'
  | 'AUTH_CHECKING'
  | 'UNAUTHENTICATED'
  | 'FETCHING_PROFILE'
  | 'FETCHING_ASSETS'
  | 'FETCHING_QUESTIONS'
  | 'READY'
  | 'ERROR';

const AppLoadingIndicator: React.FC<{ state: AppState }> = ({ state }) => {
  const messages: Record<string, string> = {
    CONFIG_CHECKING: 'Verifying configuration...',
    CONFIG_ERROR: 'Configuration error.',
    AUTH_CHECKING: 'Securing connection...',
    UNAUTHENTICATED: 'Redirecting to login...',
    FETCHING_PROFILE: 'Loading your profile...',
    FETCHING_ASSETS: 'Loading visual assets...',
    FETCHING_QUESTIONS: 'Preparing questions...',
    READY: 'Ready!',
    ERROR: 'An error occurred.'
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <div className="text-center">
        <p className="text-gray-400">{messages[state] || 'Loading application...'}</p>
        <div className="w-32 h-1 bg-slate-700 rounded-full overflow-hidden mt-4 mx-auto">
          <div className="h-1 bg-teal-400 animate-pulse" style={{ width: '100%' }}></div>
        </div>
      </div>
    </div>
  );
};

const AppError: React.FC<{ message: string; details?: string[] }> = ({ message, details }) => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-gray-300">
    <div className="max-w-2xl w-full bg-slate-800 border border-red-500/50 rounded-2xl p-8 shadow-2xl shadow-red-500/10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-400 mb-4">{message}</h1>
        {details && details.length > 0 ? (
          <>
            <p className="text-slate-400 mb-8">
              Please ensure the following environment variables are correctly set:
            </p>
            <div className="flex flex-col items-center space-y-2">
              {details.map(key => (
                <code key={key} className="bg-slate-700 text-amber-400 font-mono p-2 rounded">{key}</code>
              ))}
            </div>
          </>
        ) : (
          <p className="text-slate-400">{message.includes('timeout') && 'This can happen if the database is unreachable or if Row Level Security (RLS) policies are missing or incorrect for a table.'}</p>
        )}
      </div>
    </div>
  </div>
);

// Timeout utility to prevent the app from getting stuck on loading
const TIMEOUT_DURATION = 15000; // 15 seconds
// FIX: The generic type inference for withTimeout was failing with Supabase's PromiseLike objects,
// causing destructuring errors. The function signature has been updated to use `any` to work around this
// issue, ensuring compilation while preserving the timeout functionality.
const withTimeout = (promise: PromiseLike<any>, ms: number, customError?: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(customError || 'Request timed out. Please check your network or database configuration.'));
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
};


const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  );
  const [appState, setAppState] = useState<AppState>('CONFIG_CHECKING');
  const [missingKeys, setMissingKeys] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [session, setSession] = useState<Session | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [appAssets, setAppAssets] = useState<Record<string, string>>({});

  const [testResult, setTestResult] = useState<{ score: number, total: number }>({ score: 0, total: 0 });
  const [reviewData, setReviewData] = useState<{ questions: Question[], userAnswers: (number | null)[] }>({ questions: [], userAnswers: [] });
  const [battleResult, setBattleResult] = useState<{ playerScore: number, opponentScore: number, total: number, opponentName: string }>({ playerScore: 0, opponentScore: 0, total: 0, opponentName: '' });
  const [hazardPerceptionResult, setHazardPerceptionResult] = useState<{ scores: number[], totalScore: number, maxScore: number }>({ scores: [], totalScore: 0, maxScore: 0 });
  const [customTest, setCustomTest] = useState<Question[] | null>(null);
  const [timeLimit, setTimeLimit] = useState<number | undefined>();
  const [currentTopic, setCurrentTopic] = useState<string | undefined>();
  const [currentMode, setCurrentMode] = useState<'test' | 'study'>('test');
  const [duelOpponent, setDuelOpponent] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Main application lifecycle effect
  useEffect(() => {
    // 1. Configuration Check
    const keys: string[] = [];
    if (!isSupabaseConfigured) keys.push('VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY');
    if (!isGeminiConfigured) keys.push('VITE_GEMINI_API_KEY');
    
    if (keys.length > 0) {
      setMissingKeys(keys);
      setAppState('CONFIG_ERROR');
      return;
    }

    setAppState('AUTH_CHECKING');
    
    // Unified data loading function with timeouts
    const loadInitialData = async (session: Session) => {
        try {
            // Fetch assets
            setAppState('FETCHING_ASSETS');
            const assetsPromise = supabase!.from('app_assets').select('asset_key, asset_value');
            const { data: assetsData, error: assetsError } = await withTimeout(assetsPromise, TIMEOUT_DURATION, 'Could not load visual assets. Please check the `app_assets` table and its RLS policies.');
            if (assetsError) throw assetsError;
            const assetsMap = assetsData.reduce((acc: Record<string, string>, asset) => {
                acc[asset.asset_key] = asset.asset_value;
                return acc;
            }, {});
            setAppAssets(assetsMap);

            // Fetch profile
            setAppState('FETCHING_PROFILE');
            const profilePromise = supabase!.from('profiles').select('*').eq('id', session.user.id).single();
            let { data: profileData, error: profileError } = await withTimeout(profilePromise, TIMEOUT_DURATION, 'Could not load your profile. Please check the `profiles` table and its RLS policies.');

            if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
            if (!profileData) {
                const mockBadges: Badge[] = [{ name: '5-Day Streak', icon: 'badge_fire', color: 'text-orange-500' }, { name: 'Top 10 Finisher', icon: 'badge_trophy', color: 'text-yellow-500' }];
                const newUserProfileData = { name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'New User', avatarUrl: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${session.user.email}`, avgScore: 0, testsTaken: 0, timeSpent: '0m', streak: 0, freezes: 0, badges: mockBadges, dailyGoalProgress: 0, dailyGoalTarget: DAILY_GOAL_TARGET, lastDailyChallengeDate: null, bookmarked_questions: [], role: 'user' };
                const { data: newProfile, error } = await supabase!.from('profiles').insert({ id: session.user.id, ...newUserProfileData }).select().single();
                if (error) throw error;
                profileData = newProfile;
            }
            
            const testHistoryPromise = supabase!.from('test_attempts').select('*').eq('user_id', session.user.id);
            const { data: testHistoryData, error: testHistoryError } = await withTimeout(testHistoryPromise, TIMEOUT_DURATION, 'Could not load your test history.');
            if (testHistoryError) throw testHistoryError;
            profileData.testHistory = (testHistoryData || []).map((a: any) => ({...a, userId: a.user_id, questionIds: a.question_ids, userAnswers: a.user_answers }));
            profileData.bookmarkedQuestions = profileData.bookmarked_questions || [];
            setUserProfile(profileData);

            // Fetch questions
            setAppState('FETCHING_QUESTIONS');
            const questionsPromise = supabase!.from('questions').select('*');
            const { data: questionsData, error: questionsError } = await withTimeout(questionsPromise, TIMEOUT_DURATION, 'Could not load questions. Please check the `questions` table and its RLS policies.');
            if (questionsError) throw questionsError;

            setAllQuestions(questionsData && questionsData.length > 0 ? questionsData : MOCK_QUESTIONS);
            setAppState('READY');
        } catch (error: any) {
            console.error("Error during data initialization:", error);
            setErrorMessage(error.message || 'An unknown error occurred during startup.');
            setAppState('ERROR');
        }
    };

    // 2. Auth Listener
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setSession(null);
        setUserProfile(null);
        setAppState('UNAUTHENTICATED');
        setCurrentPage(Page.Dashboard);
        return;
      }
      
      setSession(session);
      // Load data only once when the first valid session is detected.
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          loadInitialData(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once.


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

    const newAttempt: TestAttempt = {
        userId: userProfile.id,
        topic: topic || (testId === 'daily-challenge' ? 'Daily Challenge' : 'Mock Test'),
        score: score,
        total: questions.length,
        questionIds: questions.map(q => q.id),
        userAnswers: userAnswers,
    };

    const updatedTestHistory = [...userProfile.testHistory, newAttempt];
    const totalScoreSum = updatedTestHistory.reduce((sum, attempt) => sum + attempt.score, 0);
    const totalQuestionsSum = updatedTestHistory.reduce((sum, attempt) => sum + attempt.total, 0);
    const newAvgScore = totalQuestionsSum > 0 ? Math.round((totalScoreSum / totalQuestionsSum) * 100) : 0;
    
    supabase!.from('test_attempts').insert({
        user_id: newAttempt.userId, topic: newAttempt.topic,
        score: newAttempt.score, total: newAttempt.total,
        question_ids: newAttempt.questionIds, user_answers: newAttempt.userAnswers,
    }).then(({error}) => error && console.error('Error saving test attempt:', error));
    
    const isDailyChallenge = testId === 'daily-challenge';
    const todayStr = new Date().toISOString().split('T')[0];

    supabase!.from('profiles').update({ 
        testsTaken: userProfile.testsTaken + 1,
        dailyGoalProgress: userProfile.dailyGoalProgress + score,
        lastDailyChallengeDate: isDailyChallenge ? todayStr : userProfile.lastDailyChallengeDate,
        avgScore: newAvgScore,
    }).eq('id', userProfile.id).then(({error}) => error && console.error("Error updating profile stats:", error));
    
    setUserProfile(prev => prev ? { 
      ...prev,
      testsTaken: prev.testsTaken + 1,
      dailyGoalProgress: prev.dailyGoalProgress + score,
      lastDailyChallengeDate: isDailyChallenge ? todayStr : prev.lastDailyChallengeDate,
      testHistory: updatedTestHistory,
      avgScore: newAvgScore,
    } : null);
    
    setTestResult({ score, total: questions.length });
    setReviewData({ questions, userAnswers });
    navigateTo(Page.Results);
  }, [navigateTo, userProfile]);

  const handleBattleComplete = useCallback((playerScore: number, opponentScore: number, total: number, opponentName: string) => {
    setUserProfile(prev => prev ? ({ ...prev, testsTaken: prev.testsTaken + 1, dailyGoalProgress: prev.dailyGoalProgress + playerScore }) : null);
    setBattleResult({ playerScore, opponentScore, total, opponentName });
    navigateTo(Page.BattleResults);
  }, [navigateTo]);

  const handleHazardPerceptionComplete = useCallback((scores: number[], totalClips: number) => {
    const totalScore = scores.reduce((acc, s) => acc + s, 0);
    const maxScore = totalClips * MAX_SCORE_PER_CLIP;
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
    const newBookmarks = isBookmarked ? currentBookmarks.filter(id => id !== questionId) : [...currentBookmarks, questionId];
    setUserProfile(prev => prev ? { ...prev, bookmarkedQuestions: newBookmarks } : null);
    const { error } = await supabase!.from('profiles').update({ bookmarked_questions: newBookmarks }).eq('id', userProfile.id);
    if (error) {
        console.error('Error updating bookmarks:', error);
        setUserProfile(prev => prev ? { ...prev, bookmarkedQuestions: currentBookmarks } : null);
    }
  };

  const onAssetsUpdate = useCallback(async () => {
    const { data, error } = await supabase!.from('app_assets').select('asset_key, asset_value');
    if (error) {
      console.error("Failed to refresh assets:", error);
      return;
    }
    const assetsMap = data.reduce((acc: Record<string, string>, asset) => {
        acc[asset.asset_key] = asset.asset_value;
        return acc;
    }, {});
    setAppAssets(assetsMap);
  }, []);

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
        return <StudyHubPage navigateTo={navigateTo} onCardClick={handleCardClick} appAssets={appAssets} />;
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
      case Page.Profile:
        return <ProfilePage user={userProfile!} navigateTo={navigateTo} appAssets={appAssets} />;
      case Page.Settings:
        return <SettingsPage user={userProfile!} session={session} navigateTo={navigateTo} theme={theme} setTheme={setTheme} />;
      case Page.Admin:
        return <AdminPage navigateTo={navigateTo} appAssets={appAssets} onAssetsUpdate={onAssetsUpdate} />;
      case Page.Dashboard:
      default:
        return <Dashboard onCardClick={handleCardClick} userProfile={userProfile!} navigateTo={navigateTo} handleDuel={handleDuel} appAssets={appAssets} />;
    }
  };

  if (appState === 'CONFIG_ERROR') {
    return <AppError message="Application Configuration Error" details={missingKeys} />;
  }
  if (appState === 'ERROR') {
    return <AppError message={errorMessage} />;
  }
  if (appState === 'UNAUTHENTICATED') {
    return <LoginPage appAssets={appAssets} />;
  }
  if (appState !== 'READY' || !userProfile) {
    return <AppLoadingIndicator state={appState} />;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] dark:bg-slate-900">
      <Header user={userProfile} navigateTo={navigateTo} theme={theme} setTheme={setTheme} appAssets={appAssets} />
      <main key={animationKey} className="animate-fadeInUp">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default App;
