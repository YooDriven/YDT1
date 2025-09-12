import React, { SVGProps } from 'react';

interface DynamicIconProps extends React.HTMLAttributes<HTMLDivElement> {
  svgString: string;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ svgString, ...props }) => {
  if (!svgString) {
    // Return a visible placeholder if the SVG string is missing, which helps in debugging.
    return (
      <div {...props}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-full w-full text-red-500"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
    );
  }

  // The safest way to handle dynamic SVGs is to render them inside a wrapper element.
  // The props (like className, onClick, etc.) are applied to this wrapper.
  // This avoids complex and potentially unsafe string manipulation.
  // For styling (like color), the SVG code should use `fill="currentColor"` or `stroke="currentColor"`
  // which will then inherit the text color from the parent wrapper.
  return <div {...props} dangerouslySetInnerHTML={{ __html: svgString }} />;
};

export default DynamicIcon;