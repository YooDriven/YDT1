import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Page, Question, HazardPerceptionClip } from '../types';
import { ChevronLeftIcon } from './icons';
import { supabase } from '../lib/supabaseClient';
import { MOCK_QUESTIONS } from '../constants';
import DynamicIcon from './DynamicIcon';

// A simplified, self-contained modal component for the form
const QuestionFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (question: Partial<Question>) => void;
    question: Partial<Question> | null;
}> = ({ isOpen, onClose, onSave, question }) => {
    const [formData, setFormData] = useState<Partial<Question>>({});

    useEffect(() => {
        setFormData(question || { options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }], correctAnswer: 0 });
    }, [question]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...(formData.options || [])];
        newOptions[index] = { text: value };
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const handleCorrectAnswerChange = (index: number) => {
        setFormData(prev => ({ ...prev, correctAnswer: index }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    const uniqueCategories = [...new Set(MOCK_QUESTIONS.map(q => q.category))];

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeInUp">
            <div className="relative max-w-2xl w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl">
                <form onSubmit={handleSubmit} className="p-8 space-y-4 max-h-[90vh] overflow-y-auto">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{formData.id ? 'Edit Question' : 'Add New Question'}</h2>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Question Text</label>
                        <textarea name="question" value={formData.question || ''} onChange={handleInputChange} required className="mt-1 w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Options</label>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center mt-2">
                                <input type="radio" name="correctAnswer" checked={formData.correctAnswer === i} onChange={() => handleCorrectAnswerChange(i)} className="mr-2 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 dark:border-slate-500 bg-gray-100 dark:bg-slate-600" />
                                <input type="text" value={formData.options?.[i]?.text || ''} onChange={(e) => handleOptionChange(i, e.target.value)} required placeholder={`Option ${i + 1}`} className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md" />
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                        <input name="category" list="categories" value={formData.category || ''} onChange={handleInputChange} required className="mt-1 w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md" />
                        <datalist id="categories">
                            {uniqueCategories.map(cat => <option key={cat} value={cat} />)}
                        </datalist>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Explanation</label>
                        <textarea name="explanation" value={formData.explanation || ''} onChange={handleInputChange} required className="mt-1 w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md" />
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AssetEditModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string, value: string) => void;
    asset: { asset_key: string, asset_value: string, description: string } | null;
}> = ({ isOpen, onClose, onSave, asset }) => {
    const [svg, setSvg] = useState('');
    useEffect(() => {
        if (asset) setSvg(asset.asset_value);
    }, [asset]);

    if (!isOpen || !asset) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(asset.asset_key, svg);
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeInUp">
            <div className="relative max-w-2xl w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl">
                 <form onSubmit={handleSubmit} className="p-8 space-y-4 max-h-[90vh] flex flex-col">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Asset: <span className="text-teal-500">{asset.asset_key}</span></h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{asset.description}</p>
                    <div className="flex-grow">
                        <textarea
                            value={svg}
                            onChange={(e) => setSvg(e.target.value)}
                            className="w-full h-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-md font-mono text-sm"
                            style={{ minHeight: '250px' }}
                            placeholder="Paste SVG code here..."
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600">Save</button>
                    </div>
                 </form>
            </div>
        </div>
    );
};

const HazardClipFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (clip: Partial<HazardPerceptionClip>) => void;
    clip: Partial<HazardPerceptionClip> | null;
}> = ({ isOpen, onClose, onSave, clip }) => {
    const [formData, setFormData] = useState<Partial<HazardPerceptionClip>>({});
    const [progress, setProgress] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        setFormData(clip || { hazardWindowStart: 0, hazardWindowEnd: 0 });
        setProgress(0);
        if (videoRef.current) videoRef.current.currentTime = 0;
    }, [clip]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMetadata = () => {
        if (videoRef.current) {
            setFormData(prev => ({ ...prev, duration: videoRef.current?.duration }));
        }
    };
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
        }
    };

    const handleSetPoint = (type: 'start' | 'end') => {
        if (videoRef.current && formData.duration) {
            const pointPercent = (videoRef.current.currentTime / formData.duration) * 100;
            if (type === 'start') {
                setFormData(prev => ({ ...prev, hazardWindowStart: pointPercent, hazardWindowEnd: Math.max(pointPercent, prev.hazardWindowEnd || 0) }));
            } else {
                setFormData(prev => ({ ...prev, hazardWindowEnd: Math.max(pointPercent, prev.hazardWindowStart || 0) }));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;
    
    const start = formData.hazardWindowStart || 0;
    const end = formData.hazardWindowEnd || 0;

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeInUp">
            <div className="relative max-w-2xl w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl">
                <form onSubmit={handleSubmit} className="p-8 space-y-4 max-h-[90vh] overflow-y-auto">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{formData.id ? 'Edit Hazard Clip' : 'Add New Hazard Clip'}</h2>
                    
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        {formData.videoUrl && (
                            <video ref={videoRef} src={formData.videoUrl} onLoadedMetadata={handleMetadata} onTimeUpdate={handleTimeUpdate} controls className="w-full h-full" />
                        )}
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 relative">
                        <div className="absolute top-0 h-full bg-teal-500/50 rounded-full" style={{ left: `${start}%`, width: `${end - start}%` }} />
                        <div className="absolute top-0 h-full w-1 bg-red-500" style={{ left: `${progress}%` }} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button type="button" onClick={() => handleSetPoint('start')} className="w-full p-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">Set Start Point</button>
                        <button type="button" onClick={() => handleSetPoint('end')} className="w-full p-2 bg-amber-500 text-white rounded-md hover:bg-amber-600">Set End Point</button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Video URL</label>
                        <input name="videoUrl" value={formData.videoUrl || ''} onChange={handleInputChange} required className="mt-1 w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea name="description" value={formData.description || ''} onChange={handleInputChange} required className="mt-1 w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md" />
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


type AdminTab = 'questions' | 'assets' | 'hazard';

interface AdminPageProps {
    navigateTo: (page: Page) => void;
    appAssets: Record<string, string>;
    onAssetsUpdate: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ navigateTo, appAssets, onAssetsUpdate }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('questions');
    // Question State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [qLoading, setQLoading] = useState(true);
    const [qError, setQError] = useState<string | null>(null);
    const [isQModalOpen, setIsQModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    // Asset State
    const [assets, setAssets] = useState<any[]>([]);
    const [aLoading, setALoading] = useState(true);
    const [aError, setAError] = useState<string | null>(null);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<any | null>(null);
    // Hazard Clip State
    const [clips, setClips] = useState<HazardPerceptionClip[]>([]);
    const [hLoading, setHLoading] = useState(true);
    const [hError, setHError] = useState<string | null>(null);
    const [isHModalOpen, setIsHModalOpen] = useState(false);
    const [editingClip, setEditingClip] = useState<Partial<HazardPerceptionClip> | null>(null);
    const [deletingClipId, setDeletingClipId] = useState<number | null>(null);

    const fetchQuestions = useCallback(async () => {
        setQLoading(true);
        const { data, error } = await supabase!.from('questions').select('*').order('category');
        if (error) setQError(error.message);
        else setQuestions(data as Question[]);
        setQLoading(false);
    }, []);

    const fetchAllAssets = useCallback(async () => {
        setALoading(true);
        const { data, error } = await supabase!.from('app_assets').select('*').order('asset_key');
        if (error) setAError(error.message);
        else setAssets(data);
        setALoading(false);
    }, []);

    const fetchHazardClips = useCallback(async () => {
        setHLoading(true);
        const { data, error } = await supabase!.from('hazard_clips').select('*').order('created_at');
        if (error) setHError(error.message);
        else setClips(data.map(c => ({...c, videoUrl: c.video_url, hazardWindowStart: c.hazard_window_start, hazardWindowEnd: c.hazard_window_end})));
        setHLoading(false);
    }, []);

    useEffect(() => {
        if (activeTab === 'questions') fetchQuestions();
        if (activeTab === 'assets') fetchAllAssets();
        if (activeTab === 'hazard') fetchHazardClips();
    }, [activeTab, fetchQuestions, fetchAllAssets, fetchHazardClips]);

    const handleSaveQuestion = async (formData: Partial<Question>) => {
        const payload = { ...formData, correctAnswer: Number(formData.correctAnswer) };
        if (editingQuestion?.id) { // Update
            const { error } = await supabase!.from('questions').update(payload).eq('id', editingQuestion.id);
            if (error) setQError(error.message);
        } else { // Create
            const { error } = await supabase!.from('questions').insert(payload);
            if (error) setQError(error.message);
        }
        setIsQModalOpen(false);
        fetchQuestions();
    };

    const handleDeleteQuestion = async (id: string) => {
        const { error } = await supabase!.from('questions').delete().eq('id', id);
        if (error) setQError(error.message);
        setDeletingId(null);
        fetchQuestions();
    };
    
    const handleSaveAsset = async (key: string, value: string) => {
        const { error } = await supabase!.from('app_assets').update({ asset_value: value }).eq('asset_key', key);
        if (error) setAError(error.message);
        setIsAssetModalOpen(false);
        onAssetsUpdate(); // Crucially, tell App.tsx to refetch assets
        fetchAllAssets();
    };

    const handleSaveHazardClip = async (formData: Partial<HazardPerceptionClip>) => {
        const payload = {
            description: formData.description,
            video_url: formData.videoUrl,
            duration: formData.duration,
            hazard_window_start: formData.hazardWindowStart,
            hazard_window_end: formData.hazardWindowEnd,
        };
        if (formData.id) { // Update
            const { error } = await supabase!.from('hazard_clips').update(payload).eq('id', formData.id);
            if (error) setHError(error.message);
        } else { // Create
            const { error } = await supabase!.from('hazard_clips').insert(payload);
            if (error) setHError(error.message);
        }
        setIsHModalOpen(false);
        fetchHazardClips();
    };
    
    const handleDeleteHazardClip = async (id: number) => {
        const { error } = await supabase!.from('hazard_clips').delete().eq('id', id);
        if (error) setHError(error.message);
        setDeletingClipId(null);
        fetchHazardClips();
    };


    const TabButton: React.FC<{tab: AdminTab; label: string}> = ({ tab, label }) => (
        <button 
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tab ? 'bg-teal-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navigateTo(Page.Dashboard)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
                        <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Dashboard</span>
                    </button>
                    {activeTab === 'questions' && (
                        <button onClick={() => { setEditingQuestion(null); setIsQModalOpen(true); }} className="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors">
                            Add New Question
                        </button>
                    )}
                    {activeTab === 'hazard' && (
                        <button onClick={() => { setEditingClip(null); setIsHModalOpen(true); }} className="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors">
                            Add New Clip
                        </button>
                    )}
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                <div className="mt-4 border-b border-gray-200 dark:border-slate-700 flex space-x-2">
                    <TabButton tab="questions" label="Question Management" />
                    <TabButton tab="assets" label="Asset Management" />
                    <TabButton tab="hazard" label="Hazard Perception" />
                </div>
            </header>

            {activeTab === 'questions' && (
                <div>
                    {qLoading && <p>Loading questions...</p>}
                    {qError && <p className="text-red-500">Error: {qError}</p>}
                    {!qLoading && !qError && (
                         <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden shadow-md">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 w-1/2">Question</th>
                                            <th scope="col" className="px-6 py-3">Category</th>
                                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {questions.map((q) => (
                                            <tr key={q.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white truncate" title={q.question}>{q.question}</td>
                                                <td className="px-6 py-4">{q.category}</td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button onClick={() => { setEditingQuestion(q); setIsQModalOpen(true); }} className="font-medium text-teal-600 dark:text-teal-500 hover:underline">Edit</button>
                                                    <button onClick={() => setDeletingId(q.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'assets' && (
                <div>
                    {aLoading && <p>Loading assets...</p>}
                    {aError && <p className="text-red-500">Error: {aError}</p>}
                    {!aLoading && !aError && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {assets.map(asset => (
                                <div key={asset.asset_key} className="bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700 text-center flex flex-col justify-between">
                                    <div className="h-20 flex items-center justify-center text-gray-800 dark:text-white">
                                        <DynamicIcon svgString={asset.asset_value} className="h-12 w-12" />
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{asset.asset_key}</p>
                                        <button onClick={() => { setEditingAsset(asset); setIsAssetModalOpen(true); }} className="mt-2 text-xs font-medium text-teal-600 dark:text-teal-500 hover:underline">Edit</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

             {activeTab === 'hazard' && (
                <div>
                    {hLoading && <p>Loading hazard clips...</p>}
                    {hError && <p className="text-red-500">Error: {hError}</p>}
                    {!hLoading && !hError && (
                         <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden shadow-md">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Preview</th>
                                            <th scope="col" className="px-6 py-3 w-1/2">Description</th>
                                            <th scope="col" className="px-6 py-3">Duration</th>
                                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clips.map((c) => (
                                            <tr key={c.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                                <td className="px-6 py-4"><video src={c.videoUrl} className="h-16 w-32 object-cover rounded-md bg-black" /></td>
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white" title={c.description}>{c.description}</td>
                                                <td className="px-6 py-4">{c.duration.toFixed(1)}s</td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button onClick={() => { setEditingClip(c); setIsHModalOpen(true); }} className="font-medium text-teal-600 dark:text-teal-500 hover:underline">Edit</button>
                                                    <button onClick={() => setDeletingClipId(c.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            <QuestionFormModal isOpen={isQModalOpen} onClose={() => setIsQModalOpen(false)} onSave={handleSaveQuestion} question={editingQuestion} />
            <AssetEditModal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} onSave={handleSaveAsset} asset={editingAsset} />
            <HazardClipFormModal isOpen={isHModalOpen} onClose={() => setIsHModalOpen(false)} onSave={handleSaveHazardClip} clip={editingClip} />

            {deletingId && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 text-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Are you sure?</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This action cannot be undone. This will permanently delete the question.</p>
                        <div className="mt-6 flex justify-center gap-4">
                             <button onClick={() => setDeletingId(null)} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500">Cancel</button>
                             <button onClick={() => handleDeleteQuestion(deletingId)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}
             {deletingClipId && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 text-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Hazard Clip?</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This will permanently delete the hazard perception clip.</p>
                        <div className="mt-6 flex justify-center gap-4">
                             <button onClick={() => setDeletingClipId(null)} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500">Cancel</button>
                             <button onClick={() => handleDeleteHazardClip(deletingClipId)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;