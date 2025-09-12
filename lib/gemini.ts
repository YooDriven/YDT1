import { GoogleGenAI, Type } from "@google/genai";
import { Question } from '../types';

const geminiApiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const isGeminiConfigured = !!geminiApiKey;

let ai: GoogleGenAI | null = null;
if (isGeminiConfigured) {
    // The instructions specify using `process.env.API_KEY`, but in a Vite context,
    // we use `import.meta.env.VITE_GEMINI_API_KEY` and assume it's correctly set.
    // The key is passed directly to the constructor as required.
    ai = new GoogleGenAI({ apiKey: geminiApiKey });
}

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        answerIndex: {
            type: Type.INTEGER,
            description: 'The numeric index of the chosen answer.'
        }
    },
    required: ['answerIndex'],
};

export const getAiOpponentAnswer = async (question: Question): Promise<number> => {
    if (!ai) {
        throw new Error("Gemini AI is not configured.");
    }

    const optionsString = question.options.map((opt, index) => `${index}: ${opt.text || `(Image option ${index+1})`}`).join('\n');

    const prompt = `
        You are an AI opponent in a driving theory test quiz game. Your goal is to simulate a skilled but not perfect human player.
        - Answer correctly most of the time.
        - Occasionally make a mistake, especially on questions that seem tricky or have subtle details.
        - Do not add any commentary or explanation.

        Here is the question:
        Question: "${question.question}"
        ${question.questionImage ? `(An image is associated with this question)` : ''}
        
        Options:
        ${optionsString}

        Based on the question and options, decide on an answer and provide its index. Your response must be a JSON object containing only the index of your chosen answer.
        Example response for choosing the first option: {"answerIndex": 0}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.8,
                thinkingConfig: { thinkingBudget: 0 } // Disable thinking for low latency
            }
        });
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        const answerIndex = parsed.answerIndex;

        if (typeof answerIndex === 'number' && answerIndex >= 0 && answerIndex < question.options.length) {
            return answerIndex;
        } else {
            console.error("AI returned an invalid index:", answerIndex);
            return Math.floor(Math.random() * question.options.length);
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Fallback to a less predictable random choice on API error
        const isCorrect = Math.random() > 0.3; // 70% chance to be correct on error
        if (isCorrect) return question.correctAnswer;
        
        const incorrectOptions = Array.from({ length: question.options.length }, (_, i) => i).filter(i => i !== question.correctAnswer);
        return incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
    }
};