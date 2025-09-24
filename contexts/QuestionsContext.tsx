import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Question } from '../types';
import { supabase } from '../lib/supabaseClient';
import { MOCK_QUESTIONS } from '../constants';

interface QuestionsContextType {
  questions: Question[];
  loading: boolean;
  error: string | null;
}

const QuestionsContext = createContext<QuestionsContextType | undefined>(undefined);

const CACHE_KEY = 'driveTheoryQuestionsCache';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

export const QuestionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      // 1. Try to load from cache first
      try {
        const cachedItem = localStorage.getItem(CACHE_KEY);
        if (cachedItem) {
          const { timestamp, data } = JSON.parse(cachedItem);
          const isCacheStale = Date.now() - timestamp > CACHE_DURATION;
          
          if (data && data.length > 0) {
            setQuestions(data);
            setLoading(false); // Show cached data immediately
            if (isCacheStale && navigator.onLine) {
                // Fetch in background if cache is stale and online
                fetchFromSupabase();
            } else if (!isCacheStale) {
                return; // Cache is fresh, no need to fetch
            }
          }
        }
      } catch (e) {
        console.error("Failed to read questions from cache", e);
      }
      
      // 2. If no fresh cache, fetch from Supabase
      fetchFromSupabase();
    };

    const fetchFromSupabase = async () => {
        if (!navigator.onLine && questions.length > 0) {
            // Already have cached questions and are offline, don't try to fetch
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase!.from('questions').select('*');
            if (error) throw error;

            if (data && data.length > 0) {
                setQuestions(data);
                // Save to cache
                try {
                    const cacheItem = { timestamp: Date.now(), data };
                    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheItem));
                } catch (e) {
                    console.error("Failed to save questions to cache", e);
                }
            } else if (questions.length === 0) { // Only use mocks if there's nothing else
                setQuestions(MOCK_QUESTIONS);
            }
        } catch (err: any) {
            setError(err.message);
            // On error, if we don't have cached questions, use mocks as a final fallback
            if (questions.length === 0) {
                setQuestions(MOCK_QUESTIONS);
            }
        } finally {
            setLoading(false);
        }
    };
    
    fetchQuestions();
  }, []);

  return (
    <QuestionsContext.Provider value={{ questions, loading, error }}>
      {children}
    </QuestionsContext.Provider>
  );
};

export const useQuestions = () => {
  const context = useContext(QuestionsContext);
  if (context === undefined) {
    throw new Error('useQuestions must be used within a QuestionsProvider');
  }
  return context;
};