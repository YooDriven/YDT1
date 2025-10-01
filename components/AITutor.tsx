
import React, { useState } from 'react';
import { getAIExplanation } from '../lib/gemini';
import { Question } from '../types';
import { SparklesIcon } from './icons';
import { Button, Skeleton } from './ui';

interface AITutorProps {
    question: Question;
}

const AITutor: React.FC<AITutorProps> = ({ question }) => {
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchExplanation = async () => {
        setIsLoading(true);
        setError(null);
        setExplanation(null);
        try {
            const result = await getAIExplanation(question);
            setExplanation(result);
        } catch (e: any) {
            setError('Failed to get explanation. Please try again.');
            console.error(e);
        }
        setIsLoading(false);
    };

    return (
        <div className="mt-4 pt-4 border-t border-dashed border-gray-300 dark:border-slate-600">
            {!explanation && !isLoading && (
                 <Button variant="secondary" onClick={handleFetchExplanation}>
                    <SparklesIcon className="h-5 w-5 mr-2 text-purple-500" />
                    Ask AI Tutor for another explanation
                </Button>
            )}
            {isLoading && (
                <div className="space-y-2 p-4 bg-sky-50 dark:bg-sky-500/10 rounded-lg">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            )}
            
            {explanation && (
                <div className="p-4 bg-sky-50 dark:bg-sky-500/10 rounded-lg border border-sky-200 dark:border-sky-500/20 animate-fadeInUp">
                    <h4 className="flex items-center text-sm font-semibold text-sky-800 dark:text-sky-300 mb-2">
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        AI Tutor's Explanation
                    </h4>
                    {error ? (
                        <p className="text-sm text-red-500">{error}</p>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert text-sky-700 dark:text-sky-400 max-w-none" dangerouslySetInnerHTML={{ __html: explanation }} />
                    )}
                     <Button variant="secondary" className="mt-3 !py-1 !text-xs" onClick={handleFetchExplanation} disabled={isLoading}>
                        {isLoading ? 'Getting new explanation...' : 'Get another explanation'}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default AITutor;
