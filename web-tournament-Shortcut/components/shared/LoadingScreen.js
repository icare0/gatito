// components/shared/LoadingScreen.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';

export default function LoadingScreen() {
  const [rotation, setRotation] = useState(0);
  const [loadingText, setLoadingText] = useState("");
  const { t } = useTranslation('common');
  
  useEffect(() => {
    const baseText = t('loading');
    setLoadingText(baseText);
    
    // Rotate the logo
    const rotateInterval = setInterval(() => {
      setRotation(prev => (prev + 10) % 360);
    }, 50);
    
    // Update the loading text with dots
    const textInterval = setInterval(() => {
      setLoadingText(prev => {
        if (prev === `${baseText}...`) return baseText;
        return prev + ".";
      });
    }, 500);
    
    return () => {
      clearInterval(rotateInterval);
      clearInterval(textInterval);
    };
  }, [t]);
  
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#009898] to-[#006C4C] flex flex-col items-center justify-center z-50">
      <div className="relative flex flex-col items-center">
        {/* Logo animation */}
        <div 
          className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-lg p-4"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <img 
            src="/images/shortcut-ca-logo.png" 
            alt="Shortcut" 
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Loading text */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white mb-4">Shortpocket</h1>
          <p className="text-xl text-green-200 font-semibold animate-pulse">{loadingText}</p>
        </div>
        
        {/* Floating elements */}
        <div className="absolute -top-20 -left-24 opacity-20">
          <div className="w-16 h-16 bg-white rounded-full animate-float"></div>
        </div>
        <div className="absolute -bottom-10 -right-16 opacity-20">
          <div className="w-20 h-20 bg-white rounded-full animate-float-delayed"></div>
        </div>
      </div>
    </div>
  );
}