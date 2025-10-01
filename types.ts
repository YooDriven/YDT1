
import { FC, SVGProps, ReactNode, Dispatch, SetStateAction } from 'react';
import { Session, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
export type { Session };

export type Theme = 'light' | 'dark';

export enum Page {
  Dashboard,
  Test,
  Results,
  Matchmaking,
  BattleGround,
  BattleResults,
  HazardPerception,
  HazardPerceptionResults,
  Review,
  RoadSigns,
  StudyHub,
  TopicSelection,
  Study,
  BookmarkedQuestions,
  HighwayCode,
  CaseStudySelection,
  CaseStudy,
  Profile,
  Settings,
  Admin,
  Leaderboard,
  Friends,
  Achievements,
  Statistics,
  VoicePractice,
}

export type AdminSection = 'content' | 'appearance';
export type ContentTab = 'dashboard' | 'questions' | 'categories' | 'road_signs' | 'road_sign_categories' | 'hazard' | 'highway_code' | 'case_studies';


export interface TestCardData {
  id: string;
  title: string;
  description: string;
  icon: string; // Changed from FC to string (asset key)
  color: string;
  hoverColor: string;
  duration?: string;
  comingSoon?: boolean;
  page: Page;
  timeLimit?: number; // in seconds
  mode?: 'test' | 'study';
  topic?: string;
}

export interface QuestionOption {
    text?: string;
    image?: string;
}

export interface Question {
  id: string;
  question: string;
  questionImage?: string;
  options: QuestionOption[];
  correctAnswer: number;
  category: string;
  explanation: string;
  created_at?: string;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  score: number;
  region?: string;
  isUser?: boolean;
  avatarUrl: string;
}

export interface HazardPerceptionClip {
  id: number;
  description: string;
  duration: number; // in seconds
  videoUrl: string;
  hazardWindowStart: number; // percentage of duration
  hazardWindowEnd: number; // percentage of duration;
}

export interface ChatMessage {
  author: string;
  text: string;
}

export type Opponent = {
  id?: string;
  name: string;
  avatarUrl: string;
  isBot?: boolean;
  score?: number;
  rank?: number;
};

export interface Badge {
  name: string;
  icon: string; // Changed from FC to string (asset key)
  color: string;
}

export interface TestAttempt {
  userId: string;
  topic: string;
  score: number;
  total: number;
  questionIds: string[];
  userAnswers: (number | null)[];
  created_at?: string;
}

export interface BattleHistoryEntry {
  opponent_name: string;
  opponent_avatar_url: string;
  user_score: number;
  opponent_score: number;
  total_questions: number;
  created_at: string;
}

export type AchievementId = 'first_win' | 'streak_3' | 'streak_7' | 'perfect_score' | 'topic_master_alertness' | 'topic_master_attitude' | 'topic_master_signs';
export type AchievementStatus = 'locked' | 'unlocked';

export interface Achievement {
    id: AchievementId;
    name: string;
    description: string;
    status: AchievementStatus;
    icon: string;
}

export interface Friend {
    id: string;
    name: string;
    avatarUrl: string;
    avgScore: number;
    status: 'friends' | 'pending_sent' | 'pending_received';
}

export interface Notification {
    id: string;
    type: 'friend_request' | 'challenge';
    from_user_id: string;
    from_user_name: string;
    from_user_avatar_url: string;
    created_at: string;
    metadata?: {
        battleId?: string;
    };
}

export interface UserProfile {
  id:string;
  name: string;
  avatarUrl: string;
  avgScore: number;
  testsTaken: number;
  timeSpent: string;
  streak: number;
  freezes: number;
  badges: Badge[];
  testHistory: TestAttempt[];
  battleHistory: BattleHistoryEntry[];
  dailyGoalProgress: number;
  dailyGoalTarget: number;
  lastDailyChallengeDate: string | null;
  bookmarkedQuestions: string[];
  role?: 'user' | 'admin';
  unlocked_achievements: AchievementId[];
  friends: Friend[];
  onboarding_completed: boolean;
  last_login_date: string;
}

export interface RoadSign {
  id: string;
  name: string;
  description: string;
  category: string;
  svg_code: string;
}

export interface RoadSignCategory {
  id: string;
  name: string;
}

export interface HighwayCodeRule {
  id: number;
  rule_number: number;
  title: string;
  content: string;
  category: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  scenario: string;
  scenario_image?: string;
  question_ids: string[];
}

export interface AppAsset {
  value: string;
  mimeType: string;
}

export type AppAssetRecord = Record<string, AppAsset>;

export interface UserGrowthData {
    date: string;
    count: number;
}
export interface FailedQuestionData {
    question: string;
    fail_count: number;
}
export interface TopicPopularityData {
    topic: string;
    count: number;
}

export interface AppContextType {
  supabase: SupabaseClient;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  appAssets: AppAssetRecord;
  currentPage: Page;
  animationKey: number;
  navigateTo: (page: Page) => void;
  loadAssets: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  assetsLoading: boolean;
}

// New Global State Types
export interface GlobalState {
  loading: boolean;
  session: Session | null;
  userProfile: UserProfile | null;
  friends: Friend[];
  notifications: Notification[];
  achievements: Achievement[];
  testResult: { score: number; total: number };
  reviewData: { questions: Question[]; userAnswers: (number | null)[] };
  battleResult: { playerScore: number; opponentScore: number; total: number; opponentName: string };
  hazardPerceptionResult: { scores: number[]; totalScore: number; maxScore: number };
  customTest: Question[] | null;
  currentTestId?: string;
  timeLimit?: number;
  currentTopic?: string;
  currentMode: 'test' | 'study';
  duelOpponent: Opponent | null;
  currentBattleId: string | null;
  selectedCaseStudy: CaseStudy | null;
}

export interface GlobalContextType extends GlobalState {
  // Methods
  handleCardClick: (card: TestCardData) => void;
  handleDuel: (opponent: LeaderboardEntry | Friend) => void;
  handleMatchFound: (battleId: string, opponent: Opponent) => void;
  handleTestComplete: (score: number, questions: Question[], userAnswers: (number | null)[], topic?: string, testId?: string) => Promise<void>;
  handleBattleComplete: (playerScore: number, opponentScore: number, total: number, opponent: Opponent) => Promise<void>;
  handleRematch: () => void;
  handleHazardPerceptionComplete: (scores: number[], totalClips: number) => void;
  handleTopicSelect: (topic: string) => void;
  handleCaseStudySelect: (caseStudy: CaseStudy) => void;
  handleToggleBookmark: (questionId: string) => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
  handleProfileUpdate: (name: string) => void;
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (userId: string) => Promise<void>;
  declineFriendRequest: (userId: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  sendChallenge: (friendId: string) => Promise<void>;
  acceptChallenge: (notification: Notification) => Promise<void>;
}
