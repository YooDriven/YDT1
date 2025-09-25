import React, { सस्पेंस } from 'react';
import { Page } from './types';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
// FIX: Import Breadcrumb type to resolve type error.
import Breadcrumbs, { type Breadcrumb } from './components/Breadcrumbs';
import { initializeSupabase } from './lib/supabaseClient';
import { QuestionsProvider } from './contexts/QuestionsContext';
// FIX: Removed unused useAuth and useGameplay imports as their values are now accessed through useAppContext.
import { AppProvider, useAppContext } from './contexts/AppContext';
import DynamicAsset from './components/DynamicAsset';
import { Button, Input, Skeleton } from './components/ui';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load page components
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const TestPage = React.lazy(() => import('./components/TestPage'));
const ResultsPage = React.lazy(() => import('./components/ResultsPage'));
const MatchmakingPage = React.lazy(() => import('./components/MatchmakingPage'));
const BattleGroundPage = React.lazy(() => import('./components/BattleGroundPage'));
const BattleResultsPage = React.lazy(() => import('./components/BattleResultsPage'));
const HazardPerceptionPage = React.lazy(() => import('./components/HazardPerceptionPage'));
const HazardPerceptionResultsPage = React.lazy(() => import('./components/HazardPerceptionResultsPage'));
const ReviewPage = React.lazy(() => import('./components/ReviewPage'));
const RoadSignsPage = React.lazy(() => import('./components/RoadSignsPage'));
const StudyHubPage = React.lazy(() => import('./components/StudyHubPage'));
const TopicSelectionPage = React.lazy(() => import('./components/TopicSelectionPage'));
const StudyPage = React.lazy(() => import('./components/StudyPage'));
const BookmarkedQuestionsPage = React.lazy(() => import('./components/BookmarkedQuestionsPage'));
const HighwayCodePage = React.lazy(() => import('./components/HighwayCodePage'));
const CaseStudySelectionPage = React.lazy(() => import('./components/CaseStudySelectionPage'));
const CaseStudyPage = React.lazy(() => import('./components/CaseStudyPage'));
const ProfilePage = React.lazy(() => import('./components/ProfilePage'));
const SettingsPage = React.lazy(() => import('./components/SettingsPage'));
const AdminPage = React.lazy(() => import('./components/AdminPage'));
const LeaderboardPage = React.lazy(() => import('./components/LeaderboardPage'));
const FriendsPage = React.lazy(() => import('./pages/FriendsPage'));
const AchievementsPage = React.lazy(() => import('./pages/AchievementsPage'));
const StatisticsPage = React.lazy(() => import('./pages/StatisticsPage'));


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


const SupabaseConfigPage: React.FC<{ onConfigured: (url: string, key: string) => void }> = ({ onConfigured }) => {
    const [url, setUrl] = React.useState('');
    const [key, setKey] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url || !key) {
            setError('Both URL and Key are required.');
            return;
        }
        setError('');
        setLoading(true);
        onConfigured(url, key);
        setTimeout(() => setLoading(false), 1000); 
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-8 space-y-6">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Backend Configuration</h2>
                    <p className="mt-2 text-base text-gray-600 dark:text-gray-400">This app requires a Supabase backend to function. Please enter your project details.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input type="url" placeholder="Supabase Project URL" value={url} onChange={(e) => setUrl(e.target.value)} required />
                    <Input type="text" placeholder="Supabase Anon Key" value={key} onChange={(e) => setKey(e.target.value)} required />
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

