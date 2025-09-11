import React, { useState, useEffect, useCallback } from 'react';
import { Page, Question, TestCardData, UserProfile, TestAttempt, Theme, LeaderboardEntry } from './types';
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
import { TOTAL_QUESTIONS, MOCK_HAZARD_CLIPS } from './constants';
import { getDailyChallengeQuestions } from './utils';
import { supabase } from './lib/supabaseClient';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  );
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

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // For demo purposes, we fetch a hardcoded user profile. In a real app, this would be the logged-in user.
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('name', 'Alan') // Assuming a user named 'Alan' exists
        .single();
      
      if (profileError) console.error('Error fetching profile:', profileError);
      else setUserProfile(profileData);

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*');

      if (questionsError) console.error('Error fetching questions:', questionsError);
      else setAllQuestions(questionsData || []);
      
      setLoading(false);
    };
    fetchData();
  }, []);

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

    setUserProfile(prev => prev ? ({
        ...prev,
        testsTaken: prev.testsTaken + 1,
        dailyGoalProgress: prev.dailyGoalProgress + score,
        lastDailyChallengeDate: isDailyChallenge ? todayStr : prev.lastDailyChallengeDate,
    }) : null);
    
    // Persist test attempt to Supabase
    const { error } = await supabase.from('test_attempts').insert({
        user_id: userProfile.id,
        topic: topic || (testId === 'daily-challenge' ? 'Daily Challenge' : 'Mock Test'),
        score: score,
        total: questions.length,
        question_ids: questions.map(q => q.id),
        user_answers: userAnswers,
    });
    if (error) console.error('Error saving test attempt:', error);
    
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

  const renderPage = () => {
    if (loading || !userProfile) {
      return (
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500 dark:text-gray-400">Loading application...</p>
        </div>
      );
    }

    switch (currentPage) {
      case Page.Test:
        return <TestPage 
                    navigateTo={navigateTo} 
                    onTestComplete={handleTestComplete} 
                    totalQuestions={TOTAL_QUESTIONS}
                    allQuestions={allQuestions}
                    customQuestions={customTest}
                    testId={customTest ? 'daily-challenge' : undefined}
                    timeLimit={timeLimit}
                    topic={currentTopic}
                />;
      case Page.Results:
        return <ResultsPage navigateTo={navigateTo} score={testResult.score} totalQuestions={testResult.total} />;
      case Page.Review:
        return <ReviewPage navigateTo={navigateTo} reviewData={reviewData} />;
      case Page.RoadSigns:
        return <RoadSignsPage navigateTo={navigateTo} />;
      case Page.Matchmaking:
        return <MatchmakingPage navigateTo={navigateTo} />;
      case Page.BattleGround:
        return <BattleGroundPage navigateTo={navigateTo} onBattleComplete={handleBattleComplete} totalQuestions={TOTAL_QUESTIONS} opponent={duelOpponent} />;
      case Page.BattleResults:
        return <BattleResultsPage navigateTo={navigateTo} {...battleResult} />;
      case Page.HazardPerception:
        return <HazardPerceptionPage navigateTo={navigateTo} onTestComplete={handleHazardPerceptionComplete} />;
      case Page.HazardPerceptionResults:
        return <HazardPerceptionResultsPage navigateTo={navigateTo} {...hazardPerceptionResult} />;
      case Page.StudyHub:
        return <StudyHubPage navigateTo={navigateTo} onCardClick={handleCardClick} />;
      case Page.TopicSelection:
        return <TopicSelectionPage navigateTo={navigateTo} onTopicSelect={handleTopicSelect} mode={currentMode} />;
      case Page.Study:
        return <StudyPage navigateTo={navigateTo} topic={currentTopic || ''} />;
      case Page.BookmarkedQuestions:
        return <BookmarkedQuestionsPage navigateTo={navigateTo} />;
      case Page.HighwayCode:
        return <HighwayCodePage navigateTo={navigateTo} />;
      case Page.CaseStudySelection:
        return <CaseStudySelectionPage navigateTo={navigateTo} />;
      case Page.Dashboard:
      default:
        return <Dashboard onCardClick={handleCardClick} userProfile={userProfile} navigateTo={navigateTo} handleDuel={handleDuel} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] dark:bg-slate-900">
      {!loading && userProfile && <Header user={userProfile} navigateTo={navigateTo} theme={theme} setTheme={setTheme} />}
      <main key={animationKey} className="animate-fadeInUp">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
