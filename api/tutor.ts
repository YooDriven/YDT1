import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";
import type { Question } from '../src/types';

// This function acts as a secure backend proxy to the Gemini API.
// The API_KEY is stored as a server-side environment variable on Vercel
// and is never exposed to the client.
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const question: Question = request.body.question;

    if (!question) {
        return response.status(400).json({ error: 'Question data is missing in the request body.' });
    }

    const optionsText = question.options.map((opt, i) => 
        `${String.fromCharCode(65 + i)}. ${opt.text || `(Image option ${i+1})`}`
    ).join('\n');
    const correctAnswerText = question.options[question.correctAnswer].text || `(Image option ${question.correctAnswer + 1})`;

    const prompt = `You are a friendly and professional UK driving instructor. A student is asking for help with a theory test question. Please explain the answer clearly and concisely.

Here is the question:
Question: "${question.question}"
${question.questionImage ? `(This question includes an image reference)` : ''}

Here are the options:
${optionsText}

The correct answer is: "${correctAnswerText}"

Your task:
1. Explain exactly why the correct answer is the right choice, referencing UK driving rules or principles.
2. Briefly explain why each of the other options is incorrect.
3. Keep the tone encouraging and easy to understand for a learner driver. Format your response using markdown for readability (e.g., use bolding for key terms and lists for clarity).`;

    const geminiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    if (!geminiResponse.text) {
        throw new Error('No text in response from Gemini API.');
    }

    return response.status(200).json({ explanation: geminiResponse.text });

  } catch (error) {
    console.error("Error in /api/tutor serverless function:", error);
    // Avoid leaking detailed error messages to the client
    return response.status(500).json({ error: "An internal server error occurred while generating the explanation." });
  }
}
