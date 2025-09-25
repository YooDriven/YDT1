import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Page, Question, AdminSection, ContentTab, RoadSign, RoadSignCategory, HazardPerceptionClip, CaseStudy, HighwayCodeRule, AppAssetRecord, AppAsset } from '../types';
import { ChevronLeftIcon } from './icons';
import { supabase } from '../lib/supabaseClient';
import DynamicAsset from './DynamicAsset';
import { Toast, Modal, FormRow, Label, Input, Textarea, Select, Button } from './ui';
import { useDebounce } from '../hooks/useDebounce';

// Question Form Component
const DEFAULT_QUESTION: Omit<Question, 'id'> = {
    question: '',
    options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
    correctAnswer: 0,
    category: '',
    explanation: '',
    questionImage: ''
};

const QuestionForm: React.FC<{ question: Question | null; onSave: (question: Omit<Question, 'id'> | Question) => Promise<void>; onClose: () => void; categories: string[]; }> = ({ question, onSave, onClose, categories }) => {
    const [formData, setFormData] = useState(question || DEFAULT_QUESTION);
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'correctAnswer' ? parseInt(value) : value }));
    };

    const handleOptionChange = (index: number, field: 'text' | 'image', value: string) => {
        const newOptions = [...formData.options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };

    return (
        <Modal title={question ? 'Edit Question' : 'Add New Question'} onClose={onClose} size="3xl">
            <form onSubmit={handleSubmit}>
                <FormRow>
                    <Label htmlFor="question">Question Text</Label>
                    <Textarea id="question" name="question" value={formData.question} onChange={handleInputChange} required />
                </FormRow>
                <FormRow>
                    <Label htmlFor="questionImage">Question Image URL (Optional)</Label>
                    <Input id="questionImage" name="questionImage" value={formData.questionImage || ''} onChange={handleInputChange} />
                </FormRow>
                <FormRow>
                    <Label>Options</Label>
                    <div className="space-y-3">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-md">
                                <input type="radio" name="correctAnswer" value={i} checked={formData.correctAnswer === i} onChange={handleInputChange} className="mt-1" />
                                <Input placeholder={`Option ${i + 1} Text`} value={formData.options[i]?.text || ''} onChange={(e) => handleOptionChange(i, 'text', e.target.value)} />
                                <Input placeholder={`Option ${i + 1} Image URL`} value={formData.options[i]?.image || ''} onChange={(e) => handleOptionChange(i, 'image', e.target.value)} />
                            </div>
                        ))}
                    </div>
                </FormRow>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormRow>
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" name="category" list="category-list" value={formData.category} onChange={handleInputChange} required placeholder="Type or select a category" />
                        <datalist id="category-list">
                            {categories.map(cat => <option key={cat} value={cat} />)}
                        </datalist>
                    </FormRow>
                    <FormRow>
                         <Label htmlFor="explanation">Explanation</Label>
                         <Textarea id="explanation" name="explanation" value={formData.explanation} onChange={handleInputChange} required />
                    </FormRow>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Question'}</Button>
                </div>
            </form>
        </Modal>
    );
};

