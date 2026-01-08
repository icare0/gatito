// components/admin/AccessDenied.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AccessDenied() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  // Redirection automatique après 5 secondes
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push('/');
    }
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-700 to-blue-900 flex flex-col items-center justify-center px-4 text-white">
      <div className="relative w-24 h-24 mb-8">
        {/* Pokéball stylisé */}
        <div className="w-full h-full bg-white rounded-full border-8 border-gray-800 relative overflow-hidden">
          <div className="w-full h-1/2 bg-red-600 absolute top-0"></div>
          <div className="w-full h-4 bg-gray-800 absolute top-1/2 transform -translate-y-1/2"></div>
          <div className="w-10 h-10 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-4 border-gray-800 z-10"></div>
        </div>
        
        {/* Yeux tristes */}
        <div className="absolute top-6 left-2.5 w-4 h-4 border-b-4 border-gray-800 rounded-full transform rotate-45"></div>
        <div className="absolute top-6 right-2.5 w-4 h-4 border-b-4 border-gray-800 rounded-full transform -rotate-45"></div>
      </div>
      
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">Accès Refusé</h1>
        <div className="bg-blue-800 bg-opacity-50 p-6 rounded-lg mb-6">
          <p className="text-lg mb-4">
            Oh non ! Vous n'avez pas les autorisations nécessaires pour accéder à cette section.
          </p>
          <p className="text-blue-200">
            Seuls les Maîtres de la Ligue (administrateurs) peuvent accéder au tableau de bord.
          </p>
        </div>
        
        <p className="text-sm text-blue-300 mb-8">
          Redirection automatique dans {countdown} secondes...
        </p>
        
        <div className="flex justify-center space-x-4">
          <Link href="/">
            <button className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-2 px-6 rounded-full transition transform hover:scale-105">
              Retour à l'accueil
            </button>
          </Link>
          
          <Link href="/profile/me">
            <button className="bg-transparent hover:bg-blue-700 border-2 border-white text-white font-bold py-2 px-6 rounded-full transition transform hover:scale-105">
              Mon profil
            </button>
          </Link>
        </div>
      </div>
      
      {/* Décoration Pokémon */}
      <div className="absolute bottom-10 left-10 opacity-20">
        <div className="w-16 h-16 bg-white rounded-full animate-float"></div>
      </div>
      <div className="absolute top-10 right-10 opacity-20">
        <div className="w-20 h-20 bg-white rounded-full animate-float-delayed"></div>
      </div>
    </div>
  );
}