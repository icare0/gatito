// components/event/EventBanner.js
import React, { useState } from 'react';
import Link from 'next/link';

export default function EventBanner() {
  const [isOpen, setIsOpen] = useState(true);
  
  if (!isOpen) return null;
  
  return (
    <div className="bg-gradient-to-r from-[#009898] to-[#006C4C] text-white py-2 px-4 relative">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center">
          <img 
            src="/images/shortcut-ca-logo.png" 
            alt="Shortcut"
            className="h-8 mr-2 bg-white p-1 rounded"
          />
          <div className="text-sm md:text-base">
            <span className="font-bold">Événement spécial Shortcut by Crédit Agricole</span>
            <span className="hidden md:inline"> - Participez aux tournois et gagnez des récompenses exclusives!</span>
          </div>
        </div>
        
        <div className="flex items-center mt-2 md:mt-0">
          <Link href="/tournament">
            <button className="text-xs md:text-sm bg-white text-[#009898] px-3 py-1 rounded-full font-medium mr-3 hover:bg-green-100 transition-colors">
              Participer
            </button>
          </Link>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-green-200"
            aria-label="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}