import React, { useEffect, forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ButtonHTMLAttributes, useRef } from 'react';

export const Toast: React.FC<{ message: string; type: 'success' | 'error'; onDismiss: () => void; }> = ({ message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);
    const bgColor = type === 'success' ? 'bg-teal-500' : 'bg-red-500';
    return (
        <div 
            role="alert"
            aria-live="assertive"
            className={`fixed bottom-5 right-5 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-[100] animate-fadeInUp`}
        >
            {message}
        </div>
    );
};

export const Modal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void; size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' }> = ({ title, children, onClose, size = 'xl' }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        previouslyFocusedElement.current = document.activeElement as HTMLElement;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
            if (event.key === 'Tab' && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (event.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        event.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        event.preventDefault();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        
        // Focus the first focusable element in the modal
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        firstFocusable?.focus();

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            previouslyFocusedElement.current?.focus();
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-gray-900/30 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeInUp" onClick={onClose}>
            <div 
                ref={modalRef}
                className={`bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-${size} max-h-[90vh] flex flex-col`} 
                style={{ animation: 'scaleIn 0.3s ease-out forwards' }} 
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <header className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                    <h2 id="modal-title" className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl" aria-label="Close modal">&times;</button>
                </header>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};


export const FormRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => <div className={["mb-4", className].filter(Boolean).join(" ")}>{children}</div>;
export const Label: React.FC<{ children: React.ReactNode; htmlFor?: string; className?: string; }> = ({ children, htmlFor, className }) => <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${className}`}>{children}</label>;

// Input Component
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => (
  <div className="w-full">
    <input
      ref={ref}
      className={`block w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md text-sm shadow-sm placeholder-slate-400
        focus:outline-none focus:ring-1
        disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none
        ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:border-teal-500 focus:ring-teal-500'}
        ${className}`
      }
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));

// Textarea Component
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, error, ...props }, ref) => (
  <div className="w-full">
    <textarea
      ref={ref}
      className={`block w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md text-sm shadow-sm placeholder-slate-400
        focus:outline-none focus:ring-1
        ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:border-teal-500 focus:ring-teal-500'}
        ${className}`
      }
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));

// Select Component
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, error, children, ...props }, ref) => (
  <div className="w-full">
    <select
      ref={ref}
      className={`block w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md text-sm shadow-sm
        focus:outline-none focus:ring-1
        ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:border-teal-500 focus:ring-teal-500'}
        ${className}`
      }
      {...props}
    >
        {children}
    </select>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));

// Button Component
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'primary', children, ...props }, ref) => {
  const baseClasses = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-px active:scale-98";
  
  const variantClasses = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500',
    secondary: 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600 focus:ring-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'bg-transparent border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:ring-teal-500',
  };

  return (
    <button ref={ref} className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
});

// Skeleton Loader
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
    return <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded-md ${className}`} />;
};