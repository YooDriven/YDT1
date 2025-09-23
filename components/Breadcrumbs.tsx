import React from 'react';
import { Page } from '../types';

export interface Breadcrumb {
    label: string;
    page?: Page;
    onClick?: () => void;
}

interface BreadcrumbsProps {
    path: Breadcrumb[];
    navigateTo: (page: Page) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path, navigateTo }) => {
    if (path.length <= 1) {
        return null;
    }

    return (
        <nav aria-label="Breadcrumb" className="px-4 sm:px-6 lg:px-8 max-w-screen-xl mx-auto mt-4">
            <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                {path.map((item, index) => (
                    <li key={index} className="flex items-center">
                        {index > 0 && (
                            <svg className="flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                        )}
                        {index < path.length - 1 && (item.page || item.onClick) ? (
                            <button
                                onClick={() => item.page ? navigateTo(item.page) : item.onClick?.()}
                                className="hover:text-gray-700 dark:hover:text-gray-200 hover:underline"
                            >
                                {item.label}
                            </button>
                        ) : (
                            <span className="font-semibold text-gray-700 dark:text-gray-200" aria-current="page">
                                {item.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