const AppLoadingIndicator: React.FC<{ state: string }> = ({ state }) => {
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

const PageLoader: React.FC = () => (
    <div className="flex items-center justify-center h-[calc(100vh-150px)]">
      <div className="text-center p-4">
        <div className="relative inline-flex">
          <div className="w-12 h-12 bg-teal-500/20 rounded-full"></div>
          <div className="w-12 h-12 bg-teal-500/20 rounded-full absolute top-0 left-0 animate-ping"></div>
        </div>
      </div>
    </div>
);

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

const MainApp: React.FC = () => {
    // FIX: Consolidate multiple hook calls into one to resolve import errors and improve performance.
    const { session, userProfile, currentPage, animationKey, navigateTo, appAssets } = useAppContext();

    if (!session || !userProfile) {
        return <LoginPage appAssets={appAssets} />;
    }

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
        [Page.Friends]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Friends' }],
        [Page.Achievements]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Achievements' }],
        [Page.Statistics]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Statistics' }],
    };

    const renderPage = () => {
        switch (currentPage) {
            case Page.Test: return <TestPage />;
            case Page.Results: return <ResultsPage />;
            case Page.Matchmaking: return <MatchmakingPage />;
            case Page.BattleGround: return <BattleGroundPage />;
            case Page.BattleResults: return <BattleResultsPage />;
            case Page.HazardPerception: return <HazardPerceptionPage />;
            case Page.HazardPerceptionResults: return <HazardPerceptionResultsPage />;
            case Page.Review: return <ReviewPage />;
            case Page.RoadSigns: return <RoadSignsPage />;
            case Page.StudyHub: return <StudyHubPage />;
            case Page.TopicSelection: return <TopicSelectionPage />;
            case Page.Study: return <StudyPage />;
            case Page.BookmarkedQuestions: return <BookmarkedQuestionsPage />;
            case Page.HighwayCode: return <HighwayCodePage />;
            case Page.CaseStudySelection: return <CaseStudySelectionPage />;
            case Page.CaseStudy: return <CaseStudyPage />;
            case Page.Profile: return <ProfilePage />;
            case Page.Settings: return <SettingsPage />;
            case Page.Admin: return <AdminPage />;
            case Page.Leaderboard: return <LeaderboardPage />;
            case Page.Friends: return <FriendsPage />;
            case Page.Achievements: return <AchievementsPage />;
            case Page.Statistics: return <StatisticsPage />;
            default: return <Dashboard />;
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
            <Header />
            <Breadcrumbs path={breadcrumbPaths[currentPage]} navigateTo={navigateTo} />
            <div key={animationKey} className="animate-fadeInUp">
                <React.Suspense fallback={<PageLoader />}>
                    {renderPage()}
                </React.Suspense>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [appState, setAppState] = React.useState<AppState>('INIT');
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  
  const handleConfigured = (url: string, key: string) => {
    localStorage.removeItem('SUPABASE_URL');
    localStorage.removeItem('SUPABASE_ANON_KEY');
    if (initializeSupabase(url, key)) {
        localStorage.setItem('SUPABASE_URL', url);
        localStorage.setItem('SUPABASE_ANON_KEY', key);
        setAppState('AUTH_CHECKING');
    } else {
        setErrorMessage('Failed to connect to Supabase. Please check the URL and Key.');
        setAppState('AWAITING_CONFIG');
    }
  };

  if (appState === 'INIT') {
      const envUrl = typeof process !== 'undefined' ? process.env.SUPABASE_URL : undefined;
      const envKey = typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : undefined;
      if (envUrl && envKey && initializeSupabase(envUrl, envKey)) {
          setAppState('AUTH_CHECKING');
      } else {
          const storedUrl = localStorage.getItem('SUPABASE_URL');
          const storedKey = localStorage.getItem('SUPABASE_ANON_KEY');
          if (storedUrl && storedKey && initializeSupabase(storedUrl, storedKey)) {
              setAppState('AUTH_CHECKING');
          } else {
              setAppState('AWAITING_CONFIG');
          }
      }
  }

  if (appState === 'AWAITING_CONFIG') {
    return <SupabaseConfigPage onConfigured={handleConfigured} />;
  }

  if (appState === 'ERROR') {
      return <AppError message={errorMessage} />;
  }

  return (
    <ErrorBoundary>
        <QuestionsProvider>
            <AppProvider setAppState={setAppState} setErrorMessage={setErrorMessage}>
                <AppInitializer>
                    <MainApp />
                </AppInitializer>
            </AppProvider>
        </QuestionsProvider>
    </ErrorBoundary>
  );
};

const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { appState } = useAppContext();
    if (appState !== 'READY') {
        return <AppLoadingIndicator state={appState} />;
    }
    return <>{children}</>;
};

export default App;
