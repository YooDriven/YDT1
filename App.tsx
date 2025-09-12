import React, { useState, useEffect, useCallback } from 'react';
import { Session } from 'https://esm.sh/@supabase/supabase-js@2';
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
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import { TOTAL_QUESTIONS, MOCK_HAZARD_CLIPS, DAILY_GOAL_TARGET, MOCK_QUESTIONS } from './constants';
import { getDailyChallengeQuestions } from './utils';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { isGeminiConfigured } from './lib/gemini';

// Define the states for our application's loading lifecycle
type AppState =
  | 'CONFIG_CHECKING'
  | 'CONFIG_ERROR'
  | 'INITIALIZING'
  | 'AUTH_CHECKING'
  | 'UNAUTHENTICATED'
  | 'FETCHING_PROFILE'
  | 'FETCHING_QUESTIONS'
  | 'READY'
  | 'ERROR';

const AppLoadingIndicator: React.FC<{ state: AppState }> = ({ state }) => {
  const messages: Record<AppState, string> = {
    CONFIG_CHECKING: 'Verifying configuration...',
    CONFIG_ERROR: 'Configuration error.',
    INITIALIZING: 'Initializing application...',
    AUTH_CHECKING: 'Securing connection...',
    UNAUTHENTICATED: 'Redirecting to login...',
    FETCHING_PROFILE: 'Loading your profile...',
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
        {details && details.length > 0 && (
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
        )}
      </div>
    </div>
  </div>
);


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
    // 1. Configuration Check
    const keys: string[] = [];
    if (!isSupabaseConfigured) keys.push('VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY');
    if (!isGeminiConfigured) keys.push('VITE_GEMINI_API_KEY');
    
    if (keys.length > 0) {
      setMissingKeys(keys);
      setAppState('CONFIG_ERROR');
    } else {
      setAppState('INITIALIZING');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (appState !== 'INITIALIZING') return;
    
    // 2. Auth State Subscription
    setAppState('AUTH_CHECKING');
    supabase!.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAppState(session ? 'FETCHING_PROFILE' : 'UNAUTHENTICATED');
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_OUT') {
        setUserProfile(null);
        setAllQuestions([]);
        setCurrentPage(Page.Dashboard);
        setAppState('UNAUTHENTICATED');
      } else if (_event === 'SIGNED_IN') {
        setAppState('FETCHING_PROFILE');
      }
    });

    return () => subscription.unsubscribe();
  }, [appState]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (appState !== 'FETCHING_PROFILE' || !session) return;
      try {
        const { data: { user } } = await supabase!.auth.getUser();
        if (!user) throw new Error("User not found despite session.");

        let { data: profileData, error: profileError } = await supabase!.from('profiles').select('*').eq('id', user.id).single();
        if (profileError && profileError.code !== 'PGRST116') { // Ignore 'exact one row' error
           throw profileError;
        }

        if (!profileData) {
          const newUserProfileData = {
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User',
            avatarUrl: user.user_metadata?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${user.email}`,
            avgScore: 0, testsTaken: 0, timeSpent: '0m', streak: 0, freezes: 0, badges: [],
            dailyGoalProgress: 0, dailyGoalTarget: DAILY_GOAL_TARGET, lastDailyChallengeDate: null, bookmarked_questions: [],
          };
          const { data: newProfile, error } = await supabase!.from('profiles').insert({ id: user.id, ...newUserProfileData }).select().single();
          if (error) throw error;
          profileData = newProfile;
        }
        
        const { data: testHistoryData } = await supabase!.from('test_attempts').select('*').eq('user_id', user.id);
        profileData.testHistory = (testHistoryData || []).map((a: any) => ({...a, userId: a.user_id, questionIds: a.question_ids, userAnswers: a.user_answers }));
        profileData.bookmarkedQuestions = profileData.bookmarked_questions || [];

        setUserProfile(profileData);
        setAppState('FETCHING_QUESTIONS');
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        setErrorMessage(`Could not load your profile. Please try logging in again. [${error.message}]`);
        setAppState('ERROR');
      }
    };
    fetchProfile();
  }, [appState, session]);
  
  useEffect(() => {
    const fetchQuestions = async () => {
        if (appState !== 'FETCHING_QUESTIONS') return;
        try {
            const { data, error } = await supabase!.from('questions').select('*');
            if (error) throw error;
            setAllQuestions(data && data.length > 0 ? data : MOCK_QUESTIONS);
            setAppState('READY');
        } catch (error: any) {
            console.error("Error fetching questions, using mock data:", error);
            setAllQuestions(MOCK_QUESTIONS);
            // Non-critical failure, app can proceed with mock data.
            setAppState('READY');
        }
    };
    fetchQuestions();
  }, [appState]);


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

    // 1. Create the new test attempt object
    const newAttempt: TestAttempt = {
        userId: userProfile.id,
        topic: topic || (testId === 'daily-challenge' ? 'Daily Challenge' : 'Mock Test'),
        score: score,
        total: questions.length,
        questionIds: questions.map(q => q.id),
        userAnswers: userAnswers,
    };

    // 2. Update the test history for calculation
    const updatedTestHistory = [...userProfile.testHistory, newAttempt];

    // 3. Recalculate the average score
    const totalScoreSum = updatedTestHistory.reduce((sum, attempt) => sum + attempt.score, 0);
    const totalQuestionsSum = updatedTestHistory.reduce((sum, attempt) => sum + attempt.total, 0);
    const newAvgScore = totalQuestionsSum > 0 ? Math.round((totalScoreSum / totalQuestionsSum) * 100) : 0;
    
    // 4. Save the new attempt to the database
    supabase!.from('test_attempts').insert({
        user_id: newAttempt.userId, topic: newAttempt.topic,
        score: newAttempt.score, total: newAttempt.total,
        question_ids: newAttempt.questionIds, user_answers: newAttempt.userAnswers,
    }).then(({error}) => error && console.error('Error saving test attempt:', error));
    
    const isDailyChallenge = testId === 'daily-challenge';
    const todayStr = new Date().toISOString().split('T')[0];

    // 5. Update the user's profile in the database with the new average score
    supabase!.from('profiles').update({ 
        testsTaken: userProfile.testsTaken + 1,
        dailyGoalProgress: userProfile.dailyGoalProgress + score,
        lastDailyChallengeDate: isDailyChallenge ? todayStr : userProfile.lastDailyChallengeDate,
        avgScore: newAvgScore,
    }).eq('id', userProfile.id).then(({error}) => error && console.error("Error updating profile stats:", error));
    
    // 6. Update the local user profile state
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
    const newBookmarks = isBookmarked ? currentBookmarks.filter(id => id !== questionId) : [...currentBookmarks, questionId];
    setUserProfile(prev => prev ? { ...prev, bookmarkedQuestions: newBookmarks } : null);
    const { error } = await supabase!.from('profiles').update({ bookmarked_questions: newBookmarks }).eq('id', userProfile.id);
    if (error) {
        console.error('Error updating bookmarks:', error);
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
      case Page.Profile:
        return <ProfilePage user={userProfile!} navigateTo={navigateTo} />;
      case Page.Settings:
        // FIX: Pass session object to SettingsPage to avoid making an async call in render.
        return <SettingsPage user={userProfile!} session={session} navigateTo={navigateTo} theme={theme} setTheme={setTheme} />;
      case Page.Dashboard:
      default:
        return <Dashboard onCardClick={handleCardClick} userProfile={userProfile!} navigateTo={navigateTo} handleDuel={handleDuel} />;
    }
  };

  if (appState === 'CONFIG_ERROR') {
    return <AppError message="Application Configuration Error" details={missingKeys} />;
  }
  if (appState === 'ERROR') {
    return <AppError message={errorMessage || "An Unexpected Error Occurred"} />;
  }
  if (appState === 'UNAUTHENTICATED') {
    return <LoginPage />;
  }
  if (appState !== 'READY' || !userProfile) {
    return <AppLoadingIndicator state={appState} />;
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