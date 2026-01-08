// components/shared/DarkModeToggle.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { motion } from 'framer-motion';

export default function DarkModeToggle() {
  // State pour suivre le mode actuel
  const [darkMode, setDarkMode] = useState(false);
  const { t } = useTranslation('common');
  
  // Effet pour initialiser le mode selon les préférences de l'utilisateur
  useEffect(() => {
    // S'assurer que le code ne s'exécute que côté client
    if (typeof window === 'undefined') return;
    
    // Vérifier les préférences locales
    const savedMode = localStorage.getItem('theme');
    // Vérifier les préférences du système
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Définir l'état initial
    const initialDarkMode = savedMode === 'dark' || (!savedMode && prefersDark);
    setDarkMode(initialDarkMode);
    
    // Appliquer le mode immédiatement
    applyTheme(initialDarkMode);
    
    // Ajouter un listener pour les changements de préférence système
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (localStorage.getItem('theme') === null) {
        applyTheme(e.matches);
        setDarkMode(e.matches);
      }
    };
    
    // Écouter les changements pour les navigateurs modernes
    if (darkModeMediaQuery.addEventListener) {
      darkModeMediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback pour les navigateurs plus anciens (Safari 13)
      darkModeMediaQuery.addListener(handleChange);
    }
    
    // Nettoyer l'écouteur d'événements à la démontage
    return () => {
      if (darkModeMediaQuery.removeEventListener) {
        darkModeMediaQuery.removeEventListener('change', handleChange);
      } else {
        darkModeMediaQuery.removeListener(handleChange);
      }
    };
  }, []);
  
  // Fonction pour appliquer le thème au document
  const applyTheme = (isDark) => {
    // S'assurer que le code ne s'exécute que côté client
    if (typeof window === 'undefined') return;
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Log pour le débogage
    console.log('Mode sombre:', isDark ? 'activé' : 'désactivé');
  };
  
  // Gérer le changement de mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    applyTheme(newDarkMode);
  };
  
  return (
    <button 
      onClick={toggleDarkMode}
      className="relative inline-flex items-center justify-center p-1 overflow-hidden transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
      title={darkMode ? t('switch_to_light') : t('switch_to_dark')}
      aria-label={darkMode ? t('switch_to_light') : t('switch_to_dark')}
    >
      {/* Pokéball container */}
      <div className="relative w-14 h-14">
        {/* Top half (changes between red for light mode and dark blue for dark mode) */}
        <motion.div 
          className={`absolute top-0 left-0 w-full h-1/2 rounded-t-full ${darkMode ? 'bg-blue-900' : 'bg-red-600'}`}
          initial={false}
          animate={{
            backgroundColor: darkMode ? '#1E3A8A' : '#DC2626', // blue-900 or red-600
            rotateZ: darkMode ? 180 : 0
          }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 80 }}
        />
        
        {/* Bottom half (changes between white for light mode and gray for dark mode) */}
        <motion.div 
          className={`absolute bottom-0 left-0 w-full h-1/2 rounded-b-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
          initial={false}
          animate={{
            backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', // gray-800 or white
            rotateZ: darkMode ? 180 : 0
          }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 80 }}
        />
        
        {/* Middle band */}
        <div className="absolute top-1/2 left-0 w-full h-1.5 bg-black transform -translate-y-1/2 z-10" />
        
        {/* Center button */}
        <div className="absolute top-1/2 left-1/2 w-5 h-5 bg-white rounded-full border-2 border-black transform -translate-x-1/2 -translate-y-1/2 z-20 shadow-md">
          {/* Inner circle */}
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-gray-200 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        {/* Sun/Moon icon overlay */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center z-30 text-yellow-300 opacity-75"
          initial={false}
          animate={{ 
            opacity: [0.75, 0.5, 0.75],
            scale: darkMode ? 1 : 0
          }}
          transition={{ 
            opacity: { repeat: Infinity, duration: 2, ease: "easeInOut" },
            scale: { duration: 0.3 }
          }}
        >
          {/* Moon icon for dark mode */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 3C10.2 3 8.5 3.5 7 4.4C9.3 5.8 11 8.4 11 11.4C11 14.4 9.3 17 7 18.6C8.5 19.5 10.2 20 12 20C16.4 20 20 16.4 20 12S16.4 3 12 3Z" />
          </svg>
        </motion.div>
        
        <motion.div 
          className="absolute inset-0 flex items-center justify-center z-30 text-yellow-500"
          initial={false}
          animate={{ 
            opacity: [1, 0.8, 1],
            rotate: [0, 10, 0],
            scale: darkMode ? 0 : 1
          }}
          transition={{ 
            opacity: { repeat: Infinity, duration: 3, ease: "easeInOut" },
            rotate: { repeat: Infinity, duration: 5, ease: "easeInOut" },
            scale: { duration: 0.3 }
          }}
        >
          {/* Sun icon for light mode */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7ZM12 2L14.39 5.42C13.65 5.15 12.84 5 12 5C11.16 5 10.35 5.15 9.61 5.42L12 2ZM3.34 7L7.5 6.65C6.9 7.16 6.36 7.78 5.94 8.5C5.5 9.24 5.25 10 5.11 10.79L3.34 7ZM3.36 17L5.12 13.23C5.26 14 5.53 14.78 5.95 15.5C6.37 16.24 6.91 16.86 7.5 17.37L3.36 17ZM12 22L9.59 18.56C10.33 18.83 11.14 19 12 19C12.86 19 13.67 18.83 14.41 18.58L12 22ZM18.64 17L20.42 13.21C20.56 14 20.29 14.78 19.87 15.5C19.45 16.24 18.9 16.86 18.33 17.37L18.64 17ZM18.65 7L14.5 6.65C15.1 7.16 15.63 7.78 16.06 8.5C16.5 9.22 16.75 10 16.89 10.79L18.65 7Z" />
          </svg>
        </motion.div>
      </div>
    </button>
  );
}