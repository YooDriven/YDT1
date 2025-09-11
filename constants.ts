import React from 'react';
import { Page, TestCardData, Question, HazardPerceptionClip, RoadSign, RoadSignCategory, TestAttempt, LeaderboardEntry } from './types';
import { SwordsIcon, ClockIcon, ClipboardIcon, ConstructionIcon, TrophyIcon, FireIcon, SnowflakeIcon, CheckCircleIcon, StarIcon, BadgeIcon, RoadSignIcon, ChartBarIcon, CalendarIcon, LightbulbIcon, BookmarkIcon, BookOpenIcon, DocumentTextIcon } from './components/icons';

// This file will now primarily hold static configuration data.
// Dynamic data like questions and user profiles are fetched from Supabase.

export const TOTAL_QUESTIONS = 50;
export const PASS_PERCENTAGE = 86; // 43/50 for the official test
export const DAILY_GOAL_TARGET = 15;

export const PRIMARY_TEST_CARDS: TestCardData[] = [
  {
    id: 'daily-challenge',
    title: 'Daily Challenge',
    description: 'A new set of 10 questions every day. How will you score?',
    icon: CalendarIcon,
    color: 'text-sky-500',
    hoverColor: '',
    page: Page.Test,
    timeLimit: 120, // 2 minutes
  },
  {
    id: 'battle-ground',
    title: 'Battle Ground',
    description: 'Challenge other users in a real-time quiz.',
    icon: SwordsIcon,
    color: 'text-red-500',
    hoverColor: '',
    page: Page.Matchmaking,
  },
  {
    id: 'timed-3',
    title: '3 Minute Challenge',
    description: 'Answer as many questions as you can in 3 minutes.',
    icon: ClockIcon,
    color: 'text-blue-500',
    hoverColor: '',
    page: Page.Test,
    timeLimit: 180,
    duration: "3 Minutes"
  },
  {
    id: 'timed-6',
    title: '6 Minute Challenge',
    description: 'Answer as many questions as you can in 6 minutes.',
    icon: ClockIcon,
    color: 'text-blue-500',
    hoverColor: '',
    page: Page.Test,
    timeLimit: 360,
    duration: "6 Minutes"
  },
  {
    id: 'timed-9',
    title: '9 Minute Challenge',
    description: 'Answer as many questions as you can in 9 minutes.',
    icon: ClockIcon,
    color: 'text-blue-500',
    hoverColor: '',
    page: Page.Test,
    timeLimit: 540,
    duration: "9 Minutes"
  },
  {
    id: 'mock-test',
    title: 'Full Mock Test',
    description: 'Simulate the official DVSA theory test.',
    icon: ClipboardIcon,
    color: 'text-gray-700',
    hoverColor: '',
    page: Page.Test,
  },
];

export const STUDY_CARDS: TestCardData[] = [
  {
    id: 'topic-tests',
    title: 'Topic Tests',
    description: 'Focus your practice on specific categories.',
    icon: ClipboardIcon,
    color: 'text-indigo-500',
    hoverColor: '',
    page: Page.TopicSelection,
    mode: 'test',
  },
  {
    id: 'study-mode',
    title: 'Study Mode',
    description: 'Review questions and explanations by topic, at your own pace.',
    icon: LightbulbIcon,
    color: 'text-purple-500',
    hoverColor: '',
    page: Page.TopicSelection,
    mode: 'study',
  },
   {
    id: 'road-signs',
    title: 'Road Signs',
    description: 'Browse and learn all essential road signs.',
    icon: RoadSignIcon,
    color: 'text-orange-500',
    hoverColor: '',
    page: Page.RoadSigns,
  },
  {
    id: 'hazard-perception',
    title: 'Hazard Perception',
    description: 'Interactive video-based hazard scenarios.',
    icon: ConstructionIcon,
    color: 'text-teal-500',
    hoverColor: '',
    page: Page.HazardPerception,
  },
];

export const MOCK_HAZARD_CLIPS: HazardPerceptionClip[] = [
  { 
    id: 1, 
    description: "A ball rolls out from behind a parked car.", 
    duration: 8000, 
    hazardWindowStart: 50, 
    hazardWindowEnd: 75,
    backgroundUrl: 'https://picsum.photos/seed/road1/800/450',
    hazard: {
      icon: '⚽️',
      animationClass: 'animate-roll-across',
      positionClass: 'top-[65%] left-1/2 -translate-x-1/2'
    }
  },
];

export const HAZARD_PERCEPTION_PASS_MARK = 15; // out of max 20 for this mock
export const MAX_SCORE_PER_CLIP = 5;

export const OPPONENT_CHAT_MESSAGES = {
  greetings: ["Good luck!", "Let's have a good game."],
  correctAnswer: ["Nice one!", "Good answer."],
  incorrectAnswer: ["Tough question.", "Unlucky."],
  win: ["Well played!", "GG! Congrats on the win."],
  lose: ["Good game!", "Rematch anytime!"],
  draw: ["Wow, a draw! Well played."],
};

export const ROAD_SIGN_CATEGORIES: RoadSignCategory[] = [
  { id: 'warning', name: 'Warning' },
  { id: 'regulatory', name: 'Regulatory' },
  { id: 'informatory', name: 'Informatory' },
];

export const MOCK_ROAD_SIGNS: RoadSign[] = [
  { 
    id: '1', 
    name: 'Stop and give way', 
    description: 'You must stop behind the line at junctions and give way to traffic on the major road.',
    category: 'regulatory',
    svg: React.createElement('svg', { viewBox: "0 0 100 100" }, 
        React.createElement('polygon', { points: "50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5", fill: "#DC2626" }),
        React.createElement('text', { x: "50", y: "62", textAnchor: "middle", fill: "white", fontSize: "30", fontWeight: "bold" }, 'STOP')
    )
  },
];

// Re-add a simplified MOCK_QUESTIONS to derive topics, until topics are also fetched from DB
export const MOCK_QUESTIONS: Question[] = [
  { id: 'q1', question: 'Q1', options: [], correctAnswer: 0, category: 'Vulnerable Road Users', explanation: '' },
  { id: 'q2', question: 'Q2', options: [], correctAnswer: 0, category: 'Road and Traffic Signs', explanation: '' },
  { id: 'q3', question: 'Q3', options: [], correctAnswer: 0, category: 'Alertness', explanation: '' },
  { id: 'q4', question: 'Q4', options: [], correctAnswer: 0, category: 'Attitude', explanation: '' },
  { id: 'q5', question: 'Q5', options: [], correctAnswer: 0, category: 'Safety Margins', explanation: '' },
];
export const TOPICS = [...new Set(MOCK_QUESTIONS.map(q => q.category))];
