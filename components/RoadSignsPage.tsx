import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Page, RoadSign, RoadSignCategory } from '../types';
import { ChevronLeftIcon } from './icons';
import { supabase } from '../lib/supabaseClient';
import DynamicAsset from './DynamicAsset';
import { useDebounce } from '../hooks/useDebounce';
import useLocalStorage from '../hooks/useLocalStorage';
// FIX: Import the 'Input' component from the UI library.
import { Input } from './ui';

interface RoadSignsPageProps {
  navigateTo: (page: Page) => void;
}

const RoadSignsPage: React.FC<RoadSignsPageProps> = ({ navigateTo }) => {
  const [signs, setSigns] = useState<RoadSign[]>([]);
  const [categories, setCategories] = useState<RoadSignCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const signsPromise = supabase!.from('road_signs').select('*');
        const categoriesPromise = supabase!.from('road_sign_categories').select('*');

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

  const autocompleteSuggestions = useMemo(() => {
    if (!debouncedSearchTerm) return [];
    return signs
      .filter(sign => sign.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      .slice(0, 5);
  }, [debouncedSearchTerm, signs]);

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading Road Signs...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigateTo(Page.StudyHub)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
            <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
            <span className="text-base">Back to Study Hub</span>
          </button>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">Road Signs Library</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 leading-relaxed max-w-3xl">
          Browse, search, and learn essential UK road signs. Click on a sign to reveal its meaning.
        </p>
      </header>
      
      <main>
        <div className="mb-6 sticky top-4 z-20 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 dark:border-slate-700">
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
              {isSearchFocused && (
                  <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                      {searchTerm.length > 0 && autocompleteSuggestions.length > 0 && (
                          <ul className="py-1">
                              <li className="px-3 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Suggestions</li>
                              {autocompleteSuggestions.map(sign => (
                                  <li key={sign.id}>
                                      <button onClick={() => handleSearchSubmit(sign.name)} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">{sign.name}</button>
                                  </li>
                              ))}
                          </ul>
                      )}
                      {recentSearches.length > 0 && (
                          <ul className="py-1 border-t border-gray-200 dark:border-slate-700">
                              <li className="px-3 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Recent</li>
                              {recentSearches.map(term => (
                                  <li key={term}>
                                      <button onClick={() => handleSearchSubmit(term)} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">{term}</button>
                                  </li>
                              ))}
                          </ul>
                      )}
                  </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={() => setActiveCategory('all')} 
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeCategory === 'all' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'}`}
              >
                All
              </button>
              {categories.map(category => (
                <button 
                  key={category.id} 
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeCategory === category.id ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredSigns.map((sign, index) => (
            <div 
              key={sign.id} 
              className="stagger-fade-in aspect-square perspective cursor-pointer group"
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => setFlippedSignId(prev => prev === sign.id ? null : sign.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setFlippedSignId(prev => prev === sign.id ? null : sign.id)}
              role="button"
              tabIndex={0}
              aria-label={`Road sign: ${sign.name}. Click to see description.`}
            >
              <div className={`card-inner ${flippedSignId === sign.id ? 'is-flipped' : ''}`}>
                <div className="card-face w-full h-full p-4 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-md shadow-gray-200/50 dark:shadow-black/20 border border-gray-200 dark:border-slate-700 transition-transform transform group-hover:-translate-y-1">
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
        {filteredSigns.length === 0 && (
            <div className="text-center py-16">
                <p className="text-gray-500 dark:text-gray-400">No signs found matching your criteria.</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default RoadSignsPage;