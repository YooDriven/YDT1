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

export const QuestionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase!.from('questions').select('*');
        if (error) throw error;
        setQuestions(data && data.length > 0 ? data : MOCK_QUESTIONS);
      } catch (err: any) {
        setError(err.message);
        setQuestions(MOCK_QUESTIONS); // Fallback
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
