import React from 'react';
import { Page, TestCardData, Question, RoadSignCategory, TestAttempt, LeaderboardEntry } from './types';

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
    icon: 'icon_calendar',
    color: 'text-sky-500',
    hoverColor: '',
    page: Page.Test,
    timeLimit: 120, // 2 minutes
  },
  {
    id: 'battle-ground',
    title: 'Battle Ground',
    description: 'Challenge other users in a real-time quiz.',
    icon: 'icon_swords',
    color: 'text-red-500',
    hoverColor: '',
    page: Page.Matchmaking,
  },
  {
    id: 'timed-3',
    title: '3 Minute Challenge',
    description: 'Answer as many questions as you can in 3 minutes.',
    icon: 'icon_clock',
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
    icon: 'icon_clock',
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
    icon: 'icon_clock',
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
    icon: 'icon_clipboard',
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
    icon: 'icon_clipboard',
    color: 'text-indigo-500',
    hoverColor: '',
    page: Page.TopicSelection,
    mode: 'test',
  },
  {
    id: 'study-mode',
    title: 'Study Mode',
    description: 'Review questions and explanations by topic, at your own pace.',
    icon: 'icon_lightbulb',
    color: 'text-purple-500',
    hoverColor: '',
    page: Page.TopicSelection,
    mode: 'study',
  },
  {
    id: 'bookmarked-questions',
    title: 'Bookmarked Questions',
    description: 'Review questions you have saved for later.',
    icon: 'icon_bookmark',
    color: 'text-yellow-500',
    hoverColor: '',
    page: Page.BookmarkedQuestions,
  },
   {
    id: 'road-signs',
    title: 'Road Signs',
    description: 'Browse and learn all essential road signs.',
    icon: 'icon_road_sign',
    color: 'text-orange-500',
    hoverColor: '',
    page: Page.RoadSigns,
  },
  {
    id: 'hazard-perception',
    title: 'Hazard Perception',
    description: 'Interactive video-based hazard scenarios.',
    icon: 'icon_construction',
    color: 'text-teal-500',
    hoverColor: '',
    page: Page.HazardPerception,
  },
];

export const HAZARD_PERCEPTION_PASS_MARK = 15; // Official test is 44/75. We'll use a proportional value.
export const MAX_SCORE_PER_CLIP = 5;

export const OPPONENT_CHAT_MESSAGES = {
  greetings: ["Good luck!", "Let's have a good game."],
  correctAnswer: ["Nice one!", "Good answer."],
  incorrectAnswer: ["Tough question.", "Unlucky."],
  win: ["Well played!", "GG! Congrats on the win."],
  lose: ["Good game!", "Rematch anytime!"],
  draw: ["Wow, a draw! Well played."],
};

// Fallback questions if the database is unavailable or empty.
export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'mq1',
    question: 'What is the national speed limit on a single carriageway road for a car?',
    options: [
      { text: '50 mph' },
      { text: '60 mph' },
      { text: '70 mph' },
      { text: '40 mph' },
    ],
    correctAnswer: 1,
    category: 'Alertness',
    explanation: 'The national speed limit for a car on a single carriageway is 60 mph, unless signs indicate otherwise.',
  },
  {
    id: 'mq2',
    question: 'When can you overtake on the left?',
    options: [
        { text: 'When the vehicle in front is signalling to turn right' },
        { text: 'On a one-way street' },
        { text: 'In slow-moving traffic queues, when traffic in the right-hand lane is moving more slowly' },
        { text: 'All of the above' },
    ],
    correctAnswer: 3,
    category: 'Attitude',
    explanation: 'You can overtake on the left when the vehicle in front is signalling to turn right, on a one-way street, or in slow-moving traffic queues where the right lane is slower. So all options are correct.',
  },
  {
    id: 'mq3',
    question: 'You are on a motorway. What does this sign mean?',
    questionImage: 'https://www.safedrivingforlife.info/sites/default/files/styles/image_style_20_10_landscape/public/2022-03/traffic-sign-2915.webp?itok=fT_fE609',
    options: [
      { text: 'Start of motorway regulations' },
      { text: 'Motorway services ahead' },
      { text: 'End of motorway' },
      { text: 'No entry to motorway' },
    ],
    correctAnswer: 2,
    category: 'Road and Traffic Signs',
    explanation: 'This sign indicates the end of motorway regulations. Be prepared for changes in speed limits and road conditions.',
  },
  {
    id: 'mq4',
    question: 'Why are motorcyclists considered vulnerable road users?',
    options: [
        { text: 'They are difficult to see' },
        { text: 'They can be unstable' },
        { text: 'They offer little protection in a crash' },
        { text: 'All of the above' },
    ],
    correctAnswer: 3,
    category: 'Vulnerable Road Users',
    explanation: 'Motorcyclists are considered vulnerable because they are harder to see, can be unstable (especially in poor weather), and their vehicle offers no protection in a collision.',
  },
  {
    id: 'mq5',
    question: 'What is the minimum legal tread depth for car tyres in the UK?',
    options: [
        { text: '1.0 mm' },
        { text: '1.6 mm' },
        { text: '2.0 mm' },
        { text: '2.5 mm' },
    ],
    correctAnswer: 1,
    category: 'Safety Margins',
    explanation: 'The legal minimum tread depth for car tyres in the UK is 1.6 mm across the central three-quarters of the tread and around the entire circumference.',
  },
];