// Question Manager Component
const QuestionManager: React.FC<{ showToast: (msg: string, type?: 'success' | 'error') => void; }> = ({ showToast }) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase!.from('questions').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setQuestions(data || []);
        } catch (err: any) {
            setError(err.message);
            showToast(`Error fetching questions: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const handleSave = async (questionData: Omit<Question, 'id'> | Question) => {
        try {
            const { id, created_at, ...upsertData } = questionData as Question;
            const { error } = await supabase!.from('questions').upsert(upsertData);
            if (error) throw error;
            showToast('Question saved successfully!');
            setIsModalOpen(false);
            setEditingQuestion(null);
            fetchQuestions();
        } catch (err: any) {
            showToast(`Error saving question: ${err.message}`, 'error');
        }
    };

    const handleDelete = async (questionId: string) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            try {
                const { error } = await supabase!.from('questions').delete().eq('id', questionId);
                if (error) throw error;
                showToast('Question deleted successfully.');
                fetchQuestions();
            } catch (err: any) {
                showToast(`Error deleting question: ${err.message}`, 'error');
            }
        }
    };

    const handleEdit = (question: Question) => {
        setEditingQuestion(question);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingQuestion(null);
        setIsModalOpen(true);
    };

    const uniqueCategories = useMemo(() => [...new Set(questions.map(q => q.category))], [questions]);
    const filteredQuestions = useMemo(() => questions.filter(q => q.question.toLowerCase().includes(debouncedSearchTerm.toLowerCase())), [questions, debouncedSearchTerm]);

    if (loading) return <div className="text-center p-8">Loading questions...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

    return (
        <div>
             {isModalOpen && <QuestionForm question={editingQuestion} onSave={handleSave} onClose={() => setIsModalOpen(false)} categories={uniqueCategories} />}
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Questions</h2>
                <Button onClick={handleAddNew}>Add New Question</Button>
            </div>
            <div className="mb-4">
                <Input type="search" placeholder="Search questions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                         <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400 tracking-wider">
                             <tr>
                                 <th className="px-6 py-3">Question</th>
                                 <th className="px-6 py-3">Category</th>
                                 <th className="px-6 py-3 text-right">Actions</th>
                             </tr>
                         </thead>
                         <tbody>
                            {filteredQuestions.map(q => (
                                <tr key={q.id} className="border-b dark:border-slate-700">
                                    <td className="px-6 py-4 font-normal text-gray-900 dark:text-white max-w-md truncate">{q.question}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{q.category}</td>
                                    <td className="px-6 py-4 flex justify-end gap-2">
                                        <Button variant="secondary" onClick={() => handleEdit(q)}>Edit</Button>
                                        <Button variant="danger" onClick={() => handleDelete(q.id)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                         </tbody>
                    </table>
                     {filteredQuestions.length === 0 && <p className="p-8 text-center text-gray-500 dark:text-gray-400">No questions found.</p>}
                </div>
            </div>
        </div>
    );
};

// Category Manager Components
type CategoryInfo = { name: string; count: number };

const CategoryRenameModal: React.FC<{ categoryName: string; onSave: (newName: string) => Promise<void>; onClose: () => void; }> = ({ categoryName, onSave, onClose }) => {
    const [newName, setNewName] = useState(categoryName);
    const [isSaving, setIsSaving] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(newName);
        setIsSaving(false);
    };
    return (
        <Modal title={`Rename Category: ${categoryName}`} onClose={onClose} size="md">
            <form onSubmit={handleSubmit}>
                <FormRow>
                    <Label htmlFor="category-name">New Category Name</Label>
                    <Input id="category-name" value={newName} onChange={e => setNewName(e.target.value)} required />
                </FormRow>
                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={isSaving || !newName || newName === categoryName}>
                        {isSaving ? 'Saving...' : 'Rename'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const CategoryDeleteModal: React.FC<{ category: CategoryInfo; otherCategories: string[]; onDelete: (transferTo: string | null) => Promise<void>; onClose: () => void; }> = ({ category, otherCategories, onDelete, onClose }) => {
    const [transferTo, setTransferTo] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const needsTransfer = category.count > 0;

    const handleSubmit = async () => {
        setIsDeleting(true);
        await onDelete(transferTo);
        setIsDeleting(false);
    };

    return (
        <Modal title={`Delete Category: ${category.name}`} onClose={onClose} size="lg">
            <p className="text-gray-700 dark:text-gray-300">Are you sure you want to delete this category?</p>
            {needsTransfer && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-500/10 border-l-4 border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-300">
                    <p className="font-semibold">This category contains {category.count} questions.</p>
                    <p>To prevent orphaning questions, please select a new category to move them to.</p>
                </div>
            )}
            {needsTransfer && (
                <FormRow>
                    <Label htmlFor="transfer-category" className="mt-4">Move questions to:</Label>
                    <Select id="transfer-category" value={transferTo} onChange={e => setTransferTo(e.target.value)} required>
                        <option value="" disabled>Select a category...</option>
                        {otherCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Select>
                </FormRow>
            )}
            <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="danger" onClick={handleSubmit} disabled={isDeleting || (needsTransfer && !transferTo)}>
                    {isDeleting ? 'Deleting...' : 'Delete Category'}
                </Button>
            </div>
        </Modal>
    );
};

const CategoryManager: React.FC<{ showToast: (msg: string, type?: 'success' | 'error') => void; }> = ({ showToast }) => {
    const [categories, setCategories] = useState<CategoryInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState<'rename' | 'delete' | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(null);
    
    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase!.from('questions').select('category');
            if (error) throw error;

            // FIX: Explicitly type `categoryCounts` and `q` to prevent type inference issues where `count` becomes `unknown`.
            const categoryCounts: Record<string, number> = (data || []).reduce((acc: Record<string, number>, q: any) => {
                const cat = q.category || 'Uncategorized';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const categoriesData = Object.entries(categoryCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => a.name.localeCompare(b.name));

            setCategories(categoriesData);
        } catch (err: any) {
            setError(err.message);
            showToast(`Error fetching categories: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleRename = async (newName: string) => {
        if (!selectedCategory || newName === selectedCategory.name) return;
        try {
            const { error } = await supabase!.from('questions').update({ category: newName }).eq('category', selectedCategory.name);
            if (error) throw error;
            showToast(`Category renamed to "${newName}"`);
            setModal(null);
            fetchCategories();
        } catch (err: any) {
            showToast(`Error renaming category: ${err.message}`, 'error');
        }
    };

    const handleDelete = async (transferTo: string | null) => {
        if (!selectedCategory) return;
        try {
            if (selectedCategory.count > 0 && transferTo) {
                const { error } = await supabase!.from('questions').update({ category: transferTo }).eq('category', selectedCategory.name);
                if (error) throw error;
            }
            showToast(`Category "${selectedCategory.name}" deleted successfully.`);
            setModal(null);
            fetchCategories();
        } catch (err: any) {
            showToast(`Error deleting category: ${err.message}`, 'error');
        }
    };
    
    if (loading) return <div className="text-center p-8">Loading categories...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

    return (
        <div>
            {modal === 'rename' && selectedCategory && <CategoryRenameModal categoryName={selectedCategory.name} onSave={handleRename} onClose={() => setModal(null)} />}
            {modal === 'delete' && selectedCategory && <CategoryDeleteModal category={selectedCategory} otherCategories={categories.map(c => c.name).filter(n => n !== selectedCategory.name)} onDelete={handleDelete} onClose={() => setModal(null)} />}
            
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Question Categories</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Categories are created automatically when you add or edit questions. This ensures that every category is actively in use.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400 tracking-wider">
                             <tr>
                                 <th className="px-6 py-3">Category Name</th>
                                 <th className="px-6 py-3">Questions</th>
                                 <th className="px-6 py-3 text-right">Actions</th>
                             </tr>
                         </thead>
                         <tbody>
                            {categories.map(cat => (
                                <tr key={cat.name} className="border-b dark:border-slate-700">
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{cat.name}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{cat.count}</td>
                                    <td className="px-6 py-4 flex justify-end gap-2">
                                        <Button variant="secondary" onClick={() => { setSelectedCategory(cat); setModal('rename'); }}>Rename</Button>
                                        <Button variant="danger" onClick={() => { setSelectedCategory(cat); setModal('delete'); }}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                         </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Road Sign Manager Components
const DEFAULT_SIGN: Omit<RoadSign, 'id'> = {
    name: '',
    description: '',
    category: '',
    svg_code: '',
};

const RoadSignForm: React.FC<{ sign: RoadSign | null; onSave: (signData: Omit<RoadSign, 'id'> | RoadSign) => Promise<void>; onClose: () => void; categories: RoadSignCategory[]; }> = ({ sign, onSave, onClose, categories }) => {
    const [formData, setFormData] = useState(sign || DEFAULT_SIGN);
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };

    return (
        <Modal title={sign ? 'Edit Road Sign' : 'Add New Road Sign'} onClose={onClose} size="2xl">
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <FormRow>
                            <Label htmlFor="name">Sign Name</Label>
                            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                        </FormRow>
                        <FormRow>
                            <Label htmlFor="category">Category</Label>
                            <Select id="category" name="category" value={formData.category} onChange={handleInputChange} required>
                                <option value="" disabled>Select a category...</option>
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </Select>
                        </FormRow>
                        <FormRow>
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} required />
                        </FormRow>
                        <FormRow>
                            <Label htmlFor="svg_code">SVG Code</Label>
                            <Textarea id="svg_code" name="svg_code" value={formData.svg_code} onChange={handleInputChange} required rows={8} />
                        </FormRow>
                    </div>
                    <div className="flex flex-col">
                         <Label>Live Preview</Label>
                         <div className="flex-grow w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center border border-gray-300 dark:border-slate-600">
                             {formData.svg_code ? (
                                <DynamicAsset svgString={formData.svg_code} className="w-48 h-48" />
                             ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">Preview will appear here</p>
                             )}
                         </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Sign'}</Button>
                </div>
            </form>
        </Modal>
    );
};

const RoadSignManager: React.FC<{ showToast: (msg: string, type?: 'success' | 'error') => void; }> = ({ showToast }) => {
    const [signs, setSigns] = useState<RoadSign[]>([]);
    const [categories, setCategories] = useState<RoadSignCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSign, setEditingSign] = useState<RoadSign | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

    const fetchSignsAndCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const signsPromise = supabase!.from('road_signs').select('*').order('name', { ascending: true });
            const categoriesPromise = supabase!.from('road_sign_categories').select('*');
            const [{ data: signsData, error: signsError }, { data: categoriesData, error: categoriesError }] = await Promise.all([signsPromise, categoriesPromise]);
            
            if (signsError) throw signsError;
            if (categoriesError) throw categoriesError;
            
            setSigns(signsData || []);
            setCategories(categoriesData || []);
        } catch (err: any) {
            setError(err.message);
            showToast(`Error fetching data: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchSignsAndCategories();
    }, [fetchSignsAndCategories]);

    const handleSave = async (signData: Omit<RoadSign, 'id'> | RoadSign) => {
        try {
            const { error } = await supabase!.from('road_signs').upsert(signData);
            if (error) throw error;
            showToast('Road sign saved successfully!');
            setIsModalOpen(false);
            setEditingSign(null);
            fetchSignsAndCategories();
        } catch (err: any) {
            showToast(`Error saving sign: ${err.message}`, 'error');
        }
    };

    const handleDelete = async (signId: string) => {
        if (window.confirm('Are you sure you want to delete this road sign?')) {
            try {
                const { error } = await supabase!.from('road_signs').delete().eq('id', signId);
                if (error) throw error;
                showToast('Road sign deleted successfully.');
                fetchSignsAndCategories();
            } catch (err: any) {
                showToast(`Error deleting sign: ${err.message}`, 'error');
            }
        }
    };

    const handleEdit = (sign: RoadSign) => {
        setEditingSign(sign);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingSign(null);
        setIsModalOpen(true);
    };
    
    const filteredSigns = useMemo(() => signs.filter(s => s.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())), [signs, debouncedSearchTerm]);
    
    if (loading) return <div className="text-center p-8">Loading road signs...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

    return (
        <div>
            {isModalOpen && <RoadSignForm sign={editingSign} onSave={handleSave} onClose={() => setIsModalOpen(false)} categories={categories} />}
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Road Signs</h2>
                <Button onClick={handleAddNew}>Add New Sign</Button>
            </div>
            <div className="mb-4">
                <Input type="search" placeholder="Search signs by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                         <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400 tracking-wider">
                             <tr>
                                 <th className="px-6 py-3 w-20">Preview</th>
                                 <th className="px-6 py-3">Name</th>
                                 <th className="px-6 py-3">Category</th>
                                 <th className="px-6 py-3 text-right">Actions</th>
                             </tr>
                         </thead>
                         <tbody>
                            {filteredSigns.map(s => (
                                <tr key={s.id} className="border-b dark:border-slate-700">
                                    <td className="px-6 py-2">
                                        <div className="w-12 h-12 p-1 bg-gray-100 dark:bg-slate-700 rounded-md flex items-center justify-center">
                                            <DynamicAsset svgString={s.svg_code} className="w-full h-full" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{s.name}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{categoryMap.get(s.category) || 'N/A'}</td>
                                    <td className="px-6 py-4 flex justify-end gap-2">
                                        <Button variant="secondary" onClick={() => handleEdit(s)}>Edit</Button>
                                        <Button variant="danger" onClick={() => handleDelete(s.id)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                         </tbody>
                    </table>
                     {filteredSigns.length === 0 && <p className="p-8 text-center text-gray-500 dark:text-gray-400">No signs found.</p>}
                </div>
            </div>
        </div>
    );
};

// Road Sign Category Manager
const SignCategoryFormModal: React.FC<{ category: RoadSignCategory | null; onSave: (data: Partial<RoadSignCategory>) => Promise<void>; onClose: () => void; }> = ({ category, onSave, onClose }) => {
    const [name, setName] = useState(category?.name || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave({ ...category, name });
        setIsSaving(false);
    };

    return (
        <Modal title={category ? 'Edit Sign Category' : 'Add New Sign Category'} onClose={onClose} size="md">
            <form onSubmit={handleSubmit}>
                <FormRow>
                    <Label htmlFor="name">Category Name</Label>
                    <Input id="name" name="name" value={name} onChange={e => setName(e.target.value)} required />
                </FormRow>
                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={isSaving || !name}>{isSaving ? 'Saving...' : 'Save'}</Button>
                </div>
            </form>
        </Modal>
    );
};

const SignCategoryDeleteModal: React.FC<{ category: RoadSignCategory; otherCategories: RoadSignCategory[]; onDelete: (transferToId: string | null) => Promise<void>; onClose: () => void; }> = ({ category, otherCategories, onDelete, onClose }) => {
    const [transferTo, setTransferTo] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [signCount, setSignCount] = useState<number | null>(null);

    useEffect(() => {
        supabase!.from('road_signs').select('id', { count: 'exact', head: true }).eq('category', category.id)
            .then(({ count }) => setSignCount(count));
    }, [category.id]);
    
    const needsTransfer = signCount !== null && signCount > 0;

    const handleSubmit = async () => {
        setIsDeleting(true);
        await onDelete(transferTo);
        setIsDeleting(false);
    };
    
    if (signCount === null) {
        return <Modal title={`Delete Category: ${category.name}`} onClose={onClose} size="lg"><p>Checking for associated signs...</p></Modal>;
    }
    
    return (
        <Modal title={`Delete Category: ${category.name}`} onClose={onClose} size="lg">
            <p className="text-gray-700 dark:text-gray-300">Are you sure you want to delete this category?</p>
            {needsTransfer && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-500/10 border-l-4 border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-300">
                    <p className="font-semibold">This category contains {signCount} road signs.</p>
                    <p>To prevent orphaning signs, please select a new category to move them to.</p>
                </div>
            )}
            {needsTransfer && (
                <FormRow>
                    <Label htmlFor="transfer-category" className="mt-4">Move signs to:</Label>
                    <Select id="transfer-category" value={transferTo} onChange={e => setTransferTo(e.target.value)} required>
                        <option value="" disabled>Select a category...</option>
                        {otherCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </Select>
                </FormRow>
            )}
            <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="danger" onClick={handleSubmit} disabled={isDeleting || (needsTransfer && !transferTo)}>
                    {isDeleting ? 'Deleting...' : 'Delete Category'}
                </Button>
            </div>
        </Modal>
    );
};


const RoadSignCategoryManager: React.FC<{ showToast: (msg: string, type?: 'success' | 'error') => void; }> = ({ showToast }) => {
    const [categories, setCategories] = useState<RoadSignCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState<'edit' | 'delete' | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<RoadSignCategory | null>(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase!.from('road_sign_categories').select('*').order('name');
            if (error) throw error;
            setCategories(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCategories() }, [fetchCategories]);

    const handleSave = async (data: Partial<RoadSignCategory>) => {
        try {
            const { error } = await supabase!.from('road_sign_categories').upsert(data);
            if (error) throw error;
            showToast('Category saved!');
            setModal(null);
            setSelectedCategory(null);
            fetchCategories();
        } catch (err: any) {
            showToast(`Error: ${err.message}`, 'error');
        }
    };
    
    const handleDelete = async (transferToId: string | null) => {
        if (!selectedCategory) return;
        try {
            if (transferToId) {
                const { error: updateError } = await supabase!.from('road_signs').update({ category: transferToId }).eq('category', selectedCategory.id);
                if (updateError) throw updateError;
            }
            const { error: deleteError } = await supabase!.from('road_sign_categories').delete().eq('id', selectedCategory.id);
            if (deleteError) throw deleteError;

            showToast('Category deleted.');
            setModal(null);
            setSelectedCategory(null);
            fetchCategories();
        } catch (err: any) {
            showToast(`Error: ${err.message}`, 'error');
        }
    };
    
    if (loading) return <p>Loading sign categories...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;

    return (
        <div>
            {modal === 'edit' && <SignCategoryFormModal category={selectedCategory} onSave={handleSave} onClose={() => setModal(null)} />}
            {modal === 'delete' && selectedCategory && <SignCategoryDeleteModal category={selectedCategory} otherCategories={categories.filter(c => c.id !== selectedCategory.id)} onDelete={handleDelete} onClose={() => setModal(null)} />}

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Sign Categories</h2>
                <Button onClick={() => { setSelectedCategory(null); setModal('edit'); }}>Add New Category</Button>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400 tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Category Name</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(c => (
                            <tr key={c.id} className="border-b dark:border-slate-700">
                                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{c.name}</td>
                                <td className="px-6 py-4 flex justify-end gap-2">
                                    <Button variant="secondary" onClick={() => { setSelectedCategory(c); setModal('edit'); }}>Edit</Button>
                                    <Button variant="danger" onClick={() => { setSelectedCategory(c); setModal('delete'); }}>Delete</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// Hazard Perception Manager Components
const mapClipToCamelCase = (dbClip: any): HazardPerceptionClip => ({
  id: dbClip.id,
  description: dbClip.description,
  duration: dbClip.duration,
  videoUrl: dbClip.video_url,
  hazardWindowStart: dbClip.hazard_window_start,
  hazardWindowEnd: dbClip.hazard_window_end,
});

const mapClipToSnakeCase = (appClip: HazardPerceptionClip | Omit<HazardPerceptionClip, 'id'>) => ({
  ...('id' in appClip && { id: appClip.id }),
  description: appClip.description,
  duration: appClip.duration,
  video_url: appClip.videoUrl,
  hazard_window_start: appClip.hazardWindowStart,
  hazard_window_end: appClip.hazardWindowEnd,
});


const DEFAULT_CLIP: Omit<HazardPerceptionClip, 'id'> = {
    description: '',
    videoUrl: '',
    duration: 0,
    hazardWindowStart: 0,
    hazardWindowEnd: 10,
};

const HazardClipForm: React.FC<{ clip: HazardPerceptionClip | null; onSave: (clipData: Omit<HazardPerceptionClip, 'id'> | HazardPerceptionClip) => Promise<void>; onClose: () => void; }> = ({ clip, onSave, onClose }) => {
    const [formData, setFormData] = useState(clip || DEFAULT_CLIP);
    const [isSaving, setIsSaving] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentTime, setCurrentTime] = useState(0);

    const videoDuration = videoRef.current?.duration || 0;

    useEffect(() => {
        const video = videoRef.current;
        const handleMetadata = () => {
            if (video) {
                setFormData(prev => ({ ...prev, duration: Math.round(video.duration) }));
            }
        };
        const handleTimeUpdate = () => {
            if (video) setCurrentTime(video.currentTime);
        };
        video?.addEventListener('loadedmetadata', handleMetadata);
        video?.addEventListener('timeupdate', handleTimeUpdate);
        return () => {
            video?.removeEventListener('loadedmetadata', handleMetadata);
            video?.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [formData.videoUrl]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name.includes('hazard') ? parseFloat(value) : value }));
    };

    const setWindowTime = (type: 'start' | 'end') => {
        if (videoRef.current && videoDuration > 0) {
            const timePercent = (videoRef.current.currentTime / videoDuration) * 100;
            const field = type === 'start' ? 'hazardWindowStart' : 'hazardWindowEnd';
            setFormData(prev => ({...prev, [field]: parseFloat(timePercent.toFixed(2))}));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };

    return (
        <Modal title={clip ? 'Edit Hazard Clip' : 'Add New Hazard Clip'} onClose={onClose} size="3xl">
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <FormRow>
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} required />
                        </FormRow>
                        <FormRow>
                            <Label htmlFor="videoUrl">Video URL</Label>
                            <Input id="videoUrl" name="videoUrl" value={formData.videoUrl} onChange={handleInputChange} required />
                        </FormRow>
                        <FormRow>
                            <Label htmlFor="duration">Duration (seconds)</Label>
                            <Input id="duration" name="duration" type="number" value={formData.duration} onChange={handleInputChange} required />
                        </FormRow>
                        <div className="grid grid-cols-2 gap-4">
                            <FormRow>
                                <Label htmlFor="hazardWindowStart">Window Start (%)</Label>
                                <Input id="hazardWindowStart" name="hazardWindowStart" type="number" step="0.1" value={formData.hazardWindowStart} onChange={handleInputChange} required />
                            </FormRow>
                             <FormRow>
                                <Label htmlFor="hazardWindowEnd">Window End (%)</Label>
                                <Input id="hazardWindowEnd" name="hazardWindowEnd" type="number" step="0.1" value={formData.hazardWindowEnd} onChange={handleInputChange} required />
                            </FormRow>
                        </div>
                    </div>
                    <div>
                        <Label>Interactive Preview</Label>
                        <video ref={videoRef} src={formData.videoUrl} controls key={formData.videoUrl} className="w-full aspect-video bg-black rounded-lg" muted playsInline />
                        <div className="mt-2">
                             <div className="relative w-full h-3 bg-gray-200 dark:bg-slate-600 rounded-full">
                                {videoDuration > 0 && (
                                    <>
                                        <div className="absolute top-0 left-0 h-full bg-teal-500/50" style={{ left: `${formData.hazardWindowStart}%`, width: `${Math.max(0, formData.hazardWindowEnd - formData.hazardWindowStart)}%` }} />
                                        <div className="absolute -top-1 h-5 w-1 bg-red-500" style={{ left: `${(currentTime / videoDuration) * 100}%` }} />
                                    </>
                                )}
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                                <span>{new Date(currentTime * 1000).toISOString().substr(14, 5)}</span>
                                <span>{new Date(videoDuration * 1000).toISOString().substr(14, 5)}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <Button type="button" variant="secondary" onClick={() => setWindowTime('start')}>Set Start at Current Time</Button>
                            <Button type="button" variant="secondary" onClick={() => setWindowTime('end')}>Set End at Current Time</Button>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Clip'}</Button>
                </div>
            </form>
        </Modal>
    );
};

const HazardClipManager: React.FC<{ showToast: (msg: string, type?: 'success' | 'error') => void; }> = ({ showToast }) => {
    const [clips, setClips] = useState<HazardPerceptionClip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClip, setEditingClip] = useState<HazardPerceptionClip | null>(null);

    const fetchClips = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase!.from('hazard_clips').select('*').order('id', { ascending: true });
            if (error) throw error;
            setClips((data || []).map(mapClipToCamelCase));
        } catch (err: any) {
            setError(err.message);
            showToast(`Error fetching clips: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchClips();
    }, [fetchClips]);

    const handleSave = async (clipData: Omit<HazardPerceptionClip, 'id'> | HazardPerceptionClip) => {
        try {
            const snakeCaseData = mapClipToSnakeCase(clipData);
            const { error } = await supabase!.from('hazard_clips').upsert(snakeCaseData);
            if (error) throw error;
            showToast('Hazard clip saved successfully!');
            setIsModalOpen(false);
            setEditingClip(null);
            fetchClips();
        } catch (err: any) {
            showToast(`Error saving clip: ${err.message}`, 'error');
        }
    };

    const handleDelete = async (clipId: number) => {
        if (window.confirm('Are you sure you want to delete this hazard clip?')) {
            try {
                const { error } = await supabase!.from('hazard_clips').delete().eq('id', clipId);
                if (error) throw error;
                showToast('Hazard clip deleted successfully.');
                fetchClips();
            } catch (err: any) {
                showToast(`Error deleting clip: ${err.message}`, 'error');
            }
        }
    };

    if (loading) return <div className="text-center p-8">Loading hazard clips...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

    return (
        <div>
            {isModalOpen && <HazardClipForm clip={editingClip} onSave={handleSave} onClose={() => { setIsModalOpen(false); setEditingClip(null); }} />}
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Hazard Clips</h2>
                <Button onClick={() => { setEditingClip(null); setIsModalOpen(true); }}>Add New Clip</Button>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                         <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400 tracking-wider">
                             <tr>
                                 <th className="px-6 py-3 w-32">Preview</th>
                                 <th className="px-6 py-3">Description</th>
                                 <th className="px-6 py-3">Duration</th>
                                 <th className="px-6 py-3">Window</th>
                                 <th className="px-6 py-3 text-right">Actions</th>
                             </tr>
                         </thead>
                         <tbody>
                            {clips.map(clip => (
                                <tr key={clip.id} className="border-b dark:border-slate-700">
                                    <td className="px-6 py-2">
                                        <video src={clip.videoUrl} className="w-28 h-16 bg-black rounded" muted />
                                    </td>
                                    <td className="px-6 py-4 font-normal text-gray-900 dark:text-white max-w-sm truncate">{clip.description}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{clip.duration}s</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{clip.hazardWindowStart}% - {clip.hazardWindowEnd}%</td>
                                    <td className="px-6 py-4 flex justify-end gap-2">
                                        <Button variant="secondary" onClick={() => { setEditingClip(clip); setIsModalOpen(true); }}>Edit</Button>
                                        <Button variant="danger" onClick={() => handleDelete(clip.id)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                         </tbody>
                    </table>
                     {clips.length === 0 && <p className="p-8 text-center text-gray-500 dark:text-gray-400">No hazard clips found.</p>}
                </div>
            </div>
        </div>
    );
};

// Case Study Manager Components
const DEFAULT_CASE_STUDY: Omit<CaseStudy, 'id'> = {
    title: '',
    scenario: '',
    scenario_image: '',
    question_ids: [],
};

const CaseStudyForm: React.FC<{ study: CaseStudy | null; onSave: (studyData: Omit<CaseStudy, 'id'> | CaseStudy) => Promise<void>; onClose: () => void; }> = ({ study, onSave, onClose }) => {
    const [formData, setFormData] = useState(study || DEFAULT_CASE_STUDY);
    const [isSaving, setIsSaving] = useState(false);
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [questionSearch, setQuestionSearch] = useState('');
    const debouncedSearch = useDebounce(questionSearch, 300);

    useEffect(() => {
        supabase!.from('questions').select('id, question, category').then(({ data }) => {
            if (data) setAllQuestions(data);
        });
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleQuestionToggle = (questionId: string) => {
        setFormData(prev => {
            const newIds = prev.question_ids.includes(questionId)
                ? prev.question_ids.filter(id => id !== questionId)
                : [...prev.question_ids, questionId];
            return { ...prev, question_ids: newIds };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };

    const filteredQuestions = useMemo(() => {
        return allQuestions.filter(q => q.question.toLowerCase().includes(debouncedSearch.toLowerCase()));
    }, [allQuestions, debouncedSearch]);

    return (
        <Modal title={study ? 'Edit Case Study' : 'Add New Case Study'} onClose={onClose} size="3xl">
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <FormRow>
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required />
                        </FormRow>
                        <FormRow>
                            <Label htmlFor="scenario">Scenario</Label>
                            <Textarea id="scenario" name="scenario" value={formData.scenario} onChange={handleInputChange} required rows={6} />
                        </FormRow>
                        <FormRow>
                            <Label htmlFor="scenario_image">Scenario Image URL (Optional)</Label>
                            <Input id="scenario_image" name="scenario_image" value={formData.scenario_image || ''} onChange={handleInputChange} />
                        </FormRow>
                    </div>
                    <div>
                        <Label>Associated Questions ({formData.question_ids.length} selected)</Label>
                        <Input type="search" placeholder="Search questions..." className="mb-2" value={questionSearch} onChange={e => setQuestionSearch(e.target.value)} />
                        <div className="h-64 overflow-y-auto border border-gray-300 dark:border-slate-600 rounded-md p-2 space-y-2">
                            {filteredQuestions.map(q => (
                                <label key={q.id} className="flex items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-md cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.question_ids.includes(q.id)}
                                        onChange={() => handleQuestionToggle(q.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                    />
                                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 truncate">{q.question}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Case Study'}</Button>
                </div>
            </form>
        </Modal>
    );
};

const CaseStudyManager: React.FC<{ showToast: (msg: string, type?: 'success' | 'error') => void; }> = ({ showToast }) => {
    const [studies, setStudies] = useState<CaseStudy[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudy, setEditingStudy] = useState<CaseStudy | null>(null);

    const fetchStudies = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase!.from('case_studies').select('*').order('title');
            if (error) throw error;
            setStudies(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStudies() }, [fetchStudies]);

    const handleSave = async (studyData: Omit<CaseStudy, 'id'> | CaseStudy) => {
        try {
            const { error } = await supabase!.from('case_studies').upsert(studyData);
            if (error) throw error;
            showToast('Case study saved!');
            setIsModalOpen(false);
            fetchStudies();
        } catch (err: any) {
            showToast(`Error: ${err.message}`, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Delete this case study?')) {
            try {
                const { error } = await supabase!.from('case_studies').delete().eq('id', id);
                if (error) throw error;
                showToast('Case study deleted.');
                fetchStudies();
            } catch (err: any) {
                showToast(`Error: ${err.message}`, 'error');
            }
        }
    };
    
    if (loading) return <p>Loading case studies...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;

    return (
        <div>
            {isModalOpen && <CaseStudyForm study={editingStudy} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Case Studies</h2>
                <Button onClick={() => { setEditingStudy(null); setIsModalOpen(true); }}>Add New</Button>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400 tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Title</th>
                            <th className="px-6 py-3"># Questions</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studies.map(s => (
                            <tr key={s.id} className="border-b dark:border-slate-700">
                                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{s.title}</td>
                                <td className="px-6 py-4">{s.question_ids.length}</td>
                                <td className="px-6 py-4 flex justify-end gap-2">
                                    <Button variant="secondary" onClick={() => { setEditingStudy(s); setIsModalOpen(true); }}>Edit</Button>
                                    <Button variant="danger" onClick={() => handleDelete(s.id)}>Delete</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Highway Code Manager Components
const HighwayCodeForm: React.FC<{ rule: HighwayCodeRule | null; onSave: (data: any) => Promise<void>; onClose: () => void; }> = ({ rule, onSave, onClose }) => {
    const [formData, setFormData] = useState(rule || { rule_number: '', title: '', content: '', category: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'rule_number' ? parseInt(value) || '' : value }));
    };

    return (
        <Modal title={rule ? 'Edit Rule' : 'Add New Rule'} onClose={onClose} size="2xl">
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormRow>
                        <Label htmlFor="rule_number">Rule Number</Label>
                        <Input id="rule_number" name="rule_number" type="number" value={formData.rule_number} onChange={handleInputChange} required />
                    </FormRow>
                    <FormRow className="md:col-span-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required />
                    </FormRow>
                </div>
                <FormRow>
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" name="category" value={formData.category} onChange={handleInputChange} required />
                </FormRow>
                <FormRow>
                    <Label htmlFor="content">Content (HTML allowed)</Label>
                    <Textarea id="content" name="content" value={formData.content} onChange={handleInputChange} required rows={10} />
                </FormRow>
                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Rule'}</Button>
                </div>
            </form>
        </Modal>
    );
};

const HighwayCodeManager: React.FC<{ showToast: (msg: string, type?: 'success' | 'error') => void; }> = ({ showToast }) => {
    const [rules, setRules] = useState<HighwayCodeRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<HighwayCodeRule | null>(null);

    const fetchRules = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase!.from('highway_code').select('*').order('rule_number');
            if (error) throw error;
            setRules(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRules() }, [fetchRules]);

    const handleSave = async (data: any) => {
        try {
            const { error } = await supabase!.from('highway_code').upsert(data);
            if (error) throw error;
            showToast('Rule saved!');
            setIsModalOpen(false);
            fetchRules();
        } catch (err: any) {
            showToast(`Error: ${err.message}`, 'error');
        }
    };
    
    const handleDelete = async (id: number) => {
        if (window.confirm('Delete this rule?')) {
            try {
                const { error } = await supabase!.from('highway_code').delete().eq('id', id);
                if (error) throw error;
                showToast('Rule deleted.');
                fetchRules();
            } catch (err: any) {
                showToast(`Error: ${err.message}`, 'error');
            }
        }
    };

    if (loading) return <p>Loading rules...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;

    return (
        <div>
            {isModalOpen && <HighwayCodeForm rule={editingRule} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Highway Code</h2>
                <Button onClick={() => { setEditingRule(null); setIsModalOpen(true); }}>Add New Rule</Button>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                 <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400 tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Rule #</th>
                            <th className="px-6 py-3">Title</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rules.map(r => (
                            <tr key={r.id} className="border-b dark:border-slate-700">
                                <td className="px-6 py-4 font-bold">{r.rule_number}</td>
                                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{r.title}</td>
                                <td className="px-6 py-4">{r.category}</td>
                                <td className="px-6 py-4 flex justify-end gap-2">
                                    <Button variant="secondary" onClick={() => { setEditingRule(r); setIsModalOpen(true); }}>Edit</Button>
                                    <Button variant="danger" onClick={() => handleDelete(r.id)}>Delete</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// Appearance Manager Component
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
});

const AssetEditor: React.FC<{
    assetKey: string;
    asset: AppAsset;
    onUpload: (file: File, key: string) => Promise<void>;
    onDelete: (key: string) => Promise<void>;
    showToast: (msg: string, type?: 'success' | 'error') => void;
}> = ({ assetKey, asset, onUpload, onDelete, showToast }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File | null) => {
        if (!file) return;
        
        const validMimeTypes = ['image/svg+xml', 'image/png', 'image/jpeg'];
        if (!validMimeTypes.includes(file.type)) {
            showToast(`Invalid file type: ${file.name}. Please use SVG, PNG, or JPG.`, 'error');
            return;
        }

        setIsUploading(true);
        await onUpload(file, assetKey);
        setIsUploading(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    };
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
        e.target.value = '';
    };

    return (
        <div 
            className={`group relative p-4 bg-white dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center shadow-md border-2 transition-all duration-300 ${isDragOver ? 'border-teal-500 scale-105' : 'border-gray-200 dark:border-slate-700'}`}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
            onDrop={handleDrop}
        >
            <input ref={inputRef} type="file" className="hidden" onChange={handleFileSelect} accept=".svg,.png,.jpg,.jpeg" />
            
            <div className="h-16 w-16 flex items-center justify-center">
                 <DynamicAsset asset={asset} className="max-h-full max-w-full text-gray-700 dark:text-gray-300" />
            </div>
            <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400 break-all">{assetKey}</p>
            
            <div className="absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
            </div>
             <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    onClick={() => onDelete(assetKey)}
                    variant="danger"
                    className="!p-1.5 !rounded-full"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193v-.443A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
                </Button>
            </div>
        </div>
    );
};

const AddAssetModal: React.FC<{
    onSave: (file: File, key: string) => Promise<void>;
    onClose: () => void;
    showToast: (msg: string, type?: 'success' | 'error') => void;
    existingKeys: string[];
}> = ({ onSave, onClose, showToast, existingKeys }) => {
    const [key, setKey] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [keyError, setKeyError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !key || keyError) return;
        setIsSaving(true);
        await onSave(file, key);
        setIsSaving(false);
    };

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newKey = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        setKey(newKey);
        if (existingKeys.includes(newKey)) {
            setKeyError('This key already exists.');
        } else {
            setKeyError('');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const validMimeTypes = ['image/svg+xml', 'image/png', 'image/jpeg'];
        if (!validMimeTypes.includes(selectedFile.type)) {
            showToast(`Invalid file type. Please use SVG, PNG, or JPG.`, 'error');
            return;
        }
        setFile(selectedFile);
    };

    return (
        <Modal title="Add New Asset" onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <FormRow>
                    <Label htmlFor="assetKey">Asset Key</Label>
                    <Input id="assetKey" value={key} onChange={handleKeyChange} required placeholder="e.g., new_promo_banner" error={keyError} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use lowercase letters, numbers, and underscores only.</p>
                </FormRow>
                <FormRow>
                    <Label htmlFor="assetFile">Asset File</Label>
                    <Input id="assetFile" type="file" onChange={handleFileSelect} accept=".svg,.png,.jpg,.jpeg" required />
                </FormRow>
                 <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={isSaving || !file || !key || !!keyError}>
                        {isSaving ? 'Saving...' : 'Add Asset'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const AppearanceManager: React.FC<{
    onAssetsUpdate: () => void;
    showToast: (msg: string, type?: 'success' | 'error') => void;
    appAssets: AppAssetRecord;
}> = ({ onAssetsUpdate, showToast, appAssets }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleUpload = async (file: File, key: string) => {
        try {
            if (!key) throw new Error('Asset key is missing.');
            
            const mime_type = file.type;
            let asset_value: string;

            if (mime_type === 'image/svg+xml') {
                asset_value = await file.text();
            } else {
                asset_value = await toBase64(file);
            }
            
            const { error } = await supabase!.from('app_assets').upsert({ asset_key: key, asset_value, mime_type });
            if (error) throw error;
            
            showToast(`Asset '${key}' updated successfully.`);
            onAssetsUpdate();
            if(isAddModalOpen) setIsAddModalOpen(false);
        } catch(err: any) {
             showToast(`Failed to upload asset: ${err.message}`, 'error');
        }
    };

    const handleDeleteAsset = async (key: string) => {
        if (window.confirm(`Are you sure you want to delete the asset "${key}"? This cannot be undone.`)) {
            try {
                const { error } = await supabase!.from('app_assets').delete().eq('asset_key', key);
                if (error) throw error;
                showToast(`Asset "${key}" deleted successfully.`);
                onAssetsUpdate();
            } catch (err: any) {
                showToast(`Error deleting asset: ${err.message}`, 'error');
            }
        }
    };
    
    const categorizedAssets = useMemo(() => {
        type Categories = { [key: string]: AppAssetRecord };
        const categories: Categories = {
            'Logos': {},
            'Badge Icons': {},
            'UI Icons': {},
            'Other': {},
        };

        // FIX: Explicitly cast the result of Object.entries to fix type inference issues where 'value' becomes unknown.
        (Object.entries(appAssets) as [string, AppAsset][]).forEach(([key, value]) => {
            if (key.startsWith('logo_')) categories['Logos'][key] = value;
            else if (key.startsWith('badge_')) categories['Badge Icons'][key] = value;
            else if (key.startsWith('icon_') || key.startsWith('admin_icon_')) categories['UI Icons'][key] = value;
            else categories['Other'][key] = value;
        });

        return Object.entries(categories).filter(([_, assets]) => Object.keys(assets).length > 0);
    }, [appAssets]);

    return (
        <div>
             {isAddModalOpen && (
                <AddAssetModal 
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={handleUpload}
                    showToast={showToast}
                    existingKeys={Object.keys(appAssets)}
                />
            )}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance Settings</h2>
                <Button onClick={() => setIsAddModalOpen(true)}>Add New Asset</Button>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                Directly manage your application's visual assets. Drag & drop a file onto any item to replace it, or click the upload button that appears on hover.
            </p>
            
            <div className="space-y-8">
                {categorizedAssets.map(([categoryName, assets]) => (
                    <section key={categoryName}>
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white pb-2 border-b-2 border-slate-200 dark:border-slate-700">{categoryName}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {Object.entries(assets).map(([key, value]) => (
                                <AssetEditor 
                                    key={key}
                                    assetKey={key}
                                    asset={value}
                                    onUpload={handleUpload}
                                    onDelete={handleDeleteAsset}
                                    showToast={showToast}
                                />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};


// Main Component
interface AdminPageProps {
    navigateTo: (page: Page) => void;
    appAssets: AppAssetRecord;
    onAssetsUpdate: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ navigateTo, appAssets, onAssetsUpdate }) => {
    const [activeSection, setActiveSection] = useState<AdminSection>('content');
    const [activeContentTab, setActiveContentTab] = useState<ContentTab>('questions');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
    };

    // FIX: Explicitly type `sidebarItems` to fix type inference issue with `Object.entries`.
    const sidebarItems: Record<AdminSection, { name: string, icon: string }> = {
        content: { name: 'Content Management', icon: 'admin_icon_content' },
        appearance: { name: 'Appearance', icon: 'admin_icon_appearance' }
    };
    
    const contentTabs: Record<ContentTab, { name: string }> = {
        questions: { name: 'Questions' },
        categories: { name: 'Question Categories' },
        road_signs: { name: 'Road Signs' },
        road_sign_categories: { name: 'Sign Categories' },
        hazard: { name: 'Hazard Perception' },
        highway_code: { name: 'Highway Code' },
        case_studies: { name: 'Case Studies' }
    };


    const renderContent = () => {
        if (activeSection === 'content') {
            switch (activeContentTab) {
                case 'questions':
                    return <QuestionManager showToast={showToast} />;
                case 'categories':
                    return <CategoryManager showToast={showToast} />;
                case 'road_signs':
                    return <RoadSignManager showToast={showToast} />;
                case 'road_sign_categories':
                    return <RoadSignCategoryManager showToast={showToast} />;
                case 'hazard':
                    return <HazardClipManager showToast={showToast} />;
                case 'highway_code':
                    return <HighwayCodeManager showToast={showToast} />;
                case 'case_studies':
                    return <CaseStudyManager showToast={showToast} />;
                default:
                    return <div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{contentTabs[activeContentTab as ContentTab].name}</h2>
                        <div className="p-8 text-center bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                            <p className="text-gray-500 dark:text-gray-400">Management for this section is coming soon.</p>
                        </div>
                    </div>;
            }
        }
        if (activeSection === 'appearance') {
             return <AppearanceManager onAssetsUpdate={onAssetsUpdate} showToast={showToast} appAssets={appAssets} />;
        }
        return null;
    };

    return (
        <div className="min-h-[calc(100vh-81px)]">
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
             <header className="p-4 sm:p-6 lg:p-8 max-w-full mx-auto border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <button onClick={() => navigateTo(Page.Dashboard)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
                      <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
                      <span className="text-base">Back to Dashboard</span>
                  </button>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
                </div>
            </header>
            <div className="flex">
                <aside className="w-64 bg-white dark:bg-slate-800/50 p-4 border-r border-gray-200 dark:border-slate-700">
                    <nav className="space-y-2">
                         {Object.entries(sidebarItems).map(([key, {name, icon}]) => (
                            <button
                                key={key}
                                onClick={() => setActiveSection(key as AdminSection)}
                                className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${activeSection === key ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                            >
                                <DynamicAsset asset={appAssets[icon]} className="h-5 w-5 mr-3" />
                                <span className="font-semibold">{name}</span>
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="flex-1 p-6 bg-gray-50 dark:bg-slate-900/50">
                    {activeSection === 'content' && (
                        <div className="mb-6 flex items-center gap-2 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
                            {Object.entries(contentTabs).map(([key, { name }]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveContentTab(key as ContentTab)}
                                    className={`px-4 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap ${activeContentTab === key ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-800 dark:hover:text-gray-200'}`}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    )}
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default AdminPage;