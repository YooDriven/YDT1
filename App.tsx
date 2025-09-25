import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Session } from 'https://esm.sh/@supabase/supabase-js@2';
import { Page, Question, TestCardData, UserProfile, Theme, LeaderboardEntry, TestAttempt, Badge, CaseStudy, AppAssetRecord, AppAsset, Opponent } from './types';
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
import { initializeSupabase, supabase } from './lib/supabaseClient';
import { QuestionsProvider } from './contexts/QuestionsContext';
import DynamicAsset from './components/DynamicAsset';
import { Button, Input } from './components/ui';

// Define the states for our application's loading lifecycle
type AppState =
  | 'INIT'
  | 'AWAITING_CONFIG'
  | 'AUTH_CHECKING'
  | 'UNAUTHENTICATED'
  | 'FETCHING_PROFILE'
  | 'FETCHING_ASSETS'
  | 'READY'
  | 'ERROR';


const SupabaseConfigPage: React.FC<{ onConfigured: (url: string, key: string) => void, appAssets: AppAssetRecord }> = ({ onConfigured, appAssets }) => {
    const [url, setUrl] = useState('');
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url || !key) {
            setError('Both URL and Key are required.');
            return;
        }
        setError('');
        setLoading(true);
        // Pass the credentials up to App.tsx to attempt initialization.
        onConfigured(url, key);
        // The loading state can be reset by the parent if config fails
        setTimeout(() => setLoading(false), 1000); 
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-8 space-y-6">
                <div className="text-center">
                    <div className="h-10 w-auto mx-auto mb-4 flex justify-center">
                        <DynamicAsset asset={appAssets['logo_yoodrive']} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Backend Configuration</h2>
                    <p className="mt-2 text-base text-gray-600 dark:text-gray-400">This app requires a Supabase backend to function. Please enter your project details.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="url"
                        placeholder="Supabase Project URL"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                    />
                    <Input
                        type="text"
                        placeholder="Supabase Anon Key"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        required
                    />
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <Button type="submit" variant="primary" className="w-full py-3" disabled={loading}>
                        {loading ? 'Connecting...' : 'Save and Continue'}
                    </Button>
                </form>
                 <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Your keys will be stored in your browser's local storage and will not be shared.</p>
            </div>
        </div>
    );
};

