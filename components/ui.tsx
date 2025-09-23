import React, { useEffect } from 'react';

export const Toast: React.FC<{ message: string; type: 'success' | 'error'; onDismiss: () => void; }> = ({ message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);
    const bgColor = type === 'success' ? 'bg-teal-500' : 'bg-red-500';
    return <div className={`fixed bottom-5 right-5 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-[100] animate-fadeInUp`}>{message}</div>;
};

export const Modal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void; size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' }> = ({ title, children, onClose, size = 'xl' }) => (
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

export const FormRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => <div className={["mb-4", className].filter(Boolean).join(" ")}>{children}</div>;
export const Label: React.FC<{ children: React.ReactNode; htmlFor?: string; className?: string; }> = ({ children, htmlFor, className }) => <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${className || ''}`}>{children}</label>;
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => <input {...props} className={`w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-gray-900 dark:text-white ${props.className}`} />;
export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => <textarea {...props} className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-gray-900 dark:text-white" rows={props.rows || 3} />;
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => <select {...props} className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-gray-900 dark:text-white" />;
export const Button: React.FC<{ children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string; variant?: 'primary' | 'secondary' | 'danger'; type?: 'button' | 'submit' }> = ({ children, onClick, disabled, className, variant = 'primary', type = 'button' }) => {
    const variants = {
        primary: 'bg-teal-500 hover:bg-teal-600 text-white',
        secondary: 'bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-800 dark:text-gray-200',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
    };
    return <button type={type} onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-md font-semibold disabled:opacity-50 ${variants[variant]} ${className}`}>{children}</button>;
};
