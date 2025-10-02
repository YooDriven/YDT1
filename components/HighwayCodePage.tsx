import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Page, HighwayCodeRule } from '../types';
import { ChevronLeftIcon } from './icons';
import { useApp } from '../contexts/AppContext';
import { Skeleton } from './ui';

const useHighwayCode = () => {
    const { supabase } = useApp();
    const [rules, setRules] = useState<HighwayCodeRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCode = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('highway_code')
                    .select('*')
                    .order('rule_number', { ascending: true });
                if (error) throw error;
                setRules(data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCode();
    }, [supabase]);

    return { rules, loading, error };
};

const HighwayCodePage: React.FC = () => {
    const { navigateTo } = useApp();
    const { rules, loading, error } = useHighwayCode();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('');

    const mainContentRef = useRef<HTMLDivElement>(null);
    const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

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

    // FIX: Using a for...of loop with an explicitly typed accumulator `groups` ensures that TypeScript
    // correctly infers the type of `groupedRules` as `Record<string, HighwayCodeRule[]>`.
    // This resolves the "Property 'map' does not exist on type 'unknown'" error that can occur
    // when using `reduce` with an untyped initial value like `{}`.
    const groupedRules = useMemo(() => {
        const groups: Record<string, HighwayCodeRule[]> = {};
        for (const rule of filteredRules) {
            const category = rule.category;
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(rule);
        }
        return groups;
    }, [filteredRules]);

    const categories = useMemo(() => [...new Set(rules.map(r => r.category))], [rules]);

    useEffect(() => {
        if (loading || !mainContentRef.current) return;
        
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

        const currentRefs = categoryRefs.current;
        Object.values(currentRefs).forEach((el: HTMLElement | null) => {
            if (el) observer.observe(el);
        });

        return () => {
            Object.values(currentRefs).forEach((el: HTMLElement | null) => {
                if (el) observer.unobserve(el);
            });
        };
    }, [loading, groupedRules]);


    const handleCategoryClick = (category: string) => {
      categoryRefs.current[category]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const renderContent = () => {
        if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>;
        if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;
        if (Object.keys(groupedRules).length === 0) {
            return <div className="text-center p-8 text-gray-500">No results for "{searchTerm}".</div>;
        }

        return Object.entries(groupedRules).map(([category, rulesInCategory]) => (
            <section
                key={category}
                id={category}
                ref={(el: HTMLElement | null) => { categoryRefs.current[category] = el; }}
                className="mb-12 scroll-mt-24"
            >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b-2 border-teal-500">{category}</h2>
                <div className="space-y-6">
                    {rulesInCategory.map((rule, index) => (
                        <article key={rule.id} className="stagger-fade-in flex items-start gap-4" style={{ animationDelay: `${index * 20}ms`}}>
                            <div className="flex-shrink-0 mt-1 h-8 w-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 text-sm font-semibold">{rule.rule_number}</div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{rule.title}</h3>
                                <div className="prose prose-base dark:prose-invert text-gray-600 dark:text-gray-400 mt-1 max-w-none" dangerouslySetInnerHTML={{ __html: rule.content }}/>
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
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">The Highway Code</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">The official rules of the road. Search or browse by category.</p>
            </header>

            <div className="flex flex-col md:flex-row mt-8">
                <aside className="w-full md:w-64 lg:w-72 md:pr-8 mb-8 md:mb-0">
                    <div className="sticky top-24">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Categories</h2>
                        <nav className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryClick(category)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        activeCategory === category 
                                        ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-500' 
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>
                <main ref={mainContentRef} className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
                    <input
                        type="search"
                        placeholder="Search rules by number, title, or content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 mb-6 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 sticky top-24 z-10"
                    />
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default HighwayCodePage;