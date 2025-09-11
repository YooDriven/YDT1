import { Question } from './types';

// Simple mulberry32 PRNG to create a deterministic random sequence based on a seed
function mulberry32(a: number) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

/**
 * Generates a consistent list of questions for the daily challenge.
 * Uses the current date as a seed for a PRNG to ensure every user
 * gets the same set of questions on any given day.
 * @param allQuestions The complete array of questions.
 * @param count The number of questions to include in the challenge.
 * @returns An array of questions for the daily challenge.
 */
export const getDailyChallengeQuestions = (allQuestions: Question[], count: number): Question[] => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    
    // Create a simple numeric seed from the date string
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) {
        seed = (seed << 5) - seed + dateStr.charCodeAt(i);
        seed |= 0; // Convert to a 32bit integer
    }

    const random = mulberry32(seed);
    
    // Shuffle the array deterministically using the seeded PRNG
    const shuffled = [...allQuestions].sort(() => 0.5 - random());
    
    return shuffled.slice(0, count);
};
