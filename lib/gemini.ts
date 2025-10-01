
import { GoogleGenAI } from "@google/genai";
import { Question } from '../types';

let ai: GoogleGenAI | null = null;

const getAI = () => {
    if (!ai) {
        // As per guidelines, apiKey is expected to be in the execution environment.
        if (typeof process === 'undefined' || !process.env.API_KEY) {
            console.error("Gemini API key is not available in process.env.API_KEY. The AI Tutor feature will be disabled.");
            return null;
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

export async function getAIExplanation(question: Question): Promise<string> {
    const ai = getAI();
    if (!ai) {
        return Promise.resolve("AI Tutor is currently unavailable. Please ensure the API key is configured correctly.");
    }

    const prompt = `
        You are an expert driving instructor in the UK, acting as a friendly and encouraging AI Tutor.
        A student is reviewing a theory test question. Provide an alternative explanation for the correct answer.

        Guidelines:
        - Keep the tone helpful and easy to understand.
        - Do NOT simply repeat the original explanation. Offer a different perspective, a real-world example, or a mnemonic device if applicable.
        - Focus on the 'why' behind the rule.
        - Format your response using simple HTML for clarity (e.g., <p>, <strong>, <ul>, <li>). Do not use markdown.
        - Keep it concise, around 2-4 sentences.

        Here is the question and the official explanation:

        **Question:** "${question.question}"

        **Correct Answer:** "${question.options[question.correctAnswer]?.text || 'See image'}"

        **Official Explanation:** "${question.explanation}"

        Now, please provide your alternative explanation:
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text;
    } catch (error) {
        console.error("Error fetching AI explanation:", error);
        return "Sorry, I couldn't generate an explanation right now. Please try again later.";
    }
}
