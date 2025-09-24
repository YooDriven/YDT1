import React, { useState, useEffect, useCallback } from 'react';
import { Session } from 'https://esm.sh/@supabase/supabase-js@2';
import { Page, Question, TestCardData, UserProfile, Theme, LeaderboardEntry, TestAttempt, Badge, CaseStudy } from './types';
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
import CaseStudyPage from './components/CaseStudyPage';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import AdminPage from './components/AdminPage';
import Breadcrumbs, { Breadcrumb } from './components/Breadcrumbs';
import LeaderboardPage from './components/LeaderboardPage';
import { TOTAL_QUESTIONS, DAILY_GOAL_TARGET, MAX_SCORE_PER_CLIP } from './constants';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { isGeminiConfigured } from './lib/gemini';
import { QuestionsProvider } from './contexts/QuestionsContext';

// Define the states for our application's loading lifecycle
type AppState =
  | 'CONFIG_CHECKING'
  | 'CONFIG_ERROR'
  | 'AUTH_CHECKING'
  | 'UNAUTHENTICATED'
  | 'FETCHING_PROFILE'
  | 'FETCHING_ASSETS'
  | 'READY'
  | 'ERROR';

type Opponent = { name: string; avatarUrl: string; isUser?: boolean, rank?: number, score?: number, id?: string };

const AppLoadingIndicator: React.FC<{ state: AppState }> = ({ state }) => {
  const messages: Record<string, string> = {
    CONFIG_CHECKING: 'Verifying configuration...',
    CONFIG_ERROR: 'Configuration error.',
    AUTH_CHECKING: 'Securing connection...',
    UNAUTHENTICATED: 'Redirecting to login...',
    FETCHING_PROFILE: 'Loading your profile...',
    FETCHING_ASSETS: 'Loading visual assets...',
    READY: 'Ready!',
    ERROR: 'An error occurred.'
  };

  return (
     <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
      <div className="text-center p-4">
        <div className="relative inline-flex">
          <div className="w-16 h-16 bg-teal-500 rounded-full"></div>
          <div className="w-16 h-16 bg-teal-500 rounded-full absolute top-0 left-0 animate-ping"></div>
          <div className="w-16 h-16 bg-teal-500 rounded-full absolute top-0 left-0 animate-pulse"></div>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-6">{messages[state] || 'Loading application...'}</p>
      </div>
    </div>
  );
};

