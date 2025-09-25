import { FC, SVGProps, ReactNode } from 'react';

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
}

export type AdminSection = 'content' | 'appearance';
export type ContentTab = 'questions' | 'categories' | 'road_signs' | 'road_sign_categories' | 'hazard' | 'highway_code' | 'case_studies';


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
}

export interface UserProfile {
  id:string;
  name: string;
  avatarUrl: string;
  avgScore: number; // This would be calculated dynamically in a real app
  testsTaken: number;
  timeSpent: string;
  streak: number;
  freezes: number;
  badges: Badge[];
  testHistory: TestAttempt[];
  dailyGoalProgress: number;
  dailyGoalTarget: number;
  lastDailyChallengeDate: string | null;
  bookmarkedQuestions: string[];
  role?: 'user' | 'admin';
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