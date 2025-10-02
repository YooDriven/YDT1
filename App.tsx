
import React, { Suspense, useEffect } from 'react';
import { Page } from './types';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import Breadcrumbs from './components/Breadcrumbs';
import type { Breadcrumb } from './components/Breadcrumbs';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { QuestionsProvider } from './contexts/QuestionsContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { GlobalStateProvider, useGlobalState } from './contexts/GlobalStateContext';
import ErrorBoundary from './components/ErrorBoundary';
import OnboardingGuide from './components/OnboardingGuide';

// --- Singleton Client Creation ---
const supabaseUrl = (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;


let supabaseClient: SupabaseClient | null = null;
let initError: string | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  initError = "Supabase environment variables are missing. Please create a `.env.local` file in your project root and add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";
} else {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e: any) {
    initError = `Failed to create Supabase client: ${e.message}`;
    console.error(e);
  }
}
// --- End of Singleton Creation ---


// Lazy load page components
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const TestPage = React.lazy(() => import('./components/TestPage'));
const ResultsPage = React.lazy(() => import('./components/ResultsPage'));
const MatchmakingPage = React.lazy(() => import('./components/MatchmakingPage'));
const BattleGroundPage = React.lazy(() => import('./components/BattleGroundPage'));
const BattleResultsPage = React.lazy(() => import('./components/BattleResultsPage'));
const ReviewPage = React.lazy(() => import('./components/ReviewPage'));
const RoadSignsPage = React.lazy(() => import('./components/RoadSignsPage'));
const StudyHubPage = React.lazy(() => import('./components/StudyHubPage'));
const TopicSelectionPage = React.lazy(() => import('./components/TopicSelectionPage'));
const StudyPage = React.lazy(() => import('./components/StudyPage'));
const BookmarkedQuestionsPage = React.lazy(() => import('./components/BookmarkedQuestionsPage'));
const HighwayCodePage = React.lazy(() => import('./components/HighwayCodePage'));
const ProfilePage = React.lazy(() => import('./components/ProfilePage'));
const SettingsPage = React.lazy(() => import('./components/SettingsPage'));
const AdminPage = React.lazy(() => import('./components/AdminPage'));
const LeaderboardPage = React.lazy(() => import('./components/LeaderboardPage'));
const FriendsPage = React.lazy(() => import('./pages/FriendsPage'));
const AchievementsPage = React.lazy(() => import('./pages/AchievementsPage'));
const StatisticsPage = React.lazy(() => import('./pages/StatisticsPage'));


const AppLoadingIndicator: React.FC<{ message: string }> = ({ message }) => {
  return (
     <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
      <div className="text-center p-4">
        <div className="relative inline-flex">
          <div className="w-16 h-16 bg-teal-500 rounded-full"></div>
          <div className="w-16 h-16 bg-teal-500 rounded-full absolute top-0 left-0 animate-ping"></div>
          <div className="w-16 h-16 bg-teal-500 rounded-full absolute top-0 left-0 animate-pulse"></div>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-6">{message}</p>
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

const MainApp: React.FC = () => {
    const { session, userProfile, markOnboardingComplete } = useGlobalState();
    const { currentPage, animationKey, navigateTo, appAssets, loadAssets, showToast } = useApp();

    if (!session || !userProfile) {
        return <LoginPage appAssets={appAssets} />;
    }

    if (!userProfile.onboarding_completed) {
        return <OnboardingGuide onComplete={markOnboardingComplete} />;
    }
    
    const handleAdminAssetsUpdate = async () => {
        await loadAssets();
        showToast('Assets updated successfully!');
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
        [Page.HighwayCode]: [{ label: 'Dashboard', page: Page.Dashboard }, { label: 'Study Hub', page: Page.StudyHub }, { label: 'Highway Code' }],
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
            case Page.Review: return <ReviewPage />;
            case Page.RoadSigns: return <RoadSignsPage />;
            case Page.StudyHub: return <StudyHubPage />;
            case Page.TopicSelection: return <TopicSelectionPage />;
            case Page.Study: return <StudyPage />;
            case Page.BookmarkedQuestions: return <BookmarkedQuestionsPage />;
            case Page.HighwayCode: return <HighwayCodePage />;
            case Page.Profile: return <ProfilePage />;
            case Page.Settings: return <SettingsPage />;
            case Page.Admin: return <AdminPage navigateTo={navigateTo} appAssets={appAssets} onAssetsUpdate={handleAdminAssetsUpdate} />;
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
                <Suspense fallback={<PageLoader />}>
                    {renderPage()}
                </Suspense>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const { loading: globalLoading } = useGlobalState();
    const { assetsLoading, loadAssets } = useApp();

    useEffect(() => {
        loadAssets();
    }, [loadAssets]);
    
    if (globalLoading) {
        return <AppLoadingIndicator message="Loading your profile..." />;
    }

    if (assetsLoading) {
        return <AppLoadingIndicator message="Loading visual assets..." />;
    }

    return <MainApp />;
};

const App: React.FC = () => {
  // If the singleton client failed to initialize, show a developer-facing error.
  if (initError || !supabaseClient) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-red-500 p-8 space-y-4 text-center">
          <h2 className="text-2xl font-bold text-red-500">Configuration Error</h2>
          <p className="text-base text-gray-600 dark:text-gray-400">{initError || "Supabase client could not be initialized."}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">This is a developer-facing error. Ensure your environment variables are set correctly.</p>
        </div>
      </div>
    );
  }
  
  // Render the app with the stable, singleton client.
  return (
    <ErrorBoundary>
        <AppProvider supabaseClient={supabaseClient}>
            <QuestionsProvider>
                <GlobalStateProvider>
                    <AppContent />
                </GlobalStateProvider>
            </QuestionsProvider>
        </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
