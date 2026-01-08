// components/shared/SafeImage.js
import React, { useState } from 'react';
import Image from 'next/image';

export default function SafeImage({ 
  src, 
  alt, 
  className, 
  width, 
  height, 
  fallbackSrc = "/images/default-placeholder.png", 
  ...props 
}) {
  const [imageError, setImageError] = useState(false);
  
  // Créer une image par défaut si src est une chaine vide ou undefined
  const imageSrc = (!src || src === "undefined") ? fallbackSrc : src;
  
  return (
    <Image
      src={imageError ? fallbackSrc : imageSrc}
      alt={alt || "Image"}
      width={width}
      height={height}
      className={className}
      onError={() => setImageError(true)}
      {...props}
    />
  );
}