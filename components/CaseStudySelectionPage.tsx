import React, { useState, useEffect } from 'react';
import { Page, CaseStudy } from '../types';
import { ChevronLeftIcon } from './icons';
import { supabase } from '../lib/supabaseClient';

interface CaseStudySelectionPageProps {
    navigateTo: (page: Page) => void;
    onCaseStudySelect: (caseStudy: CaseStudy) => void;
}

const CaseStudySelectionPage: React.FC<CaseStudySelectionPageProps> = ({ navigateTo, onCaseStudySelect }) => {
    const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCaseStudies = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase!
                    .from('case_studies')
                    .select('*')
                    .order('title', { ascending: true });
                if (error) throw error;
                setCaseStudies(data as CaseStudy[]);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCaseStudies();
    }, []);

    const renderContent = () => {
        if (loading) {
            return <div className="text-center p-8 text-gray-500 dark:text-gray-400">Loading Case Studies...</div>;
        }
        if (error) {
            return <div className="text-center p-8 text-red-500">Error: {error}</div>;
        }
        if (caseStudies.length === 0) {
            return (
                 <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">No case studies have been added yet.</p>
                </div>
            );
        }
        return (
            <main className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {caseStudies.map((study, index) => (
                    <button
                        key={study.id}
                        onClick={() => onCaseStudySelect(study)}
                        className="stagger-fade-in p-6 bg-white dark:bg-slate-800 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700 transition-all transform hover:-translate-y-1"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <h2 className="font-bold text-xl text-gray-900 dark:text-white">{study.title}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{study.scenario}</p>
                    </button>
                ))}
            </main>
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <div className="flex items-center justify-between mb-4">
                <button onClick={() => navigateTo(Page.StudyHub)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
                    <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Study Hub</span>
                </button>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Case Studies</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">Select a scenario to test your knowledge with a related set of questions.</p>
            </header>
            {renderContent()}
        </div>
    );
};

export default CaseStudySelectionPage;