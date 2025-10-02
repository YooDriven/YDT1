import { Question } from '../types';

export const getAIExplanation = async (question: Question): Promise<string> => {
    try {
        const response = await fetch('/api/tutor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'The AI Tutor is currently unavailable. Please try again later.');
        }

        return data.explanation;
    } catch (error) {
        console.error("Error fetching AI explanation:", error);
        if (error instanceof Error) {
            return error.message;
        }
        return "An unexpected error occurred while contacting the AI Tutor.";
    }
};
