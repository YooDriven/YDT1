import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Page, Question, HazardPerceptionClip, RoadSign, RoadSignCategory, QuestionOption, AdminSection, ContentTab } from '../types';
import { ChevronLeftIcon } from './icons';
import { supabase } from '../lib/supabaseClient';
import DynamicIcon from './DynamicIcon';

// Reusable UI Components
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onDismiss: () => void; }> = ({ message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);
    const bgColor = type === 'success' ? 'bg-teal-500' : 'bg-red-500';
    return <div className={`fixed bottom-5 right-5 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-[100] animate-fadeInUp`}>{message}</div>;
};

const Modal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void; size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' }> = ({ title, children, onClose, size = 'xl' }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-${size} max-h-[90vh] flex flex-col animate-fadeInUp`} onClick={(e) => e.stopPropagation()}>
            <header className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl">&times;</button>
            </header>
            <div className="p-6 overflow-y-auto">{children}</div>
        </div>
    </div>
);

const FormRow: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="mb-4">{children}</div>;
const Label: React.FC<{ children: React.ReactNode; htmlFor?: string }> = ({ children, htmlFor }) => <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{children}</label>;
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => <input {...props} className={`w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-gray-900 dark:text-white ${props.className}`} />;
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => <textarea {...props} className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-gray-900 dark:text-white" rows={props.rows || 3} />;
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => <select {...props} className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-gray-900 dark:text-white" />;
const Button: React.FC<{ children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string; variant?: 'primary' | 'secondary' | 'danger'; type?: 'button' | 'submit' }> = ({ children, onClick, disabled, className, variant = 'primary', type = 'button' }) => {
    const variants = {
        primary: 'bg-teal-500 hover:bg-teal-600 text-white',
        secondary: 'bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-800 dark:text-gray-200',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
    };
    return <button type={type} onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-md font-semibold disabled:opacity-50 ${variants[variant]} ${className}`}>{children}</button>;
};

// Main Component
interface AdminPageProps {
    navigateTo: (page: Page) => void;
    appAssets: Record<string, string>;
    onAssetsUpdate: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ navigateTo, appAssets, onAssetsUpdate }) => {
    const [activeSection, setActiveSection] = useState<AdminSection>('content');
    const [activeContentTab, setActiveContentTab] = useState<ContentTab>('questions');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
    };

    const sidebarItems = {
        content: { name: 'Content Management', icon: 'icon_clipboard' },
        appearance: { name: 'Appearance', icon: 'icon_lightbulb' }
    };
    
    const contentTabs = {
        questions: { name: 'Questions', icon: 'icon_clipboard' },
        hazard: { name: 'Hazard Perception', icon: 'icon_construction' },
        road_signs: { name: 'Road Signs', icon: 'icon_road_sign' },
        highway_code: { name: 'Highway Code', icon: 'icon_lightbulb' },
        case_studies: { name: 'Case Studies', icon: 'icon_clipboard' }
    };

    const renderContent = () => {
        if (activeSection === 'content') {
            switch (activeContentTab) {
                // Other cases would be added here in a full implementation
                default:
                    return <div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{contentTabs[activeContentTab].name}</h2>
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
                      <span>Back to Dashboard</span>
                  </button>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
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
                                <DynamicIcon svgString={appAssets[icon]} className="h-5 w-5 mr-3" />
                                <span className="font-semibold">{name}</span>
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="flex-1 p-6 bg-gray-50 dark:bg-slate-900/50">
                    {activeSection === 'content' && (
                        <div className="mb-6 flex items-center gap-2 border-b border-gray-200 dark:border-slate-700">
                            {Object.entries(contentTabs).map(([key, { name }]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveContentTab(key as ContentTab)}
                                    className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeContentTab === key ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-800 dark:hover:text-gray-200'}`}
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

// Appearance Manager Component
const AppearanceManager: React.FC<{ onAssetsUpdate: () => void; showToast: (msg: string, type?: 'success' | 'error') => void; appAssets: Record<string, string>; }> = ({ onAssetsUpdate, showToast, appAssets: initialAssets }) => {
    const [assets, setAssets] = useState(initialAssets);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    useEffect(() => {
        setAssets(initialAssets);
    }, [initialAssets]);
    
    const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        handleFiles(files);
    };

    const handleFiles = async (files: File[]) => {
        setIsUploading(true);
        for (const file of files) {
            if (file.type !== 'image/svg+xml') {
                showToast(`'${file.name}' is not an SVG file.`, 'error');
                continue;
            }
            try {
                const svgContent = await file.text();
                const assetKey = `icon_${file.name.replace('.svg', '').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                
                const { error } = await supabase!.from('app_assets').upsert({ asset_key: assetKey, asset_value: svgContent });
                if (error) throw error;
                showToast(`Uploaded '${file.name}' as '${assetKey}'.`);
            } catch (err: any) {
                showToast(`Failed to upload ${file.name}: ${err.message}`, 'error');
            }
        }
        setIsUploading(false);
        onAssetsUpdate();
    };

    const handleDeleteAsset = async (key: string) => {
        if (window.confirm(`Are you sure you want to delete the asset "${key}"? This cannot be undone.`)) {
            setIsDeleting(key);
            try {
                const { error } = await supabase!.from('app_assets').delete().eq('asset_key', key);
                if (error) throw error;
                showToast(`Asset "${key}" deleted successfully.`);
                onAssetsUpdate();
            } catch (err: any) {
                showToast(`Error deleting asset: ${err.message}`, 'error');
            }
            setIsDeleting(null);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Asset Management</h2>
            <div 
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver ? 'border-teal-500 bg-teal-500/10' : 'border-gray-300 dark:border-slate-600'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
            >
                 <input type="file" id="file-upload" multiple accept=".svg" className="hidden" onChange={handleFileSelect} />
                 <label htmlFor="file-upload" className="cursor-pointer">
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Drag & Drop SVG files here</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">or click to select files</p>
                    {isUploading && <p className="mt-2 text-sm text-teal-500 animate-pulse">Uploading...</p>}
                 </label>
            </div>
            
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.entries(assets).map(([key, value]) => (
                    <div key={key} className="group relative p-4 bg-white dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center shadow-md border border-gray-200 dark:border-slate-700">
                        <DynamicIcon svgString={value} className="h-12 w-12 text-gray-700 dark:text-gray-300" />
                        <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400 break-all">{key}</p>
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button
                                onClick={() => handleDeleteAsset(key)}
                                variant="danger"
                                className="!p-1.5 !rounded-full"
                                disabled={isDeleting === key}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193v-.443A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


export default AdminPage;