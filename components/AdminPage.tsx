
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Page, Question, AdminSection, ContentTab, RoadSign, RoadSignCategory, HighwayCodeRule, AppAssetRecord, AppAsset } from '../types';
import { ChevronLeftIcon } from './icons';
import DynamicAsset from './DynamicAsset';
import { Toast, Modal, FormRow, Label, Input, Textarea, Select, Button } from './ui';
import { useDebounce } from '../hooks/useDebounce';
import { isRasterImage, removeImageBackground, convertRasterToSvg } from '../utils';
import AdminDashboard from './AdminDashboard';
import { useApp } from '../contexts/AppContext';


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
    const { supabase } = useApp();
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
            const { data, error } = await supabase.from('questions').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setQuestions(data || []);
        } catch (err: any) {
            setError(err.message);
            showToast(`Error fetching questions: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [supabase, showToast]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const handleSave = async (questionData: Omit<Question, 'id'> | Question) => {
        try {
            const { id, created_at, ...upsertData } = questionData as Question;
            const { error } = await supabase.from('questions').upsert(upsertData);
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
                const { error } = await supabase.from('questions').delete().eq('id', questionId);
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
    const { supabase } = useApp();
    const [categories, setCategories] = useState<CategoryInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState<'rename' | 'delete' | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(null);
    
    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.from('questions').select('category');
            if (error) throw error;
            
            const categoryCounts = (data || []).reduce((acc: Map<string, number>, q: { category: string | null }) => {
                const cat = q.category || 'Uncategorized';
                acc.set(cat, (acc.get(cat) || 0) + 1);
                return acc;
            }, new Map<string, number>());

            const categoriesData = Array.from(categoryCounts.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => a.name.localeCompare(b.name));

            setCategories(categoriesData);
        } catch (err: any) {
            setError(err.message);
            showToast(`Error fetching categories: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [supabase, showToast]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleRename = async (newName: string) => {
        if (!selectedCategory || newName === selectedCategory.name) return;
        try {
            const { error } = await supabase.from('questions').update({ category: newName }).eq('category', selectedCategory.name);
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
                const { error } = await supabase.from('questions').update({ category: transferTo }).eq('category', selectedCategory.name);
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
const generateSignName = (filename: string): string => {
    return filename
        .split('.')[0] // remove extension
        .replace(/[-_]/g, ' ') // replace hyphens/underscores with spaces
        .replace(/\b\w/g, char => char.toUpperCase()); // capitalize each word
};

type StagedSign = { file: File; name: string; svg_code: string; categoryId: string; error?: string };

const BulkRoadSignUploader: React.FC<{
    onUploadComplete: () => void;
    showToast: (msg: string, type?: 'success' | 'error') => void;
    existingSignNames: string[];
    categories: RoadSignCategory[];
}> = ({ onUploadComplete, showToast, existingSignNames, categories }) => {
    const { supabase } = useApp();
    const [stagedSigns, setStagedSigns] = useState<StagedSign[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFiles = async (files: FileList | null) => {
        if (!files) return;
        const newFilesPromises = Array.from(files).map(async file => {
            const validMimeTypes = ['image/svg+xml', 'image/png', 'image/jpeg'];
            if (!validMimeTypes.includes(file.type)) {
                showToast(`Skipped invalid file type: ${file.name}`, 'error');
                return null;
            }
            const name = generateSignName(file.name);
            let svg_code;
            if (isRasterImage(file)) {
                const { base64, width, height } = await removeImageBackground(file);
                svg_code = convertRasterToSvg(base64, width, height);
            } else {
                svg_code = await file.text();
            }
            
            return {
                file,
                name,
                svg_code,
                categoryId: categories[0]?.id || '',
                error: existingSignNames.includes(name.toLowerCase()) ? 'Name already exists' : undefined,
            };
        });
        const newFiles = (await Promise.all(newFilesPromises)).filter(Boolean) as StagedSign[];
        setStagedSigns(prev => [...prev, ...newFiles]);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleUpdateStagedSign = (index: number, field: keyof StagedSign, value: string) => {
        setStagedSigns(prev => {
            const newSigns = [...prev];
            const signToUpdate = { ...newSigns[index], [field]: value };
            if (field === 'name') {
                signToUpdate.error = existingSignNames.includes(value.toLowerCase()) ? 'Name already exists' : undefined;
            }
            newSigns[index] = signToUpdate;
            return newSigns;
        });
    };

    const handleUploadAll = async () => {
        if (stagedSigns.some(s => s.error || !s.categoryId)) {
            showToast('Please fix errors and assign categories before uploading.', 'error');
            return;
        }
        setIsUploading(true);
        const signsToInsert = stagedSigns.map(s => ({ name: s.name, svg_code: s.svg_code, description: 'Default description', category: s.categoryId }));
        const { error } = await supabase.from('road_signs').insert(signsToInsert);
        if (error) {
            showToast(`Bulk upload failed: ${error.message}`, 'error');
        } else {
            showToast(`${stagedSigns.length} signs uploaded successfully.`, 'success');
            onUploadComplete();
            setStagedSigns([]);
        }
        setIsUploading(false);
    };

    return (
        <section className="mb-8 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Bulk Sign Uploader</h3>
            <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
                onDrop={handleDrop}
                className={`relative p-6 border-2 border-dashed rounded-lg text-center transition-colors ${isDragOver ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-gray-300 dark:border-slate-600'}`}
            >
                <input type="file" multiple onChange={(e) => handleFiles(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".svg,.png,.jpg,.jpeg" />
                <p className="text-gray-500 dark:text-gray-400">Drag & drop SVG, PNG, or JPG files here, or click to select.</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Names are generated from filenames. JPG/PNG backgrounds are auto-removed.</p>
            </div>
            {stagedSigns.length > 0 && (
                <div className="mt-4 space-y-3">
                    {stagedSigns.map((stagedSign, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                           <div className="flex-shrink-0 w-10 h-10 p-1"><DynamicAsset svgString={stagedSign.svg_code} /></div>
                            <div className="flex-1">
                                <Input value={stagedSign.name} onChange={e => handleUpdateStagedSign(index, 'name', e.target.value)} error={stagedSign.error}/>
                            </div>
                            <div className="w-1/3">
                                <Select value={stagedSign.categoryId} onChange={e => handleUpdateStagedSign(index, 'categoryId', e.target.value)}>
                                    <option value="" disabled>Select Category...</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </Select>
                            </div>
                            <Button variant="danger" className="!p-2" onClick={() => setStagedSigns(prev => prev.filter((_, i) => i !== index))}>&times;</Button>
                        </div>
                    ))}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setStagedSigns([])} disabled={isUploading}>Clear All</Button>
                        <Button onClick={handleUploadAll} disabled={isUploading || stagedSigns.some(f => !!f.error || !f.categoryId)}>
                            {isUploading ? 'Uploading...' : `Upload All (${stagedSigns.length})`}
                        </Button>
                    </div>
                </div>
            )}
        </section>
    );
};

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
    const { supabase } = useApp();
    const [signs, setSigns] = useState<RoadSign[]>([]);
    const [categories, setCategories] = useState<RoadSignCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSign, setEditingSign] = useState<RoadSign | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
    const existingSignNames = useMemo(() => signs.map(s => s.name.toLowerCase()), [signs]);

    const fetchSignsAndCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const signsPromise = supabase.from('road_signs').select('*').order('name', { ascending: true });
            const categoriesPromise = supabase.from('road_sign_categories').select('*');
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
    }, [supabase, showToast]);

    useEffect(() => {
        fetchSignsAndCategories();
    }, [fetchSignsAndCategories]);

    const handleSave = async (signData: Omit<RoadSign, 'id'> | RoadSign) => {
        try {
            const { error } = await supabase.from('road_signs').upsert(signData);
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
                const { error } = await supabase.from('road_signs').delete().eq('id', signId);
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
             <BulkRoadSignUploader 
                onUploadComplete={fetchSignsAndCategories}
                showToast={showToast}
                existingSignNames={existingSignNames}
                categories={categories}
            />
            <div className="mb-4 mt-8">
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
    const { supabase } = useApp();
    const [transferTo, setTransferTo] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [signCount, setSignCount] = useState<number | null>(null);

    useEffect(() => {
        supabase.from('road_signs').select('id', { count: 'exact', head: true }).eq('category', category.id)
            .then(({ count }) => setSignCount(count));
    }, [category.id, supabase]);
    
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
    const { supabase } = useApp();
    const [categories, setCategories] = useState<RoadSignCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState<'edit' | 'delete' | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<RoadSignCategory | null>(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('road_sign_categories').select('*').order('name');
            if (error) throw error;
            setCategories(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => { fetchCategories() }, [fetchCategories]);

    const handleSave = async (data: Partial<RoadSignCategory>) => {
        try {
            const { error } = await supabase.from('road_sign_categories').upsert(data);
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
                const { error: updateError } = await supabase.from('road_signs').update({ category: transferToId }).eq('category', selectedCategory.id);
                if (updateError) throw updateError;
            }
            const { error: deleteError } = await supabase.from('road_sign_categories').delete().eq('id', selectedCategory.id);
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
    const { supabase } = useApp();
    const [rules, setRules] = useState<HighwayCodeRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<HighwayCodeRule | null>(null);

    const fetchRules = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('highway_code').select('*').order('rule_number');
            if (error) throw error;
            setRules(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => { fetchRules() }, [fetchRules]);

    const handleSave = async (data: any) => {
        try {
            const { error } = await supabase.from('highway_code').upsert(data);
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
                const { error } = await supabase.from('highway_code').delete().eq('id', id);
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

// Core Asset Definition
interface CoreAssetInfo {
    key: string;
    name: string;
    description: string;
    category: 'Logos' | 'UI Icons' | 'Badge Icons';
}

const CORE_ASSETS: CoreAssetInfo[] = [
    { key: 'logo_yoodrive', name: 'Main Application Logo', description: 'Used in the header and on the login page.', category: 'Logos'},
    { key: 'admin_icon_dashboard', name: 'Admin: Dashboard Icon', description: 'Icon for the Dashboard section in the admin sidebar.', category: 'UI Icons'},
    { key: 'admin_icon_content', name: 'Admin: Content Icon', description: 'Icon for the Content Management section in the admin sidebar.', category: 'UI Icons'},
    { key: 'admin_icon_appearance', name: 'Admin: Appearance Icon', description: 'Icon for the Appearance section in the admin sidebar.', category: 'UI Icons'},
    { key: 'icon_calendar', name: 'Calendar Icon', description: 'Used for the Daily Challenge card and profile stats.', category: 'UI Icons'},
    { key: 'icon_swords', name: 'Swords Icon', description: 'Used for the Battle Ground card and duels.', category: 'UI Icons'},
    { key: 'icon_clock', name: 'Clock Icon', description: 'Used for timed challenge cards.', category: 'UI Icons'},
    { key: 'icon_clipboard', name: 'Clipboard Icon', description: 'Used for Mock Test and Topic Test cards.', category: 'UI Icons'},
    { key: 'icon_lightbulb', name: 'Lightbulb Icon', description: 'Used for Study Mode and Highway Code cards.', category: 'UI Icons'},
    { key: 'icon_bookmark', name: 'Bookmark Icon', description: 'Used for the Bookmarked Questions card.', category: 'UI Icons'},
    { key: 'icon_road_sign', name: 'Road Sign Icon', description: 'Used for the Road Signs study card.', category: 'UI Icons'},
    { key: 'icon_construction', name: 'Hazard Icon', description: 'Used for the Hazard Perception study card.', category: 'UI Icons'},
    { key: 'icon_handshake', name: 'Handshake Icon', description: 'Used on the battle results page for a draw.', category: 'UI Icons'},
    { key: 'icon_chart_bar', name: 'Chart Bar Icon', description: 'Used in the profile for performance stats.', category: 'UI Icons'},
    { key: 'badge_fire', name: 'Fire Badge', description: 'Represents the user\'s login streak.', category: 'Badge Icons'},
    { key: 'badge_snowflake', name: 'Snowflake Badge', description: 'Represents the user\'s streak freezes.', category: 'Badge Icons'},
    { key: 'badge_trophy', name: 'Trophy Badge', description: 'Represents leaderboard achievements and battle wins.', category: 'Badge Icons'},
    { key: 'badge_generic', name: 'Generic Badge Icon', description: 'A default icon for miscellaneous badges.', category: 'Badge Icons'},
];

// Appearance Manager Components
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
});

type StagedFile = { file: File; key: string; error?: string; assignedSlot: string; };

const BulkAssetUploader: React.FC<{
    onBulkUpload: (files: StagedFile[]) => Promise<void>;
    showToast: (msg: string, type?: 'success' | 'error') => void;
    existingKeys: string[];
    coreAssets: CoreAssetInfo[];
    appAssets: AppAssetRecord;
}> = ({ onBulkUpload, showToast, existingKeys, coreAssets, appAssets }) => {
    const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const newFiles: StagedFile[] = Array.from(files).map(file => {
            const validMimeTypes = ['image/svg+xml', 'image/png', 'image/jpeg'];
            if (!validMimeTypes.includes(file.type)) {
                showToast(`Skipped invalid file type: ${file.name}`, 'error');
                return null;
            }
            const key = file.name.split('.')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
            return {
                file,
                key,
                error: existingKeys.includes(key) ? 'Key already exists' : undefined,
                assignedSlot: 'new_asset'
            };
        }).filter(Boolean) as StagedFile[];
        setStagedFiles(prev => [...prev, ...newFiles]);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleUpdateStagedFile = (index: number, field: keyof StagedFile, value: string) => {
        setStagedFiles(prev => {
            const newFiles = [...prev];
            const fileToUpdate = { ...newFiles[index], [field]: value };
            if (field === 'key') {
                fileToUpdate.error = existingKeys.includes(value) ? 'Key already exists' : undefined;
            }
            newFiles[index] = fileToUpdate;
            return newFiles;
        });
    };

    const handleUploadAll = async () => {
        if (stagedFiles.some(f => f.error)) {
            showToast('Please fix errors before uploading.', 'error');
            return;
        }
        setIsUploading(true);
        await onBulkUpload(stagedFiles);
        setIsUploading(false);
        setStagedFiles([]);
    };

    return (
        <section className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Bulk Asset Uploader</h3>
            <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
                onDrop={handleDrop}
                className={`relative p-6 border-2 border-dashed rounded-lg text-center transition-colors ${isDragOver ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-gray-300 dark:border-slate-600'}`}
            >
                <input type="file" multiple onChange={(e) => handleFiles(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <p className="text-gray-500 dark:text-gray-400">Drag & drop files here, or click to select.</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Accepts SVG, PNG, JPG. Asset keys are generated from filenames.</p>
            </div>
            {stagedFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                    {stagedFiles.map((stagedFile, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                            <img src={URL.createObjectURL(stagedFile.file)} alt="preview" className="h-10 w-10 rounded object-contain" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{stagedFile.file.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{stagedFile.file.type}</p>
                            </div>
                            <div className="w-1/3">
                                 <Select value={stagedFile.assignedSlot} onChange={e => handleUpdateStagedFile(index, 'assignedSlot', e.target.value)}>
                                    <option value="new_asset">Add as new asset</option>
                                    <option disabled>--- Assign to Core Asset ---</option>
                                    {coreAssets.map(core => (
                                        <option key={core.key} value={core.key}>Replace: {core.name}</option>
                                    ))}
                                 </Select>
                            </div>
                            <div className="w-1/3">
                                {stagedFile.assignedSlot === 'new_asset' && (
                                     <Input 
                                        value={stagedFile.key} 
                                        onChange={e => handleUpdateStagedFile(index, 'key', e.target.value)} 
                                        error={stagedFile.error}
                                    />
                                )}
                            </div>
                            <Button variant="danger" className="!p-2" onClick={() => setStagedFiles(prev => prev.filter((_, i) => i !== index))}>&times;</Button>
                        </div>
                    ))}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setStagedFiles([])} disabled={isUploading}>Clear All</Button>
                        <Button onClick={handleUploadAll} disabled={isUploading || stagedFiles.some(f => f.error)}>
                            {isUploading ? 'Uploading...' : `Upload All (${stagedFiles.length})`}
                        </Button>
                    </div>
                </div>
            )}
        </section>
    );
};

const CoreAssetEditor: React.FC<{
    assetInfo: CoreAssetInfo;
    asset: AppAsset | undefined;
    onUpload: (file: File, key: string) => Promise<void>;
    showToast: (msg: string, type?: 'success' | 'error') => void;
}> = ({ assetInfo, asset, onUpload, showToast }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File | null) => {
        if (!file) return;
        const validMimeTypes = ['image/svg+xml', 'image/png', 'image/jpeg'];
        if (!validMimeTypes.includes(file.type)) {
            showToast(`Invalid file type for ${assetInfo.name}. Please use SVG, PNG, or JPG.`, 'error');
            return;
        }
        setIsUploading(true);
        await onUpload(file, assetInfo.key);
        setIsUploading(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    return (
        <div 
            className={`relative p-4 flex items-center gap-4 bg-white dark:bg-slate-800 rounded-lg border-2 transition-colors ${isDragOver ? 'border-teal-500' : 'border-gray-200 dark:border-slate-700'}`}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
            onDrop={handleDrop}
        >
             <input ref={inputRef} type="file" className="hidden" onChange={e => handleFile(e.target.files?.[0] || null)} accept=".svg,.png,.jpg,.jpeg" />
             <div className="flex-shrink-0 h-16 w-16 bg-gray-100 dark:bg-slate-700 rounded-md flex items-center justify-center p-2">
                 <DynamicAsset asset={asset} className="max-h-full max-w-full text-gray-700 dark:text-gray-300" />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-gray-900 dark:text-white">{assetInfo.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{assetInfo.description}</p>
                <code className="text-xs text-gray-400 dark:text-gray-500">{assetInfo.key}</code>
            </div>
            <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Change'}
            </Button>
        </div>
    );
};

const AppearanceManager: React.FC<{
    onAssetsUpdate: () => void;
    showToast: (msg: string, type?: 'success' | 'error') => void;
    appAssets: AppAssetRecord;
}> = ({ onAssetsUpdate, showToast, appAssets }) => {
    const { supabase } = useApp();

    const handleUpload = async (file: File, key: string) => {
        try {
            let mime_type = file.type;
            let asset_value: string;
            
            if (isRasterImage(file)) {
                const { base64 } = await removeImageBackground(file);
                asset_value = base64;
                mime_type = 'image/png'; // Background removal converts to PNG
            } else {
                asset_value = await file.text();
            }
            
            const { error } = await supabase.from('app_assets').upsert({ asset_key: key, asset_value, mime_type });
            if (error) throw error;
            
            showToast(`Asset '${key}' updated successfully.`);
            onAssetsUpdate();
        } catch(err: any) {
             showToast(`Failed to upload asset: ${err.message}`, 'error');
        }
    };

    const handleBulkUpload = async (stagedFiles: StagedFile[]) => {
        try {
            const uploads = stagedFiles.map(async stagedFile => {
                const key = stagedFile.assignedSlot === 'new_asset' ? stagedFile.key : stagedFile.assignedSlot;
                const file = stagedFile.file;
                let mime_type = file.type;
                let asset_value: string;
                
                if (isRasterImage(file)) {
                    const { base64 } = await removeImageBackground(file);
                    asset_value = base64;
                    mime_type = 'image/png';
                } else {
                    asset_value = await file.text();
                }

                return { asset_key: key, asset_value, mime_type };
            });
            const upsertData = await Promise.all(uploads);
            const { error } = await supabase.from('app_assets').upsert(upsertData);
            if (error) throw error;

            showToast(`${stagedFiles.length} assets uploaded successfully.`);
            onAssetsUpdate();
        } catch (err: any) {
            showToast(`Bulk upload failed: ${err.message}`, 'error');
        }
    };
    
    const categorizedCoreAssets = useMemo(() => {
        return CORE_ASSETS.reduce((acc: Record<string, CoreAssetInfo[]>, asset) => {
            (acc[asset.category] = acc[asset.category] || []).push(asset);
            return acc;
        }, {});
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance Settings</h2>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                Manage your application's visual assets. Upload multiple new assets at once, or replace a core asset by dragging a file onto its entry below.
            </p>

            <BulkAssetUploader 
                onBulkUpload={handleBulkUpload}
                showToast={showToast}
                existingKeys={Object.keys(appAssets)}
                coreAssets={CORE_ASSETS}
                appAssets={appAssets}
            />
            
            <section className="mt-8">
                 <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Core Application Assets</h3>
                 <div className="space-y-6">
                    {Object.keys(categorizedCoreAssets).map((category: string) => (
                        <div key={category}>
                            <h4 className="font-semibold text-lg text-gray-600 dark:text-gray-300 mb-3">{category}</h4>
                            <div className="space-y-3">
                                {categorizedCoreAssets[category].map(assetInfo => (
                                    <CoreAssetEditor 
                                        key={assetInfo.key}
                                        assetInfo={assetInfo}
                                        asset={appAssets[assetInfo.key]}
                                        onUpload={handleUpload}
                                        showToast={showToast}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                 </div>
            </section>
        </div>
    );
};

// Main Admin Page Component
interface AdminPageProps {
  navigateTo: (page: Page) => void;
  appAssets: AppAssetRecord;
  onAssetsUpdate: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ navigateTo, appAssets, onAssetsUpdate }) => {
    const { showToast } = useApp();
    const [activeSection, setActiveSection] = useState<AdminSection>('content');
    const [activeTab, setActiveTab] = useState<ContentTab>('dashboard');
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showToastInternal = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
    };

    const sidebarItems = {
        content: {
            name: 'Content Management',
            icon: 'admin_icon_content',
        },
        appearance: {
            name: 'Appearance',
            icon: 'admin_icon_appearance',
        },
    };
    
    const contentTabs: { id: ContentTab, name: string }[] = [
        { id: 'dashboard', name: 'Dashboard' },
        { id: 'questions', name: 'Questions' },
        { id: 'categories', name: 'Question Categories' },
        { id: 'road_signs', name: 'Road Signs' },
        { id: 'road_sign_categories', name: 'Sign Categories' },
        { id: 'highway_code', name: 'Highway Code' },
    ];

    const renderContent = () => {
        if (activeSection === 'appearance') {
            return <AppearanceManager onAssetsUpdate={onAssetsUpdate} showToast={showToastInternal} appAssets={appAssets} />;
        }
        switch (activeTab) {
            case 'dashboard': return <AdminDashboard showToast={showToastInternal} />;
            case 'questions': return <QuestionManager showToast={showToastInternal} />;
            case 'categories': return <CategoryManager showToast={showToastInternal} />;
            case 'road_signs': return <RoadSignManager showToast={showToastInternal} />;
            case 'road_sign_categories': return <RoadSignCategoryManager showToast={showToastInternal} />;
            case 'highway_code': return <HighwayCodeManager showToast={showToastInternal} />;
            default: return <div>Select a tab</div>;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-64 flex-shrink-0">
                    <div className="sticky top-24">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
                        </div>
                        <nav className="space-y-1">
                            {Object.entries(sidebarItems).map(([key, item]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveSection(key as AdminSection)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors ${activeSection === key ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-500' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                >
                                    <DynamicAsset asset={appAssets[item.icon]} className="h-5 w-5" />
                                    <span>{item.name}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                <main className="flex-1 min-w-0">
                    {activeSection === 'content' && (
                        <div className="mb-6 border-b border-gray-200 dark:border-slate-700">
                            <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                                {contentTabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        {tab.name}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    )}
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default AdminPage;
