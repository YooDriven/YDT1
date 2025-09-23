import React, { useState, useMemo, useEffect } from 'react';
import { Page, RoadSign, RoadSignCategory } from '../types';
import { ChevronLeftIcon } from './icons';
import { supabase } from '../lib/supabaseClient';
import DynamicIcon from './DynamicIcon';
import { useDebounce } from '../hooks/useDebounce';

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

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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

  const filteredSigns = useMemo(() => {
    return signs.filter(sign => {
      const matchesCategory = activeCategory === 'all' || sign.category === activeCategory;
      const matchesSearch = debouncedSearchTerm === '' ||
        sign.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        sign.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [debouncedSearchTerm, activeCategory, signs]);

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading Road Signs...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigateTo(Page.StudyHub)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
            <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
            <span>Back to Study Hub</span>
          </button>
          <p className="text-lg font-bold text-gray-900 dark:text-white">Road Signs Library</p>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mt-2 leading-relaxed max-w-2xl">
          Browse, search, and learn essential UK road signs. Click on a sign to reveal its meaning.
        </p>
      </header>
      
      <main>
        <div className="mb-6 sticky top-4 z-10 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text"
              placeholder="Search signs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-1/3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={() => setActiveCategory('all')} 
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeCategory === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'}`}
              >
                All
              </button>
              {categories.map(category => (
                <button 
                  key={category.id} 
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeCategory === category.id ? 'bg-teal-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'}`}
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
              className="stagger-fade-in aspect-square perspective cursor-pointer"
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => setFlippedSignId(prev => prev === sign.id ? null : sign.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setFlippedSignId(prev => prev === sign.id ? null : sign.id)}
              role="button"
              tabIndex={0}
              aria-label={`Road sign: ${sign.name}. Click to see description.`}
            >
              <div className={`card-inner ${flippedSignId === sign.id ? 'is-flipped' : ''}`}>
                <div className="card-face w-full h-full p-4 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-md shadow-gray-200/50 dark:shadow-black/20 border border-gray-200 dark:border-slate-700">
                   <DynamicIcon svgString={sign.svg_code} className="w-full h-full" />
                </div>
                <div className="card-face card-back w-full h-full p-4 bg-slate-800 rounded-lg flex flex-col justify-center text-center border border-slate-700">
                  <h3 className="font-bold text-white text-sm">{sign.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{sign.description}</p>
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
