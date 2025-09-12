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
  Profile,
  Settings,
}

export interface TestCardData {
  id: string;
  title: string;
  description: string;
  icon: FC<SVGProps<SVGSVGElement>>;
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
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  region?: string;
  isUser?: boolean;
  avatarUrl: string;
}

export interface Hazard {
  icon: string;
  animationClass: string;
  positionClass: string;
}

export interface HazardPerceptionClip {
  id: number;
  description: string;
  duration: number; // in milliseconds
  hazardWindowStart: number; // percentage of duration
  hazardWindowEnd: number; // percentage of duration
  backgroundUrl: string;
  hazard: Hazard;
}

export interface ChatMessage {
  author: string;
  text: string;
}

export interface Badge {
  name: string;
  icon: FC<SVGProps<SVGSVGElement>>;
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
  id: string;
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
}

export interface RoadSign {
  id: string;
  name: string;
  description: string;
  category: string;
  svg: ReactNode;
}

export interface RoadSignCategory {
  id: string;
  name: string;
}