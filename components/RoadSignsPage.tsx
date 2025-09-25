import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RoadSign, RoadSignCategory } from '../types';
import { ChevronLeftIcon } from './icons';
import DynamicAsset from './DynamicAsset';
import { useDebounce } from '../hooks/useDebounce';
import useLocalStorage from '../hooks/useLocalStorage';
import { Input, Skeleton } from './ui';
// FIX: Replace `useAppContext` with the correct `useApp` hook.
import { useApp } from '../contexts/AppContext';

const useRoadSigns = () => {
    const { supabase } = useApp();
    const [signs, setSigns] = useState<RoadSign[]>([]);
    const [categories, setCategories] = useState<RoadSignCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const signsPromise = supabase.from('road_signs').select('*');
                const categoriesPromise = supabase.from('road_sign_categories').select('*');
                const [{ data: signsData, error: signsError }, { data: categoriesData, error: categoriesError }] = await Promise.all([signsPromise, categoriesPromise]);
                if (signsError) throw signsError;
                if (categoriesError) throw categoriesError;
                setSigns(signsData as RoadSign[]);
                setCategories(categoriesData as RoadSignCategory[]);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [supabase]);

    return { signs, categories, loading, error };
};

const RoadSignsPage: React.FC = () => {
  const { navigateTo } = useApp();
  const { signs, categories, loading, error } = useRoadSigns();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [flippedSignId, setFlippedSignId] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('roadSignRecentSearches', []);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setIsSearchFocused(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (term: string) => {
    const cleanedTerm = term.trim();
    if (cleanedTerm) {
        setSearchTerm(cleanedTerm);
        const newRecent = [cleanedTerm, ...recentSearches.filter(s => s !== cleanedTerm)].slice(0, 5);
        setRecentSearches(newRecent);
        setIsSearchFocused(false);
    }
  };

  const filteredSigns = useMemo(() => {
    return signs.filter(sign => {
      const matchesCategory = activeCategory === 'all' || sign.category === activeCategory;
      const matchesSearch = debouncedSearchTerm === '' ||
        sign.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        sign.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [debouncedSearchTerm, activeCategory, signs]);

  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">Road Signs Library</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 leading-relaxed max-w-3xl">
          Browse, search, and learn essential UK road signs. Click on a sign to reveal its meaning.
        </p>
      </header>
      
      <main>
        <div className="mb-6 sticky top-24 z-20 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div ref={searchContainerRef} className="relative w-full sm:w-1/3">
              <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(searchTerm); }}>
                  <Input 
                    type="text"
                    placeholder="Search signs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    className="w-full"
                  />
              </form>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={() => setActiveCategory('all')} 
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeCategory === 'all' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-slate-700'}`}
              >
                All
              </button>
              {categories.map(category => (
                <button 
                  key={category.id} 
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeCategory === category.id ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-slate-700'}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {loading ? Array.from({length: 18}).map((_, i) => <Skeleton key={i} className="aspect-square" />) :
          filteredSigns.map((sign, index) => (
            <div 
              key={sign.id} 
              className="stagger-fade-in aspect-square perspective cursor-pointer group"
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => setFlippedSignId(prev => prev === sign.id ? null : sign.id)}
            >
              <div className={`card-inner ${flippedSignId === sign.id ? 'is-flipped' : ''}`}>
                <div className="card-face w-full h-full p-4 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-md border border-gray-200 dark:border-slate-700">
                   <DynamicAsset svgString={sign.svg_code} className="w-full h-full" />
                </div>
                <div className="card-face card-back w-full h-full p-4 bg-slate-800 rounded-lg flex flex-col justify-center text-center border border-slate-700">
                  <h3 className="font-semibold text-white text-sm leading-snug">{sign.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-snug">{sign.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!loading && filteredSigns.length === 0 && (
            <div className="text-center py-16">
                <p className="text-gray-500 dark:text-gray-400">No signs found matching your criteria.</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default RoadSignsPage;