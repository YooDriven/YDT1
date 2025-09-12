import React, { SVGProps } from 'react';

interface DynamicIconProps extends SVGProps<SVGSVGElement> {
  svgString: string;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ svgString, ...props }) => {
  if (!svgString) {
    // Return a placeholder or null if the SVG string is not available
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }

  // To inject the SVG string, we need to strip the outer <svg> tag if it exists
  // and just use the inner content, because we are creating our own <svg> element with props.
  // A simpler and safer approach for this context is to inject the whole string,
  // but that means the passed props like `className` might not apply if they are not in the string itself.
  // Let's modify the string to include the props.
  
  let finalSvgString = svgString;

  // Build a string of props to inject into the <svg> tag.
  const propsString = Object.entries(props)
    .map(([key, value]) => {
        // Convert camelCase to kebab-case for SVG attributes
        const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
        return `${kebabKey}="${value}"`;
    })
    .join(' ');
  
  if (finalSvgString.includes('<svg')) {
      finalSvgString = finalSvgString.replace('<svg', `<svg ${propsString}`);
  }

  return <div dangerouslySetInnerHTML={{ __html: finalSvgString }} />;
};

export default DynamicIcon;
