import React, { useState } from 'react';

interface TooltipProps {
    text: string;
    children?: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
    const [isVisible, setIsVisible] = useState(false);

    const content = children || (
        <span className="flex items-center justify-center h-4 w-4 rounded-full bg-gray-300 dark:bg-slate-600 text-gray-600 dark:text-slate-300 text-xs font-semibold cursor-help">
            ?
        </span>
    );

    return (
        <div className="relative inline-flex items-center" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)} onFocus={() => setIsVisible(true)} onBlur={() => setIsVisible(false)} tabIndex={0}>
            {content}
            {isVisible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-sm rounded-lg shadow-lg z-10 transition-opacity duration-300 animate-fadeInUp">
                    {text}
                </div>
            )}
        </div>
    );
};

export default Tooltip;