const AppError: React.FC<{ message: string; details?: string[] }> = ({ message, details }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 text-gray-300 animate-fadeInUp">
    <div className="max-w-2xl w-full bg-white dark:bg-slate-800 border border-red-500/50 rounded-2xl p-8 shadow-2xl shadow-red-500/10">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500 dark:text-red-400 mb-4 tracking-tight leading-tight">Application Error</h1>
        <p className="text-base text-gray-600 dark:text-slate-400 mb-6 leading-relaxed">
          {message}
        </p>
        {details && details.length > 0 && (
          <>
            <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
              Please ensure the following environment variables are correctly set in your project configuration:
            </p>
            <div className="flex flex-col items-center space-y-2">
              {details.map(key => (
                <code key={key} className="bg-slate-100 dark:bg-slate-700 text-amber-600 dark:text-amber-400 font-mono text-sm p-2 rounded">{key}</code>
              ))}
            </div>
          </>
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
  const [appAssets, setAppAssets] = useState<Record<string, string>>({});

  const [testResult, setTestResult] = useState<{ score: number, total: number }>({ score: 0, total: 0 });
  const [reviewData, setReviewData] = useState<{ questions: Question[], userAnswers: (number | null)[] }>({ questions: [], userAnswers: [] });
  const [battleResult, setBattleResult] = useState<{ playerScore: number, opponentScore: number, total: number, opponentName: string }>({ playerScore: 0, opponentScore: 0, total: 0, opponentName: '' });
  const [hazardPerceptionResult, setHazardPerceptionResult] = useState<{ scores: number[], totalScore: number, maxScore: number }>({ scores: [], totalScore: 0, maxScore: 0 });
  const [customTest, setCustomTest] = useState<Question[] | null>(null);
  const [currentTestId, setCurrentTestId] = useState<string | undefined>();
  const [timeLimit, setTimeLimit] = useState<number | undefined>();
  const [currentTopic, setCurrentTopic] = useState<string | undefined>();
  const [currentMode, setCurrentMode] = useState<'test' | 'study'>('test');
  const [duelOpponent, setDuelOpponent] = useState<LeaderboardEntry | null>(null);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
  const [lastOpponent, setLastOpponent] = useState<Opponent | null>(null);

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
    if (!isSupabaseConfigured) keys.push('SUPABASE_URL', 'SUPABASE_ANON_KEY');
    if (!isGeminiConfigured) keys.push('API_KEY');
    
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
                const newUserProfileData = { name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'New User', avatarUrl: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${session.user.email}`, avgScore: 0, testsTaken: 0, timeSpent: '0m', streak: 0, freezes: 0, badges: mockBadges, dailyGoalProgress: 0, dailyGoalTarget: DAILY_GOAL_TARGET, lastDailyChallengeDate: null, bookmarked_questions: [], role: session.user.user_metadata?.role === 'admin' ? 'admin' : 'user' };
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
      setSelectedCaseStudy(null);
      setCurrentTestId(undefined);
    }
    setCurrentPage(page);
    setAnimationKey(prevKey => prevKey + 1);
  }, []);
  
  const handleCardClick = useCallback((card: TestCardData) => {
    setCustomTest(null); // Clear any previous custom tests
    if (card.mode) {
      setCurrentMode(card.mode);
    }
    setCurrentTopic(card.topic);
    setTimeLimit(card.timeLimit);
    setCurrentTestId(card.id);
    navigateTo(card.page);
  }, [navigateTo]);

  const handleTopicSelect = useCallback((topic: string) => {
      setCurrentTopic(topic);
      if (currentMode === 'test') {
        navigateTo(Page.Test);
      } else {
        navigateTo(Page.Study);
      }
  }, [navigateTo, currentMode]);

  const handleCaseStudySelect = useCallback((caseStudy: CaseStudy) => {
    setSelectedCaseStudy(caseStudy);
    navigateTo(Page.CaseStudy);
  }, [navigateTo]);

  const handleTestComplete = useCallback(async (score: number, questions: Question[], userAnswers: (number | null)[], topic?: string, testId?: string) => {
    if (!userProfile) return;
    
    let testTopic = topic;
    if (selectedCaseStudy) {
        testTopic = `Case Study: ${selectedCaseStudy.title}`;
    } else if (testId === 'daily-challenge') {
        testTopic = 'Daily Challenge';
    } else if (!topic) {
        testTopic = 'Mock Test';
    }

    const newAttempt: TestAttempt = {
        userId: userProfile.id,
        topic: testTopic,
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
  }, [navigateTo, userProfile, selectedCaseStudy]);

  const handleBattleComplete = useCallback((playerScore: number, opponentScore: number, total: number, opponent: Opponent) => {
    setUserProfile(prev => prev ? ({ ...prev, testsTaken: prev.testsTaken + 1, dailyGoalProgress: prev.dailyGoalProgress + playerScore }) : null);
    setBattleResult({ playerScore, opponentScore, total, opponentName: opponent.name });
    setLastOpponent(opponent);
    navigateTo(Page.BattleResults);
  }, [navigateTo]);

  const handleRematch = useCallback(() => {
    if (lastOpponent?.isUser) {
        // This is a rough conversion for rematching a real player
        setDuelOpponent(lastOpponent as LeaderboardEntry);
    } else {
        // For rematching a bot, just clear the duel opponent so a new one is generated
        setDuelOpponent(null);
    }
    navigateTo(Page.BattleGround);
  }, [lastOpponent, navigateTo]);


  const handleHazardPerceptionComplete = useCallback((scores: number[], totalClips: number) => {
    const totalScore = scores.reduce((acc, s) => acc + s, 0);
    const maxScore = totalClips * MAX_SCORE_PER_CLIP;
    setHazardPerceptionResult({ scores, totalScore, maxScore });
    navigateTo(Page.HazardPerceptionResults);
  }, [navigateTo]);

  const handleDuel = useCallback((opponent: LeaderboardEntry) => {
    setDuelOpponent(opponent);
    navigateTo(Page.BattleGround);
  }, [navigateTo]);

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
  
  const generateBreadcrumbs = (): Breadcrumb[] => {
    const home: Breadcrumb = { label: 'Dashboard', page: Page.Dashboard };
    const studyHub: Breadcrumb = { label: 'Study Hub', page: Page.StudyHub };

    switch (currentPage) {
        case Page.Profile:
            return [home, { label: 'My Profile' }];
        case Page.Settings:
            return [home, { label: 'Settings' }];
        case Page.Admin:
             return [home, { label: 'Admin' }];
        case Page.Leaderboard:
            return [home, { label: 'Leaderboard' }];
        case Page.StudyHub:
            return [home, { label: 'Study Hub' }];
        case Page.TopicSelection:
            return [home, studyHub, { label: 'Topics' }];
        case Page.Study:
            return [home, studyHub, { label: 'Topics', page: Page.TopicSelection }, { label: currentTopic || 'Study' }];
        case Page.Test:
             if (currentTopic) {
                return [home, studyHub, { label: 'Topics', page: Page.TopicSelection }, { label: currentTopic }];
            }
            return []; // No breadcrumbs for general tests
        case Page.RoadSigns:
            return [home, studyHub, { label: 'Road Signs' }];
        case Page.BookmarkedQuestions:
            return [home, studyHub, { label: 'Bookmarked Questions' }];
        case Page.HighwayCode:
            return [home, studyHub, { label: 'Highway Code' }];
        case Page.CaseStudySelection:
            return [home, studyHub, { label: 'Case Studies' }];
        case Page.CaseStudy:
            return [home, studyHub, { label: 'Case Studies', page: Page.CaseStudySelection }, { label: selectedCaseStudy?.title || 'Case Study' }];
        default:
            return [];
    }
  };


  const renderCurrentPage = () => {
    switch (currentPage) {
      case Page.Test:
        return <TestPage navigateTo={navigateTo} onTestComplete={handleTestComplete} totalQuestions={TOTAL_QUESTIONS} customQuestions={customTest} testId={currentTestId} timeLimit={timeLimit} topic={currentTopic} bookmarkedQuestions={userProfile?.bookmarkedQuestions || []} onToggleBookmark={handleToggleBookmark} />;
      case Page.Results:
        return <ResultsPage navigateTo={navigateTo} score={testResult.score} totalQuestions={testResult.total} />;
      case Page.Review:
        return <ReviewPage navigateTo={navigateTo} reviewData={reviewData} />;
      case Page.RoadSigns:
        return <RoadSignsPage navigateTo={navigateTo} />;
      case Page.Matchmaking:
        return <MatchmakingPage navigateTo={navigateTo} />;
      case Page.BattleGround:
        return <BattleGroundPage navigateTo={navigateTo} onBattleComplete={handleBattleComplete} opponent={duelOpponent} />;
      case Page.BattleResults:
        return <BattleResultsPage navigateTo={navigateTo} onRematch={handleRematch} {...battleResult} />;
      case Page.HazardPerception:
        return <HazardPerceptionPage navigateTo={navigateTo} onTestComplete={handleHazardPerceptionComplete} />;
      case Page.HazardPerceptionResults:
        return <HazardPerceptionResultsPage navigateTo={navigateTo} {...hazardPerceptionResult} />;
      case Page.StudyHub:
        return <StudyHubPage navigateTo={navigateTo} onCardClick={handleCardClick} appAssets={appAssets} />;
      case Page.TopicSelection:
        return <TopicSelectionPage navigateTo={navigateTo} onTopicSelect={handleTopicSelect} mode={currentMode} />;
      case Page.Study:
        return <StudyPage navigateTo={navigateTo} topic={currentTopic || ''} />;
      case Page.BookmarkedQuestions:
        return <BookmarkedQuestionsPage navigateTo={navigateTo} bookmarkedQuestions={userProfile?.bookmarkedQuestions || []} onToggleBookmark={handleToggleBookmark} />;
      case Page.HighwayCode:
        return <HighwayCodePage navigateTo={navigateTo} />;
      case Page.CaseStudySelection:
        return <CaseStudySelectionPage navigateTo={navigateTo} onCaseStudySelect={handleCaseStudySelect} />;
      case Page.CaseStudy:
        return <CaseStudyPage navigateTo={navigateTo} caseStudy={selectedCaseStudy!} onTestComplete={handleTestComplete} />;
      case Page.Profile:
        return <ProfilePage user={userProfile!} navigateTo={navigateTo} appAssets={appAssets} />;
      case Page.Settings:
        return <SettingsPage user={userProfile!} onProfileUpdate={(name) => setUserProfile(p => p ? {...p, name} : null)} session={session} navigateTo={navigateTo} theme={theme} setTheme={setTheme} />;
      case Page.Admin:
        return <AdminPage navigateTo={navigateTo} appAssets={appAssets} onAssetsUpdate={onAssetsUpdate} />;
      case Page.Leaderboard:
        return <LeaderboardPage navigateTo={navigateTo} currentUser={userProfile!} />;
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
    <QuestionsProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header user={userProfile} navigateTo={navigateTo} theme={theme} setTheme={setTheme} appAssets={appAssets} />
        <Breadcrumbs path={generateBreadcrumbs()} navigateTo={navigateTo} />
        <main key={animationKey} className="animate-fadeInUp">
          {renderCurrentPage()}
        </main>
      </div>
    </QuestionsProvider>
  );
};

export default App;