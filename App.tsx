import React, { Suspense, useEffect, useState } from 'react';
import { Page } from './types';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import Breadcrumbs, { type Breadcrumb } from './components/Breadcrumbs';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { QuestionsProvider } from './contexts/QuestionsContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocialProvider } from './contexts/SocialContext';
import { GameplayProvider } from './contexts/GameplayContext';
import ErrorBoundary from './components/ErrorBoundary';
import OnboardingGuide from './components/OnboardingGuide';
import { Button, Input } from './components/ui';

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


const SupabaseConfigPage: React.FC<{ onConfigured: (url: string, key: string) => void }> = ({ onConfigured }) => {
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
    const { session, userProfile, markOnboardingComplete } = useAuth();
    const { currentPage, animationKey, navigateTo, appAssets, handleAssetsUpdate } = useApp();

    if (!session || !userProfile) {
        return <LoginPage appAssets={appAssets} />;
    }

    if (!userProfile.onboarding_completed) {
        return <OnboardingGuide onComplete={markOnboardingComplete} />;
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
            case Page.Admin: return <AdminPage navigateTo={navigateTo} appAssets={appAssets} onAssetsUpdate={handleAssetsUpdate} />;
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
    const { loading: authLoading } = useAuth();
    const { assetsLoading, loadInitialAssets } = useApp();

    useEffect(() => {
        if (!authLoading) {
            loadInitialAssets();
        }
    }, [authLoading, loadInitialAssets]);
    
    if (authLoading) {
        return <AppLoadingIndicator message="Securing connection..." />;
    }

    if (assetsLoading) {
        return <AppLoadingIndicator message="Loading visual assets..." />;
    }

    return <MainApp />;
};

type SupabaseConfig = {
    url: string;
    key: string;
}

const App: React.FC = () => {
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [config, setConfig] = useState<SupabaseConfig | null>(null);
  
  const handleConfigured = (url: string, key: string) => {
    localStorage.setItem('SUPABASE_URL', url);
    localStorage.setItem('SUPABASE_ANON_KEY', key);
    setConfig({ url, key });
  };

  useEffect(() => {
      let active = true;
      const setupSupabase = () => {
        try {
            const envUrl = typeof process !== 'undefined' ? process.env.SUPABASE_URL : undefined;
            const envKey = typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : undefined;
            if (envUrl && envKey) {
                if (active) setConfig({ url: envUrl, key: envKey });
                return;
            } 
            
            const storedUrl = localStorage.getItem('SUPABASE_URL');
            const storedKey = localStorage.getItem('SUPABASE_ANON_KEY');
            if (storedUrl && storedKey) {
                if (active) setConfig({ url: storedUrl, key: storedKey });
                return;
            }
        } catch(e) {
            console.error("Error setting up Supabase config:", e);
        }
      }
      setupSupabase();
      return () => { active = false; };
  }, []);
  
  useEffect(() => {
      if (config) {
          try {
              const client = createClient(config.url, config.key);
              setSupabaseClient(client);
          } catch(e) {
              console.error("Failed to create Supabase client:", e);
              // Clear bad config
              localStorage.removeItem('SUPABASE_URL');
              localStorage.removeItem('SUPABASE_ANON_KEY');
              setConfig(null);
          }
      }
  }, [config]);

  if (!config) {
    return <SupabaseConfigPage onConfigured={handleConfigured} />;
  }

  if (!supabaseClient) {
      return <AppLoadingIndicator message="Initializing connection..." />;
  }
  
  return (
    <ErrorBoundary>
        <AppProvider supabaseClient={supabaseClient}>
            <QuestionsProvider>
                <AppContent />
            </QuestionsProvider>
        </AppProvider>
    </ErrorBoundary>
  );
};

export default App;