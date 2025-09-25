import React from 'react';
import { AppAsset } from '../types';

interface DynamicAssetProps extends React.HTMLAttributes<HTMLDivElement> {
  asset?: AppAsset;
  svgString?: string;
  alt?: string;
}

const DynamicAsset: React.FC<DynamicAssetProps> = ({ asset, svgString, alt = '', ...props }) => {
  const finalAsset = asset || (svgString ? { value: svgString, mimeType: 'image/svg+xml' } : undefined);

  if (!finalAsset) {
    // Return a visible placeholder if the asset is missing, which helps in debugging.
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

  if (finalAsset.mimeType === 'image/svg+xml') {
    return <div {...props} dangerouslySetInnerHTML={{ __html: finalAsset.value }} />;
  }

  if (finalAsset.mimeType === 'image/png' || finalAsset.mimeType === 'image/jpeg') {
    const { className, ...restDivProps } = props;
    // We assume the value for PNG/JPEG is a Base64 encoded string.
    return (
      <div {...restDivProps}>
        <img src={`data:${finalAsset.mimeType};base64,${finalAsset.value}`} alt={alt} className={className} />
      </div>
    );
  }

  // Fallback for unknown mime types
  return (
    <div {...props}>
      <p className="text-xs text-red-500">Unsupported asset type: {finalAsset.mimeType}</p>
    </div>
  );
};

export default DynamicAsset;
