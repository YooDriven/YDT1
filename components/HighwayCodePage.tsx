import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Page, HighwayCodeRule } from '../types';
import { ChevronLeftIcon } from './icons';
import { supabase } from '../lib/supabaseClient';

interface HighwayCodePageProps {
    navigateTo: (page: Page) => void;
}

const HighwayCodePage: React.FC<HighwayCodePageProps> = ({ navigateTo }) => {
    const [rules, setRules] = useState<HighwayCodeRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('');

    const mainContentRef = useRef<HTMLDivElement>(null);
    // FIX: Changed ref type from HTMLDivElement to HTMLElement to match the <section> element's type.
    const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

    useEffect(() => {
        const fetchCode = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase!
                    .from('highway_code')
                    .select('*')
                    .order('rule_number', { ascending: true });
                if (error) throw error;
                setRules(data as HighwayCodeRule[]);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCode();
    }, []);

    const filteredRules = useMemo(() => {
        if (!searchTerm) return rules;
        const lowercasedTerm = searchTerm.toLowerCase();
        return rules.filter(rule =>
            rule.title.toLowerCase().includes(lowercasedTerm) ||
            rule.content.toLowerCase().includes(lowercasedTerm) ||
            rule.category.toLowerCase().includes(lowercasedTerm) ||
            String(rule.rule_number).includes(lowercasedTerm)
        );
    }, [rules, searchTerm]);

    const groupedRules = useMemo(() => {
        return filteredRules.reduce((acc, rule) => {
            (acc[rule.category] = acc[rule.category] || []).push(rule);
            return acc;
        }, {} as Record<string, HighwayCodeRule[]>);
    }, [filteredRules]);

    const categories = useMemo(() => {
        const categorySet = new Set(rules.map(r => r.category));
        return Array.from(categorySet);
    }, [rules]);

     useEffect(() => {
        if (loading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveCategory(entry.target.id);
                    }
                });
            },
            { root: mainContentRef.current, rootMargin: "-20% 0px -80% 0px", threshold: 0 }
        );

        // FIX: Use Object.keys to iterate and then access the ref. This avoids type inference issues with Object.values returning unknown[].
        Object.keys(categoryRefs.current).forEach(key => {
            const el = categoryRefs.current[key];
            if (el) observer.observe(el);
        });

        return () => {
            // FIX: Use Object.keys here as well for consistency and type safety.
            Object.keys(categoryRefs.current).forEach(key => {
                const el = categoryRefs.current[key];
                if (el) observer.unobserve(el);
            });
        };
    }, [loading, groupedRules]);

    const handleCategoryClick = (category: string) => {
      const el = categoryRefs.current[category];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const renderContent = () => {
        if (loading) return <div className="text-center p-8 text-gray-500 dark:text-gray-400">Loading Highway Code...</div>;
        if (error) return <div className="text-center p-8 text-red-500">Error loading content: {error}</div>;
        if (Object.keys(groupedRules).length === 0) {
            return <div className="text-center p-8 text-gray-500 dark:text-gray-400">No results found for "{searchTerm}".</div>;
        }

        // FIX: Cast Object.entries result to the expected type to prevent '.map' does not exist on 'unknown' error.
        return (Object.entries(groupedRules) as [string, HighwayCodeRule[]][]).map(([category, rulesInCategory]) => (
            <section
                key={category}
                id={category}
                // FIX: Ensured the ref callback doesn't return a value to match the expected 'Ref<HTMLElement>' type.
                ref={el => { categoryRefs.current[category] = el; }}
                className="mb-12 scroll-mt-24"
            >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b-2 border-teal-500">{category}</h2>
                <div className="space-y-6">
                    {rulesInCategory.map((rule, index) => (
                        <article key={rule.id} className="stagger-fade-in flex items-start gap-4" style={{ animationDelay: `${index * 20}ms`}}>
                            <div className="flex-shrink-0 mt-1 h-8 w-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 text-sm font-bold text-gray-800 dark:text-white">
                                {rule.rule_number}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">{rule.title}</h3>
                                <div
                                    className="prose prose-sm dark:prose-invert text-gray-600 dark:text-gray-400 mt-1"
                                    dangerouslySetInnerHTML={{ __html: rule.content }}
                                />
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        ));
    };

    return (
        <div className="max-w-7xl mx-auto">
            <header className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navigateTo(Page.StudyHub)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
                        <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Study Hub</span>
                    </button>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">The Highway Code</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">The official rules of the road. Search or browse by category.</p>
            </header>

            <div className="flex flex-col md:flex-row mt-8">
                <aside className="w-full md:w-64 lg:w-72 md:pr-8 mb-8 md:mb-0">
                    <div className="sticky top-24">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categories</h2>
                        <nav className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryClick(category)}
                                    className={`w-full text-left p-2 rounded-md text-sm font-medium transition-colors ${
                                        activeCategory === category
                                            ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                <main ref={mainContentRef} className="flex-1 md:pl-8 border-t md:border-t-0 md:border-l border-gray-200 dark:border-slate-700">
                    <div className="sticky top-24 z-10 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-sm py-4 mb-6">
                        <input
                            type="search"
                            placeholder="Search by rule number or keyword (e.g., 159, roundabout)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                    </div>
                    <div className="px-4 sm:px-6 lg:px-0">
                         {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default HighwayCodePage;