const AppLoadingIndicator: React.FC<{ state: AppState }> = ({ state }) => {
  const messages: Record<string, string> = {
    INIT: 'Initializing...',
    AWAITING_CONFIG: 'Awaiting configuration...',
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
    <div className="max-w-2xl w-full bg-white dark:bg-slate-800 border border-amber-500/50 rounded-2xl p-8 shadow-2xl shadow-amber-500/10">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-amber-500 dark:text-amber-400 mb-4 tracking-tight leading-tight">Application Configuration Needed</h1>
        <p className="text-base text-gray-600 dark:text-slate-400 mb-6 leading-relaxed">
          {message}
        </p>
        {details && details.length > 0 && (
          <>
            <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
              Please ensure the following environment variables are correctly set in your hosting environment:
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
const withTimeout = <T,>(promise: PromiseLike<T>, ms: number, customError?: string): Promise<T> => {
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
  const [appState, setAppState] = useState<AppState>('INIT');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [session, setSession] = useState<Session | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [appAssets, setAppAssets] = useState<AppAssetRecord>({});

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

  // Create a ref to hold the current appState to avoid stale closures in the subscription
  const appStateRef = useRef(appState);
  appStateRef.current = appState;

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
    // Unified data loading function with timeouts
    const loadInitialData = async (session: Session) => {
        try {
            // Fetch assets
            setAppState('FETCHING_ASSETS');
            const assetsPromise = supabase!.from('app_assets').select('asset_key, asset_value, mime_type');
            const { data: assetsData, error: assetsError } = await withTimeout(assetsPromise, TIMEOUT_DURATION, 'Could not load visual assets. Please check the `app_assets` table and its RLS policies.') as { data: {asset_key: string; asset_value: string; mime_type: string}[] | null; error: any; };
            if (assetsError) throw assetsError;
            const assetsMap = (assetsData || []).reduce((acc: AppAssetRecord, asset) => {
                if (asset.asset_key && asset.asset_value && asset.mime_type) {
                    acc[asset.asset_key] = { value: asset.asset_value, mimeType: asset.mime_type };
                }
                return acc;
            }, {});
            setAppAssets(assetsMap);

            // Fetch profile
            setAppState('FETCHING_PROFILE');
            const profilePromise = supabase!.from('profiles').select('*').eq('id', session.user.id).single();
            let { data: profileData, error: profileError } = await withTimeout(profilePromise, TIMEOUT_DURATION, 'Could not load your profile. Please check the `profiles` table and its RLS policies.') as { data: any | null; error: any; };

            if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
            if (!profileData) {
                const mockBadges: Badge[] = [{ name: '5-Day Streak', icon: 'badge_fire', color: 'text-orange-500' }, { name: 'Top 10 Finisher', icon: 'badge_trophy', color: 'text-yellow-500' }];
                const newUserProfileData = { name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'New User', avatarUrl: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${session.user.email}`, avgScore: 0, testsTaken: 0, timeSpent: '0m', streak: 0, freezes: 0, badges: mockBadges, dailyGoalProgress: 0, dailyGoalTarget: DAILY_GOAL_TARGET, lastDailyChallengeDate: null, bookmarked_questions: [], role: session.user.user_metadata?.role === 'admin' ? 'admin' : 'user' };
                const { data: newProfile, error } = await supabase!.from('profiles').insert({ id: session.user.id, ...newUserProfileData }).select().single();
                if (error) throw error;
                profileData = newProfile;
            }
            
            const testHistoryPromise = supabase!.from('test_attempts').select('*').eq('user_id', session.user.id);
            const { data: testHistoryData, error: testHistoryError } = await withTimeout(testHistoryPromise, TIMEOUT_DURATION, 'Could not load your test history.') as { data: any[] | null; error: any; };
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

    if (appState === 'INIT') {
      const envUrl = typeof process !== 'undefined' ? process.env.SUPABASE_URL : undefined;
      const envKey = typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : undefined;
      if (envUrl && envKey && initializeSupabase(envUrl, envKey)) {
          setAppState('AUTH_CHECKING');
          return;
      }

      const storedUrl = localStorage.getItem('SUPABASE_URL');
      const storedKey = localStorage.getItem('SUPABASE_ANON_KEY');
      if (storedUrl && storedKey && initializeSupabase(storedUrl, storedKey)) {
          setAppState('AUTH_CHECKING');
          return;
      }
      
      setAppState('AWAITING_CONFIG');
    }

    if (appState === 'AUTH_CHECKING') {
      const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (!session) {
          setUserProfile(null);
          setAppState('UNAUTHENTICATED');
          setCurrentPage(Page.Dashboard);
        } else if (userProfile === null && (appStateRef.current === 'AUTH_CHECKING' || appStateRef.current === 'UNAUTHENTICATED')) {
           loadInitialData(session);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [appState, userProfile]);


  const handleConfigured = (url: string, key: string) => {
    // Clear potentially invalid keys from local storage first
    localStorage.removeItem('SUPABASE_URL');
    localStorage.removeItem('SUPABASE_ANON_KEY');

    if (initializeSupabase(url, key)) {
        localStorage.setItem('SUPABASE_URL', url);
        localStorage.setItem('SUPABASE_ANON_KEY', key);
        setAppState('AUTH_CHECKING');
    } else {
        setErrorMessage('Failed to connect to Supabase. Please check the URL and Key.');
        setAppState('AWAITING_CONFIG'); // Stay on the config page
    }
  };

  const navigateTo = (page: Page) => {
    setAnimationKey(prev => prev + 1); // Trigger animation on page change
    setCurrentPage(page);
  };

  const handleCardClick = (card: TestCardData) => {
    if (card.id === 'battle-ground') {
        setDuelOpponent(null);
    }
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
  
  const handleDuel = (opponent: LeaderboardEntry) => {
    const botOpponent: Opponent = { ...opponent, isBot: true };
    const battleId = `battle-duel-${userProfile!.id}-${opponent.id}-${Date.now()}`;
    setCurrentBattleId(battleId);
    setDuelOpponent(botOpponent);
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
    
    // Save test attempt to Supabase
    if (session && userProfile) {
      const originalProfile = { ...userProfile };
      const attempt = {
        user_id: userProfile.id,
        topic: topic || testId || 'Mock Test',
        score: score,
        total: questions.length,
        question_ids: questions.map(q => q.id),
        user_answers: userAnswers,
      };

      const { error } = await supabase!.from('test_attempts').insert(attempt);
      if (error) {
        console.error('Error saving test attempt:', error);
      } else {
        // Optimistically update local profile state for immediate UI feedback
        const updatedHistory: TestAttempt[] = [...(userProfile.testHistory || []), {
            userId: attempt.user_id,
            topic: attempt.topic,
            score: attempt.score,
            total: attempt.total,
            questionIds: attempt.question_ids,
            userAnswers: attempt.user_answers
        }];

        const newTestsTaken = updatedHistory.length;
        const newAvgScore = Math.round(updatedHistory.reduce((acc, t) => acc + (t.score / t.total), 0) / newTestsTaken * 100);

        const isDaily = testId === 'daily-challenge';
        const todayStr = new Date().toISOString().split('T')[0];

        const updatedProfile: UserProfile = {
          ...userProfile,
          testHistory: updatedHistory,
          testsTaken: newTestsTaken,
          avgScore: isNaN(newAvgScore) ? 0 : newAvgScore,
          lastDailyChallengeDate: isDaily ? todayStr : userProfile.lastDailyChallengeDate,
          dailyGoalProgress: isDaily ? DAILY_GOAL_TARGET : Math.min(DAILY_GOAL_TARGET, userProfile.dailyGoalProgress + questions.length),
        };
        setUserProfile(updatedProfile);
        
        // Also update the database profile
        const { error: profileError } = await supabase!.from('profiles').update({
            testsTaken: updatedProfile.testsTaken,
            avgScore: updatedProfile.avgScore,
            lastDailyChallengeDate: updatedProfile.lastDailyChallengeDate,
            dailyGoalProgress: updatedProfile.dailyGoalProgress,
        }).eq('id', userProfile.id);

        if (profileError) {
            console.error('Error updating profile stats:', profileError);
            // Revert on failure to maintain consistency
            setUserProfile(originalProfile);
        }
      }
    }
    
    navigateTo(Page.Results);
  };
  
  const handleBattleComplete = (playerScore: number, opponentScore: number, total: number, opponent: Opponent) => {
    setBattleResult({ playerScore, opponentScore, total, opponentName: opponent.name });
    setLastOpponent(opponent);
    navigateTo(Page.BattleResults);
  };
  
  const handleRematch = () => {
      if (lastOpponent && !lastOpponent.isBot && lastOpponent.id) {
          handleDuel(lastOpponent as LeaderboardEntry);
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
    if (currentMode === 'test') {
      navigateTo(Page.Test);
    } else {
      navigateTo(Page.Study);
    }
  };

  const handleCaseStudySelect = (caseStudy: CaseStudy) => {
      setSelectedCaseStudy(caseStudy);
      navigateTo(Page.CaseStudy);
  };

  const handleToggleBookmark = async (questionId: string) => {
    if (!userProfile) return;
    const isBookmarked = userProfile.bookmarkedQuestions.includes(questionId);
    const updatedBookmarks = isBookmarked
      ? userProfile.bookmarkedQuestions.filter(id => id !== questionId)
      : [...userProfile.bookmarkedQuestions, questionId];

    // Optimistic update
    setUserProfile({ ...userProfile, bookmarkedQuestions: updatedBookmarks });
    
    // Update Supabase
    const { error } = await supabase!.from('profiles').update({ bookmarked_questions: updatedBookmarks }).eq('id', userProfile.id);
    if (error) {
      console.error("Error updating bookmarks:", error);
      // Revert on error
      setUserProfile({ ...userProfile, bookmarkedQuestions: userProfile.bookmarkedQuestions });
    }
  };
  
  const handleProfileUpdate = (name: string) => {
    if(userProfile) {
        setUserProfile({...userProfile, name});
    }
  };

  const handleAssetsUpdate = async () => {
    if (!supabase) return;
    try {
        const { data: assetsData, error: assetsError } = await supabase.from('app_assets').select('asset_key, asset_value, mime_type');
        if (assetsError) throw assetsError;
        const assetsMap = (assetsData as {asset_key: string; asset_value: string; mime_type: string}[]).reduce((acc: AppAssetRecord, asset) => {
            if (asset.asset_key && asset.asset_value && asset.mime_type) {
                acc[asset.asset_key] = { value: asset.asset_value, mimeType: asset.mime_type };
            }
            return acc;
        }, {});
        setAppAssets(assetsMap);
    } catch (error) {
        console.error("Failed to refresh assets:", error);
    }
  };
  

  const breadcrumbPaths: Record<Page, Breadcrumb[]> = {
    [Page.Dashboard]: [{ label: 'Dashboard' }],
    [Page.Test]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Test' }],
    [Page.Results]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Test' }, { label: 'Results' }],
    [Page.Review]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Test' }, { label: 'Results', page: Page.Results }, { label: 'Review' }],
    [Page.Matchmaking]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Battle Ground' }],
    [Page.BattleGround]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Battle Ground' }],
    [Page.BattleResults]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Battle Ground' }, { label: 'Results' }],
    [Page.StudyHub]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Study Hub' }],
    [Page.RoadSigns]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Study Hub', page: Page.StudyHub }, { label: 'Road Signs' }],
    [Page.TopicSelection]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Study Hub', page: Page.StudyHub }, { label: 'Topic Selection' }],
    [Page.Study]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Study Hub', page: Page.StudyHub }, { label: 'Topic Selection', page: Page.TopicSelection }, { label: 'Study' }],
    [Page.BookmarkedQuestions]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Study Hub', page: Page.StudyHub }, { label: 'Bookmarked Questions' }],
    [Page.HazardPerception]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Study Hub', page: Page.StudyHub }, { label: 'Hazard Perception' }],
    [Page.HazardPerceptionResults]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Study Hub', page: Page.StudyHub }, { label: 'Hazard Perception' }, { label: 'Results' }],
    [Page.HighwayCode]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Study Hub', page: Page.StudyHub }, { label: 'Highway Code' }],
    [Page.CaseStudySelection]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Study Hub', page: Page.StudyHub }, { label: 'Case Studies' }],
    [Page.CaseStudy]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Study Hub', page: Page.StudyHub }, { label: 'Case Studies', page: Page.CaseStudySelection }, { label: 'Scenario' }],
    [Page.Profile]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'My Profile' }],
    [Page.Settings]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Settings' }],
    [Page.Admin]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Admin Panel' }],
    [Page.Leaderboard]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Leaderboard' }],
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.Test: return <TestPage navigateTo={navigateTo} onTestComplete={handleTestComplete} totalQuestions={TOTAL_QUESTIONS} customQuestions={customTest} testId={currentTestId} timeLimit={timeLimit} topic={currentTopic} bookmarkedQuestions={userProfile?.bookmarkedQuestions || []} onToggleBookmark={handleToggleBookmark} />;
      case Page.Results: return <ResultsPage navigateTo={navigateTo} score={testResult.score} totalQuestions={testResult.total} />;
      case Page.Matchmaking: return <MatchmakingPage navigateTo={navigateTo} onMatchFound={handleMatchFound} user={userProfile!} />;
      case Page.BattleGround: return <BattleGroundPage navigateTo={navigateTo} onBattleComplete={handleBattleComplete} battleId={currentBattleId!} user={userProfile!} opponent={duelOpponent!} />;
      case Page.BattleResults: return <BattleResultsPage navigateTo={navigateTo} onRematch={handleRematch} playerScore={battleResult.playerScore} opponentScore={battleResult.opponentScore} total={battleResult.total} opponentName={battleResult.opponentName}/>;
      case Page.HazardPerception: return <HazardPerceptionPage navigateTo={navigateTo} onTestComplete={handleHazardPerceptionComplete} />;
      case Page.HazardPerceptionResults: return <HazardPerceptionResultsPage navigateTo={navigateTo} {...hazardPerceptionResult} />;
      case Page.Review: return <ReviewPage navigateTo={navigateTo} reviewData={reviewData} />;
      case Page.RoadSigns: return <RoadSignsPage navigateTo={navigateTo} />;
      case Page.StudyHub: return <StudyHubPage navigateTo={navigateTo} onCardClick={handleCardClick} appAssets={appAssets} />;
      case Page.TopicSelection: return <TopicSelectionPage navigateTo={navigateTo} onTopicSelect={handleTopicSelect} mode={currentMode} />;
      case Page.Study: return <StudyPage navigateTo={navigateTo} topic={currentTopic!} />;
      case Page.BookmarkedQuestions: return <BookmarkedQuestionsPage navigateTo={navigateTo} bookmarkedQuestions={userProfile?.bookmarkedQuestions || []} onToggleBookmark={handleToggleBookmark} />;
      case Page.HighwayCode: return <HighwayCodePage navigateTo={navigateTo} />;
      case Page.CaseStudySelection: return <CaseStudySelectionPage navigateTo={navigateTo} onCaseStudySelect={handleCaseStudySelect} />;
      case Page.CaseStudy: return <CaseStudyPage navigateTo={navigateTo} caseStudy={selectedCaseStudy!} onTestComplete={handleTestComplete} />;
      case Page.Profile: return <ProfilePage user={userProfile!} navigateTo={navigateTo} appAssets={appAssets} />;
      case Page.Settings: return <SettingsPage user={userProfile!} navigateTo={navigateTo} session={session} theme={theme} setTheme={setTheme} onProfileUpdate={handleProfileUpdate} />;
      case Page.Admin: return <AdminPage navigateTo={navigateTo} appAssets={appAssets} onAssetsUpdate={handleAssetsUpdate} />;
      case Page.Leaderboard: return <LeaderboardPage navigateTo={navigateTo} currentUser={userProfile!} />;
      default: return <Dashboard onCardClick={handleCardClick} userProfile={userProfile!} navigateTo={navigateTo} handleDuel={handleDuel} appAssets={appAssets} />;
    }
  };

  if (appState === 'AWAITING_CONFIG') {
    return <SupabaseConfigPage onConfigured={handleConfigured} appAssets={appAssets} />;
  }

  if (appState === 'ERROR') {
      return <AppError message={errorMessage} />;
  }
  
  if (appState !== 'READY') {
    return <AppLoadingIndicator state={appState} />;
  }

  if (!session || !userProfile) {
    return <LoginPage appAssets={appAssets} />;
  }
  
  return (
    <QuestionsProvider>
      <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
        <Header user={userProfile} navigateTo={navigateTo} theme={theme} setTheme={setTheme} appAssets={appAssets} />
        <Breadcrumbs path={breadcrumbPaths[currentPage]} navigateTo={navigateTo} />
        <div key={animationKey} className="animate-fadeInUp">
          {renderPage()}
        </div>
      </div>
    </QuestionsProvider>
  );
};

export default App;